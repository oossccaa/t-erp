<template>
  <div class="main-layout">
    <!-- 主要内容区 -->
    <main class="main-content">
      <RouterView />
    </main>
    
    <!-- 底部导航栏 -->
    <van-tabbar 
      v-model="activeTab" 
      @change="onTabChange"
      class="main-tabbar"
      placeholder
      safe-area-inset-bottom
    >
      <van-tabbar-item icon="home-o" name="home">{{ $t('nav.home') }}</van-tabbar-item>
      <van-tabbar-item icon="orders-o" name="orders">{{ $t('nav.orders') }}</van-tabbar-item>
      <van-tabbar-item icon="goods-collect-o" name="products">{{ $t('nav.products') }}</van-tabbar-item>
      <van-tabbar-item icon="records" name="inventory">{{ $t('nav.inventory') }}</van-tabbar-item>
      <van-tabbar-item icon="setting-o" name="settings">{{ $t('nav.settings') }}</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const activeTab = ref('home')

// 监听路由变化更新活跃标签
watch(
  () => route.name,
  (newRoute) => {
    if (newRoute && typeof newRoute === 'string') {
      const routeTabMap: Record<string, string> = {
        Home: 'home',
        Orders: 'orders',
        CreateOrder: 'orders',
        OrderDetail: 'orders',
        Products: 'products',
        Inventory: 'inventory',
        Settings: 'settings',
      }
      activeTab.value = routeTabMap[newRoute] || 'home'
    }
  },
  { immediate: true }
)

// 标签页切换
const onTabChange = (name: string | number) => {
  const tabRouteMap: Record<string, string> = {
    home: '/home',
    orders: '/orders',
    products: '/products',
    inventory: '/inventory',
    settings: '/settings',
  }
  
  if (typeof name === 'string' && tabRouteMap[name]) {
    router.push(tabRouteMap[name])
  }
}
</script>

<style lang="scss" scoped>
.main-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  padding-bottom: 50px; // 为底部导航预留空间
}

.main-tabbar {
  :deep(.van-tabbar-item) {
    color: #646566;
  }
  
  :deep(.van-tabbar-item--active) {
    color: #1989fa;
  }
}
</style>