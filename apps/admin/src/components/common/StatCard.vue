<template>
  <el-card shadow="hover" class="stat-card">
    <div class="stat-card__title">
      <el-icon :class="['stat-card__icon', tone]">
        <component :is="icon" />
      </el-icon>
      <span>{{ label }}</span>
    </div>
    <div class="stat-card__value">{{ value }}</div>
  </el-card>
</template>

<script setup lang="ts">
import type { Component } from 'vue'

type Tone = 'primary' | 'success' | 'warning' | 'danger'

defineProps<{
  icon: Component | string
  label: string
  value: string | number
  tone?: Tone
}>()
</script>

<style lang="scss" scoped>
// 仿 el-statistic 排版：title 在上 (小灰), value 在下 (大粗)
// 沒有彩色背景方塊, 深色 / 淺色兩邊都乾淨
.stat-card {
  .stat-card__title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    color: var(--el-text-color-regular);
    margin-bottom: 8px;

    .stat-card__icon {
      font-size: 18px;
      color: var(--el-color-primary);

      &.success {
        color: var(--el-color-success);
      }
      &.warning {
        color: var(--el-color-warning);
      }
      &.danger {
        color: var(--el-color-danger);
      }
    }
  }

  .stat-card__value {
    font-size: 28px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    line-height: 1.2;
  }
}
</style>
