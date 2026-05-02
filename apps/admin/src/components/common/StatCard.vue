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

      // 深色模式：Element Plus 的 light-9 變成 #18222c 之類，
      // 跟 dark 背景幾乎同色 → icon 糊掉。
      // 用 color-mix 把彩色 mix 透明度，深色底下也看得到。
      :global(html.dark) & {
        background-color: color-mix(in srgb, var(--el-color-primary) 22%, transparent);
      }

      &.success {
        background-color: var(--el-color-success-light-9);
        color: var(--el-color-success);

        :global(html.dark) & {
          background-color: color-mix(in srgb, var(--el-color-success) 22%, transparent);
        }
      }

      &.warning {
        background-color: var(--el-color-warning-light-9);
        color: var(--el-color-warning);

        :global(html.dark) & {
          background-color: color-mix(in srgb, var(--el-color-warning) 22%, transparent);
        }
      }

      &.danger {
        background-color: var(--el-color-danger-light-9);
        color: var(--el-color-danger);

        :global(html.dark) & {
          background-color: color-mix(in srgb, var(--el-color-danger) 22%, transparent);
        }
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
