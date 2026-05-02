<template>
  <el-dialog
    v-model="visible"
    :title="isView ? '檢視銷貨單' : isEdit ? '編輯銷貨單' : '新增銷貨單'"
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
          <el-form-item label="客戶" prop="customerId">
            <el-select
              v-model="form.customerId"
              placeholder="請選擇客戶"
              filterable
              style="width: 100%"
              :disabled="isEdit"
            >
              <el-option
                v-for="customer in customers"
                :key="customer.id"
                :label="customer.name"
                :value="customer.id"
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
          <el-form-item label="統一編號">
            <el-input :model-value="selectedCustomerTaxId" disabled placeholder="選擇客戶後自動帶入" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="預計出貨日期">
            <el-date-picker
              v-model="form.expectedShippingDate"
              type="date"
              placeholder="請選擇預計出貨日期"
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
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="參考編號">
            <el-input
              v-model="form.referenceNumber"
              placeholder="請輸入參考編號"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="付款方式">
            <el-select
              v-model="form.paymentMethod"
              placeholder="請選擇付款方式"
              clearable
              style="width: 100%"
            >
              <el-option label="現金" value="cash" />
              <el-option label="信用卡" value="credit_card" />
              <el-option label="銀行轉帳" value="bank_transfer" />
              <el-option label="支票" value="check" />
              <el-option label="月結" value="monthly" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-divider content-position="left">訂單項目</el-divider>

      <div v-if="!isView" class="items-toolbar">
        <el-checkbox v-model="showDiscount">顯示折扣欄</el-checkbox>
      </div>

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
        <el-table-column v-if="showDiscount || isView" prop="discountRate" label="折扣 (%)" width="180">
          <template #default="{ row }">
            <el-input-number
              v-model="row.discountRate"
              :min="0"
              :max="100"
              :precision="2"
              :disabled="isView"
              controls-position="right"
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

      <el-button v-if="!isView" @click="addItem" class="add-item-btn">
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
            <div v-if="features.weight" class="summary-item weight" :class="{ overweight: isOverweight }">
              <span>總重量:</span>
              <span class="amount">
                {{ totalWeight.toLocaleString('zh-TW', { minimumFractionDigits: 3, maximumFractionDigits: 3 }) }} kg
                <span v-if="isOverweight" class="overweight-tip">超過載重 {{ truckCapacityKg }} kg</span>
              </span>
            </div>
          </div>
        </el-col>
      </el-row>

      <el-divider content-position="left">配送資訊</el-divider>

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
          <el-form-item label="帳單地址">
            <el-input
              v-model="form.billingAddress"
              type="textarea"
              :rows="2"
              placeholder="請輸入帳單地址"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="運送方式">
            <el-input
              v-model="form.shippingMethod"
              placeholder="例如：宅配、快遞、自取"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="追蹤號碼">
            <el-input
              v-model="form.trackingNumber"
              placeholder="請輸入物流追蹤號碼"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="備註">
        <el-input
          v-model="form.notes"
          type="textarea"
          :rows="2"
          placeholder="請輸入備註"
        />
      </el-form-item>
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
    price-type="sale"
    @select="handleProductSelect"
  />
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Plus, Delete } from '@element-plus/icons-vue'
import { customersApi } from '@/api/customers'
import { productsApi } from '@/api/products'
import { features } from '@/config/features'
import type { Customer, Product } from '@/types'
import ProductListModal from '@/components/common/ProductListModal.vue'

interface SaleOrderItem {
  productId: number
  productName?: string
  productSku?: string
  quantity: number
  unitPrice: number
  discountRate?: number
  discountAmount?: number
  amount: number
  notes?: string
}

interface SaleOrderForm {
  customerId: number | undefined
  orderDate: string
  expectedShippingDate?: string
  expectedDeliveryDate?: string
  taxRate?: number
  discountRate?: number
  discountAmount?: number
  shippingCost?: number
  notes?: string
  shippingAddress?: string
  billingAddress?: string
  paymentMethod?: string
  shippingMethod?: string
  trackingNumber?: string
  referenceNumber?: string
  items: SaleOrderItem[]
}

interface Props {
  modelValue: boolean
  mode?: 'create' | 'edit' | 'view'
  saleOrder?: any
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
const customers = ref<Customer[]>([])
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

const selectedCustomerTaxId = computed(() => {
  const c = customers.value.find((x) => x.id === form.customerId)
  return c?.taxId || '—'
})

// 折扣欄預設隱藏，需要時勾選顯示
const showDiscount = ref(false)

const form = reactive<SaleOrderForm>({
  customerId: undefined,
  orderDate: new Date().toISOString().split('T')[0],
  expectedShippingDate: undefined,
  expectedDeliveryDate: undefined,
  taxRate: 0,
  discountRate: 0,
  discountAmount: 0,
  shippingCost: 0,
  notes: '',
  shippingAddress: '',
  billingAddress: '',
  paymentMethod: '',
  shippingMethod: '',
  trackingNumber: '',
  referenceNumber: '',
  items: []
})

const rules: FormRules = {
  customerId: [
    { required: true, message: '請選擇客戶', trigger: 'change' }
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

// 卡車容量（kg）— 預設 5000 kg，後續可改為設定值
const truckCapacityKg = 5000

// 計算總重量
const totalWeight = computed(() => {
  return form.items.reduce((sum, item) => {
    const product = products.value.find(p => p.id === item.productId)
    const weight = Number(product?.weight) || 0
    const qty = Number(item.quantity) || 0
    return sum + weight * qty
  }, 0)
})

const isOverweight = computed(() => features.weight && totalWeight.value > truckCapacityKg)

// 格式化金額（含千分位）
const formatCurrency = (amount: number | string | undefined) => {
  const numAmount = Number(amount) || 0
  return `NT$ ${numAmount.toLocaleString('zh-TW', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// 計算項目金額
const calculateItemAmount = (item: SaleOrderItem) => {
  const quantity = Number(item.quantity) || 0
  const unitPrice = Number(item.unitPrice) || 0
  const discountRate = Number(item.discountRate) || 0
  const discountAmount = Number(item.discountAmount) || 0
  const baseAmount = quantity * unitPrice
  const itemDiscount = discountRate ? baseAmount * (discountRate / 100) : discountAmount
  item.amount = baseAmount - itemDiscount
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
    discountRate: 0,
    amount: 0,
    notes: ''
  })
}

// 刪除項目
const removeItem = (index: number) => {
  form.items.splice(index, 1)
}

// 處理產品變更
const handleProductChange = (item: SaleOrderItem) => {
  const product = products.value.find(p => p.id === item.productId)
  if (product) {
    item.productName = product.name
    item.productSku = product.sku
    item.unitPrice = product.unitPrice || 0
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
    item.unitPrice = product.unitPrice || 0
    calculateItemAmount(item)
  }
}

// 重置表單
const resetForm = () => {
  Object.assign(form, {
    customerId: undefined,
    orderDate: new Date().toISOString().split('T')[0],
    expectedShippingDate: undefined,
    expectedDeliveryDate: undefined,
    taxRate: 0,
    discountRate: 0,
    discountAmount: 0,
    shippingCost: 0,
    notes: '',
    shippingAddress: '',
    billingAddress: '',
    paymentMethod: '',
    shippingMethod: '',
    trackingNumber: '',
    referenceNumber: '',
    items: []
  })
  showDiscount.value = false
  formRef.value?.clearValidate()
}

// 獲取客戶列表
const fetchCustomers = async () => {
  try {
    const response = await customersApi.getCustomers()
    // 過濾啟用的客戶
    customers.value = (response.data || []).filter(c => c.isActive)
  } catch (error) {
    console.error('獲取客戶列表失敗:', error)
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

    // 準備提交數據 - 基礎數據
    const baseData = {
      orderDate: form.orderDate,
      expectedShippingDate: form.expectedShippingDate || undefined,
      expectedDeliveryDate: form.expectedDeliveryDate || undefined,
      taxRate: Number(form.taxRate) || 0,
      discountRate: Number(form.discountRate) || 0,
      discountAmount: Number(discountAmount.value) || 0,
      shippingCost: Number(form.shippingCost) || 0,
      notes: form.notes || undefined,
      shippingAddress: form.shippingAddress || undefined,
      billingAddress: form.billingAddress || undefined,
      paymentMethod: form.paymentMethod || undefined,
      shippingMethod: form.shippingMethod || undefined,
      trackingNumber: form.trackingNumber || undefined,
      referenceNumber: form.referenceNumber || undefined,
      items: form.items.map(item => ({
        productId: item.productId,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        discountRate: Number(item.discountRate) || 0,
        discountAmount: Number(item.discountAmount) || 0,
        notes: item.notes || undefined
      }))
    }

    // 根據模式添加特定字段
    const submitData = isEdit.value
      ? baseData  // 編輯時不包含 customerId 和 status
      : { ...baseData, customerId: form.customerId, status: 'pending' }  // 新建時直接為待確認狀態

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

// 當銷貨單資料變化時更新表單
watch(
  () => props.saleOrder,
  (newOrder) => {
    if (newOrder && visible.value) {
      Object.assign(form, {
        customerId: newOrder.customerId,
        orderDate: newOrder.orderDate,
        expectedShippingDate: newOrder.expectedShippingDate,
        expectedDeliveryDate: newOrder.expectedDeliveryDate,
        taxRate: Number(newOrder.taxRate) || 0,
        discountRate: Number(newOrder.discountRate) || 0,
        discountAmount: Number(newOrder.discountAmount) || 0,
        shippingCost: Number(newOrder.shippingCost) || 0,
        notes: newOrder.notes || '',
        shippingAddress: newOrder.shippingAddress || '',
        billingAddress: newOrder.billingAddress || '',
        paymentMethod: newOrder.paymentMethod || '',
        shippingMethod: newOrder.shippingMethod || '',
        trackingNumber: newOrder.trackingNumber || '',
        referenceNumber: newOrder.referenceNumber || '',
        items: (newOrder.items || []).map((item: any) => {
          const quantity = Number(item.quantity) || 0
          const unitPrice = Number(item.unitPrice) || 0
          const discountRate = Number(item.discountRate) || 0
          const discountAmount = Number(item.discountAmount) || 0
          const baseAmount = quantity * unitPrice
          const itemDiscount = discountRate ? baseAmount * (discountRate / 100) : discountAmount
          return {
            productId: item.productId,
            productName: item.productName,
            productSku: item.productSku,
            quantity,
            unitPrice,
            discountRate,
            discountAmount,
            amount: baseAmount - itemDiscount,
            notes: item.notes
          }
        })
      })
      // 既有訂單若有任何品項用過折扣，自動展開折扣欄
      showDiscount.value = (newOrder.items || []).some(
        (it: any) => Number(it.discountRate) > 0 || Number(it.discountAmount) > 0
      )
    }
  },
  { immediate: true }
)

// 當對話框打開時處理表單
watch(visible, (newVisible) => {
  if (newVisible) {
    // 每次打開重抓 customers / products，避免使用者剛在別的頁面新增完看不到
    fetchCustomers()
    fetchProducts()
    if (props.saleOrder) {
      Object.assign(form, {
        customerId: props.saleOrder.customerId,
        orderDate: props.saleOrder.orderDate,
        expectedShippingDate: props.saleOrder.expectedShippingDate,
        expectedDeliveryDate: props.saleOrder.expectedDeliveryDate,
        taxRate: Number(props.saleOrder.taxRate) || 0,
        discountRate: Number(props.saleOrder.discountRate) || 0,
        discountAmount: Number(props.saleOrder.discountAmount) || 0,
        shippingCost: Number(props.saleOrder.shippingCost) || 0,
        notes: props.saleOrder.notes || '',
        shippingAddress: props.saleOrder.shippingAddress || '',
        billingAddress: props.saleOrder.billingAddress || '',
        paymentMethod: props.saleOrder.paymentMethod || '',
        shippingMethod: props.saleOrder.shippingMethod || '',
        trackingNumber: props.saleOrder.trackingNumber || '',
        referenceNumber: props.saleOrder.referenceNumber || '',
        items: (props.saleOrder.items || []).map((item: any) => {
          const quantity = Number(item.quantity) || 0
          const unitPrice = Number(item.unitPrice) || 0
          const discountRate = Number(item.discountRate) || 0
          const discountAmount = Number(item.discountAmount) || 0
          const baseAmount = quantity * unitPrice
          const itemDiscount = discountRate ? baseAmount * (discountRate / 100) : discountAmount
          return {
            productId: item.productId,
            productName: item.productName,
            productSku: item.productSku,
            quantity,
            unitPrice,
            discountRate,
            discountAmount,
            amount: baseAmount - itemDiscount,
            notes: item.notes
          }
        })
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
  fetchCustomers()
  fetchProducts()
})
</script>

<style lang="scss" scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.items-toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 8px;
}

.add-item-btn {
  width: 100%;
  margin-bottom: 16px;
  background-color: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary-light-7);
  color: var(--el-color-primary);

  &:hover {
    background-color: var(--el-color-primary-light-8);
    border-color: var(--el-color-primary-light-5);
    color: var(--el-color-primary);
  }
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

    &.weight {
      margin-top: 4px;
      font-size: 14px;
      color: var(--el-text-color-regular);

      &.overweight {
        color: var(--el-color-danger);
        font-weight: 600;
      }

      .overweight-tip {
        margin-left: 8px;
        font-size: 12px;
      }
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
