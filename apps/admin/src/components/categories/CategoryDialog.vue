<template>
  <el-dialog
    v-model="visible"
    :title="isEdit ? '編輯分類' : '新增分類'"
    width="500px"
    :close-on-click-modal="false"
    @closed="handleClosed"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="100px"
    >
      <el-form-item label="分類名稱" prop="name">
        <el-input v-model="form.name" placeholder="請輸入分類名稱" />
      </el-form-item>

      <el-form-item label="父分類">
        <el-select
          v-model="form.parentId"
          placeholder="請選擇父分類（留空為根分類）"
          clearable
          style="width: 100%"
        >
          <el-option
            v-for="category in availableParents"
            :key="category.id"
            :label="category.name"
            :value="category.id"
            :disabled="category.id === currentCategoryId"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="描述">
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="3"
          placeholder="請輸入分類描述"
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
import type { Category } from '@/types'

interface CategoryForm {
  name: string
  description?: string
  parentId?: number
}

interface Props {
  modelValue: boolean
  category?: Category | null
  categories: Category[]
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm', data: CategoryForm): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  category: null,
  categories: () => []
})

const emit = defineEmits<Emits>()

const formRef = ref<FormInstance>()
const loading = ref(false)

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const isEdit = computed(() => !!props.category?.id)
const currentCategoryId = computed(() => props.category?.id)

// 取得可用的父分類（排除自己和自己的子分類）
const availableParents = computed(() => {
  if (!isEdit.value) {
    return props.categories
  }

  // 編輯模式下，排除自己及其子孫分類
  const excludeIds = new Set<number>()
  const addDescendants = (id: number) => {
    excludeIds.add(id)
    props.categories.forEach(cat => {
      if (cat.parentId === id) {
        addDescendants(cat.id!)
      }
    })
  }

  if (currentCategoryId.value) {
    addDescendants(currentCategoryId.value)
  }

  return props.categories.filter(cat => !excludeIds.has(cat.id!))
})

const form = reactive<CategoryForm>({
  name: '',
  description: '',
  parentId: undefined
})

const rules: FormRules = {
  name: [
    { required: true, message: '請輸入分類名稱', trigger: 'blur' }
  ]
}

const resetForm = () => {
  Object.assign(form, {
    name: '',
    description: '',
    parentId: undefined
  })
  formRef.value?.clearValidate()
}

const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    loading.value = true

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

// 當分類資料變化時更新表單
watch(
  () => props.category,
  (newCategory) => {
    if (newCategory && visible.value) {
      Object.assign(form, {
        name: newCategory.name || '',
        description: newCategory.description || '',
        parentId: newCategory.parentId || undefined
      })
    }
  },
  { immediate: true }
)

// 當對話框打開/關閉時處理表單
watch(visible, (newVisible) => {
  if (newVisible && props.category) {
    Object.assign(form, {
      name: props.category.name || '',
      description: props.category.description || '',
      parentId: props.category.parentId || undefined
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
