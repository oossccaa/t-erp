<template>
  <div class="suppliers-view">
    <!-- 頁面標題 -->
    <div class="page-header">
      <div class="header-content">
        <h2 class="page-title">供應商管理</h2>
        <p class="page-description">管理供應商資訊，包括聯繫方式、供貨記錄等</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="handleCreate">
          <el-icon><Plus /></el-icon>
          新增供應商
        </el-button>
      </div>
    </div>

    <!-- 搜尋和篩選 -->
    <el-card class="filter-card" shadow="never">
      <el-form :model="filters" :inline="true" class="search-form">
        <el-form-item label="供應商名稱">
          <el-input
            v-model="filters.name"
            placeholder="請輸入供應商名稱"
            clearable
            @clear="handleSearch"
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜尋
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 供應商列表 -->
    <el-card class="table-card" shadow="never">
      <el-table
        v-loading="loading"
        :data="tableData"
        border
        stripe
        style="width: 100%"
      >
        <el-table-column prop="name" label="供應商名稱" min-width="150" />
        <el-table-column prop="contactPerson" label="聯繫人" width="120" />
        <el-table-column prop="phone" label="電話" width="140" />
        <el-table-column prop="email" label="電子郵箱" min-width="180" />
        <el-table-column prop="address" label="地址" min-width="200" show-overflow-tooltip />
        <el-table-column prop="isActive" label="狀態" width="80">
          <template #default="{ row }">
            <el-switch
              v-model="row.isActive"
              @change="handleToggleStatus(row)"
            />
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

    <!-- 供應商對話框 -->
    <SupplierDialog
      v-model="dialogVisible"
      :supplier="currentSupplier"
      @confirm="handleDialogConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Refresh, Edit, Delete } from '@element-plus/icons-vue'
import type { Supplier } from '@t-erp/shared'
import { suppliersApi } from '@/api/suppliers'
import SupplierDialog from '@/components/suppliers/SupplierDialog.vue'

const loading = ref(false)
const tableData = ref<Supplier[]>([])
const dialogVisible = ref(false)
const currentSupplier = ref<Supplier | null>(null)

const filters = ref({
  name: '',
})

// 獲取供應商列表
const loadData = async () => {
  loading.value = true
  try {
    const response = await suppliersApi.getSuppliers(filters.value.name)
    tableData.value = response.data || []
  } catch (error) {
    ElMessage.error('獲取供應商列表失敗')
  } finally {
    loading.value = false
  }
}

// 新增供應商
const handleCreate = () => {
  currentSupplier.value = null
  dialogVisible.value = true
}

// 編輯供應商
const handleEdit = (row: Supplier) => {
  currentSupplier.value = row
  dialogVisible.value = true
}

// 刪除供應商
const handleDelete = async (row: Supplier) => {
  try {
    await ElMessageBox.confirm(
      `確定要刪除供應商 "${row.name}" 嗎？`,
      '刪除確認',
      {
        confirmButtonText: '確定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    await suppliersApi.deleteSupplier(row.id!)
    ElMessage.success('刪除成功')
    loadData()
  } catch (error: any) {
    if (error !== 'cancel') {
      // 錯誤訊息已由 request.ts 攔截器處理
    }
  }
}

// 切換狀態
const handleToggleStatus = async (row: Supplier) => {
  try {
    await suppliersApi.toggleSupplierStatus(row.id!)
    ElMessage.success(row.isActive ? '啟用成功' : '停用成功')
  } catch (error) {
    // 還原狀態
    row.isActive = !row.isActive
    // 錯誤訊息已由 request.ts 攔截器處理
  }
}

// 搜尋
const handleSearch = () => {
  loadData()
}

// 重置
const handleReset = () => {
  filters.value = { name: '' }
  loadData()
}

// 對話框確認
const handleDialogConfirm = async (formData: any) => {
  try {
    if (currentSupplier.value?.id) {
      // 更新供應商
      await suppliersApi.updateSupplier(currentSupplier.value.id, formData)
      ElMessage.success('更新成功')
    } else {
      // 建立供應商
      await suppliersApi.createSupplier(formData)
      ElMessage.success('建立成功')
    }

    dialogVisible.value = false
    loadData()
  } catch (error: any) {
    ElMessage.error(error.message || (currentSupplier.value?.id ? '更新失敗' : '建立失敗'))
    throw error // 讓 dialog 知道失敗，不要關閉
  }
}

// 組件名稱
defineOptions({
  name: 'Suppliers',
})

onMounted(() => {
  loadData()
})
</script>

<style lang="scss" scoped>
.suppliers-view {
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

.filter-card {
  margin-bottom: 16px;

  .search-form {
    margin-bottom: 0;
  }
}

.table-card {
  min-height: 400px;
}

// 響應式設計
@media (max-width: 768px) {
  .suppliers-view {
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

  .search-form {
    :deep(.el-form-item) {
      margin-bottom: 16px;

      .el-form-item__label {
        display: block;
        text-align: left;
        margin-bottom: 4px;
      }

      .el-form-item__content {
        margin-left: 0 !important;
      }
    }
  }
}
</style>
