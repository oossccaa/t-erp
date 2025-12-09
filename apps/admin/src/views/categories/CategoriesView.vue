<template>
  <div class="categories-view">
    <div class="page-header">
      <h1>分類管理</h1>
      <el-button type="primary" @click="handleCreate">
        <el-icon><Plus /></el-icon>
        新增分類
      </el-button>
    </div>

    <el-table :data="tableData" :loading="loading" border stripe row-key="id" default-expand-all>
      <el-table-column prop="name" label="分類名稱" />
      <el-table-column prop="description" label="描述" />
      <el-table-column label="操作" width="200">
        <template #default="{ row }">
          <el-button size="small" @click="handleEdit(row)">編輯</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row)">刪除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'

const loading = ref(false)
const tableData = ref([])

const handleCreate = () => {
  ElMessage.info('新增功能開發中')
}

const handleEdit = (row: any) => {
  ElMessage.info('編輯功能開發中')
}

const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm('確定要刪除此分類嗎？', '提示', {
      confirmButtonText: '確定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    ElMessage.success('刪除成功')
  } catch {
    // 用戶取消
  }
}

const loadData = async () => {
  loading.value = true
  setTimeout(() => {
    tableData.value = []
    loading.value = false
  }, 500)
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.categories-view {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
</style>