<template>
  <el-dialog
    v-model="visible"
    :title="isEdit ? '編輯供應商' : '新增供應商'"
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
      <el-form-item label="供應商名稱" prop="name">
        <el-input v-model="form.name" placeholder="請輸入供應商名稱" />
      </el-form-item>

      <el-form-item label="聯絡人">
        <el-input v-model="form.contactPerson" placeholder="請輸入聯絡人" />
      </el-form-item>

      <el-form-item label="聯絡電話">
        <el-input v-model="form.phone" placeholder="請輸入聯絡電話" />
      </el-form-item>

      <el-form-item label="電子郵箱">
        <el-input v-model="form.email" type="email" placeholder="請輸入電子郵箱" />
      </el-form-item>

      <el-form-item label="統一編號" prop="taxId">
        <el-input v-model="form.taxId" placeholder="請輸入統一編號（選填）" maxlength="20" />
      </el-form-item>

      <el-form-item label="地址">
        <el-input
          v-model="form.address"
          type="textarea"
          :rows="3"
          placeholder="請輸入地址"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" :loading="loading" @click="handleSubmit">
          {{ isEdit ? '更新' : '建立' }}
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { type FormInstance, type FormRules } from 'element-plus'
import type { Supplier } from '@/types'

interface SupplierForm {
  name: string
  contactPerson?: string
  phone?: string
  email?: string
  taxId?: string
  address?: string
}

interface Props {
  modelValue: boolean
  supplier?: Supplier | null
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm', data: SupplierForm): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  supplier: null
})

const emit = defineEmits<Emits>()

const formRef = ref<FormInstance>()
const loading = ref(false)

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const isEdit = computed(() => !!props.supplier?.id)

const form = reactive<SupplierForm>({
  name: '',
  contactPerson: '',
  phone: '',
  email: '',
  taxId: '',
  address: ''
})

const rules: FormRules = {
  name: [
    { required: true, message: '請輸入供應商名稱', trigger: 'blur' },
    { max: 100, message: '供應商名稱長度不能超過100字符', trigger: 'blur' }
  ],
  email: [
    { type: 'email', message: '請輸入有效的電子郵箱地址', trigger: 'blur' }
  ]
}

const resetForm = () => {
  Object.assign(form, {
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: ''
  })
  formRef.value?.clearValidate()
}

const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    loading.value = true

    // 空字串欄位轉 undefined（避免後端 @IsEmail 等 optional 驗證誤觸）
    const payload: any = { ...form }
    Object.keys(payload).forEach(k => { if (payload[k] === '') payload[k] = undefined })
    emit('confirm', payload)
  } catch (error) {
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

// 當供應商數據變化時更新表單
watch(
  () => props.supplier,
  (newSupplier) => {
    if (newSupplier && visible.value) {
      Object.assign(form, {
        name: newSupplier.name || '',
        contactPerson: newSupplier.contactPerson || '',
        phone: newSupplier.phone || '',
        email: newSupplier.email || '',
        taxId: newSupplier.taxId || '',
        address: newSupplier.address || ''
      })
    }
  },
  { immediate: true }
)

// 當對話框打開/關閉時處理表單
watch(visible, (newVisible) => {
  if (newVisible && props.supplier) {
    Object.assign(form, {
      name: props.supplier.name || '',
      contactPerson: props.supplier.contactPerson || '',
      phone: props.supplier.phone || '',
      email: props.supplier.email || '',
      taxId: props.supplier.taxId || '',
      address: props.supplier.address || ''
    })
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
