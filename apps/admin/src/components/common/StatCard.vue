<template>
  <el-card class="stats-card" shadow="hover">
    <div class="stats-content">
      <div class="stats-icon" :class="tone">
        <el-icon>
          <component :is="icon" />
        </el-icon>
      </div>
      <div class="stats-info">
        <div class="stats-value">{{ value }}</div>
        <div class="stats-label">{{ label }}</div>
      </div>
    </div>
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
.stats-card {
  .stats-content {
    display: flex;
    align-items: center;
    gap: 16px;

    .stats-icon {
      width: 48px;
      height: 48px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      background-color: var(--el-color-primary-light-9);
      color: var(--el-color-primary);

      &.success {
        background-color: var(--el-color-success-light-9);
        color: var(--el-color-success);
      }

      &.warning {
        background-color: var(--el-color-warning-light-9);
        color: var(--el-color-warning);
      }

      &.danger {
        background-color: var(--el-color-danger-light-9);
        color: var(--el-color-danger);
      }
    }

    .stats-info {
      flex: 1;
      min-width: 0;

      .stats-value {
        font-size: 24px;
        font-weight: 600;
        color: var(--el-text-color-primary);
        margin-bottom: 4px;
      }

      .stats-label {
        color: var(--el-text-color-secondary);
        font-size: 14px;
      }
    }
  }
}
</style>
