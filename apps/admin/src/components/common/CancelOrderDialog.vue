<template>
  <el-dialog
    v-model="visible"
    title="取消訂單"
    width="500px"
    :close-on-click-modal="false"
    @closed="handleClosed"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="120px"
    >
      <el-alert
        v-if="hasInventoryImpact"
        :title="alertTitle"
        :type="alertType"
        :description="alertDescription"
        show-icon
        :closable="false"
        style="margin-bottom: 16px"
      />

      <el-form-item label="取消原因" prop="reason" required>
        <el-input
          v-model="form.reason"
          type="textarea"
          :rows="4"
          placeholder="請輸入取消原因（必填）"
          maxlength="500"
          show-word-limit
        />
      </el-form-item>

      <el-form-item v-if="hasInventoryImpact" label="庫存處理">
        <el-switch
          v-model="form.adjustInventory"
          active-text="調整庫存"
          inactive-text="不調整庫存"
        />
        <div style="margin-top: 8px; font-size: 12px; color: #909399;">
          {{ inventoryHelpText }}
        </div>
      </el-form-item>
    </el-form>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="danger" :loading="loading" @click="handleSubmit">
          確定取消訂單
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'

interface CancelForm {
  reason: string
  adjustInventory: boolean
}

interface Props {
  modelValue: boolean
  orderType: 'purchase' | 'sale'
  order?: any
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm', data: CancelForm): void
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

const form = reactive<CancelForm>({
  reason: '',
  adjustInventory: true
})

const rules: FormRules = {
  reason: [
    { required: true, message: '請輸入取消原因', trigger: 'blur' },
    { min: 1, max: 500, message: '取消原因長度在 1 到 500 個字符', trigger: 'blur' }
  ]
}

// 檢查是否有庫存影響
const hasInventoryImpact = computed(() => {
  if (!props.order || !props.order.items) return false

  if (props.orderType === 'purchase') {
    // 進貨單：檢查是否有已入庫的商品
    return props.order.items.some((item: any) => (item.receivedQuantity || 0) > 0)
  } else {
    // 銷貨單：檢查是否有已出貨的商品
    return props.order.items.some((item: any) => (item.shippedQuantity || 0) > 0)
  }
})

// 警告標題
const alertTitle = computed(() => {
  if (props.orderType === 'purchase') {
    return '該進貨單已有入庫記錄'
  } else {
    return '該銷貨單已有出貨記錄'
  }
})

// 警告類型
const alertType = computed(() => {
  return form.adjustInventory ? 'warning' : 'info'
})

// 警告描述
const alertDescription = computed(() => {
  if (props.orderType === 'purchase') {
    return form.adjustInventory
      ? '取消後將扣減已入庫的商品數量，請確保庫存充足'
      : '取消後不會調整庫存，可能導致庫存數據與實際情況不符'
  } else {
    return form.adjustInventory
      ? '取消後將回補已出貨的商品數量到庫存'
      : '取消後不會調整庫存，可能導致庫存數據與實際情況不符'
  }
})

// 庫存處理說明
const inventoryHelpText = computed(() => {
  if (props.orderType === 'purchase') {
    return form.adjustInventory
      ? '開啟後，將扣減已入庫的商品庫存'
      : '關閉後，不會調整庫存，需手動處理'
  } else {
    return form.adjustInventory
      ? '開啟後，將回補已出貨的商品到庫存'
      : '關閉後，不會調整庫存，需手動處理'
  }
})

const resetForm = () => {
  form.reason = ''
  form.adjustInventory = true
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

// 當對話框打開時，重置表單並根據訂單設置默認值
watch(visible, (newVisible) => {
  if (newVisible) {
    resetForm()
    // 默認開啟庫存調整
    form.adjustInventory = true
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
