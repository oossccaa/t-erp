import { computed } from 'vue'
import { useAppStore } from '@/stores/app'

// 提供 ECharts 在 light/dark 模式下的共用文字與軸線顏色
export function useChartTheme() {
  const appStore = useAppStore()
  const textColor = computed(() => (appStore.isDark ? '#cfd3dc' : '#606266'))
  const axisLineColor = computed(() => (appStore.isDark ? '#414243' : '#dcdfe6'))
  const splitLineColor = computed(() => (appStore.isDark ? '#363637' : '#ebeef5'))

  // 套用到 ECharts option root，會被 legend / tooltip 等繼承
  const baseOption = computed(() => ({
    textStyle: { color: textColor.value },
    legend: { textStyle: { color: textColor.value } },
  }))

  return { textColor, axisLineColor, splitLineColor, baseOption }
}
