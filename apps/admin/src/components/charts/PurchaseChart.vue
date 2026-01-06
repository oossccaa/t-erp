<template>
  <div class="purchase-chart">
    <v-chart
      v-if="!loading && chartData.dates.length > 0"
      :option="option"
      :autoresize="true"
      style="width: 100%; height: 300px;"
    />
    <el-empty v-else-if="!loading" description="暫無數據" :image-size="80" />
    <div v-else class="loading-container">
      <el-icon class="is-loading"><Loading /></el-icon>
      <span>載入中...</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, BarChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent
} from 'echarts/components'
import VChart from 'vue-echarts'
import { purchaseOrdersApi } from '@/api/purchase-orders'
import dayjs from 'dayjs'
import { Loading } from '@element-plus/icons-vue'

// 註冊 ECharts 組件
use([
  CanvasRenderer,
  LineChart,
  BarChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent
])

// Props
interface Props {
  period: '7d' | '30d' | '90d'
}

const props = defineProps<Props>()

// 數據狀態
const loading = ref(false)
const chartData = ref<{
  dates: string[]
  amounts: number[]
  orderCounts: number[]
}>({
  dates: [],
  amounts: [],
  orderCounts: []
})

/**
 * 計算日期範圍
 */
const calculateDateRange = (period: string) => {
  const endDate = dayjs().format('YYYY-MM-DD')
  let startDate = ''

  switch (period) {
    case '7d':
      startDate = dayjs().subtract(6, 'day').format('YYYY-MM-DD')
      break
    case '30d':
      startDate = dayjs().subtract(29, 'day').format('YYYY-MM-DD')
      break
    case '90d':
      startDate = dayjs().subtract(89, 'day').format('YYYY-MM-DD')
      break
    default:
      startDate = dayjs().subtract(6, 'day').format('YYYY-MM-DD')
  }

  return { startDate, endDate }
}

/**
 * 加載圖表數據
 */
const loadChartData = async () => {
  try {
    loading.value = true
    const { startDate, endDate } = calculateDateRange(props.period)

    const res = await purchaseOrdersApi.getDateRangePurchaseReport({
      startDate,
      endDate
    })

    if (res.success && res.data && res.data.trend) {
      // 提取 trend 數據
      const dates = res.data.trend.map((item: any) => item.date)
      const amounts = res.data.trend.map((item: any) => item.amount)
      const orderCounts = res.data.trend.map((item: any) => item.orderCount)

      chartData.value = {
        dates,
        amounts,
        orderCounts
      }
    }
  } catch (error) {
    console.error('加載進貨趨勢數據失敗', error)
    chartData.value = {
      dates: [],
      amounts: [],
      orderCounts: []
    }
  } finally {
    loading.value = false
  }
}

/**
 * ECharts 雙Y軸配置
 */
const option = computed(() => ({
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'cross',
      crossStyle: {
        color: '#999'
      }
    },
    formatter: (params: any) => {
      if (!params || params.length === 0) return ''

      const date = params[0].axisValue
      let result = `${date}<br/>`

      params.forEach((param: any) => {
        const value = param.value
        const unit = param.seriesName === '進貨額' ? ' 元' : ' 筆'
        result += `${param.marker}${param.seriesName}: ${value.toLocaleString()}${unit}<br/>`
      })

      return result
    }
  },
  legend: {
    data: ['進貨額', '訂單數'],
    top: 0
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
    data: chartData.value.dates,
    axisPointer: {
      type: 'shadow'
    },
    axisLabel: {
      rotate: chartData.value.dates.length > 30 ? 45 : 0,
      formatter: (value: string) => {
        // 格式化日期顯示，只顯示月-日
        return dayjs(value).format('MM-DD')
      }
    }
  },
  yAxis: [
    {
      type: 'value',
      name: '進貨額',
      position: 'left',
      axisLabel: {
        formatter: (value: number) => {
          if (value >= 10000) {
            return (value / 10000).toFixed(1) + 'w'
          }
          return value.toString()
        }
      },
      splitLine: {
        lineStyle: {
          type: 'dashed'
        }
      }
    },
    {
      type: 'value',
      name: '訂單數',
      position: 'right',
      axisLabel: {
        formatter: '{value} 筆'
      },
      splitLine: {
        show: false
      }
    }
  ],
  series: [
    {
      name: '進貨額',
      type: 'line',
      yAxisIndex: 0,
      data: chartData.value.amounts,
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      itemStyle: {
        color: '#E6A23C'
      },
      lineStyle: {
        width: 2
      },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(230, 162, 60, 0.3)' },
            { offset: 1, color: 'rgba(230, 162, 60, 0.05)' }
          ]
        }
      }
    },
    {
      name: '訂單數',
      type: 'bar',
      yAxisIndex: 1,
      data: chartData.value.orderCounts,
      itemStyle: {
        color: '#F56C6C',
        borderRadius: [4, 4, 0, 0]
      },
      barMaxWidth: 30
    }
  ]
}))

// 生命週期
onMounted(() => {
  loadChartData()
})

// 監聽 period 變化
watch(() => props.period, () => {
  loadChartData()
})
</script>

<style scoped>
.purchase-chart {
  width: 100%;
  min-height: 300px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: var(--el-text-color-secondary);
  gap: 12px;
}

.loading-container .el-icon {
  font-size: 32px;
}

.loading-container span {
  font-size: 14px;
}
</style>
