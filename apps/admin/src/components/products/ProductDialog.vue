<template>
  <el-dialog
    v-model="visible"
    :title="isView ? '檢視產品' : isEdit ? '編輯產品' : '新增產品'"
    width="600px"
    :close-on-click-modal="false"
    @closed="handleClosed"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="100px"
      :disabled="isView"
    >
      <el-form-item label="SKU" prop="sku">
        <el-input
          v-model="form.sku"
          placeholder="請輸入產品 SKU"
          :disabled="isEdit"
        />
        <template v-if="isEdit" #extra>
          <span style="color: #909399; font-size: 12px;">SKU 不可修改</span>
        </template>
      </el-form-item>

      <el-form-item label="產品名稱" prop="name">
        <el-input v-model="form.name" placeholder="請輸入產品名稱" />
      </el-form-item>
      
      <el-form-item label="描述">
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="3"
          placeholder="請輸入產品描述"
        />
      </el-form-item>

      <el-form-item label="產品分類">
        <el-select
          v-model="form.categoryId"
          placeholder="請選擇產品分類"
          clearable
          style="width: 100%"
        >
          <el-option
            v-for="category in categories"
            :key="category.id"
            :label="category.name"
            :value="category.id"
          />
        </el-select>
      </el-form-item>
      
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="售價" prop="unitPrice">
            <el-input-number
              v-model="form.unitPrice"
              :min="0"
              :precision="2"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="成本價" prop="costPrice">
            <el-input-number
              v-model="form.costPrice"
              :min="0"
              :precision="2"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
      </el-row>
      
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="庫存" prop="stockQuantity">
            <el-input-number
              v-model="form.stockQuantity"
              :min="0"
              :disabled="isEdit"
              style="width: 100%"
            />
            <template v-if="isEdit" #extra>
              <span style="color: #909399; font-size: 12px;">庫存需透過進貨單/銷貨單調整</span>
            </template>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="最低庫存" prop="minStockLevel">
            <el-input-number
              v-model="form.minStockLevel"
              :min="0"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
      </el-row>
      
      <el-form-item v-if="isEdit" label="狀態">
        <el-switch v-model="form.isActive" />
        <span style="margin-left: 12px; color: #909399; font-size: 12px;">
          {{ form.isActive ? '啟用' : '停用' }}
        </span>
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
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { categoriesApi } from '@/api/categories'
import type { Category } from '@/types'

interface ProductForm {
  sku: string
  name: string
  description?: string
  categoryId?: number
  unitPrice: number
  costPrice: number
  stockQuantity: number
  minStockLevel: number
  isActive?: boolean  // 可選，創建時不需要
}

interface Props {
  modelValue: boolean
  mode?: 'create' | 'edit' | 'view'
  product?: any
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm', data: ProductForm): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  mode: 'create'
})

const emit = defineEmits<Emits>()

const formRef = ref<FormInstance>()
const loading = ref(false)
const categories = ref<Category[]>([])

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const isEdit = computed(() => props.mode === 'edit')
const isView = computed(() => props.mode === 'view')

const form = reactive<ProductForm>({
  sku: '',
  name: '',
  description: '',
  categoryId: undefined,
  unitPrice: 0,
  costPrice: 0,
  stockQuantity: 0,
  minStockLevel: 0,
  isActive: true
})

const rules: FormRules = {
  sku: [
    { required: true, message: '請輸入 SKU', trigger: 'blur' }
  ],
  name: [
    { required: true, message: '請輸入產品名稱', trigger: 'blur' }
  ],
  unitPrice: [
    { required: true, message: '請輸入售價', trigger: 'blur' }
  ],
  costPrice: [
    { required: true, message: '請輸入成本價', trigger: 'blur' }
  ],
  stockQuantity: [
    { required: true, message: '請輸入庫存', trigger: 'blur' }
  ],
  minStockLevel: [
    { required: true, message: '請輸入最低庫存', trigger: 'blur' }
  ]
}

const resetForm = () => {
  Object.assign(form, {
    sku: '',
    name: '',
    description: '',
    categoryId: undefined,
    unitPrice: 0,
    costPrice: 0,
    stockQuantity: 0,
    minStockLevel: 0,
    isActive: true
  })
  formRef.value?.clearValidate()
}

// 取得分類列表
const fetchCategories = async () => {
  try {
    const response = await categoriesApi.getCategories()
    categories.value = response.data || []
  } catch (error) {
    console.error('取得分類列表失敗:', error)
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    loading.value = true

    // 發出 confirm 事件，等待父元件處理 API
    await emit('confirm', { ...form })

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

// 當產品資料變化時更新表單
watch(
  () => props.product,
  (newProduct) => {
    if (newProduct && visible.value) {
      Object.assign(form, {
        sku: newProduct.sku || '',
        name: newProduct.name || '',
        description: newProduct.description || '',
        categoryId: newProduct.categoryId || undefined,
        unitPrice: newProduct.unitPrice || 0,
        costPrice: newProduct.costPrice || 0,
        stockQuantity: newProduct.stockQuantity || 0,
        minStockLevel: newProduct.minStockLevel || 0,
        isActive: newProduct.isActive ?? true
      })
    }
  },
  { immediate: true }
)

// 當對話框打開/關閉時處理表單
watch(visible, (newVisible) => {
  if (newVisible) {
    // 對話框打開時重新獲取分類列表
    fetchCategories()

    if (props.product) {
      Object.assign(form, {
        sku: props.product.sku || '',
        name: props.product.name || '',
        description: props.product.description || '',
        categoryId: props.product.categoryId || undefined,
        unitPrice: props.product.unitPrice || 0,
        costPrice: props.product.costPrice || 0,
        stockQuantity: props.product.stockQuantity || 0,
        minStockLevel: props.product.minStockLevel || 0,
        isActive: props.product.isActive ?? true
      })
    }
  } else {
    resetForm()
  }
})

// 組件掛載時獲取分類列表
onMounted(() => {
  fetchCategories()
})
</script>

<style scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>