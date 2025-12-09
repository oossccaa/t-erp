<template>
  <el-dialog
    v-model="visible"
    :title="isEdit ? '編輯產品' : '新增產品'"
    width="600px"
    :close-on-click-modal="false"
    @closed="handleClosed"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="100px"
    >
      <el-form-item label="SKU" prop="sku">
        <el-input v-model="form.sku" placeholder="請輸入產品 SKU" />
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
          <el-form-item label="庫存" prop="stock">
            <el-input-number
              v-model="form.stock"
              :min="0"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="最低庫存" prop="minStock">
            <el-input-number
              v-model="form.minStock"
              :min="0"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
      </el-row>
      
      <el-form-item label="狀態">
        <el-switch v-model="form.isActive" />
      </el-form-item>
    </el-form>
    
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" :loading="loading" @click="handleSubmit">
          {{ isEdit ? '更新' : '創建' }}
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'

interface ProductForm {
  sku: string
  name: string
  description?: string
  unitPrice: number
  costPrice: number
  stock: number
  minStock: number
  isActive: boolean
}

interface Props {
  modelValue: boolean
  data?: any
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm', data: ProductForm): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false
})

const emit = defineEmits<Emits>()

const formRef = ref<FormInstance>()
const loading = ref(false)

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const isEdit = computed(() => !!props.data?.id)

const form = reactive<ProductForm>({
  sku: '',
  name: '',
  description: '',
  unitPrice: 0,
  costPrice: 0,
  stock: 0,
  minStock: 0,
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
  stock: [
    { required: true, message: '請輸入庫存', trigger: 'blur' }
  ],
  minStock: [
    { required: true, message: '請輸入最低庫存', trigger: 'blur' }
  ]
}

const resetForm = () => {
  Object.assign(form, {
    sku: '',
    name: '',
    description: '',
    unitPrice: 0,
    costPrice: 0,
    stock: 0,
    minStock: 0,
    isActive: true
  })
  formRef.value?.clearValidate()
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    loading.value = true
    
    emit('confirm', { ...form })
    
    ElMessage.success(isEdit.value ? '更新成功' : '創建成功')
    visible.value = false
  } catch (error) {
    console.error('表單驗證失敗:', error)
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

watch(
  () => props.data,
  (newData) => {
    if (newData && visible.value) {
      Object.assign(form, newData)
    }
  },
  { immediate: true }
)

watch(visible, (newVisible) => {
  if (newVisible && props.data) {
    Object.assign(form, props.data)
  } else if (!newVisible) {
    resetForm()
  }
})
</script>

<style scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>