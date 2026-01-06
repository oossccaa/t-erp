<template>
  <div class="dashboard">
    <!-- 歡迎資訊 -->
    <div class="welcome-section">
      <h1 class="welcome-title">
        歡迎回來，{{ authStore.user?.username }}！
      </h1>
      <p class="welcome-subtitle">
        今天是 {{ currentDate }}，祝您工作愉快。
      </p>
    </div>
    
    <!-- 資料概覽卡片 -->
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
      
      <!-- 進貨趨勢圖 -->
      <el-col :xs="24" :lg="12">
        <el-card class="chart-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span class="card-title">進貨趨勢</span>
              <el-radio-group v-model="purchasePeriod" size="small">
                <el-radio-button value="7d">7天</el-radio-button>
                <el-radio-button value="30d">30天</el-radio-button>
                <el-radio-button value="90d">90天</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div class="chart-container">
            <PurchaseChart :period="purchasePeriod" />
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
                檢視全部
              </el-link>
            </div>
          </template>
          <div class="list-content">
            <el-empty v-if="!recentOrders.length" description="暫無資料" :image-size="80" />
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
                檢視全部
              </el-link>
            </div>
          </template>
          <div class="list-content">
            <el-empty v-if="!lowStockProducts.length" description="庫存充足" :image-size="80" />
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import { ElMessage } from 'element-plus'
import {
  Box,
  User,
  ShoppingCart,
  Wallet,
  ArrowUp,
  ArrowDown,
} from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import SalesChart from '@/components/charts/SalesChart.vue'
import PurchaseChart from '@/components/charts/PurchaseChart.vue'
import { saleOrdersApi } from '@/api/sale-orders'
import { purchaseOrdersApi } from '@/api/purchase-orders'
import { inventoryApi } from '@/api/inventory'
import { customersApi } from '@/api/customers'
import { productsApi } from '@/api/products'

const router = useRouter()
const authStore = useAuthStore()

// 當前日期
const currentDate = computed(() => {
  return dayjs().format('YYYY年MM月DD日 dddd')
})

// 銷售周期
const salesPeriod = ref<'7d' | '30d' | '90d'>('30d')

// 進貨周期
const purchasePeriod = ref<'7d' | '30d' | '90d'>('30d')

// 統計數據
const statsData = ref([
  {
    key: 'products',
    label: '產品總數',
    value: '0',
    icon: 'Box',
    type: 'primary',
    trend: 0,
  },
  {
    key: 'orders',
    label: '本月訂單',
    value: '0',
    icon: 'ShoppingCart',
    type: 'success',
    trend: 0,
  },
  {
    key: 'customers',
    label: '客戶總數',
    value: '0',
    icon: 'User',
    type: 'info',
    trend: 0,
  },
  {
    key: 'revenue',
    label: '本月銷售額',
    value: '0',
    icon: 'Wallet',
    type: 'warning',
    trend: 0,
  },
])

// 最新訂單
const recentOrders = ref<any[]>([])

// 低庫存產品
const lowStockProducts = ref<any[]>([])

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

// 檢視訂單詳情
const viewOrderDetail = (order: any) => {
  router.push(`/sale-orders/${order.id}`)
}

// 組件標題
defineOptions({
  name: 'Dashboard',
})

// 初始化數據
const loadDashboardData = async () => {
  try {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1

    // 並行加載所有數據
    const [
      inventoryStats,
      monthlySalesReport,
      customerStats,
      orders,
      lowStock
    ] = await Promise.all([
      inventoryApi.getStats(),
      saleOrdersApi.getMonthlySalesReport({ year: currentYear, month: currentMonth }),
      customersApi.getCustomerStats(),
      saleOrdersApi.getSaleOrders({ page: 1, limit: 5 }),
      inventoryApi.getStats({ lowStockOnly: true })
    ])

    // 更新統計卡片數據 - 產品總數
    if (inventoryStats.success && inventoryStats.data) {
      const productStat = statsData.value.find(s => s.key === 'products')
      if (productStat) {
        productStat.value = (inventoryStats.data as any).totalProducts?.toString() || '0'
      }
    }

    // 更新本月訂單和收入
    if (monthlySalesReport.success && monthlySalesReport.data) {
      const orderStat = statsData.value.find(s => s.key === 'orders')
      const revenueStat = statsData.value.find(s => s.key === 'revenue')

      const reportData = monthlySalesReport.data as any
      const summary = reportData.data?.summary || reportData.summary
      if (orderStat && summary?.totalOrders !== undefined) {
        orderStat.value = summary.totalOrders.toString()
      }

      if (revenueStat && summary?.totalAmount !== undefined) {
        const revenue = summary.totalAmount
        if (revenue >= 1000000) {
          revenueStat.value = (revenue / 1000000).toFixed(1) + 'M'
        } else if (revenue >= 1000) {
          revenueStat.value = (revenue / 1000).toFixed(1) + 'K'
        } else {
          revenueStat.value = revenue.toFixed(0)
        }
      }
    }

    // 更新客戶總數
    if (customerStats.success && customerStats.data) {
      const customerStat = statsData.value.find(s => s.key === 'customers')
      if (customerStat) {
        customerStat.value = (customerStats.data as any).totalCustomers?.toString() || '0'
      }
    }

    // 更新最新訂單列表
    if (orders.success && orders.data) {
      const orderData = orders.data as any
      const items = orderData.items || []
      recentOrders.value = items.slice(0, 5).map((order: any) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        customer: order.customerName || '未知客戶',
        totalAmount: order.totalAmount,
        status: order.status,
        createdAt: new Date(order.createdAt)
      }))
    }

    // 更新低庫存產品列表
    if (lowStock.success && lowStock.data) {
      const stockData = lowStock.data as any
      const products = stockData.products || []
      lowStockProducts.value = products.slice(0, 5).map((product: any) => ({
        id: product.id,
        name: product.name,
        sku: product.sku,
        currentStock: product.stockQuantity,
        minStock: product.minStockLevel
      }))
    }
  } catch (error) {
    console.error('加載儀表板數據失敗:', error)
    ElMessage.error('加載儀表板數據失敗')
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
