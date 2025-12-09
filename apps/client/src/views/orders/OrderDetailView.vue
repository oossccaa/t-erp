<template>
  <div class="order-detail-view">
    <van-nav-bar
      :title="$t('order.detail.title')"
      :left-text="$t('common.back')"
      @click-left="$router.go(-1)"
    />
    
    <div class="order-detail">
      <!-- 订单基本信息 -->
      <van-card class="order-info-card">
        <template #header>
          <div class="order-header">
            <h2>{{ $t('order.order') }} #{{ order.orderNumber }}</h2>
            <van-tag :type="getOrderStatusType(order.status)">
              {{ getOrderStatusText(order.status) }}
            </van-tag>
          </div>
        </template>

        <van-cell-group>
          <van-cell :title="$t('order.customer')" :value="order.customer" />
          <van-cell :title="$t('order.createdAt')" :value="formatTime(order.createdAt)" />
          <van-cell :title="$t('order.totalAmount')" :value="`NT$ ${formatMoney(order.totalAmount)}`" />
        </van-cell-group>
      </van-card>
      
      <!-- 订单商品 -->
      <van-card class="order-items-card">
        <template #header>
          <h3>{{ $t('order.detail.products') }}</h3>
        </template>

        <div class="items-list">
          <div v-for="item in order.items" :key="item.id" class="item-row">
            <div class="item-info">
              <h4>{{ item.name }}</h4>
              <p>{{ $t('product.sku') }}: {{ item.sku }}</p>
              <p>{{ $t('order.create.price') }}: NT$ {{ formatMoney(item.price) }}</p>
            </div>
            <div class="item-quantity">
              × {{ item.quantity }}
            </div>
            <div class="item-total">
              NT$ {{ formatMoney(item.price * item.quantity) }}
            </div>
          </div>
        </div>

        <van-cell-group>
          <van-cell :title="$t('order.detail.subtotal')" :value="`NT$ ${formatMoney(order.subtotal)}`" />
          <van-cell :title="$t('order.detail.discount')" :value="`-NT$ ${formatMoney(order.discount || 0)}`" />
          <van-cell :title="$t('order.detail.shipping')" :value="`NT$ ${formatMoney(order.shipping || 0)}`" />
          <van-cell :title="$t('order.detail.total')" :value="`NT$ ${formatMoney(order.totalAmount)}`" class="total-row" />
        </van-cell-group>
      </van-card>
      
      <!-- 操作按钮 -->
      <div class="actions">
        <van-button
          v-if="order.status === 'pending'"
          block
          type="primary"
          @click="confirmOrder"
        >
          {{ $t('order.confirmOrder') }}
        </van-button>
        <van-button
          v-if="order.status === 'confirmed'"
          block
          type="primary"
          @click="shipOrder"
        >
          {{ $t('order.detail.ship') }}
        </van-button>
        <van-button
          block
          plain
          @click="editOrder"
        >
          {{ $t('order.editOrder') }}
        </van-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { showToast, showConfirmDialog, showSuccessToast } from 'vant'
import dayjs from 'dayjs'

const { t } = useI18n()

const route = useRoute()
const orderId = route.params.id

// 模拟订单数据
const order = ref({
  id: 1,
  orderNumber: 'SO202401001',
  customer: '优质客户A',
  status: 'pending',
  createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  subtotal: 15000,
  discount: 400,
  shipping: 1000,
  totalAmount: 15600,
  items: [
    {
      id: 1,
      name: 'iPhone 15 Pro',
      sku: 'PHONE001',
      price: 35900,
      quantity: 1,
    },
    {
      id: 2,
      name: 'AirPods Pro',
      sku: 'AUDIO001',
      price: 7490,
      quantity: 2,
    },
  ],
})

const formatMoney = (amount: number) => {
  return new Intl.NumberFormat('zh-TW').format(amount)
}

const formatTime = (time: Date) => {
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}

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

const getOrderStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    pending: t('order.statusType.pending'),
    confirmed: t('order.statusType.confirmed'),
    shipped: t('order.statusType.shipped'),
    completed: t('order.statusType.completed'),
    cancelled: t('order.statusType.cancelled'),
  }
  return statusMap[status] || status
}

const confirmOrder = async () => {
  try {
    await showConfirmDialog({
      title: t('order.confirmOrder'),
      message: `${t('order.confirmOrderMessage')} ${order.value.orderNumber}?`,
    })

    order.value.status = 'confirmed'
    showSuccessToast(t('order.orderConfirmed'))
  } catch {
    // User cancelled
  }
}

const shipOrder = async () => {
  try {
    await showConfirmDialog({
      title: t('order.detail.ship'),
      message: `${t('order.detail.confirmShip')} ${order.value.orderNumber}?`,
    })

    order.value.status = 'shipped'
    showSuccessToast(t('order.detail.shipped'))
  } catch {
    // User cancelled
  }
}

const editOrder = () => {
  showToast(t('order.detail.editDeveloping'))
}

onMounted(() => {
  console.log('Order ID:', orderId)
  // Load order data based on orderId
})

defineOptions({
  name: 'OrderDetail',
})
</script>

<style lang="scss" scoped>
.order-detail-view {
  background: #f7f8fa;
  min-height: 100vh;
}

.order-detail {
  padding: 16px;
}

.order-info-card,
.order-items-card {
  margin-bottom: 16px;
  
  :deep(.van-card__header) {
    padding: 16px 16px 8px 16px;
  }
  
  :deep(.van-card__body) {
    padding: 0 16px 16px 16px;
  }
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  h2 {
    font-size: 18px;
    font-weight: 600;
    color: #323233;
    margin: 0;
  }
}

.items-list {
  margin-bottom: 16px;
  
  .item-row {
    display: flex;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid #f5f5f5;
    
    &:last-child {
      border-bottom: none;
    }
    
    .item-info {
      flex: 1;
      
      h4 {
        margin: 0 0 4px 0;
        font-size: 14px;
        color: #323233;
      }
      
      p {
        margin: 2px 0;
        font-size: 12px;
        color: #969799;
      }
    }
    
    .item-quantity {
      margin: 0 16px;
      font-size: 14px;
      color: #646566;
    }
    
    .item-total {
      font-weight: 600;
      color: #1989fa;
    }
  }
}

:deep(.total-row) {
  font-size: 16px;
  font-weight: 600;
  color: #1989fa;
}

.actions {
  margin-top: 20px;
  
  .van-button {
    margin-bottom: 12px;
    height: 50px;
    font-size: 16px;
  }
}
</style>