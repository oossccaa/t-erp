<template>
  <div class="inventory-view">
    <div class="page-header">
      <h1>庫存管理</h1>
      <div>
        <el-button type="primary" @click="handleAdjustment">
          <el-icon><Edit /></el-icon>
          庫存調整
        </el-button>
        <el-button @click="handleExport">
          <el-icon><Download /></el-icon>
          匯出
        </el-button>
      </div>
    </div>

    <div class="stats-cards">
      <el-row :gutter="16">
        <el-col :span="6">
          <el-card class="stats-card">
            <div class="stats-content">
              <div class="stats-value">0</div>
              <div class="stats-label">總商品數</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stats-card">
            <div class="stats-content">
              <div class="stats-value">0</div>
              <div class="stats-label">低庫存警告</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stats-card">
            <div class="stats-content">
              <div class="stats-value">0</div>
              <div class="stats-label">缺貨商品</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stats-card">
            <div class="stats-content">
              <div class="stats-value">0</div>
              <div class="stats-label">總庫存值</div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <div class="filters">
      <el-form :inline="true">
        <el-form-item label="商品名稱">
          <el-input v-model="filters.productName" placeholder="請輸入商品名稱" clearable />
        </el-form-item>
        <el-form-item label="分類">
          <el-select v-model="filters.category" placeholder="選擇分類" clearable>
            <el-option label="全部" value="" />
          </el-select>
        </el-form-item>
        <el-form-item label="庫存狀態">
          <el-select v-model="filters.stockStatus" placeholder="選擇狀態" clearable>
            <el-option label="正常" value="normal" />
            <el-option label="低庫存" value="low" />
            <el-option label="缺貨" value="out" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button @click="handleSearch">搜尋</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <el-table :data="tableData" :loading="loading" border stripe>
      <el-table-column prop="productName" label="商品名稱" />
      <el-table-column prop="sku" label="SKU" />
      <el-table-column prop="category" label="分類" />
      <el-table-column prop="currentStock" label="目前庫存">
        <template #default="{ row }">
          <span :class="getStockClass(row)">{{ row.currentStock }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="minStock" label="最低庫存" />
      <el-table-column prop="unit" label="單位" />
      <el-table-column prop="unitPrice" label="單價" />
      <el-table-column prop="totalValue" label="庫存總值" />
      <el-table-column label="操作" width="150">
        <template #default="{ row }">
          <el-button size="small" @click="handleViewTransactions(row)">異動記錄</el-button>
          <el-button size="small" @click="handleAdjust(row)">調整</el-button>
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
import { ElMessage } from 'element-plus'
import { Edit, Download } from '@element-plus/icons-vue'

const loading = ref(false)
const tableData = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

const filters = ref({
  productName: '',
  category: '',
  stockStatus: ''
})

const getStockClass = (row: any) => {
  if (row.currentStock <= 0) return 'stock-out'
  if (row.currentStock <= row.minStock) return 'stock-low'
  return 'stock-normal'
}

const handleAdjustment = () => {
  ElMessage.info('庫存調整功能開發中')
}

const handleExport = () => {
  ElMessage.info('匯出功能開發中')
}

const handleViewTransactions = (row: any) => {
  ElMessage.info('查看異動記錄功能開發中')
}

const handleAdjust = (row: any) => {
  ElMessage.info('調整庫存功能開發中')
}

const handleSearch = () => {
  currentPage.value = 1
  loadData()
}

const handleReset = () => {
  filters.value = {
    productName: '',
    category: '',
    stockStatus: ''
  }
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
.inventory-view {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.stats-cards {
  margin-bottom: 20px;
}

.stats-card {
  text-align: center;
}

.stats-content {
  padding: 10px;
}

.stats-value {
  font-size: 24px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 5px;
}

.stats-label {
  color: #666;
  font-size: 14px;
}

.filters {
  background: #f5f5f5;
  padding: 16px;
  border-radius: 4px;
  margin-bottom: 20px;
}

.stock-normal {
  color: #67c23a;
}

.stock-low {
  color: #e6a23c;
}

.stock-out {
  color: #f56c6c;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}
</style>