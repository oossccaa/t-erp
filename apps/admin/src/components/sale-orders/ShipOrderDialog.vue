<template>
  <el-dialog
    v-model="visible"
    title="出貨"
    width="800px"
    :close-on-click-modal="false"
    @closed="handleClosed"
  >
    <el-alert
      type="info"
      :closable="false"
      style="margin-bottom: 20px"
    >
      <template #title>
        請選擇要出貨的產品數量。如果全部出貨，請點擊「全部出貨」按鈕。
      </template>
    </el-alert>

    <el-table
      :data="items"
      border
      stripe
      style="width: 100%"
    >
      <el-table-column prop="productName" label="產品名稱" min-width="150" />
      <el-table-column prop="productSku" label="SKU" width="120" />
      <el-table-column prop="quantity" label="訂購數量" width="100" align="right" />
      <el-table-column prop="shippedQuantity" label="已出貨" width="100" align="right">
        <template #default="{ row }">
          {{ row.shippedQuantity || 0 }}
        </template>
      </el-table-column>
      <el-table-column label="待出貨" width="100" align="right">
        <template #default="{ row }">
          {{ row.quantity - (row.shippedQuantity || 0) }}
        </template>
      </el-table-column>
      <el-table-column label="本次出貨" width="150">
        <template #default="{ row }">
          <el-input-number
            v-model="row.currentShipQuantity"
            :min="0"
            :max="row.quantity - (row.shippedQuantity || 0)"
            :step="1"
            size="small"
            style="width: 100%"
          />
        </template>
      </el-table-column>
    </el-table>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="visible = false">取消</el-button>
        <el-button type="info" @click="handleShipAll">全部出貨</el-button>
        <el-button type="primary" :loading="loading" @click="handleConfirm">
          確認出貨
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'

interface OrderItem {
  id: number
  productId: number
  productName: string
  productSku: string
  quantity: number
  shippedQuantity: number
  currentShipQuantity?: number
}

interface Props {
  modelValue: boolean
  orderId: number | null
  orderItems: OrderItem[]
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm', items: Array<{ itemId: number; shippedQuantity: number }>): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const visible = ref(false)
const loading = ref(false)
const items = ref<OrderItem[]>([])

watch(
  () => props.modelValue,
  (val) => {
    visible.value = val
    if (val) {
      initItems()
    }
  }
)

watch(visible, (val) => {
  emit('update:modelValue', val)
})

const initItems = () => {
  items.value = props.orderItems.map(item => ({
    ...item,
    currentShipQuantity: 0
  }))
}

const handleShipAll = () => {
  items.value.forEach(item => {
    item.currentShipQuantity = item.quantity - (item.shippedQuantity || 0)
  })
}

const handleConfirm = async () => {
  // 檢查是否有選擇出貨數量
  const shipItems = items.value.filter(item => (item.currentShipQuantity || 0) > 0)

  if (shipItems.length === 0) {
    ElMessage.warning('請至少選擇一個產品進行出貨')
    return
  }

  const data = shipItems.map(item => ({
    itemId: item.id,
    shippedQuantity: item.currentShipQuantity || 0
  }))

  loading.value = true
  try {
    emit('confirm', data)
  } finally {
    loading.value = false
  }
}

const handleClosed = () => {
  items.value = []
  loading.value = false
}
</script>

<style lang="scss" scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

:deep(.el-input-number) {
  .el-input__inner {
    text-align: right;
  }
}
</style>
