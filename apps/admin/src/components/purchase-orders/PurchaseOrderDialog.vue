<template>
  <el-dialog
    v-model="visible"
    :title="isView ? '檢視進貨單' : isEdit ? '編輯進貨單' : '新增進貨單'"
    width="90%"
    style="max-width: 1400px"
    :close-on-click-modal="false"
    @closed="handleClosed"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="120px"
      :disabled="isView"
    >
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="供應商" prop="supplierId">
            <el-select
              v-model="form.supplierId"
              placeholder="請選擇供應商"
              filterable
              style="width: 100%"
              :disabled="isEdit"
            >
              <el-option
                v-for="supplier in suppliers"
                :key="supplier.id"
                :label="supplier.name"
                :value="supplier.id"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="訂單日期" prop="orderDate">
            <el-date-picker
              v-model="form.orderDate"
              type="date"
              placeholder="請選擇訂單日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="預計交貨日期">
            <el-date-picker
              v-model="form.expectedDeliveryDate"
              type="date"
              placeholder="請選擇預計交貨日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="參考編號">
            <el-input
              v-model="form.referenceNumber"
              placeholder="請輸入參考編號"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-divider content-position="left">訂單項目</el-divider>

      <el-table :data="form.items" border style="width: 100%; margin-bottom: 16px;">
        <el-table-column prop="productId" label="產品" min-width="200">
          <template #default="{ row, $index }">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span v-if="row.productName" style="flex: 1;">
                {{ row.productName }} ({{ row.productSku }})
              </span>
              <el-button
                v-if="!isView"
                type="primary"
                size="small"
                @click="openProductSelector($index)"
              >
                {{ row.productName ? '更換' : '選擇產品' }}
              </el-button>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="quantity" label="數量" width="160">
          <template #default="{ row }">
            <el-input-number
              v-model="row.quantity"
              :min="1"
              :step="1"
              :disabled="isView"
              style="width: 100%"
              @change="calculateItemAmount(row)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="unitPrice" label="單價" width="180">
          <template #default="{ row }">
            <el-input-number
              v-model="row.unitPrice"
              :min="0"
              :precision="2"
              :disabled="isView"
              style="width: 100%"
              @change="calculateItemAmount(row)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="amount" label="小計" width="150">
          <template #default="{ row }">
            {{ formatCurrency(row.amount) }}
          </template>
        </el-table-column>
        <el-table-column label="備註" min-width="150">
          <template #default="{ row }">
            <el-input
              v-model="row.notes"
              :disabled="isView"
              placeholder="備註"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80" fixed="right">
          <template #default="{ $index }">
            <el-button
              v-if="!isView"
              type="danger"
              size="small"
              link
              @click="removeItem($index)"
            >
              刪除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-button v-if="!isView" @click="addItem" style="width: 100%; margin-bottom: 16px;">
        <el-icon><Plus /></el-icon>
        新增項目
      </el-button>

      <el-divider content-position="left">費用明細</el-divider>

      <el-row :gutter="16">
        <el-col :span="8">
          <el-form-item label="稅率 (%)">
            <el-input-number
              v-model="form.taxRate"
              :min="0"
              :max="100"
              :precision="2"
              style="width: 100%"
              @change="calculateAmounts"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="折扣率 (%)">
            <el-input-number
              v-model="form.discountRate"
              :min="0"
              :max="100"
              :precision="2"
              style="width: 100%"
              @change="calculateAmounts"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="運費">
            <el-input-number
              v-model="form.shippingCost"
              :min="0"
              :precision="2"
              style="width: 100%"
              @change="calculateAmounts"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="24">
          <div class="amount-summary">
            <div class="summary-item">
              <span>小計:</span>
              <span class="amount">{{ formatCurrency(subtotal) }}</span>
            </div>
            <div class="summary-item">
              <span>折扣:</span>
              <span class="amount discount">-{{ formatCurrency(discountAmount) }}</span>
            </div>
            <div class="summary-item">
              <span>稅額:</span>
              <span class="amount">{{ formatCurrency(taxAmount) }}</span>
            </div>
            <div class="summary-item">
              <span>運費:</span>
              <span class="amount">{{ formatCurrency(form.shippingCost || 0) }}</span>
            </div>
            <div class="summary-item total">
              <span>總計:</span>
              <span class="amount">{{ formatCurrency(totalAmount) }}</span>
            </div>
          </div>
        </el-col>
      </el-row>

      <el-divider content-position="left">其他資訊</el-divider>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="送貨地址">
            <el-input
              v-model="form.shippingAddress"
              type="textarea"
              :rows="2"
              placeholder="請輸入送貨地址"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="備註">
            <el-input
              v-model="form.notes"
              type="textarea"
              :rows="2"
              placeholder="請輸入備註"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="付款條件">
            <el-input
              v-model="form.paymentTerms"
              placeholder="例如：30天內付款"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="交貨條件">
            <el-input
              v-model="form.deliveryTerms"
              placeholder="例如：FOB, CIF"
            />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleCancel">{{ isView ? '關閉' : '取消' }}</el-button>
        <el-button v-if="!isView" type="primary" :loading="loading" @click="handleSubmit">
          {{ isEdit ? '更新' : '建立' }}
        </el-button>
      </span>
    </template>
  </el-dialog>

  <!-- 產品選擇模態框 -->
  <ProductListModal
    v-model="showProductSelector"
    price-type="cost"
    @select="handleProductSelect"
  />
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Plus, Delete } from '@element-plus/icons-vue'
import { suppliersApi } from '@/api/suppliers'
import { productsApi } from '@/api/products'
import type { Supplier, Product } from '@t-erp/shared'
import ProductListModal from '@/components/common/ProductListModal.vue'

interface PurchaseOrderItem {
  productId: number
  productName?: string
  productSku?: string
  quantity: number
  unitPrice: number
  amount: number
  notes?: string
}

interface PurchaseOrderForm {
  supplierId: number | undefined
  orderDate: string
  expectedDeliveryDate?: string
  taxRate?: number
  discountRate?: number
  discountAmount?: number
  shippingCost?: number
  notes?: string
  shippingAddress?: string
  paymentTerms?: string
  deliveryTerms?: string
  referenceNumber?: string
  items: PurchaseOrderItem[]
}

interface Props {
  modelValue: boolean
  mode?: 'create' | 'edit' | 'view'
  purchaseOrder?: any
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm', data: any): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  mode: 'create'
})

const emit = defineEmits<Emits>()

const formRef = ref<FormInstance>()
const loading = ref(false)
const suppliers = ref<Supplier[]>([])
const products = ref<Product[]>([])

// 產品選擇器相關
const showProductSelector = ref(false)
const currentItemIndex = ref<number>(-1)

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const isEdit = computed(() => props.mode === 'edit')
const isView = computed(() => props.mode === 'view')

const form = reactive<PurchaseOrderForm>({
  supplierId: undefined,
  orderDate: new Date().toISOString().split('T')[0],
  expectedDeliveryDate: undefined,
  taxRate: 0,
  discountRate: 0,
  discountAmount: 0,
  shippingCost: 0,
  notes: '',
  shippingAddress: '',
  paymentTerms: '',
  deliveryTerms: '',
  referenceNumber: '',
  items: []
})

const rules: FormRules = {
  supplierId: [
    { required: true, message: '請選擇供應商', trigger: 'change' }
  ],
  orderDate: [
    { required: true, message: '請選擇訂單日期', trigger: 'change' }
  ]
}

// 計算小計
const subtotal = computed(() => {
  return form.items.reduce((sum, item) => sum + (item.amount || 0), 0)
})

// 計算折扣金額
const discountAmount = computed(() => {
  if (form.discountRate) {
    return subtotal.value * (form.discountRate / 100)
  }
  return form.discountAmount || 0
})

// 計算稅額
const taxAmount = computed(() => {
  const taxableAmount = subtotal.value - discountAmount.value
  return taxableAmount * ((form.taxRate || 0) / 100)
})

// 計算總計
const totalAmount = computed(() => {
  return subtotal.value - discountAmount.value + taxAmount.value + (form.shippingCost || 0)
})

// 格式化金額
const formatCurrency = (amount: number | undefined) => {
  const value = Number(amount) || 0
  return `NT$ ${value.toFixed(2)}`
}

// 計算項目金額
const calculateItemAmount = (item: PurchaseOrderItem) => {
  item.amount = item.quantity * item.unitPrice
}

// 重新計算所有金額
const calculateAmounts = () => {
  // 觸發計算屬性更新
}

// 新增項目
const addItem = () => {
  form.items.push({
    productId: 0,
    quantity: 1,
    unitPrice: 0,
    amount: 0,
    notes: ''
  })
}

// 刪除項目
const removeItem = (index: number) => {
  form.items.splice(index, 1)
}

// 處理產品變更
const handleProductChange = (item: PurchaseOrderItem) => {
  const product = products.value.find(p => p.id === item.productId)
  if (product) {
    item.productName = product.name
    item.productSku = product.sku
    item.unitPrice = product.costPrice || 0
    calculateItemAmount(item)
  }
}

// 打開產品選擇器
const openProductSelector = (index: number) => {
  currentItemIndex.value = index
  showProductSelector.value = true
}

// 處理產品選擇
const handleProductSelect = (product: Product) => {
  if (currentItemIndex.value >= 0 && currentItemIndex.value < form.items.length) {
    const item = form.items[currentItemIndex.value]
    item.productId = product.id
    item.productName = product.name
    item.productSku = product.sku
    item.unitPrice = product.costPrice || 0
    calculateItemAmount(item)
  }
}

// 重置表單
const resetForm = () => {
  Object.assign(form, {
    supplierId: undefined,
    orderDate: new Date().toISOString().split('T')[0],
    expectedDeliveryDate: undefined,
    taxRate: 0,
    discountRate: 0,
    discountAmount: 0,
    shippingCost: 0,
    notes: '',
    shippingAddress: '',
    paymentTerms: '',
    deliveryTerms: '',
    referenceNumber: '',
    items: []
  })
  formRef.value?.clearValidate()
}

// 獲取供應商列表
const fetchSuppliers = async () => {
  try {
    const response = await suppliersApi.getActiveSuppliers()
    suppliers.value = response.data || []
  } catch (error) {
    console.error('獲取供應商列表失敗:', error)
  }
}

// 獲取產品列表
const fetchProducts = async () => {
  try {
    const response = await productsApi.getProducts({ isActive: true })
    products.value = response.data.items || []
  } catch (error) {
    console.error('獲取產品列表失敗:', error)
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()

    // 驗證是否有項目
    if (form.items.length === 0) {
      ElMessage.warning('請至少新增一個訂單項目')
      return
    }

    // 驗證所有項目都已選擇產品
    const hasEmptyProduct = form.items.some(item => !item.productId)
    if (hasEmptyProduct) {
      ElMessage.warning('請為所有項目選擇產品')
      return
    }

    loading.value = true

    // 準備提交數據
    const submitData = {
      supplierId: form.supplierId,
      orderDate: form.orderDate,
      expectedDeliveryDate: form.expectedDeliveryDate,
      status: 'pending', // 設置為待審核狀態
      taxRate: form.taxRate,
      discountRate: form.discountRate,
      discountAmount: discountAmount.value,
      shippingCost: form.shippingCost,
      notes: form.notes,
      shippingAddress: form.shippingAddress,
      paymentTerms: form.paymentTerms,
      deliveryTerms: form.deliveryTerms,
      referenceNumber: form.referenceNumber,
      items: form.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        notes: item.notes
      }))
    }

    // 發出 confirm 事件，等待父元件處理 API
    await emit('confirm', submitData)

    // API 成功後，父元件會關閉對話框
  } catch (error) {
    // 表單驗證失敗或 API 呼叫失敗
    console.error('提交失敗:', error)
  } finally {
    loading.value = false
  }
}

const handleCancel = () => {
  visible.value = false
}

const handleClosed = () => {
  resetForm()
}

// 當進貨單資料變化時更新表單
watch(
  () => props.purchaseOrder,
  (newOrder) => {
    if (newOrder && visible.value) {
      Object.assign(form, {
        supplierId: newOrder.supplierId,
        orderDate: newOrder.orderDate,
        expectedDeliveryDate: newOrder.expectedDeliveryDate,
        taxRate: newOrder.taxRate || 0,
        discountRate: newOrder.discountRate || 0,
        discountAmount: newOrder.discountAmount || 0,
        shippingCost: newOrder.shippingCost || 0,
        notes: newOrder.notes || '',
        shippingAddress: newOrder.shippingAddress || '',
        paymentTerms: newOrder.paymentTerms || '',
        deliveryTerms: newOrder.deliveryTerms || '',
        referenceNumber: newOrder.referenceNumber || '',
        items: (newOrder.items || []).map((item: any) => ({
          productId: item.productId,
          productName: item.productName,
          productSku: item.productSku,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          amount: item.quantity * item.unitPrice,
          notes: item.notes
        }))
      })
    }
  },
  { immediate: true }
)

// 當對話框打開時處理表單
watch(visible, (newVisible) => {
  if (newVisible) {
    if (props.purchaseOrder) {
      Object.assign(form, {
        supplierId: props.purchaseOrder.supplierId,
        orderDate: props.purchaseOrder.orderDate,
        expectedDeliveryDate: props.purchaseOrder.expectedDeliveryDate,
        taxRate: props.purchaseOrder.taxRate || 0,
        discountRate: props.purchaseOrder.discountRate || 0,
        discountAmount: props.purchaseOrder.discountAmount || 0,
        shippingCost: props.purchaseOrder.shippingCost || 0,
        notes: props.purchaseOrder.notes || '',
        shippingAddress: props.purchaseOrder.shippingAddress || '',
        paymentTerms: props.purchaseOrder.paymentTerms || '',
        deliveryTerms: props.purchaseOrder.deliveryTerms || '',
        referenceNumber: props.purchaseOrder.referenceNumber || '',
        items: (props.purchaseOrder.items || []).map((item: any) => ({
          productId: item.productId,
          productName: item.productName,
          productSku: item.productSku,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          amount: item.quantity * item.unitPrice,
          notes: item.notes
        }))
      })
    } else {
      // 新增模式，預設新增一個空項目
      if (form.items.length === 0) {
        addItem()
      }
    }
  }
})

// 組件掛載時獲取數據
onMounted(() => {
  fetchSuppliers()
  fetchProducts()
})
</script>

<style lang="scss" scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.amount-summary {
  background-color: var(--el-fill-color-light);
  padding: 16px;
  border-radius: 4px;

  .summary-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;

    &:last-child {
      margin-bottom: 0;
    }

    &.total {
      margin-top: 8px;
      padding-top: 8px;
      border-top: 2px solid var(--el-border-color);
      font-size: 18px;
      font-weight: 600;
      color: var(--el-color-primary);
    }

    .amount {
      font-weight: 500;

      &.discount {
        color: var(--el-color-danger);
      }
    }
  }
}

</style>
