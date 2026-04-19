<template>
  <div class="customers-view">
    <!-- 頁面標題 -->
    <div class="page-header">
      <div class="header-content">
        <h2 class="page-title">客戶管理</h2>
        <p class="page-description">管理客戶資訊，包括聯繫方式、交易記錄等</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="handleCreate">
          <el-icon><Plus /></el-icon>
          新增客戶
        </el-button>
      </div>
    </div>

    <!-- 搜尋和篩選 -->
    <el-card class="filter-card" shadow="never">
      <el-form :model="filters" :inline="true" class="search-form">
        <el-form-item label="客戶名稱">
          <el-input
            v-model="filters.name"
            placeholder="請輸入客戶名稱"
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

    <!-- 客戶列表 -->
    <el-card class="table-card" shadow="never">
      <el-table
        v-loading="loading"
        :data="tableData"
        border
        stripe
        style="width: 100%"
      >
        <el-table-column prop="name" label="客戶名稱" min-width="150" />
        <el-table-column prop="contactPerson" label="聯繫人" width="120" />
        <el-table-column prop="phone" label="電話" width="140" />
        <el-table-column prop="email" label="電子郵箱" min-width="180" />
        <el-table-column prop="taxId" label="統一編號" width="120">
          <template #default="{ row }">{{ row.taxId || '-' }}</template>
        </el-table-column>
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
            <div class="action-buttons">
              <el-button size="small" @click="handleEdit(row)">
                <el-icon><Edit /></el-icon>
                編輯
              </el-button>
              <el-button size="small" type="danger" @click="handleDelete(row)">
                <el-icon><Delete /></el-icon>
                刪除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 客戶對話框 -->
    <CustomerDialog
      v-model="dialogVisible"
      :customer="currentCustomer"
      @confirm="handleDialogConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Refresh, Edit, Delete } from '@element-plus/icons-vue'
import type { Customer } from '@/types'
import { customersApi } from '@/api/customers'
import CustomerDialog from '@/components/customers/CustomerDialog.vue'

const loading = ref(false)
const tableData = ref<Customer[]>([])
const dialogVisible = ref(false)
const currentCustomer = ref<Customer | null>(null)

const filters = ref({ name: '' })

// 獲取客戶列表
const loadData = async () => {
  loading.value = true
  try {
    const response = await customersApi.getCustomers(filters.value.name)
    tableData.value = response.data || []
  } catch (error) {
    ElMessage.error('獲取客戶列表失敗')
  } finally {
    loading.value = false
  }
}

// 新增客戶
const handleCreate = () => {
  currentCustomer.value = null
  dialogVisible.value = true
}

// 編輯客戶
const handleEdit = (row: Customer) => {
  currentCustomer.value = row
  dialogVisible.value = true
}

// 刪除客戶
const handleDelete = async (row: Customer) => {
  try {
    await ElMessageBox.confirm(
      `確定要刪除客戶 "${row.name}" 嗎？`,
      '刪除確認',
      {
        confirmButtonText: '確定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    await customersApi.deleteCustomer(row.id!)
    ElMessage.success('刪除成功')
    loadData()
  } catch (error: any) {
    if (error !== 'cancel') {
      // 錯誤訊息已由 request.ts 攔截器處理
    }
  }
}

// 切換狀態
const handleToggleStatus = async (row: Customer) => {
  try {
    await customersApi.toggleCustomerStatus(row.id!)
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
    if (currentCustomer.value?.id) {
      // 更新客戶
      await customersApi.updateCustomer(currentCustomer.value.id, formData)
      ElMessage.success('更新成功')
    } else {
      // 建立客戶
      await customersApi.createCustomer(formData)
      ElMessage.success('建立成功')
    }

    dialogVisible.value = false
    loadData()
  } catch (error: any) {
    // 錯誤訊息已由 request.ts 攔截器處理，這裡只 re-throw 讓 dialog 保持開啟
    throw error
  }
}

// 組件名稱
defineOptions({
  name: 'Customers',
})

onMounted(() => {
  loadData()
})
</script>

<style lang="scss" scoped>
.customers-view {
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
  .customers-view {
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

.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;

  .el-button + .el-button {
    margin-left: 0;
  }
}
</style>
