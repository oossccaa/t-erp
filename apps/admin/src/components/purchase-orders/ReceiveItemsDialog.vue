<template>
  <el-dialog
    v-model="visible"
    title="進貨收貨"
    width="900px"
    :close-on-click-modal="false"
    @closed="handleClosed"
  >
    <!-- 訂單摘要 -->
    <el-card class="order-summary" shadow="never">
      <el-descriptions :column="3" border>
        <el-descriptions-item label="單號">
          {{ purchaseOrder?.orderNumber }}
        </el-descriptions-item>
        <el-descriptions-item label="供應商">
          {{ purchaseOrder?.supplierName }}
        </el-descriptions-item>
        <el-descriptions-item label="總金額">
          NT$ {{ purchaseOrder?.totalAmount?.toLocaleString() || '0' }}
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- 收貨明細 -->
    <el-divider content-position="left">收貨明細</el-divider>

    <el-table :data="items" border style="width: 100%">
      <el-table-column prop="productName" label="產品" min-width="150" />
      <el-table-column prop="productSku" label="SKU" width="120" />
      <el-table-column prop="quantity" label="訂購數量" width="100" align="right" />
      <el-table-column prop="receivedQuantity" label="已收數量" width="100" align="right">
        <template #default="{ row }">
          <el-tag type="success">{{ row.receivedQuantity || 0 }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="本次收貨" width="150">
        <template #default="{ row }">
          <el-input-number
            v-model="row.currentReceive"
            :min="0"
            :max="row.quantity - (row.receivedQuantity || 0)"
            :step="1"
            size="small"
            style="width: 100%"
          />
        </template>
      </el-table-column>
      <el-table-column label="待收數量" width="100" align="right">
        <template #default="{ row }">
          <el-tag type="warning">
            {{ row.quantity - (row.receivedQuantity || 0) - (row.currentReceive || 0) }}
          </el-tag>
        </template>
      </el-table-column>
    </el-table>

    <template #footer>
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="info" @click="handleReceiveAll">全部收貨</el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit">
        確認收貨
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { PurchaseOrder, PurchaseOrderItem } from '@/api/purchase-orders'

interface Props {
  modelValue: boolean
  purchaseOrder: PurchaseOrder | null
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm', items: Array<{ itemId: number; receivedQuantity: number }>): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const loading = ref(false)
const items = ref<Array<PurchaseOrderItem & { currentReceive: number }>>([])

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const initItems = () => {
  const order = props.purchaseOrder
  if (order?.items) {
    items.value = order.items.map(item => ({
      ...item,
      currentReceive: Math.max(0, item.quantity - (item.receivedQuantity || 0))
    }))
  } else {
    items.value = []
  }
}

// 進貨單 prop 變化時 → 初始化
watch(() => props.purchaseOrder, initItems, { immediate: true })

// 對話框每次打開時也重新初始化（同一個 order 重開時 prop ref 不變, watch 不會觸發）
watch(visible, (open) => {
  if (open) initItems()
})

const handleReceiveAll = () => {
  items.value.forEach(item => {
    item.currentReceive = Math.max(0, item.quantity - (item.receivedQuantity || 0))
  })
}

const handleSubmit = async () => {
  // 驗證至少有一項要收貨
  const itemsToReceive = items.value.filter(item => item.currentReceive > 0)

  if (itemsToReceive.length === 0) {
    ElMessage.warning('請至少輸入一項收貨數量')
    return
  }

  loading.value = true
  try {
    const receiveData = itemsToReceive.map(item => ({
      itemId: item.id!,
      receivedQuantity: item.currentReceive
    }))

    await emit('confirm', receiveData)
  } catch (error) {
    console.error('收貨失敗:', error)
  } finally {
    loading.value = false
  }
}

const handleCancel = () => {
  visible.value = false
}

const handleClosed = () => {
  // 不清空 items；下次開啟由 watch(visible) 重新從 props 初始化
  // 之前清空導致 prop ref 沒變時無法 re-init → 列表空白 bug
}
</script>

<style lang="scss" scoped>
.order-summary {
  margin-bottom: 20px;
}

.el-divider {
  margin: 20px 0;
}
</style>
