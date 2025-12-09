<template>
  <div class="sale-orders-view">
    <div class="page-header">
      <h1>銷貨單管理</h1>
      <el-button type="primary" @click="handleCreate">
        <el-icon><Plus /></el-icon>
        新增銷貨單
      </el-button>
    </div>

    <div class="filters">
      <el-form :inline="true">
        <el-form-item label="單號">
          <el-input v-model="filters.orderNumber" placeholder="請輸入單號" clearable />
        </el-form-item>
        <el-form-item label="狀態">
          <el-select v-model="filters.status" placeholder="選擇狀態" clearable>
            <el-option label="草稿" value="draft" />
            <el-option label="待確認" value="pending" />
            <el-option label="已確認" value="confirmed" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button @click="handleSearch">搜尋</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <el-table :data="tableData" :loading="loading" border stripe>
      <el-table-column prop="orderNumber" label="單號" />
      <el-table-column prop="customerName" label="客戶" />
      <el-table-column prop="totalAmount" label="總金額" />
      <el-table-column prop="status" label="狀態">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="建立時間" />
      <el-table-column label="操作" width="200">
        <template #default="{ row }">
          <el-button size="small" @click="handleView(row)">查看</el-button>
          <el-button size="small" @click="handleEdit(row)">編輯</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row)">刪除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @current-change="handleCurrentChange"
        @size-change="handleSizeChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'

const loading = ref(false)
const tableData = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

const filters = ref({ orderNumber: '', status: '' })

const getStatusType = (status: string): string => {
  const types: Record<string, string> = {
    draft: '',
    pending: 'warning',
    confirmed: 'success',
    cancelled: 'danger'
  }
  return types[status] || ''
}

const getStatusText = (status: string): string => {
  const texts: Record<string, string> = {
    draft: '草稿',
    pending: '待確認',
    confirmed: '已確認',
    cancelled: '已取消'
  }
  return texts[status] || status
}

const handleCreate = () => {
  ElMessage.info('新增功能開發中')
}

const handleView = (row: any) => {
  ElMessage.info('查看功能開發中')
}

const handleEdit = (row: any) => {
  ElMessage.info('編輯功能開發中')
}

const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm('確定要刪除此銷貨單嗎？', '提示', {
      confirmButtonText: '確定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    ElMessage.success('刪除成功')
  } catch {}
}

const handleSearch = () => {
  currentPage.value = 1
  loadData()
}

const handleReset = () => {
  filters.value = { orderNumber: '', status: '' }
  currentPage.value = 1
  loadData()
}

const handleCurrentChange = (page: number) => {
  currentPage.value = page
  loadData()
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
  loadData()
}

const loadData = async () => {
  loading.value = true
  setTimeout(() => {
    tableData.value = []
    total.value = 0
    loading.value = false
  }, 500)
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.sale-orders-view {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.filters {
  background: #f5f5f5;
  padding: 16px;
  border-radius: 4px;
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}
</style>