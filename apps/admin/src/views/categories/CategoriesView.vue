<template>
  <div class="categories-view">
    <!-- 頁面標題 -->
    <div class="page-header">
      <div class="header-content">
        <h2 class="page-title">分類管理</h2>
        <p class="page-description">管理產品分類，支援多層級分類結構</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="handleCreate">
          <el-icon><Plus /></el-icon>
          新增分類
        </el-button>
      </div>
    </div>

    <!-- 分類列表 -->
    <el-card class="table-card" shadow="never">
      <el-table
        v-loading="loading"
        :data="tableData"
        row-key="id"
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
        border
        stripe
        style="width: 100%"
      >
        <el-table-column prop="name" label="分類名稱" min-width="200" />
        <el-table-column prop="description" label="描述" min-width="250" show-overflow-tooltip />
        <el-table-column label="子分類數量" width="120" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.children && row.children.length" type="info">
              {{ row.children.length }}
            </el-tag>
            <span v-else style="color: #909399">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="創建時間" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button-group>
              <el-button size="small" @click="handleEdit(row)">
                <el-icon><Edit /></el-icon>
                編輯
              </el-button>
              <el-button size="small" type="danger" @click="handleDelete(row)">
                <el-icon><Delete /></el-icon>
                刪除
              </el-button>
            </el-button-group>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 分類對話框 -->
    <CategoryDialog
      v-model="dialogVisible"
      :category="currentCategory"
      :categories="flatCategories"
      @confirm="handleDialogConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete } from '@element-plus/icons-vue'
import type { Category } from '@t-erp/shared'
import { categoriesApi } from '@/api/categories'
import CategoryDialog from '@/components/categories/CategoryDialog.vue'
import { formatDateTime } from '@/utils/format'

// 響應式數據
const loading = ref(false)
const tableData = ref<Category[]>([])
const dialogVisible = ref(false)
const currentCategory = ref<Category | null>(null)

// 扁平化的分類列表（用於父分類選擇）
const flatCategories = computed(() => {
  const flatten = (categories: Category[], level = 0): Category[] => {
    let result: Category[] = []
    categories.forEach(cat => {
      result.push({ ...cat, level })
      if (cat.children && cat.children.length > 0) {
        result = result.concat(flatten(cat.children, level + 1))
      }
    })
    return result
  }
  return flatten(tableData.value)
})

// 獲取分類樹
const getCategoriesTree = async () => {
  loading.value = true
  try {
    const response = await categoriesApi.getCategoryTree()
    tableData.value = response.data || []
  } catch (error) {
    ElMessage.error('獲取分類列表失敗')
  } finally {
    loading.value = false
  }
}

// 新增分類
const handleCreate = () => {
  currentCategory.value = null
  dialogVisible.value = true
}

// 編輯分類
const handleEdit = (row: Category) => {
  currentCategory.value = row
  dialogVisible.value = true
}

// 刪除分類
const handleDelete = async (row: Category) => {
  // 檢查是否有子分類
  if (row.children && row.children.length > 0) {
    ElMessage.warning('該分類下有子分類，無法刪除')
    return
  }

  try {
    await ElMessageBox.confirm(
      `確定要刪除分類 "${row.name}" 嗎？`,
      '刪除確認',
      {
        confirmButtonText: '確定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    await categoriesApi.deleteCategory(row.id!)
    ElMessage.success('刪除成功')
    getCategoriesTree()
  } catch (error: any) {
    if (error !== 'cancel') {
      // 錯誤訊息已由 request.ts 攔截器處理
    }
  }
}

// 對話框確認
const handleDialogConfirm = async (formData: any) => {
  try {
    if (currentCategory.value?.id) {
      // 更新分類
      await categoriesApi.updateCategory(currentCategory.value.id, formData)
      ElMessage.success('更新成功')
    } else {
      // 建立分類
      await categoriesApi.createCategory(formData)
      ElMessage.success('建立成功')
    }

    dialogVisible.value = false
    getCategoriesTree()
  } catch (error: any) {
    ElMessage.error(error.message || (currentCategory.value?.id ? '更新失敗' : '創建失敗'))
    throw error // 讓 dialog 知道失敗，不要關閉
  }
}

// 組件名稱
defineOptions({
  name: 'Categories',
})

// 初始化
onMounted(() => {
  getCategoriesTree()
})
</script>

<style lang="scss" scoped>
.categories-view {
  padding: 24px;
  background-color: var(--el-bg-color-page);
  min-height: calc(100vh - 120px);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;

  .header-content {
    .page-title {
      font-size: 24px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      margin: 0 0 8px 0;
    }

    .page-description {
      color: var(--el-text-color-secondary);
      margin: 0;
    }
  }
}

.table-card {
  :deep(.el-table) {
    .el-table__row {
      &.el-table__row--level-1 {
        background-color: var(--el-fill-color-lighter);
      }

      &.el-table__row--level-2 {
        background-color: var(--el-fill-color-light);
      }
    }
  }
}

// 響應式設計
@media (max-width: 768px) {
  .categories-view {
    padding: 16px;
  }

  .page-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;

    .header-actions {
      align-self: flex-end;
    }
  }
}
</style>
