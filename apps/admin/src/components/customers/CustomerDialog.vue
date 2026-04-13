<template>
  <el-dialog
    v-model="visible"
    :title="isEdit ? '編輯客戶' : '新增客戶'"
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
      <el-form-item label="客戶名稱" prop="name">
        <el-input v-model="form.name" placeholder="請輸入客戶名稱" />
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
import type { Customer } from '@/types'

interface CustomerForm {
  name: string
  contactPerson?: string
  phone?: string
  email?: string
  address?: string
}

interface Props {
  modelValue: boolean
  customer?: Customer | null
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm', data: CustomerForm): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  customer: null
})

const emit = defineEmits<Emits>()

const formRef = ref<FormInstance>()
const loading = ref(false)

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const isEdit = computed(() => !!props.customer?.id)

const form = reactive<CustomerForm>({
  name: '',
  contactPerson: '',
  phone: '',
  email: '',
  address: ''
})

const rules: FormRules = {
  name: [
    { required: true, message: '請輸入客戶名稱', trigger: 'blur' },
    { max: 100, message: '客戶名稱長度不能超過100字符', trigger: 'blur' }
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

    emit('confirm', { ...form })
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

// 當客戶數據變化時更新表單
watch(
  () => props.customer,
  (newCustomer) => {
    if (newCustomer && visible.value) {
      Object.assign(form, {
        name: newCustomer.name || '',
        contactPerson: newCustomer.contactPerson || '',
        phone: newCustomer.phone || '',
        email: newCustomer.email || '',
        address: newCustomer.address || ''
      })
    }
  },
  { immediate: true }
)

// 當對話框打開/關閉時處理表單
watch(visible, (newVisible) => {
  if (newVisible && props.customer) {
    Object.assign(form, {
      name: props.customer.name || '',
      contactPerson: props.customer.contactPerson || '',
      phone: props.customer.phone || '',
      email: props.customer.email || '',
      address: props.customer.address || ''
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
