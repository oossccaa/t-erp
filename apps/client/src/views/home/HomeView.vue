<template>
  <div class="home-view">
    <!-- 顶部栏 -->
    <van-nav-bar
      :title="`${$t('home.welcome')}，${authStore.user?.username || $t('home.user')}`"
      :border="false"
      class="home-navbar"
    >
      <template #right>
        <van-icon name="bell" size="20" @click="showNotifications" />
      </template>
    </van-nav-bar>
    
    <!-- 数据概览 -->
    <div class="stats-section">
      <van-grid :column-num="2" :border="false" :gutter="12">
        <van-grid-item
          v-for="stat in statsData"
          :key="stat.key"
          class="stat-item"
          @click="handleStatClick(stat)"
        >
          <div class="stat-content">
            <div class="stat-icon" :class="`stat-icon--${stat.type}`">
              <van-icon :name="stat.icon" size="24" />
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stat.value }}</div>
              <div class="stat-label">{{ stat.label }}</div>
            </div>
          </div>
          <div class="stat-trend">
            <van-icon
              :name="stat.trend > 0 ? 'arrow-up' : 'arrow-down'"
              :color="stat.trend > 0 ? '#07c160' : '#ee0a24'"
              size="12"
            />
            <span 
              class="trend-text"
              :style="{ color: stat.trend > 0 ? '#07c160' : '#ee0a24' }"
            >
              {{ Math.abs(stat.trend) }}%
            </span>
          </div>
        </van-grid-item>
      </van-grid>
    </div>
    
    <!-- 快捷操作 -->
    <van-card class="actions-section">
      <template #title>
        <div class="section-title">
          <van-icon name="apps-o" size="16" />
          {{ $t('home.quickActions') }}
        </div>
      </template>
      <van-grid :column-num="3" :border="false" :gutter="8">
        <van-grid-item
          v-for="action in quickActions"
          :key="action.key"
          class="action-item"
          @click="handleActionClick(action)"
        >
          <div class="action-icon">
            <van-icon :name="action.icon" size="20" />
          </div>
          <div class="action-text">{{ action.label }}</div>
        </van-grid-item>
      </van-grid>
    </van-card>
    
    <!-- 最新订单 -->
    <van-card class="orders-section">
      <template #title>
        <div class="section-title">
          <van-icon name="orders-o" size="16" />
          {{ $t('home.recentOrders') }}
        </div>
      </template>
      <template #extra>
        <van-button
          type="primary"
          size="mini"
          plain
          @click="$router.push('/orders')"
        >
          {{ $t('common.viewAll') }}
        </van-button>
      </template>
      
      <div class="orders-list">
        <van-empty
          v-if="!recentOrders.length"
          :description="$t('home.noOrders')"
          :image-size="80"
        />
        <div v-else class="order-list">
          <div 
            v-for="order in recentOrders" 
            :key="order.id"
            class="order-item"
            @click="viewOrderDetail(order)"
          >
            <div class="order-header">
              <span class="order-number">#{{ order.orderNumber }}</span>
              <van-tag 
                :type="getOrderStatusType(order.status)"
                size="medium"
              >
                {{ getOrderStatusText(order.status) }}
              </van-tag>
            </div>
            <div class="order-info">
              <div class="customer-name">{{ order.customer }}</div>
              <div class="order-time">{{ formatTime(order.createdAt) }}</div>
            </div>
            <div class="order-amount">
              NT$ {{ formatMoney(order.totalAmount) }}
            </div>
          </div>
        </div>
      </div>
    </van-card>
    
    <!-- 库存预警 -->
    <van-card class="inventory-section">
      <template #title>
        <div class="section-title">
          <van-icon name="warning-o" size="16" />
          {{ $t('home.inventoryWarning') }}
        </div>
      </template>
      <template #extra>
        <van-button
          type="primary"
          size="mini"
          plain
          @click="$router.push('/inventory')"
        >
          {{ $t('home.manageInventory') }}
        </van-button>
      </template>
      
      <div class="inventory-list">
        <van-empty
          v-if="!lowStockProducts.length"
          :description="$t('home.stockSufficient')"
          :image-size="80"
        />
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
              <div class="stock-numbers">
                <span class="current-stock">{{ product.currentStock }}</span>
                <span class="stock-separator">/</span>
                <span class="min-stock">{{ product.minStock }}</span>
              </div>
              <van-progress
                :percentage="(product.currentStock / product.minStock) * 100"
                :color="product.currentStock < product.minStock ? '#ee0a24' : '#ff976a'"
                :show-pivot="false"
                stroke-width="4"
              />
            </div>
          </div>
        </div>
      </div>
    </van-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showNotify } from 'vant'
import dayjs from 'dayjs'
import { useAuthStore } from '@/stores/auth'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const authStore = useAuthStore()
const { t } = useI18n()

// 统计数据
const statsData = ref([
  {
    key: 'orders',
    label: t('home.stats.orders'),
    value: '128',
    icon: 'orders-o',
    type: 'primary',
    trend: 15.6,
    route: '/orders',
  },
  {
    key: 'products',
    label: t('home.stats.products'),
    value: '1,234',
    icon: 'goods-collect-o',
    type: 'success',
    trend: 8.2,
    route: '/products',
  },
  {
    key: 'customers',
    label: t('home.stats.customers'),
    value: '456',
    icon: 'friends-o',
    type: 'info',
    trend: 3.1,
    route: '/customers',
  },
  {
    key: 'revenue',
    label: t('home.stats.revenue'),
    value: '892K',
    icon: 'balance-o',
    type: 'warning',
    trend: -2.3,
    route: '/reports',
  },
])

// 快捷操作
const quickActions = ref([
  {
    key: 'scan',
    label: t('home.actions.scan'),
    icon: 'scan',
    action: () => showToast(t('home.actions.scanDeveloping')),
  },
  {
    key: 'add-order',
    label: t('home.actions.addOrder'),
    icon: 'add-o',
    action: () => router.push('/orders/create'),
  },
  {
    key: 'search',
    label: t('home.actions.searchProduct'),
    icon: 'search',
    action: () => router.push('/products'),
  },
  {
    key: 'inventory',
    label: t('home.actions.inventoryManage'),
    icon: 'records',
    action: () => router.push('/inventory'),
  },
  {
    key: 'reports',
    label: t('home.actions.reports'),
    icon: 'bar-chart-o',
    action: () => router.push('/reports'),
  },
  {
    key: 'settings',
    label: t('home.actions.systemSettings'),
    icon: 'setting-o',
    action: () => router.push('/settings'),
  },
])

// 最新订单
const recentOrders = ref([
  {
    id: 1,
    orderNumber: 'SO202401001',
    customer: t('customer.qualityCustomer') + 'A',
    totalAmount: 15600,
    status: 'pending',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: 2,
    orderNumber: 'SO202401002',
    customer: t('customer.stableCustomer') + 'B',
    totalAmount: 28900,
    status: 'confirmed',
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
  },
  {
    id: 3,
    orderNumber: 'SO202401003',
    customer: t('customer.newCustomer') + 'C',
    totalAmount: 8750,
    status: 'shipped',
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
  },
])

// 低库存产品
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
    name: '原子笔',
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

// 格式化金额
const formatMoney = (amount: number) => {
  return new Intl.NumberFormat('zh-TW').format(amount)
}

// 格式化时间
const formatTime = (time: Date) => {
  return dayjs(time).format('MM/DD HH:mm')
}

// 获取订单状态类型
const getOrderStatusType = (status: string) => {
  const statusMap: Record<string, 'primary' | 'success' | 'warning' | 'danger' | 'default'> = {
    pending: 'warning',
    confirmed: 'primary',
    shipped: 'success',
    delivered: 'success',
    cancelled: 'danger',
  }
  return statusMap[status] || 'default'
}

// 获取订单状态文字
const getOrderStatusText = (status: string) => {
  return t(`order.statusType.${status}`) || status
}

// 统计卡片点击
const handleStatClick = (stat: any) => {
  if (stat.route) {
    router.push(stat.route)
  }
}

// 快捷操作点击
const handleActionClick = (action: any) => {
  if (action.action) {
    action.action()
  }
}

// 查看订单详情
const viewOrderDetail = (order: any) => {
  router.push(`/orders/${order.id}`)
}

// 显示通知
const showNotifications = () => {
  showNotify({
    type: 'primary',
    message: t('home.noNewNotifications'),
  })
}

// 组件名称
defineOptions({
  name: 'Home',
})

// 初始化数据
const loadHomeData = async () => {
  try {
    // 这里可以调用 API 获取实际数据
    // const [stats, orders, stocks] = await Promise.all([
    //   homeApi.getStats(),
    //   homeApi.getRecentOrders(),
    //   homeApi.getLowStockProducts(),
    // ])
    
    // statsData.value = stats
    // recentOrders.value = orders
    // lowStockProducts.value = stocks
  } catch (error) {
    console.error(t('home.loadDataFailed'), error)
  }
}

onMounted(() => {
  loadHomeData()
})
</script>

<style lang="scss" scoped>
.home-view {
  padding-bottom: 60px; // 为底部导航预留空间
}

.home-navbar {
  background: linear-gradient(135deg, #1989fa 0%, #1876d2 100%);
  color: white;
  
  :deep(.van-nav-bar__title) {
    color: white;
  }
  
  :deep(.van-icon) {
    color: white;
  }
}

// 统计数据
.stats-section {
  padding: 16px;
  margin-bottom: 8px;
}

.stat-item {
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  
  .stat-content {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
    
    .stat-icon {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 12px;
      
      &--primary {
        background: rgba(25, 137, 250, 0.1);
        color: #1989fa;
      }
      
      &--success {
        background: rgba(7, 193, 96, 0.1);
        color: #07c160;
      }
      
      &--info {
        background: rgba(144, 147, 153, 0.1);
        color: #909399;
      }
      
      &--warning {
        background: rgba(255, 151, 106, 0.1);
        color: #ff976a;
      }
    }
    
    .stat-info {
      flex: 1;
      
      .stat-value {
        font-size: 24px;
        font-weight: bold;
        color: #323233;
        line-height: 1;
        margin-bottom: 4px;
      }
      
      .stat-label {
        font-size: 12px;
        color: #969799;
      }
    }
  }
  
  .stat-trend {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    
    .trend-text {
      font-size: 12px;
      margin-left: 2px;
      font-weight: 500;
    }
  }
}

// 通用卡片样式
.actions-section,
.orders-section,
.inventory-section {
  margin: 0 16px 16px 16px;
  
  :deep(.van-card__header) {
    padding: 16px 16px 8px 16px;
  }
  
  :deep(.van-card__body) {
    padding: 0 16px 16px 16px;
  }
}

.section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 16px;
  font-weight: 600;
  color: #323233;
}

// 快捷操作
.action-item {
  padding: 12px 8px;
  
  .action-icon {
    width: 36px;
    height: 36px;
    background: #f7f8fa;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 8px auto;
    color: #1989fa;
  }
  
  .action-text {
    font-size: 12px;
    color: #646566;
    text-align: center;
  }
}

// 订单列表
.order-list {
  .order-item {
    padding: 12px 0;
    border-bottom: 1px solid #f5f5f5;
    
    &:last-child {
      border-bottom: none;
    }
    
    .order-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      
      .order-number {
        font-size: 14px;
        font-weight: 600;
        color: #323233;
      }
    }
    
    .order-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .customer-name {
        font-size: 13px;
        color: #646566;
      }
      
      .order-time {
        font-size: 12px;
        color: #969799;
      }
    }
    
    .order-amount {
      text-align: right;
      font-size: 16px;
      font-weight: 600;
      color: #1989fa;
      margin-top: 4px;
    }
  }
}

// 库存列表
.stock-list {
  .stock-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid #f5f5f5;
    
    &:last-child {
      border-bottom: none;
    }
    
    .product-info {
      flex: 1;
      
      .product-name {
        font-size: 14px;
        font-weight: 500;
        color: #323233;
        margin-bottom: 4px;
      }
      
      .product-sku {
        font-size: 12px;
        color: #969799;
      }
    }
    
    .stock-info {
      width: 100px;
      text-align: right;
      
      .stock-numbers {
        margin-bottom: 6px;
        
        .current-stock {
          font-size: 16px;
          font-weight: 600;
          color: #ee0a24;
        }
        
        .stock-separator {
          color: #c8c9cc;
          margin: 0 2px;
        }
        
        .min-stock {
          font-size: 14px;
          color: #969799;
        }
      }
    }
  }
}

// 空状态
:deep(.van-empty) {
  padding: 32px 0;
}
</style>
