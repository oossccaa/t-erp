<template>
  <div class="orders-view">
    <!-- 顶部搜索栏 -->
    <van-search
      v-model="searchValue"
      :placeholder="$t('order.searchPlaceholder')"
      @search="onSearch"
      @clear="onClear"
    />
    
    <!-- 筛选标签 -->
    <van-tabs v-model:active="activeTab" @change="onTabChange" sticky>
      <van-tab :title="$t('order.statusType.all')" name="all" />
      <van-tab :title="$t('order.statusType.pending')" name="pending" />
      <van-tab :title="$t('order.statusType.confirmed')" name="confirmed" />
      <van-tab :title="$t('order.statusType.shipped')" name="shipped" />
      <van-tab :title="$t('order.statusType.completed')" name="completed" />
    </van-tabs>
    
    <!-- 订单列表 -->
    <div class="orders-content">
      <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
        <van-list
          v-model:loading="loading"
          v-model:error="error"
          :finished="finished"
          :finished-text="$t('common.noMore')"
          :error-text="$t('common.loadFailed')"
          @load="onLoad"
        >
          <div class="order-list">
            <van-card
              v-for="order in orders"
              :key="order.id"
              class="order-card"
              @click="viewOrderDetail(order)"
            >
              <template #header>
                <div class="order-header">
                  <span class="order-number">#{{ order.orderNumber }}</span>
                  <van-tag :type="getOrderStatusType(order.status)" size="medium">
                    {{ getOrderStatusText(order.status) }}
                  </van-tag>
                </div>
              </template>
              
              <template #default>
                <div class="order-info">
                  <div class="customer-info">
                    <van-icon name="friends-o" size="14" />
                    <span>{{ order.customer }}</span>
                  </div>
                  <div class="order-time">
                    <van-icon name="clock-o" size="14" />
                    <span>{{ formatTime(order.createdAt) }}</span>
                  </div>
                  <div class="product-count">
                    {{ $t('order.itemCountPrefix') }} {{ order.itemCount }} {{ $t('order.itemCount') }}
                  </div>
                </div>
              </template>
              
              <template #footer>
                <div class="order-footer">
                  <div class="order-amount">
                    {{ $t('common.total') }}: <span class="amount-value">NT$ {{ formatMoney(order.totalAmount) }}</span>
                  </div>
                  <div class="order-actions">
                    <van-button size="mini" plain @click.stop="editOrder(order)">
                      {{ $t('common.edit') }}
                    </van-button>
                    <van-button
                      v-if="order.status === 'pending'"
                      size="mini"
                      type="primary"
                      @click.stop="confirmOrder(order)"
                    >
                      {{ $t('common.confirm') }}
                    </van-button>
                  </div>
                </div>
              </template>
            </van-card>
          </div>
        </van-list>
      </van-pull-refresh>
      
      <van-empty v-if="!loading && !orders.length" :description="$t('order.noOrders')" />
    </div>
    
    <!-- 创建订单按钮 -->
    <van-floating-bubble
      axis="xy"
      icon="plus"
      @click="createOrder"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showConfirmDialog, showSuccessToast } from 'vant'
import dayjs from 'dayjs'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const { t } = useI18n()

// 搜索
const searchValue = ref('')
const activeTab = ref('all')

// 列表状态
const loading = ref(false)
const finished = ref(false)
const refreshing = ref(false)
const error = ref(false)

// 订单数据
const orders = ref([
  {
    id: 1,
    orderNumber: 'SO202401001',
    customer: t('customer.qualityCustomer') + 'A',
    totalAmount: 15600,
    itemCount: 3,
    status: 'pending',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: 2,
    orderNumber: 'SO202401002',
    customer: t('customer.stableCustomer') + 'B',
    totalAmount: 28900,
    itemCount: 5,
    status: 'confirmed',
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
  },
  {
    id: 3,
    orderNumber: 'SO202401003',
    customer: t('customer.newCustomer') + 'C',
    totalAmount: 8750,
    itemCount: 2,
    status: 'shipped',
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
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
    completed: 'success',
    cancelled: 'danger',
  }
  return statusMap[status] || 'default'
}

// 获取订单状态文字
const getOrderStatusText = (status: string) => {
  return t(`order.statusType.${status}`) || status
}

// 搜索订单
const onSearch = (value: string) => {
  // 实现搜索逻辑
  console.log(t('common.search'), value)
}

// 清空搜索
const onClear = () => {
  searchValue.value = ''
}

// 标签切换
const onTabChange = (name: string | number) => {
  console.log('切換標籤:', name)
  // 根据状态筛选订单
}

// 下拉刷新
const onRefresh = () => {
  setTimeout(() => {
    refreshing.value = false
    showToast(t('common.refreshSuccess'))
  }, 1000)
}

// 加载更多
const onLoad = () => {
  setTimeout(() => {
    loading.value = false
    finished.value = true
  }, 1000)
}

// 查看订单详情
const viewOrderDetail = (order: any) => {
  router.push(`/orders/${order.id}`)
}

// 编辑订单
const editOrder = (order: any) => {
  showToast(`${t('order.editOrder')} ${order.orderNumber}`)
}

// 确认订单
const confirmOrder = async (order: any) => {
  try {
    await showConfirmDialog({
      title: t('order.confirmOrder'),
      message: `${t('order.confirmOrderMessage')} ${order.orderNumber} 嗎？`,
    })

    // 更新订单状态
    order.status = 'confirmed'
    showSuccessToast(t('order.orderConfirmed'))
  } catch {
    // 用户取消
  }
}

// 创建订单
const createOrder = () => {
  router.push('/orders/create')
}

// 组件名称
defineOptions({
  name: 'Orders',
})

onMounted(() => {
  // 初始化加载订单数据
})
</script>

<style lang="scss" scoped>
.orders-view {
  background: #f7f8fa;
  min-height: 100vh;
}

.orders-content {
  padding: 0 16px;
}

.order-list {
  .order-card {
    margin-bottom: 12px;
    
    :deep(.van-card__header) {
      padding: 16px 16px 8px 16px;
    }
    
    :deep(.van-card__body) {
      padding: 0 16px;
    }
    
    :deep(.van-card__footer) {
      padding: 8px 16px 16px 16px;
    }
  }
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  .order-number {
    font-size: 16px;
    font-weight: 600;
    color: #323233;
  }
}

.order-info {
  margin: 8px 0;
  
  .customer-info,
  .order-time {
    display: flex;
    align-items: center;
    margin-bottom: 6px;
    color: #646566;
    font-size: 14px;
    
    .van-icon {
      margin-right: 6px;
    }
  }
  
  .product-count {
    color: #969799;
    font-size: 12px;
  }
}

.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  .order-amount {
    font-size: 14px;
    color: #646566;
    
    .amount-value {
      font-size: 18px;
      font-weight: 600;
      color: #1989fa;
    }
  }
  
  .order-actions {
    display: flex;
    gap: 8px;
  }
}
</style>