<template>
  <el-dialog
    v-model="visible"
    title="退回訂單"
    width="500px"
    :close-on-click-modal="false"
    @closed="handleClosed"
  >
    <el-alert
      title="退回說明"
      type="info"
      :closable="false"
      style="margin-bottom: 16px"
    >
      <template #default>
        <div>
          <p style="margin: 0 0 8px 0;">
            當前狀態：<strong>{{ currentStatusText }}</strong>
          </p>
          <p style="margin: 0;">
            退回後狀態：<strong>{{ targetStatusText }}</strong>
          </p>
        </div>
      </template>
    </el-alert>

    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="100px"
    >
      <el-form-item label="退回原因" prop="reason">
        <el-input
          v-model="form.reason"
          type="textarea"
          :rows="4"
          placeholder="請輸入退回原因（選填）"
          maxlength="500"
          show-word-limit
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="warning" :loading="loading" @click="handleSubmit">
          確定退回
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { type FormInstance, type FormRules } from 'element-plus'

interface RevertForm {
  reason?: string
}

interface Props {
  modelValue: boolean
  orderType: 'purchase' | 'sale'
  currentStatus?: string
  targetStatus?: string
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm', data: RevertForm): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  orderType: 'purchase'
})

const emit = defineEmits<Emits>()

const formRef = ref<FormInstance>()
const loading = ref(false)

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const form = reactive<RevertForm>({
  reason: ''
})

const rules: FormRules = {
  reason: [
    { max: 500, message: '退回原因長度不能超過 500 個字符', trigger: 'blur' }
  ]
}

// 狀態文字映射
const statusTextMap: Record<string, string> = {
  // 進貨單狀態
  draft: '草稿',
  pending: '待審批',
  approved: '已批准',
  processing: '處理中',
  partially_received: '部分入庫',
  received: '已入庫',
  completed: '已完成',
  cancelled: '已取消',
  // 銷貨單狀態
  confirmed: '已確認',
  partially_shipped: '部分出貨',
  shipped: '已出貨',
  delivered: '已送達',
  returned: '已退貨'
}

const currentStatusText = computed(() => {
  return statusTextMap[props.currentStatus || ''] || props.currentStatus || '未知'
})

const targetStatusText = computed(() => {
  return statusTextMap[props.targetStatus || ''] || props.targetStatus || '未知'
})

const resetForm = () => {
  form.reason = ''
  formRef.value?.clearValidate()
}

const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    loading.value = true
    emit('confirm', { ...form })
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

// 當對話框打開時，重置表單
watch(visible, (newVisible) => {
  if (newVisible) {
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
