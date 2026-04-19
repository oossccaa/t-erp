<template>
  <el-dialog
    v-model="visible"
    title="庫存盤點"
    width="900px"
    :close-on-click-modal="false"
    @closed="handleClosed"
  >
    <div class="stocktake-header">
      <el-input
        v-model="searchKeyword"
        placeholder="搜尋 SKU 或品名"
        clearable
        style="width: 280px"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <div class="summary">
        <el-tag v-if="diffCount > 0" type="warning">
          差異 {{ diffCount }} 筆（+{{ totalIn }} / -{{ totalOut }}）
        </el-tag>
        <el-tag v-else type="info">無差異</el-tag>
      </div>
    </div>

    <el-table
      v-loading="loading"
      :data="filteredItems"
      border
      stripe
      height="500"
      style="width: 100%; margin-top: 12px"
    >
      <el-table-column prop="sku" label="SKU" width="120" />
      <el-table-column prop="name" label="品名" min-width="180" show-overflow-tooltip />
      <el-table-column label="系統數量" width="110" align="right">
        <template #default="{ row }">{{ row.systemQty }}</template>
      </el-table-column>
      <el-table-column label="實盤數量" width="160">
        <template #default="{ row }">
          <el-input-number
            v-model="row.actualQty"
            :min="0"
            :precision="0"
            :controls="false"
            style="width: 100%"
          />
        </template>
      </el-table-column>
      <el-table-column label="差異" width="100" align="right">
        <template #default="{ row }">
          <span :class="diffClass(row)">{{ diffText(row) }}</span>
        </template>
      </el-table-column>
    </el-table>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleCancel">取消</el-button>
        <el-button
          type="primary"
          :loading="submitting"
          :disabled="diffCount === 0"
          @click="handleSubmit"
        >
          送出盤點（調整 {{ diffCount }} 筆）
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { productsApi } from '@/api/products'
import { inventoryApi } from '@/api/inventory'

interface StocktakeRow {
  productId: number
  sku: string
  name: string
  systemQty: number
  actualQty: number
}

interface Props {
  modelValue: boolean
}
interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'done'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const loading = ref(false)
const submitting = ref(false)
const items = ref<StocktakeRow[]>([])
const searchKeyword = ref('')

const filteredItems = computed(() => {
  const kw = searchKeyword.value.trim().toLowerCase()
  if (!kw) return items.value
  return items.value.filter(
    (it) => it.sku.toLowerCase().includes(kw) || it.name.toLowerCase().includes(kw)
  )
})

const diffCount = computed(
  () => items.value.filter((it) => it.actualQty !== it.systemQty).length
)
const totalIn = computed(() =>
  items.value.reduce((sum, it) => sum + Math.max(0, it.actualQty - it.systemQty), 0)
)
const totalOut = computed(() =>
  items.value.reduce((sum, it) => sum + Math.max(0, it.systemQty - it.actualQty), 0)
)

const diffText = (row: StocktakeRow) => {
  const d = row.actualQty - row.systemQty
  if (d === 0) return '0'
  return d > 0 ? `+${d}` : `${d}`
}
const diffClass = (row: StocktakeRow) => {
  const d = row.actualQty - row.systemQty
  if (d > 0) return 'diff-up'
  if (d < 0) return 'diff-down'
  return ''
}

const loadProducts = async () => {
  loading.value = true
  try {
    // 一次拉全部啟用中的產品（小工廠品項不多，limit 設高）
    const res = await productsApi.getProducts({ isActive: true, page: 1, limit: 1000 })
    const list = res.data?.items || []
    items.value = list.map((p: any) => ({
      productId: p.id,
      sku: p.sku,
      name: p.name,
      systemQty: Number(p.stockQuantity) || 0,
      actualQty: Number(p.stockQuantity) || 0,
    }))
  } finally {
    loading.value = false
  }
}

const handleSubmit = async () => {
  const changes = items.value.filter((it) => it.actualQty !== it.systemQty)
  if (changes.length === 0) return

  try {
    await ElMessageBox.confirm(
      `將調整 ${changes.length} 筆商品的庫存，確定送出？`,
      '確認盤點',
      { confirmButtonText: '送出', cancelButtonText: '取消', type: 'warning' }
    )
  } catch {
    return
  }

  submitting.value = true
  try {
    const res = await inventoryApi.stocktake(
      changes.map((it) => ({ productId: it.productId, actualQty: it.actualQty }))
    )
    ElMessage.success(res.data ? `盤點完成，調整 ${res.data.adjusted} 筆` : '盤點完成')
    visible.value = false
    emit('done')
  } catch {
    // 錯誤訊息已由 interceptor 處理
  } finally {
    submitting.value = false
  }
}

const handleCancel = () => {
  visible.value = false
}
const handleClosed = () => {
  items.value = []
  searchKeyword.value = ''
}

watch(visible, (v) => {
  if (v) loadProducts()
})
</script>

<style scoped lang="scss">
.stocktake-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}
.summary {
  font-size: 14px;
}
.diff-up {
  color: var(--el-color-success);
  font-weight: 600;
}
.diff-down {
  color: var(--el-color-danger);
  font-weight: 600;
}
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
