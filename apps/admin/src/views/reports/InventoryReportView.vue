<template>
  <div class="inventory-report">
    <div class="page-header">
      <h1>庫存報表</h1>
      <el-button type="primary" @click="exportData" :loading="exporting">
        <el-icon><Download /></el-icon>
        匯出報表
      </el-button>
    </div>

    <!-- 統計摘要卡片 -->
    <el-row :gutter="16" class="summary-cards">
      <el-col :xs="12" :sm="12" :md="5">
        <StatCard :icon="Box" tone="primary" label="商品總數" :value="summaryData.totalProducts" />
      </el-col>
      <el-col :xs="12" :sm="12" :md="5">
        <StatCard :icon="Grid" tone="success" label="總庫存數量" :value="summaryData.totalStockQuantity" />
      </el-col>
      <el-col :xs="12" :sm="12" :md="5">
        <StatCard :icon="Money" tone="warning" label="總庫存價值" :value="formatMoneyShort(summaryData.totalStockValue)" />
      </el-col>
      <el-col :xs="12" :sm="12" :md="4">
        <StatCard :icon="Warning" tone="warning" label="低庫存商品" :value="summaryData.lowStockCount" />
      </el-col>
      <el-col :xs="12" :sm="12" :md="5">
        <StatCard :icon="CircleClose" tone="danger" label="零庫存商品" :value="summaryData.outOfStockCount" />
      </el-col>
    </el-row>

    <!-- 庫存趨勢篩選 -->
    <el-card shadow="never" class="filter-card">
      <el-form :inline="true" :model="filterForm" @submit.prevent>
        <el-form-item label="日期範圍">
          <el-date-picker
            v-model="filterForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="開始日期"
            end-placeholder="結束日期"
            value-format="YYYY-MM-DD"
            :shortcuts="dateShortcuts"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadTrendData">
            <el-icon><Search /></el-icon>
            查詢趨勢
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 圖表區域 -->
    <el-row :gutter="20" class="chart-section">
      <el-col :xs="24" :lg="16">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span>庫存異動趨勢</span>
              <span class="period-label">{{ trendData.period.start }} 至 {{ trendData.period.end }}</span>
            </div>
          </template>
          <div class="chart-container">
            <v-chart
              v-if="!loading && trendData.trend.length > 0"
              :option="trendChartOption"
              :autoresize="true"
              style="width: 100%; height: 350px;"
            />
            <el-empty v-else-if="!loading" description="暫無數據" />
            <div v-else class="loading-container">
              <el-icon class="is-loading" :size="32"><Loading /></el-icon>
              <span>載入中...</span>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="8">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span>庫存價值排行</span>
              <el-select v-model="topProductsSortBy" size="small" @change="loadTopProducts">
                <el-option label="按庫存數量" value="stockQuantity" />
                <el-option label="按庫存價值" value="stockValue" />
              </el-select>
            </div>
          </template>
          <div class="top-products-list">
            <div v-if="topProductsLoading" class="loading-container" style="height: 350px;">
              <el-icon class="is-loading" :size="32"><Loading /></el-icon>
            </div>
            <el-empty v-else-if="topProducts.length === 0" description="暫無數據" />
            <div v-else class="product-item" v-for="(product, index) in topProducts" :key="product.productId">
              <div class="product-rank">{{ index + 1 }}</div>
              <div class="product-info">
                <div class="product-name">{{ product.productName }}</div>
                <div class="product-sku">{{ product.productSku }}</div>
              </div>
              <div class="product-value">
                <div v-if="topProductsSortBy === 'stockQuantity'" class="value-primary">
                  {{ product.stockQuantity }} 件
                </div>
                <div v-else class="value-primary">
                  NT$ {{ product.stockValue.toLocaleString() }}
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 庫存異動明細表格 -->
    <el-card shadow="never" class="data-table-card">
      <template #header>
        <span>庫存異動明細</span>
      </template>
      <el-table :data="trendData.trend" stripe v-loading="loading">
        <el-table-column prop="date" label="日期" width="120" />
        <el-table-column prop="inboundQuantity" label="入庫數量" width="120" align="right">
          <template #default="{ row }">
            <span class="text-success">+{{ row.inboundQuantity }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="outboundQuantity" label="出庫數量" width="120" align="right">
          <template #default="{ row }">
            <span class="text-danger">-{{ row.outboundQuantity }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="netChange" label="淨變化" align="right">
          <template #default="{ row }">
            <span :class="row.netChange >= 0 ? 'text-success' : 'text-danger'">
              {{ row.netChange >= 0 ? '+' : '' }}{{ row.netChange }}
            </span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, BarChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent
} from 'echarts/components'
import VChart from 'vue-echarts'
import {
  inventoryApi,
  type InventorySummaryResponse,
  type InventoryTrendResponse
} from '@/api/inventory'
import dayjs from 'dayjs'
import {
  Download,
  Search,
  Box,
  Grid,
  Money,
  Warning,
  CircleClose,
  Loading
} from '@element-plus/icons-vue'
import { useChartTheme } from '@/composables/useChartTheme'
import { formatMoneyShort } from '@/utils/format'
import StatCard from '@/components/common/StatCard.vue'

const { textColor } = useChartTheme()

// 註冊 ECharts 組件
use([
  CanvasRenderer,
  LineChart,
  BarChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent
])

// 狀態
const loading = ref(false)
const topProductsLoading = ref(false)
const exporting = ref(false)

// 篩選表單
const filterForm = reactive({
  dateRange: [
    dayjs().subtract(29, 'day').format('YYYY-MM-DD'),
    dayjs().format('YYYY-MM-DD')
  ] as [string, string]
})

// 排序方式
const topProductsSortBy = ref<'stockQuantity' | 'stockValue'>('stockValue')

// 日期快捷選項
const dateShortcuts = [
  {
    text: '最近7天',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 6 * 24 * 3600 * 1000)
      return [start, end]
    }
  },
  {
    text: '最近30天',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 29 * 24 * 3600 * 1000)
      return [start, end]
    }
  },
  {
    text: '最近90天',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 89 * 24 * 3600 * 1000)
      return [start, end]
    }
  },
  {
    text: '本月',
    value: () => {
      const end = new Date()
      const start = new Date(end.getFullYear(), end.getMonth(), 1)
      return [start, end]
    }
  }
]

// 摘要數據
const summaryData = reactive<InventorySummaryResponse>({
  totalProducts: 0,
  totalStockQuantity: 0,
  totalStockValue: 0,
  lowStockCount: 0,
  outOfStockCount: 0
})

// 趨勢數據
const trendData = reactive<InventoryTrendResponse>({
  period: { start: '', end: '' },
  trend: []
})

// 排行數據
const topProducts = ref<Array<{
  productId: number
  productName: string
  productSku: string
  stockQuantity: number
  stockValue: number
  unitCost: number
}>>([])

// 庫存趨勢圖表配置
const trendChartOption = computed(() => ({
  textStyle: { color: textColor.value },
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'cross'
    },
    formatter: (params: any) => {
      if (!params || params.length === 0) return ''
      const raw = params[0].axisValue
      const d = dayjs(raw)
      const date = d.isValid() ? d.format('YYYY-MM-DD') : raw
      let result = `${date}<br/>`
      params.forEach((param: any) => {
        result += `${param.marker}${param.seriesName}: ${param.value} 件<br/>`
      })
      return result
    }
  },
  legend: {
    data: ['入庫', '出庫', '淨變化'],
    top: 0,
    textStyle: { color: textColor.value }
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    top: '15%',
    containLabel: true
  },
  xAxis: {
    type: 'category',
    data: trendData.trend.map(item => item.date),
    axisPointer: {
      label: {
        formatter: (p: any) => {
          const d = dayjs(p.value)
          return d.isValid() ? d.format('YYYY-MM-DD') : p.value
        }
      }
    },
    axisLabel: {
      rotate: trendData.trend.length > 15 ? 45 : 0,
      formatter: (value: string) => dayjs(value).isValid() ? dayjs(value).format('MM-DD') : value
    }
  },
  yAxis: {
    type: 'value',
    name: '數量',
    axisLabel: { formatter: '{value} 件' },
    splitLine: { lineStyle: { type: 'dashed' } }
  },
  series: [
    {
      name: '入庫',
      type: 'bar',
      data: trendData.trend.map(item => item.inboundQuantity),
      itemStyle: { color: '#67C23A', borderRadius: [4, 4, 0, 0] },
      barMaxWidth: 25
    },
    {
      name: '出庫',
      type: 'bar',
      data: trendData.trend.map(item => -item.outboundQuantity),
      itemStyle: { color: '#F56C6C', borderRadius: [0, 0, 4, 4] },
      barMaxWidth: 25
    },
    {
      name: '淨變化',
      type: 'line',
      data: trendData.trend.map(item => item.netChange),
      smooth: true,
      itemStyle: { color: '#409EFF' },
      lineStyle: { width: 2 }
    }
  ]
}))

// 載入摘要數據
const loadSummaryData = async () => {
  try {
    const res = await inventoryApi.getInventorySummary()
    if (res.success && res.data) {
      Object.assign(summaryData, res.data)
    }
  } catch (error) {
    console.error('載入庫存摘要失敗', error)
  }
}

// 載入趨勢數據
const loadTrendData = async () => {
  if (!filterForm.dateRange || filterForm.dateRange.length !== 2) {
    ElMessage.warning('請選擇日期範圍')
    return
  }

  try {
    loading.value = true
    const res = await inventoryApi.getInventoryTrend({
      startDate: filterForm.dateRange[0],
      endDate: filterForm.dateRange[1]
    })

    if (res.success && res.data) {
      Object.assign(trendData, res.data)
    }
  } catch (error) {
    console.error('載入庫存趨勢失敗', error)
    ElMessage.error('載入庫存趨勢失敗')
  } finally {
    loading.value = false
  }
}

// 載入排行數據
const loadTopProducts = async () => {
  try {
    topProductsLoading.value = true
    const res = await inventoryApi.getTopProducts({
      limit: 10,
      sortBy: topProductsSortBy.value
    })

    if (res.success && res.data) {
      topProducts.value = (res.data as any).products || []
    }
  } catch (error) {
    console.error('載入商品排行失敗', error)
  } finally {
    topProductsLoading.value = false
  }
}

// 匯出數據
const exportData = async () => {
  try {
    exporting.value = true

    const csvContent = generateCSV()

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `庫存報表_${filterForm.dateRange[0]}_${filterForm.dateRange[1]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    ElMessage.success('報表匯出成功')
  } catch (error) {
    console.error('匯出報表失敗', error)
    ElMessage.error('匯出報表失敗')
  } finally {
    exporting.value = false
  }
}

// 生成 CSV 內容
const generateCSV = () => {
  const lines: string[] = []

  lines.push('庫存報表')
  lines.push(`報表期間,${trendData.period.start} 至 ${trendData.period.end}`)
  lines.push('')

  lines.push('摘要統計')
  lines.push(`商品總數,${summaryData.totalProducts}`)
  lines.push(`總庫存數量,${summaryData.totalStockQuantity}`)
  lines.push(`總庫存價值,${summaryData.totalStockValue}`)
  lines.push(`低庫存商品,${summaryData.lowStockCount}`)
  lines.push(`零庫存商品,${summaryData.outOfStockCount}`)
  lines.push('')

  lines.push('庫存異動明細')
  lines.push('日期,入庫數量,出庫數量,淨變化')
  trendData.trend.forEach(item => {
    lines.push(`${item.date},${item.inboundQuantity},${item.outboundQuantity},${item.netChange}`)
  })
  lines.push('')

  lines.push('商品排行榜')
  lines.push('商品名稱,SKU,庫存數量,庫存價值')
  topProducts.value.forEach(product => {
    lines.push(`${product.productName},${product.productSku},${product.stockQuantity},${product.stockValue}`)
  })

  return lines.join('\n')
}

onMounted(() => {
  loadSummaryData()
  loadTrendData()
  loadTopProducts()
})
</script>

<style scoped>
.inventory-report {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h1 {
  margin: 0;
}

.filter-card {
  margin-bottom: 20px;
}

.summary-cards {
  margin-bottom: 20px;
}

.chart-section {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.period-label {
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

.chart-container {
  min-height: 350px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 350px;
  color: var(--el-text-color-secondary);
  gap: 12px;
}

.data-table-card {
  margin-bottom: 20px;
}

.text-success {
  color: #67C23A;
}

.text-danger {
  color: #F56C6C;
}

.top-products-list {
  max-height: 350px;
  overflow-y: auto;
}

.product-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid var(--el-border-color-light);
}

.product-item:last-child {
  border-bottom: none;
}

.product-rank {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background-color: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 12px;
  margin-right: 12px;
}

.product-item:nth-child(1) .product-rank {
  background-color: #FFD700;
  color: #fff;
}

.product-item:nth-child(2) .product-rank {
  background-color: #C0C0C0;
  color: #fff;
}

.product-item:nth-child(3) .product-rank {
  background-color: #CD7F32;
  color: #fff;
}

.product-info {
  flex: 1;
  min-width: 0;
}

.product-name {
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.product-sku {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.product-value {
  text-align: right;
}

.value-primary {
  font-weight: bold;
  color: var(--el-color-primary);
}

@media (max-width: 768px) {
  .summary-cards .el-col {
    margin-bottom: 12px;
  }
}
</style>
