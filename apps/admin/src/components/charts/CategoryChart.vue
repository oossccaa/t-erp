<template>
  <div class="category-chart">
    <div ref="chartRef" style="width: 100%; height: 300px;"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const chartRef = ref<HTMLDivElement>()

interface CategoryData {
  name: string
  value: number
}

const props = withDefaults(defineProps<{
  data?: CategoryData[]
  title?: string
}>(), {
  title: '分類統計圖'
})

onMounted(() => {
  // TODO: 使用真實的圖表庫 (如 ECharts)
  if (chartRef.value) {
    chartRef.value.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; height: 100%; background: #f5f7fa; border: 1px dashed #dcdfe6; border-radius: 4px;">
        <div style="text-align: center; color: #909399;">
          <div style="font-size: 16px; margin-bottom: 8px;">${props.title}</div>
          <div style="font-size: 14px;">圖表功能開發中</div>
        </div>
      </div>
    `
  }
})

onUnmounted(() => {
  // 清理圖表實例
})
</script>

<style scoped>
.category-chart {
  width: 100%;
}
</style>