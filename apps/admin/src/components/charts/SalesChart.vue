<template>
  <div class="sales-chart">
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
import { saleOrdersApi } from '@/api/sale-orders'
import dayjs from 'dayjs'
import { Loading } from '@element-plus/icons-vue'
import { useChartTheme } from '@/composables/useChartTheme'

const { textColor } = useChartTheme()

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
type Granularity = 'day' | 'week' | 'month'
interface Props {
  granularity: Granularity
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
 * 根據粒度計算查詢範圍（要抓足夠資料做加總）
 * day: 近 14 天
 * week: 近 12 週（84 天）
 * month: 近 12 個月（從當月回推 11 個月的月初）
 */
const calculateDateRange = (granularity: Granularity) => {
  const endDate = dayjs().format('YYYY-MM-DD')
  let startDate = ''
  switch (granularity) {
    case 'day':
      startDate = dayjs().subtract(13, 'day').format('YYYY-MM-DD')
      break
    case 'week':
      startDate = dayjs().subtract(11, 'week').startOf('week').format('YYYY-MM-DD')
      break
    case 'month':
      startDate = dayjs().subtract(11, 'month').startOf('month').format('YYYY-MM-DD')
      break
  }
  return { startDate, endDate }
}

/**
 * 把每日 trend 資料依粒度分組加總
 */
const bucketize = (
  trend: Array<{ date: string; amount: number; orderCount: number }>,
  granularity: Granularity,
) => {
  if (granularity === 'day') {
    return {
      dates: trend.map((t) => t.date),
      amounts: trend.map((t) => Number(t.amount) || 0),
      orderCounts: trend.map((t) => Number(t.orderCount) || 0),
    }
  }

  const now = dayjs()
  const buckets = new Map<string, { amount: number; orderCount: number; label: string }>()

  // 預先建立空桶，確保每一期都出現（避免沒單的月份被略過）
  if (granularity === 'week') {
    for (let i = 11; i >= 0; i--) {
      const weekStart = now.subtract(i, 'week').startOf('week')
      const key = weekStart.format('YYYY-MM-DD')
      buckets.set(key, { amount: 0, orderCount: 0, label: weekStart.format('MM/DD') })
    }
  } else {
    for (let i = 11; i >= 0; i--) {
      const monthStart = now.subtract(i, 'month').startOf('month')
      const key = monthStart.format('YYYY-MM')
      buckets.set(key, { amount: 0, orderCount: 0, label: monthStart.format('YYYY-MM') })
    }
  }

  for (const t of trend) {
    const d = dayjs(t.date)
    if (!d.isValid()) continue
    const key = granularity === 'week' ? d.startOf('week').format('YYYY-MM-DD') : d.format('YYYY-MM')
    const bucket = buckets.get(key)
    if (!bucket) continue
    bucket.amount += Number(t.amount) || 0
    bucket.orderCount += Number(t.orderCount) || 0
  }

  const entries = Array.from(buckets.values())
  return {
    dates: entries.map((b) => b.label),
    amounts: entries.map((b) => b.amount),
    orderCounts: entries.map((b) => b.orderCount),
  }
}

/**
 * 加載圖表數據
 */
const loadChartData = async () => {
  try {
    loading.value = true
    const { startDate, endDate } = calculateDateRange(props.granularity)

    const res = await saleOrdersApi.getDateRangeSalesReport({
      startDate,
      endDate
    })

    if (res.success && res.data && res.data.trend) {
      chartData.value = bucketize(res.data.trend as any, props.granularity)
    }
  } catch (error) {
    console.error('加載銷售趨勢數據失敗', error)
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
  textStyle: { color: textColor.value },
  legend: { data: ['銷售額', '訂單數'], top: 0, textStyle: { color: textColor.value } },
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

      const raw = params[0].axisValue
      const d = dayjs(raw)
      const header = props.granularity === 'day' && d.isValid()
        ? d.format('YYYY-MM-DD')
        : props.granularity === 'week'
          ? `${raw} 當週`
          : raw
      let result = `${header}<br/>`

      params.forEach((param: any) => {
        const value = param.value
        const prefix = param.seriesName === '銷售額' ? 'NT$ ' : ''
        const suffix = param.seriesName === '銷售額' ? '' : ' 筆'
        result += `${param.marker}${param.seriesName}: ${prefix}${Number(value).toLocaleString()}${suffix}<br/>`
      })

      return result
    }
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
      type: 'shadow',
      label: {
        formatter: (p: any) => {
          const d = dayjs(p.value)
          return d.isValid() ? d.format('YYYY-MM-DD') : p.value
        }
      }
    },
    axisLabel: {
      rotate: chartData.value.dates.length > 30 ? 45 : 0,
      formatter: (value: string) => {
        const d = dayjs(value)
        return d.isValid() ? d.format('MM-DD') : value
      }
    }
  },
  yAxis: [
    {
      type: 'value',
      name: '銷售額',
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
      name: '銷售額',
      type: 'line',
      yAxisIndex: 0,
      data: chartData.value.amounts,
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      itemStyle: {
        color: '#409EFF'
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
      data: chartData.value.orderCounts,
      itemStyle: {
        color: '#67C23A',
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

// 監聽粒度變化
watch(() => props.granularity, () => {
  loadChartData()
})
</script>

<style scoped>
.sales-chart {
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
