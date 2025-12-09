<template>
  <div class="keep-alive-tabs">
    <el-tabs
      v-model="activeTab"
      type="card"
      closable
      @tab-remove="handleTabRemove"
      @tab-click="handleTabClick"
    >
      <el-tab-pane
        v-for="tab in tabs"
        :key="tab.name"
        :label="tab.title"
        :name="tab.name"
        :closable="tab.name !== 'Dashboard'"
      >
        <component :is="tab.component" v-if="tab.name === activeTab" />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

interface TabItem {
  name: string
  title: string
  path: string
  component?: any
}

const route = useRoute()
const router = useRouter()

const activeTab = ref(route.name as string)
const tabs = ref<TabItem[]>([
  {
    name: 'Dashboard',
    title: '儀表板',
    path: '/dashboard'
  }
])

const handleTabRemove = (targetName: string) => {
  const index = tabs.value.findIndex(tab => tab.name === targetName)
  if (index > -1) {
    tabs.value.splice(index, 1)
    
    // 如果關閉的是當前標籤，切換到其他標籤
    if (activeTab.value === targetName) {
      const nextTab = tabs.value[index] || tabs.value[index - 1]
      if (nextTab) {
        activeTab.value = nextTab.name
        router.push(nextTab.path)
      }
    }
  }
}

const handleTabClick = (tab: any) => {
  const targetTab = tabs.value.find(t => t.name === tab.props.name)
  if (targetTab) {
    router.push(targetTab.path)
  }
}

// 監聽路由變化
watch(route, (newRoute) => {
  const existingTab = tabs.value.find(tab => tab.name === newRoute.name)
  if (!existingTab) {
    tabs.value.push({
      name: newRoute.name as string,
      title: newRoute.meta?.title as string || newRoute.name as string,
      path: newRoute.path
    })
  }
  activeTab.value = newRoute.name as string
}, { immediate: true })
</script>

<style scoped>
.keep-alive-tabs {
  margin-bottom: 20px;
}

:deep(.el-tabs__content) {
  padding: 0;
}
</style>