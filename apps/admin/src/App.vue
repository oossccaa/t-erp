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
</style>
