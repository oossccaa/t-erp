<template>
  <div id="app">
    <RouterView />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'

const authStore = useAuthStore()
const appStore = useAppStore()

// 初始化應用
onMounted(() => {
  // 初始化主題（先初始化主題，再檢查登入狀態）
  appStore.initTheme()

  // 檢查登入狀態
  authStore.checkAuth()
})
</script>

<style lang="scss">
#app {
  height: 100vh;
  font-family: var(--el-font-family);
}

// 手機響應式全域覆寫
@media (max-width: 768px) {
  // Dialog 在手機上全螢幕
  .el-dialog {
    --el-dialog-width: 100% !important;
    width: 100% !important;
    max-width: 100vw !important;
    margin: 0 !important;
    height: 100vh;
    border-radius: 0 !important;

    .el-dialog__body {
      max-height: calc(100vh - 120px);
      overflow-y: auto;
    }
  }

  // 表格可橫向滾動
  .el-table {
    width: 100%;
    overflow-x: auto;
  }

  // 頁面內容間距縮小
  .el-main {
    padding: 8px !important;
  }

  // 表單一列排列
  .el-form--inline .el-form-item {
    width: 100%;
    margin-right: 0;
  }
}
</style>
