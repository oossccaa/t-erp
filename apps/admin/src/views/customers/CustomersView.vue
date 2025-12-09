<template>
  <div class="customers-view">
    <div class="page-header">
      <h1>客戶管理</h1>
      <el-button type="primary" @click="handleCreate">
        <el-icon><Plus /></el-icon>
        新增客戶
      </el-button>
    </div>

    <div class="filters">
      <el-form :inline="true">
        <el-form-item label="客戶名稱">
          <el-input v-model="filters.name" placeholder="請輸入客戶名稱" clearable />
        </el-form-item>
        <el-form-item>
          <el-button @click="handleSearch">搜尋</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <el-table :data="tableData" :loading="loading" border stripe>
      <el-table-column prop="name" label="客戶名稱" />
      <el-table-column prop="contactPerson" label="聯繫人" />
      <el-table-column prop="phone" label="電話" />
      <el-table-column prop="email" label="電子郵箱" />
      <el-table-column label="操作" width="200">
        <template #default="{ row }">
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

const filters = ref({ name: '' })

const handleCreate = () => {
  ElMessage.info('新增功能開發中')
}

const handleEdit = (row: any) => {
  ElMessage.info('編輯功能開發中')
}

const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm('確定要刪除此客戶嗎？', '提示', {
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
  filters.value = { name: '' }
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
.customers-view {
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