<template>
  <el-container class="main-layout">
    <!-- 左側導航 -->
    <el-aside
      :width="sidebarWidth"
      class="sidebar"
      :class="{ collapsed: appStore.sidebarCollapsed }"
    >
      <div class="sidebar-header">
        <div class="logo">
          <el-icon v-if="!appStore.sidebarCollapsed" size="28" color="#409eff">
            <Box />
          </el-icon>
          <span v-if="!appStore.sidebarCollapsed" class="logo-text">T-ERP</span>
        </div>
      </div>
      
      <el-scrollbar class="sidebar-menu">
        <el-menu
          :default-active="currentRoute"
          :collapse="appStore.sidebarCollapsed"
          :unique-opened="true"
          router
          class="sidebar-menu-content"
        >
          <template v-for="route in menuRoutes" :key="route.name">
            <el-menu-item
              v-if="!route.children?.length"
              :index="route.path"
              :disabled="route.meta?.disabled"
            >
              <el-icon v-if="route.meta?.icon">
                <component :is="route.meta.icon" />
              </el-icon>
              <template #title>
                {{ route.meta?.title }}
              </template>
            </el-menu-item>
            
            <el-sub-menu
              v-else
              :index="route.path"
              :disabled="route.meta?.disabled"
            >
              <template #title>
                <el-icon v-if="route.meta?.icon">
                  <component :is="route.meta.icon" />
                </el-icon>
                <span>{{ route.meta?.title }}</span>
              </template>
              
              <el-menu-item
                v-for="child in route.children"
                :key="child.name"
                :index="child.path"
                :disabled="child.meta?.disabled"
              >
                <el-icon v-if="child.meta?.icon">
                  <component :is="child.meta.icon" />
                </el-icon>
                <template #title>
                  {{ child.meta?.title }}
                </template>
              </el-menu-item>
            </el-sub-menu>
          </template>
        </el-menu>
      </el-scrollbar>
    </el-aside>
    
    <!-- 右側內容 -->
    <el-container class="main-content">
      <!-- 頂部導航欄 -->
      <el-header class="main-header">
        <div class="header-left">
          <!-- 折疊按鈕 -->
          <el-button
            text
            :icon="appStore.sidebarCollapsed ? Expand : Fold"
            @click="appStore.toggleSidebar()"
          />
          
          <!-- 面包屑 -->
          <el-breadcrumb
            v-if="appStore.showBreadcrumb"
            separator="/"
            class="breadcrumb"
          >
            <el-breadcrumb-item
              v-for="item in breadcrumbs"
              :key="item.path"
              :to="item.path === currentRoute ? undefined : item.path"
            >
              {{ item.title }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        
        <div class="header-right">
          <!-- 全屏切換 -->
          <el-tooltip content="全屏" placement="bottom">
            <el-button
              text
              :icon="isFullscreen ? OfficeBuilding : FullScreen"
              @click="toggle"
            />
          </el-tooltip>
          
          <!-- 主題切換 -->
          <el-tooltip :content="appStore.isDark ? '淺色模式' : '深色模式'" placement="bottom">
            <el-button
              text
              :icon="appStore.isDark ? Sunny : Moon"
              @click="appStore.toggleTheme()"
            />
          </el-tooltip>
          
          <!-- 用戶菜單 -->
          <el-dropdown trigger="click" @command="handleUserCommand">
            <div class="user-avatar">
              <el-avatar :size="32" :src="userAvatar">
                <el-icon><User /></el-icon>
              </el-avatar>
              <span class="user-name">{{ authStore.user?.username }}</span>
              <el-icon class="dropdown-icon"><ArrowDown /></el-icon>
            </div>
            
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon>
                  個人資料
                </el-dropdown-item>
                <el-dropdown-item command="settings">
                  <el-icon><Setting /></el-icon>
                  設定
                </el-dropdown-item>
                <el-dropdown-item divided command="logout">
                  <el-icon><SwitchButton /></el-icon>
                  登出
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      
      <!-- 標籤頁 -->
      <div v-if="appStore.showTabs" class="tabs-container">
        <KeepAliveTabs />
      </div>
      
      <!-- 主要內容區域 -->
      <el-main class="main-body">
        <RouterView v-slot="{ Component, route }">
          <transition name="fade-slide" mode="out-in">
            <KeepAlive v-if="appStore.keepAlive" :include="keepAliveNames">
              <component :is="Component" :key="route.fullPath" />
            </KeepAlive>
            <component v-else :is="Component" :key="route.fullPath" />
          </transition>
        </RouterView>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useFullscreen } from '@vueuse/core'
import {
  Box,
  Fold,
  Expand,
  FullScreen,
  OfficeBuilding,
  Moon,
  Sunny,
  User,
  ArrowDown,
  Setting,
  SwitchButton,
} from '@element-plus/icons-vue'
import { ElMessageBox } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import KeepAliveTabs from '@/components/KeepAliveTabs.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const appStore = useAppStore()
const { isFullscreen, toggle } = useFullscreen()

// 當前路由
const currentRoute = computed(() => route.path)

// 導航寬度
const sidebarWidth = computed(() => `${appStore.sidebarActualWidth}px`)

// 菜單路由
const menuRoutes = computed(() => {
  // 過濾出需要在導航中顯示的路由
  return router.getRoutes().filter(route => {
    return (
      route.path !== '/' &&
      route.meta?.title &&
      route.meta?.requiresAuth !== false &&
      !route.meta?.hidden
    )
  })
})

// 面包屑
const breadcrumbs = computed(() => {
  const matched = route.matched.filter(item => item.meta?.title)
  
  return matched.map(item => ({
    title: item.meta?.title,
    path: item.path,
  }))
})

// 用戶頭像
const userAvatar = computed(() => {
  return authStore.user?.avatar || ''
})

// KeepAlive 緩存名稱
const keepAliveNames = computed(() => {
  // 這裡可以根據業務需求動態設定需要緩存的組件
  return ['Dashboard', 'Products', 'Orders']
})

// 用戶菜單處理
const handleUserCommand = async (command: string) => {
  switch (command) {
    case 'profile':
      // 跳轉到個人資料頁面
      router.push('/profile')
      break
      
    case 'settings':
      // 跳轉到設定頁面
      router.push('/settings')
      break
      
    case 'logout':
      try {
        await ElMessageBox.confirm(
          '確定要登出嗎？',
          '提示',
          {
            confirmButtonText: '確定',
            cancelButtonText: '取消',
            type: 'warning',
          }
        )
        
        await authStore.logout()
        router.push('/login')
      } catch (error) {
        // 用戶取消
      }
      break
  }
}

// 初始化
onMounted(() => {
  // 設定初始主題
  document.documentElement.classList.toggle('dark', appStore.isDark)
})
</script>

<style lang="scss" scoped>
.main-layout {
  height: 100vh;
}

// 導航欄
.sidebar {
  transition: width 0.3s ease;
  border-right: 1px solid var(--el-border-color-light);
  background-color: var(--el-bg-color);
  
  &.collapsed {
    .sidebar-header .logo-text {
      opacity: 0;
    }
  }
}

.sidebar-header {
  height: 60px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  border-bottom: 1px solid var(--el-border-color-light);
  
  .logo {
    display: flex;
    align-items: center;
    gap: 8px;
    
    .logo-text {
      font-size: 20px;
      font-weight: bold;
      color: var(--el-text-color-primary);
      transition: opacity 0.3s ease;
    }
  }
}

.sidebar-menu {
  height: calc(100vh - 60px);
  
  .sidebar-menu-content {
    border-right: none;
  }
}

// 主內容區域
.main-content {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

// 頂部導航
.main-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px;
  border-bottom: 1px solid var(--el-border-color-light);
  background-color: var(--el-bg-color);
  height: 60px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
  
  .breadcrumb {
    font-size: 14px;
  }
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-avatar {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: var(--el-fill-color-light);
  }
  
  .user-name {
    font-size: 14px;
    color: var(--el-text-color-primary);
  }
  
  .dropdown-icon {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    transition: transform 0.2s;
  }
}

// 標籤頁
.tabs-container {
  border-bottom: 1px solid var(--el-border-color-light);
  background-color: var(--el-bg-color);
}

// 主體內容
.main-body {
  flex: 1;
  overflow: auto;
  background-color: var(--el-bg-color-page);
}

// 動畫效果
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s cubic-bezier(0.55, 0, 0.1, 1);
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translate(30px, 0);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translate(-30px, 0);
}

// 響應式設計
@media (max-width: 768px) {
  .main-header {
    padding: 0 12px;
  }
  
  .header-left {
    .breadcrumb {
      display: none;
    }
  }
  
  .user-avatar {
    .user-name {
      display: none;
    }
  }
}
</style>
