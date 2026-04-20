<template>
  <div class="sales-report">
    <div class="page-header">
      <h1>銷售報表</h1>
      <el-button type="primary" @click="exportData" :loading="exporting">
        <el-icon><Download /></el-icon>
        匯出報表
      </el-button>
    </div>

    <!-- 篩選條件 -->
    <el-card class="filter-card" shadow="never">
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
        <el-form-item label="訂單狀態">
          <el-select v-model="filterForm.status" placeholder="全部狀態" clearable style="width: 150px">
            <el-option label="全部" value="" />
            <el-option label="待處理" value="pending" />
            <el-option label="已確認" value="confirmed" />
            <el-option label="處理中" value="processing" />
            <el-option label="已出貨" value="shipped" />
            <el-option label="已送達" value="delivered" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadReportData">
            <el-icon><Search /></el-icon>
            查詢
          </el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 統計摘要卡片 -->
    <el-row :gutter="20" class="summary-cards">
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover" class="stat-card">
          <el-statistic title="總銷售額" :value="reportData.summary.totalAmount" :formatter="formatMoneyShort">
            <template #prefix>
              <el-icon style="color: #3d8b7f"><Money /></el-icon>
              <span style="margin-left: 4px;">NT$</span>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover" class="stat-card">
          <el-statistic title="訂單總數" :value="reportData.summary.totalOrders">
            <template #prefix>
              <el-icon style="color: #67C23A"><Document /></el-icon>
            </template>
            <template #suffix>筆</template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover" class="stat-card">
          <el-statistic title="平均訂單金額" :value="reportData.summary.avgOrderValue" :formatter="formatMoneyShort">
            <template #prefix>
              <el-icon style="color: #E6A23C"><TrendCharts /></el-icon>
              <span style="margin-left: 4px;">NT$</span>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover" class="stat-card">
          <el-statistic title="已完成訂單" :value="reportData.summary.completedOrders">
            <template #prefix>
              <el-icon style="color: #67C23A"><CircleCheck /></el-icon>
            </template>
            <template #suffix>筆</template>
          </el-statistic>
        </el-card>
      </el-col>
    </el-row>

    <!-- 圖表區域 -->
    <el-row :gutter="20" class="chart-section">
      <el-col :xs="24" :lg="16">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span>銷售趨勢</span>
              <span class="period-label">{{ reportData.period.label }}</span>
            </div>
          </template>
          <div class="chart-container">
            <v-chart
              v-if="!loading && reportData.trend.length > 0"
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
            <span>訂單狀態分布</span>
          </template>
          <div class="chart-container">
            <v-chart
              v-if="!loading && reportData.statusBreakdown.length > 0"
              :option="statusChartOption"
              :autoresize="true"
              style="width: 100%; height: 350px;"
            />
            <el-empty v-else-if="!loading" description="暫無數據" />
            <div v-else class="loading-container">
              <el-icon class="is-loading" :size="32"><Loading /></el-icon>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 詳細數據表格 -->
    <el-card shadow="never" class="data-table-card">
      <template #header>
        <span>每日銷售明細</span>
      </template>
      <el-table :data="reportData.trend" stripe v-loading="loading">
        <el-table-column label="日期" min-width="180">
          <template #default="{ row }">
            {{ formatDate(row.date) }}
          </template>
        </el-table-column>
        <el-table-column prop="orderCount" label="訂單數" min-width="120" align="right">
          <template #default="{ row }">
            {{ row.orderCount }} 筆
          </template>
        </el-table-column>
        <el-table-column prop="amount" label="銷售額" min-width="180" align="right">
          <template #default="{ row }">
            NT$ {{ row.amount.toLocaleString() }}
          </template>
        </el-table-column>
        <el-table-column prop="avgAmount" label="平均金額" min-width="180" align="right">
          <template #default="{ row }">
            NT$ {{ row.avgAmount.toLocaleString() }}
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
import { LineChart, BarChart, PieChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent
} from 'echarts/components'
import VChart from 'vue-echarts'
import { saleOrdersApi, type SalesReportResponse } from '@/api/sale-orders'
import dayjs from 'dayjs'
import {
  Download,
  Search,
  Money,
  Document,
  TrendCharts,
  CircleCheck,
  Loading
} from '@element-plus/icons-vue'
import { useChartTheme } from '@/composables/useChartTheme'
import { formatMoneyShort } from '@/utils/format'

const { textColor } = useChartTheme()

// 註冊 ECharts 組件
use([
  CanvasRenderer,
  LineChart,
  BarChart,
  PieChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent
])

// 狀態
const loading = ref(false)
const exporting = ref(false)

// 統一日期格式：每日彙整顯示 yyyy-mm-dd（無時分），含時間的顯示 yyyy-mm-dd hh:mm
const formatDate = (value: any) => {
  if (!value) return ''
  const d = dayjs(value)
  if (!d.isValid()) return String(value)
  // 若無時分（純日期）就只顯示日期
  const hasTime = String(value).includes('T') || String(value).includes(':')
  return d.format(hasTime ? 'YYYY-MM-DD HH:mm' : 'YYYY-MM-DD')
}

// 篩選表單
const filterForm = reactive({
  dateRange: [
    dayjs().subtract(29, 'day').format('YYYY-MM-DD'),
    dayjs().format('YYYY-MM-DD')
  ] as [string, string],
  status: ''
})

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
  },
  {
    text: '上月',
    value: () => {
      const end = new Date()
      const start = new Date(end.getFullYear(), end.getMonth() - 1, 1)
      const monthEnd = new Date(end.getFullYear(), end.getMonth(), 0)
      return [start, monthEnd]
    }
  }
]

// 報表數據
const reportData = reactive<SalesReportResponse>({
  period: { start: '', end: '', label: '' },
  summary: {
    totalAmount: 0,
    totalOrders: 0,
    avgOrderValue: 0,
    completedOrders: 0,
    completedAmount: 0
  },
  trend: [],
  statusBreakdown: []
})

// 狀態名稱映射
const statusLabelMap: Record<string, string> = {
  draft: '草稿',
  pending: '待處理',
  confirmed: '已確認',
  processing: '處理中',
  shipped: '已出貨',
  delivered: '已送達',
  completed: '已完成',
  cancelled: '已取消'
}

// 狀態顏色映射
const statusColorMap: Record<string, string> = {
  draft: '#909399',
  pending: '#E6A23C',
  confirmed: '#409EFF',
  processing: '#409EFF',
  shipped: '#67C23A',
  delivered: '#67C23A',
  completed: '#67C23A',
  cancelled: '#F56C6C'
}

// 銷售趨勢圖表配置
const trendChartOption = computed(() => ({
  textStyle: { color: textColor.value },
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'cross'
    },
    formatter: (params: any) => {
      if (!params || params.length === 0) return ''
      const date = formatDate(params[0].axisValue)
      let result = `${date}<br/>`
      params.forEach((param: any) => {
        const prefix = param.seriesName === '銷售額' ? 'NT$ ' : ''
        const suffix = param.seriesName === '銷售額' ? '' : ' 筆'
        result += `${param.marker}${param.seriesName}: ${prefix}${param.value.toLocaleString()}${suffix}<br/>`
      })
      return result
    }
  },
  legend: {
    data: ['銷售額', '訂單數'],
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
    data: reportData.trend.map(item => item.date),
    axisPointer: {
      label: {
        formatter: (p: any) => {
          const d = dayjs(p.value)
          return d.isValid() ? d.format('YYYY-MM-DD') : p.value
        }
      }
    },
    axisLabel: {
      rotate: reportData.trend.length > 15 ? 45 : 0,
      formatter: (value: string) => dayjs(value).isValid() ? dayjs(value).format('MM-DD') : value
    }
  },
  yAxis: [
    {
      type: 'value',
      name: '銷售額',
      position: 'left',
      axisLabel: {
        formatter: (value: number) => value >= 10000 ? (value / 10000).toFixed(1) + 'w' : value.toString()
      },
      splitLine: { lineStyle: { type: 'dashed' } }
    },
    {
      type: 'value',
      name: '訂單數',
      position: 'right',
      axisLabel: { formatter: '{value} 筆' },
      splitLine: { show: false }
    }
  ],
  series: [
    {
      name: '銷售額',
      type: 'line',
      yAxisIndex: 0,
      data: reportData.trend.map(item => item.amount),
      smooth: true,
      itemStyle: { color: '#409EFF' },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
            { offset: 1, color: 'rgba(64, 158, 255, 0.05)' }
          ]
        }
      }
    },
    {
      name: '訂單數',
      type: 'bar',
      yAxisIndex: 1,
      data: reportData.trend.map(item => item.orderCount),
      itemStyle: { color: '#67C23A', borderRadius: [4, 4, 0, 0] },
      barMaxWidth: 30
    }
  ]
}))

// 狀態分布餅圖配置
const statusChartOption = computed(() => ({
  textStyle: { color: textColor.value },
  tooltip: {
    trigger: 'item',
    formatter: '{b}: {c} 筆 ({d}%)'
  },
  legend: {
    orient: 'vertical',
    left: 'left',
    top: 'center',
    textStyle: { color: textColor.value }
  },
  series: [
    {
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['60%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 10,
        borderColor: '#fff',
        borderWidth: 2
      },
      label: {
        show: false,
        position: 'center'
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 16,
          fontWeight: 'bold'
        }
      },
      labelLine: {
        show: false
      },
      data: reportData.statusBreakdown.map(item => ({
        name: statusLabelMap[item.status] || item.status,
        value: item.count,
        itemStyle: { color: statusColorMap[item.status] || '#909399' }
      }))
    }
  ]
}))

// 載入報表數據
const loadReportData = async () => {
  if (!filterForm.dateRange || filterForm.dateRange.length !== 2) {
    ElMessage.warning('請選擇日期範圍')
    return
  }

  try {
    loading.value = true
    const res = await saleOrdersApi.getDateRangeSalesReport({
      startDate: filterForm.dateRange[0],
      endDate: filterForm.dateRange[1],
      status: filterForm.status as any || undefined
    })

    if (res.success && res.data) {
      Object.assign(reportData, res.data)
    }
  } catch (error) {
    console.error('載入報表數據失敗', error)
    ElMessage.error('載入報表數據失敗')
  } finally {
    loading.value = false
  }
}

// 重置篩選
const resetFilter = () => {
  filterForm.dateRange = [
    dayjs().subtract(29, 'day').format('YYYY-MM-DD'),
    dayjs().format('YYYY-MM-DD')
  ]
  filterForm.status = ''
  loadReportData()
}

// 匯出數據
const exportData = async () => {
  try {
    exporting.value = true

    // 生成 CSV 數據
    const csvContent = generateCSV()

    // 創建下載連結
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `銷售報表_${filterForm.dateRange[0]}_${filterForm.dateRange[1]}.csv`)
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

  // 報表標題
  lines.push('銷售報表')
  lines.push(`報表期間,${reportData.period.label}`)
  lines.push('')

  // 摘要數據
  lines.push('摘要統計')
  lines.push(`總銷售額,${reportData.summary.totalAmount}`)
  lines.push(`訂單總數,${reportData.summary.totalOrders}`)
  lines.push(`平均訂單金額,${reportData.summary.avgOrderValue}`)
  lines.push(`已完成訂單,${reportData.summary.completedOrders}`)
  lines.push(`已完成金額,${reportData.summary.completedAmount}`)
  lines.push('')

  // 每日明細
  lines.push('每日銷售明細')
  lines.push('日期,訂單數,銷售額,平均金額')
  reportData.trend.forEach(item => {
    lines.push(`${item.date},${item.orderCount},${item.amount},${item.avgAmount}`)
  })
  lines.push('')

  // 狀態分布
  lines.push('訂單狀態分布')
  lines.push('狀態,訂單數,金額,佔比')
  reportData.statusBreakdown.forEach(item => {
    lines.push(`${statusLabelMap[item.status] || item.status},${item.count},${item.amount},${item.percentage.toFixed(2)}%`)
  })

  return lines.join('\n')
}

// 初始化
onMounted(() => {
  loadReportData()
})
</script>

<style scoped>
.sales-report {
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

.stat-card {
  text-align: center;
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

@media (max-width: 768px) {
  .summary-cards .el-col {
    margin-bottom: 12px;
  }
}
</style>
