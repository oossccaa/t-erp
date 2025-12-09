<template>
  <div class="dashboard">
    <!-- 歡迎信息 -->
    <div class="welcome-section">
      <h1 class="welcome-title">
        欢迎回來，{{ authStore.user?.username }}！
      </h1>
      <p class="welcome-subtitle">
        今天是 {{ currentDate }}，祝您工作愛快。
      </p>
    </div>
    
    <!-- 數據概覽卡片 -->
    <el-row :gutter="16" class="stats-cards">
      <el-col :xs="12" :sm="6" v-for="stat in statsData" :key="stat.key">
        <el-card class="stat-card" :class="`stat-card--${stat.type}`" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon :size="32">
                <component :is="stat.icon" />
              </el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stat.value }}</div>
              <div class="stat-label">{{ stat.label }}</div>
            </div>
          </div>
          <div class="stat-trend">
            <el-icon :class="stat.trend > 0 ? 'trend-up' : 'trend-down'">
              <ArrowUp v-if="stat.trend > 0" />
              <ArrowDown v-else />
            </el-icon>
            <span class="trend-text">{{ Math.abs(stat.trend) }}%</span>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <!-- 圖表區域 -->
    <el-row :gutter="16" class="charts-section">
      <!-- 銷售趨勢圖 -->
      <el-col :xs="24" :lg="12">
        <el-card class="chart-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span class="card-title">銷售趨勢</span>
              <el-radio-group v-model="salesPeriod" size="small">
                <el-radio-button value="7d">7天</el-radio-button>
                <el-radio-button value="30d">30天</el-radio-button>
                <el-radio-button value="90d">90天</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div class="chart-container">
            <SalesChart :period="salesPeriod" />
          </div>
        </el-card>
      </el-col>
      
      <!-- 產品分類分布 -->
      <el-col :xs="24" :lg="12">
        <el-card class="chart-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span class="card-title">產品分類</span>
            </div>
          </template>
          <div class="chart-container">
            <CategoryChart />
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <!-- 列表區域 -->
    <el-row :gutter="16" class="lists-section">
      <!-- 最新訂單 -->
      <el-col :xs="24" :lg="12">
        <el-card class="list-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span class="card-title">最新訂單</span>
              <el-link type="primary" :underline="false" @click="$router.push('/sale-orders')">
                查看全部
              </el-link>
            </div>
          </template>
          <div class="list-content">
            <el-empty v-if="!recentOrders.length" description="暂無數據" :image-size="80" />
            <div v-else class="order-list">
              <div 
                v-for="order in recentOrders" 
                :key="order.id"
                class="order-item"
                @click="viewOrderDetail(order)"
              >
                <div class="order-info">
                  <div class="order-number">#{{ order.orderNumber }}</div>
                  <div class="order-customer">{{ order.customer }}</div>
                  <div class="order-time">{{ formatTime(order.createdAt) }}</div>
                </div>
                <div class="order-amount">
                  <div class="amount">NT$ {{ formatMoney(order.totalAmount) }}</div>
                  <el-tag :type="getOrderStatusType(order.status)" size="small">
                    {{ getOrderStatusText(order.status) }}
                  </el-tag>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <!-- 庫存警告 -->
      <el-col :xs="24" :lg="12">
        <el-card class="list-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span class="card-title">庫存警告</span>
              <el-link type="primary" :underline="false" @click="$router.push('/inventory')">
                查看全部
              </el-link>
            </div>
          </template>
          <div class="list-content">
            <el-empty v-if="!lowStockProducts.length" description="库存充足" :image-size="80" />
            <div v-else class="stock-list">
              <div 
                v-for="product in lowStockProducts" 
                :key="product.id"
                class="stock-item"
              >
                <div class="product-info">
                  <div class="product-name">{{ product.name }}</div>
                  <div class="product-sku">{{ product.sku }}</div>
                </div>
                <div class="stock-info">
                  <div class="current-stock">{{ product.currentStock }}</div>
                  <div class="min-stock">最低: {{ product.minStock }}</div>
                  <el-progress 
                    :percentage="(product.currentStock / product.minStock) * 100"
                    :status="product.currentStock < product.minStock ? 'exception' : 'warning'"
                    :show-text="false"
                    :stroke-width="4"
                  />
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <!-- 快捷操作 -->
    <el-card class="quick-actions" shadow="never">
      <template #header>
        <span class="card-title">快捷操作</span>
      </template>
      <div class="actions-grid">
        <div 
          v-for="action in quickActions" 
          :key="action.key"
          class="action-item"
          @click="handleQuickAction(action)"
        >
          <div class="action-icon">
            <el-icon :size="24">
              <component :is="action.icon" />
            </el-icon>
          </div>
          <div class="action-text">{{ action.label }}</div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import {
  Box,
  User,
  ShoppingCart,
  Wallet,
  ArrowUp,
  ArrowDown,
  Plus,
  Edit,
  Search,
  Document,
} from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import SalesChart from '@/components/charts/SalesChart.vue'
import CategoryChart from '@/components/charts/CategoryChart.vue'

const router = useRouter()
const authStore = useAuthStore()

// 當前日期
const currentDate = computed(() => {
  return dayjs().format('YYYY年MM月DD日 dddd')
})

// 銷售周期
const salesPeriod = ref('30d')

// 統計數據
const statsData = ref([
  {
    key: 'products',
    label: '產品總数',
    value: '1,234',
    icon: 'Box',
    type: 'primary',
    trend: 5.2,
  },
  {
    key: 'orders',
    label: '本月訂單',
    value: '89',
    icon: 'ShoppingCart',
    type: 'success',
    trend: 12.5,
  },
  {
    key: 'customers',
    label: '客戶總数',
    value: '456',
    icon: 'User',
    type: 'info',
    trend: 3.1,
  },
  {
    key: 'revenue',
    label: '本月收入',
    value: '789K',
    icon: 'Wallet',
    type: 'warning',
    trend: -2.3,
  },
])

// 最新訂單
const recentOrders = ref([
  {
    id: 1,
    orderNumber: 'SO202401001',
    customer: '優質客戶A',
    totalAmount: 15600,
    status: 'pending',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: 2,
    orderNumber: 'SO202401002',
    customer: '稳定客戶B',
    totalAmount: 28900,
    status: 'confirmed',
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
  },
  {
    id: 3,
    orderNumber: 'SO202401003',
    customer: '新客戶C',
    totalAmount: 8750,
    status: 'shipped',
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
  },
])

// 低庫存產品
const lowStockProducts = ref([
  {
    id: 1,
    name: 'iPhone 15',
    sku: 'PHONE001',
    currentStock: 8,
    minStock: 10,
  },
  {
    id: 2,
    name: '原子筆',
    sku: 'PEN001',
    currentStock: 45,
    minStock: 100,
  },
  {
    id: 3,
    name: 'MacBook Air',
    sku: 'LAPTOP001',
    currentStock: 3,
    minStock: 5,
  },
])

// 快捷操作
const quickActions = [
  {
    key: 'add-product',
    label: '新增產品',
    icon: 'Plus',
    action: () => router.push('/products/create'),
  },
  {
    key: 'create-order',
    label: '建立訂單',
    icon: 'Edit',
    action: () => router.push('/sale-orders/create'),
  },
  {
    key: 'search-product',
    label: '搜尋產品',
    icon: 'Search',
    action: () => router.push('/products'),
  },
  {
    key: 'view-reports',
    label: '查看報表',
    icon: 'Document',
    action: () => router.push('/reports'),
  },
]

// 格式化金額
const formatMoney = (amount: number) => {
  return new Intl.NumberFormat('zh-TW').format(amount)
}

// 格式化時間
const formatTime = (time: Date) => {
  return dayjs(time).format('MM/DD HH:mm')
}

// 獲取訂單狀態類型
const getOrderStatusType = (status: string) => {
  const statusMap: Record<string, string> = {
    pending: 'warning',
    confirmed: 'primary',
    shipped: 'success',
    delivered: 'success',
    cancelled: 'danger',
  }
  return statusMap[status] || 'info'
}

// 獲取訂單狀態文字
const getOrderStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    pending: '待處理',
    confirmed: '已確認',
    shipped: '已出貨',
    delivered: '已送達',
    cancelled: '已取消',
  }
  return statusMap[status] || status
}

// 查看訂單詳情
const viewOrderDetail = (order: any) => {
  router.push(`/sale-orders/${order.id}`)
}

// 處理快捷操作
const handleQuickAction = (action: any) => {
  if (action.action) {
    action.action()
  }
}

// 組件標題
defineOptions({
  name: 'Dashboard',
})

// 初始化數據
const loadDashboardData = async () => {
  try {
    // 這裡可以調用 API 獲取實際數據
    // const [stats, orders, stocks] = await Promise.all([
    //   dashboardApi.getStats(),
    //   dashboardApi.getRecentOrders(),
    //   dashboardApi.getLowStockProducts(),
    // ])
    
    // statsData.value = stats
    // recentOrders.value = orders
    // lowStockProducts.value = stocks
  } catch (error) {
    console.error('加載儀表板數據失敗:', error)
  }
}

onMounted(() => {
  loadDashboardData()
})
</script>

<style lang="scss" scoped>
.dashboard {
  padding: 24px;
  background-color: var(--el-bg-color-page);
  min-height: calc(100vh - 120px);
}

// 歡迎信息
.welcome-section {
  margin-bottom: 24px;
  
  .welcome-title {
    font-size: 32px;
    font-weight: bold;
    color: var(--el-text-color-primary);
    margin: 0 0 8px 0;
  }
  
  .welcome-subtitle {
    font-size: 16px;
    color: var(--el-text-color-secondary);
    margin: 0;
  }
}

// 統計卡片
.stats-cards {
  margin-bottom: 24px;
}

.stat-card {
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  }
  
  :deep(.el-card__body) {
    padding: 20px;
  }
  
  &--primary {
    border-left: 4px solid var(--el-color-primary);
  }
  
  &--success {
    border-left: 4px solid var(--el-color-success);
  }
  
  &--info {
    border-left: 4px solid var(--el-color-info);
  }
  
  &--warning {
    border-left: 4px solid var(--el-color-warning);
  }
}

.stat-content {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  
  .stat-icon {
    margin-right: 16px;
    color: var(--el-text-color-secondary);
  }
  
  .stat-info {
    flex: 1;
    
    .stat-value {
      font-size: 28px;
      font-weight: bold;
      color: var(--el-text-color-primary);
      line-height: 1;
      margin-bottom: 4px;
    }
    
    .stat-label {
      font-size: 14px;
      color: var(--el-text-color-secondary);
    }
  }
}

.stat-trend {
  display: flex;
  align-items: center;
  font-size: 12px;
  
  .trend-up {
    color: var(--el-color-success);
  }
  
  .trend-down {
    color: var(--el-color-danger);
  }
  
  .trend-text {
    margin-left: 4px;
    font-weight: 500;
  }
}

// 圖表區域
.charts-section {
  margin-bottom: 24px;
}

.chart-card {
  height: 400px;
  
  .chart-container {
    height: 300px;
  }
}

// 列表區域
.lists-section {
  margin-bottom: 24px;
}

.list-card {
  height: 400px;
  
  .list-content {
    height: 300px;
    overflow-y: auto;
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  .card-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }
}

// 訂單列表
.order-list {
  .order-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid var(--el-border-color-lighter);
    cursor: pointer;
    transition: background-color 0.2s;
    
    &:hover {
      background-color: var(--el-fill-color-lighter);
    }
    
    &:last-child {
      border-bottom: none;
    }
  }
  
  .order-info {
    .order-number {
      font-weight: 600;
      color: var(--el-text-color-primary);
      margin-bottom: 4px;
    }
    
    .order-customer {
      font-size: 14px;
      color: var(--el-text-color-secondary);
      margin-bottom: 2px;
    }
    
    .order-time {
      font-size: 12px;
      color: var(--el-text-color-placeholder);
    }
  }
  
  .order-amount {
    text-align: right;
    
    .amount {
      font-weight: 600;
      color: var(--el-text-color-primary);
      margin-bottom: 4px;
    }
  }
}

// 庫存列表
.stock-list {
  .stock-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid var(--el-border-color-lighter);
    
    &:last-child {
      border-bottom: none;
    }
  }
  
  .product-info {
    .product-name {
      font-weight: 500;
      color: var(--el-text-color-primary);
      margin-bottom: 4px;
    }
    
    .product-sku {
      font-size: 12px;
      color: var(--el-text-color-placeholder);
    }
  }
  
  .stock-info {
    min-width: 120px;
    text-align: right;
    
    .current-stock {
      font-weight: 600;
      font-size: 18px;
      color: var(--el-text-color-primary);
    }
    
    .min-stock {
      font-size: 12px;
      color: var(--el-text-color-secondary);
      margin-bottom: 8px;
    }
  }
}

// 快捷操作
.quick-actions {
  .actions-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
  }
  
  .action-item {
    display: flex;
    align-items: center;
    padding: 16px;
    background-color: var(--el-fill-color-lighter);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    
    &:hover {
      background-color: var(--el-fill-color);
      transform: translateY(-2px);
    }
    
    .action-icon {
      margin-right: 12px;
      color: var(--el-color-primary);
    }
    
    .action-text {
      font-size: 14px;
      font-weight: 500;
      color: var(--el-text-color-primary);
    }
  }
}

// 響應式設計
@media (max-width: 768px) {
  .dashboard {
    padding: 16px;
  }
  
  .welcome-section {
    .welcome-title {
      font-size: 24px;
    }
    
    .welcome-subtitle {
      font-size: 14px;
    }
  }
  
  .stat-content {
    .stat-value {
      font-size: 24px;
    }
  }
  
  .chart-card,
  .list-card {
    height: auto;
    
    .chart-container,
    .list-content {
      height: 250px;
    }
  }
  
  .actions-grid {
    grid-template-columns: repeat(2, 1fr);
    
    .action-item {
      padding: 12px;
      
      .action-text {
        font-size: 12px;
      }
    }
  }
}
</style>
