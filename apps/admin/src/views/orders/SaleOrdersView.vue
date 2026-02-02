<template>
  <div class="sale-orders-view">
    <!-- 頁面標題 -->
    <div class="page-header">
      <div class="header-content">
        <h2 class="page-title">銷貨單管理</h2>
        <p class="page-description">管理銷售訂單、追蹤出貨狀態及物流資訊</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="handleCreate">
          <el-icon><Plus /></el-icon>
          新增銷貨單
        </el-button>
      </div>
    </div>

    <!-- 搜尋和篩選 -->
    <el-card class="filter-card" shadow="never">
      <el-form :model="filters" :inline="true" class="search-form">
        <el-form-item label="關鍵字">
          <el-input
            v-model="filters.keyword"
            placeholder="單號或客戶名稱"
            clearable
            @clear="handleSearch"
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="狀態">
          <el-select v-model="filters.status" placeholder="請選擇狀態" clearable style="width: 150px">
            <el-option label="待確認" value="pending" />
            <el-option label="已確認" value="confirmed" />
            <el-option label="處理中" value="processing" />
            <el-option label="已出貨" value="shipped" />
            <el-option label="已送達" value="delivered" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>

        <el-form-item label="訂單日期">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="開始日期"
            end-placeholder="結束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 260px"
          />
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

    <!-- 銷貨單列表 -->
    <el-card class="table-card" shadow="never">
      <el-table
        v-loading="loading"
        :data="tableData"
        border
        stripe
        style="width: 100%"
      >
        <el-table-column prop="orderNumber" label="單號" width="160" />
        <el-table-column label="客戶" min-width="150">
          <template #default="{ row }">
            {{ row.customer?.name || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="orderDate" label="訂單日期" width="120" />
        <el-table-column prop="expectedShippingDate" label="預計出貨" width="120" />
        <el-table-column prop="status" label="狀態" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="totalAmount" label="總金額" width="120" align="right">
          <template #default="{ row }">
            NT$ {{ row.totalAmount?.toLocaleString() || '0' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="320" fixed="right">
          <template #default="{ row }">
            <el-button-group>
              <el-button size="small" @click="handleView(row)">
                <el-icon><View /></el-icon>
                檢視
              </el-button>
              <el-button
                v-if="row.status === 'pending'"
                size="small"
                @click="handleEdit(row)"
              >
                <el-icon><Edit /></el-icon>
                編輯
              </el-button>
              <el-button
                v-if="row.status === 'pending'"
                size="small"
                type="success"
                @click="handleConfirm(row)"
              >
                <el-icon><Check /></el-icon>
                確認
              </el-button>
              <el-button
                v-if="row.status === 'confirmed' || row.status === 'processing'"
                size="small"
                type="primary"
                @click="handleShip(row)"
              >
                <el-icon><Finished /></el-icon>
                出貨
              </el-button>
              <el-button
                v-if="row.status === 'shipped'"
                size="small"
                type="success"
                @click="handleMarkDelivered(row)"
              >
                <el-icon><Van /></el-icon>
                送達
              </el-button>
              <el-button
                v-if="canRevertOrder(row)"
                size="small"
                type="warning"
                @click="handleRevert(row)"
              >
                <el-icon><Back /></el-icon>
                退回
              </el-button>
              <el-button
                v-if="canCancelOrder(row)"
                size="small"
                type="danger"
                @click="handleCancelOrder(row)"
              >
                <el-icon><Close /></el-icon>
                取消
              </el-button>
            </el-button-group>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </el-card>

    <!-- 銷貨單對話框 -->
    <SaleOrderDialog
      v-model="dialogVisible"
      :mode="dialogMode"
      :sale-order="currentOrder"
      @confirm="handleDialogConfirm"
    />

    <!-- 出貨對話框 -->
    <ShipOrderDialog
      v-model="shipDialogVisible"
      :order-id="currentShipOrder?.id || null"
      :order-items="currentShipOrder?.items || []"
      @confirm="handleShipConfirm"
    />

    <!-- 取消訂單對話框 -->
    <CancelOrderDialog
      v-model="cancelDialogVisible"
      order-type="sale"
      :order="currentOrder"
      @confirm="handleCancelConfirm"
    />

    <!-- 退回訂單對話框 -->
    <RevertOrderDialog
      v-model="revertDialogVisible"
      order-type="sale"
      :current-status="currentOrder?.status"
      :target-status="(currentOrder ? getRevertTargetStatus(currentOrder.status) : null) ?? undefined"
      @confirm="handleRevertConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Refresh, View, Edit, Check, Close, Van, Finished, Back } from '@element-plus/icons-vue'
import { saleOrdersApi, SaleOrderStatus, type SaleOrder, type CancelOrderParams, type RevertOrderParams } from '@/api/sale-orders'
import SaleOrderDialog from '@/components/sale-orders/SaleOrderDialog.vue'
import ShipOrderDialog from '@/components/sale-orders/ShipOrderDialog.vue'
import CancelOrderDialog from '@/components/common/CancelOrderDialog.vue'
import RevertOrderDialog from '@/components/common/RevertOrderDialog.vue'

const loading = ref(false)
const tableData = ref<SaleOrder[]>([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const dialogVisible = ref(false)
const dialogMode = ref<'create' | 'edit' | 'view'>('create')
const currentOrder = ref<SaleOrder | null>(null)
const dateRange = ref<[string, string] | null>(null)
const shipDialogVisible = ref(false)
const currentShipOrder = ref<SaleOrder | null>(null)
const cancelDialogVisible = ref(false)
const revertDialogVisible = ref(false)

const filters = ref({
  keyword: '',
  status: '' as SaleOrderStatus | '',
})

const getStatusType = (status: SaleOrderStatus): string => {
  const types: Record<SaleOrderStatus, string> = {
    [SaleOrderStatus.DRAFT]: 'info',
    [SaleOrderStatus.PENDING]: 'warning',
    [SaleOrderStatus.CONFIRMED]: '',
    [SaleOrderStatus.PROCESSING]: 'primary',
    [SaleOrderStatus.SHIPPED]: 'primary',
    [SaleOrderStatus.DELIVERED]: 'success',
    [SaleOrderStatus.COMPLETED]: 'success',
    [SaleOrderStatus.CANCELLED]: 'danger',
  }
  return types[status] || ''
}

const getStatusText = (status: SaleOrderStatus): string => {
  const texts: Record<SaleOrderStatus, string> = {
    [SaleOrderStatus.DRAFT]: '草稿',
    [SaleOrderStatus.PENDING]: '待確認',
    [SaleOrderStatus.CONFIRMED]: '已確認',
    [SaleOrderStatus.PROCESSING]: '處理中',
    [SaleOrderStatus.SHIPPED]: '已出貨',
    [SaleOrderStatus.DELIVERED]: '已送達',
    [SaleOrderStatus.COMPLETED]: '已完成',
    [SaleOrderStatus.CANCELLED]: '已取消',
  }
  return texts[status] || status
}

// 獲取銷貨單列表
const loadData = async () => {
  loading.value = true
  try {
    const query: any = {
      page: currentPage.value,
      limit: pageSize.value,
      keyword: filters.value.keyword || undefined,
      status: filters.value.status || undefined,
      startDate: dateRange.value?.[0] || undefined,
      endDate: dateRange.value?.[1] || undefined,
    }

    const response = await saleOrdersApi.getSaleOrders(query)
    tableData.value = response.data.items || []
    total.value = response.data.total || 0
  } catch (error) {
    ElMessage.error('獲取銷貨單列表失敗')
  } finally {
    loading.value = false
  }
}

// 新增銷貨單
const handleCreate = () => {
  currentOrder.value = null
  dialogMode.value = 'create'
  dialogVisible.value = true
}

// 檢視銷貨單
const handleView = (row: SaleOrder) => {
  currentOrder.value = row
  dialogMode.value = 'view'
  dialogVisible.value = true
}

// 編輯銷貨單
const handleEdit = (row: SaleOrder) => {
  currentOrder.value = row
  dialogMode.value = 'edit'
  dialogVisible.value = true
}

// 確認銷貨單
const handleConfirm = async (row: SaleOrder) => {
  try {
    await ElMessageBox.confirm(
      `確定要確認銷貨單 "${row.orderNumber}" 嗎？`,
      '確認',
      {
        confirmButtonText: '確定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    await saleOrdersApi.confirmSaleOrder(row.id!)
    ElMessage.success('確認成功')
    loadData()
  } catch (error: any) {
    if (error !== 'cancel') {
      // 錯誤訊息已由 request.ts 攔截器處理
    }
  }
}

// 出貨
const handleShip = async (row: SaleOrder) => {
  try {
    // 獲取完整的訂單詳情（包含 items）
    const response = await saleOrdersApi.getSaleOrder(row.id!)
    currentShipOrder.value = response.data
    shipDialogVisible.value = true
  } catch (error: any) {
    ElMessage.error('獲取訂單詳情失敗')
  }
}

// 確認出貨
const handleShipConfirm = async (items: Array<{ itemId: number; shippedQuantity: number }>) => {
  try {
    await saleOrdersApi.shipItems(currentShipOrder.value!.id!, items)
    ElMessage.success('出貨成功')
    shipDialogVisible.value = false
    loadData()
  } catch (error: any) {
    // 錯誤訊息已由 request.ts 攔截器處理
    throw error
  }
}

// 標記為已送達
const handleMarkDelivered = async (row: SaleOrder) => {
  try {
    await ElMessageBox.confirm(
      `確定要標記銷貨單 "${row.orderNumber}" 為已送達嗎？`,
      '確認送達',
      {
        confirmButtonText: '確定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    await saleOrdersApi.markDelivered(row.id!)
    ElMessage.success('標記成功')
    loadData()
  } catch (error: any) {
    if (error !== 'cancel') {
      // 錯誤訊息已由 request.ts 攔截器處理
    }
  }
}

// 判斷是否可以取消（放寬限制：除了 COMPLETED、CANCELLED、RETURNED 都可以取消）
const canCancelOrder = (order: SaleOrder): boolean => {
  return !['completed', 'cancelled', 'returned'].includes(order.status)
}

// 判斷是否可以退回（只有已確認和處理中可以退回）
const canRevertOrder = (order: SaleOrder): boolean => {
  return ['confirmed', 'processing'].includes(order.status)
}

// 檢查是否有出貨記錄
const hasShippedItems = (order: SaleOrder | null): boolean => {
  if (!order || !order.items) return false
  return order.items.some(item => (item.shippedQuantity || 0) > 0)
}

// 取得退回目標狀態
const getRevertTargetStatus = (currentStatus: SaleOrderStatus): SaleOrderStatus | null => {
  const statusMap: Record<string, SaleOrderStatus> = {
    'confirmed': SaleOrderStatus.PENDING,
    'processing': SaleOrderStatus.CONFIRMED,
  }
  return statusMap[currentStatus] || null
}

// 取消銷貨單（舊的方法，保留給舊按鈕使用）
const handleCancel = async (row: SaleOrder) => {
  // 使用新的取消對話框
  currentOrder.value = row
  cancelDialogVisible.value = true
}

// 處理取消訂單（新方法）
const handleCancelOrder = (row: SaleOrder) => {
  currentOrder.value = row
  cancelDialogVisible.value = true
}

// 處理退回
const handleRevert = (row: SaleOrder) => {
  if (hasShippedItems(row)) {
    ElMessage.warning('該訂單已有出貨記錄，請使用「取消」功能並選擇回補庫存')
    return
  }
  currentOrder.value = row
  revertDialogVisible.value = true
}

// 取消確認
const handleCancelConfirm = async (data: CancelOrderParams) => {
  try {
    await saleOrdersApi.cancelSaleOrder(currentOrder.value!.id!, data)
    ElMessage.success('取消成功')
    cancelDialogVisible.value = false
    loadData()
  } catch (error: any) {
    ElMessage.error(error.message || '取消失敗')
    throw error
  }
}

// 退回確認
const handleRevertConfirm = async (data: RevertOrderParams) => {
  try {
    await saleOrdersApi.revertSaleOrder(currentOrder.value!.id!, data)
    ElMessage.success('退回成功')
    revertDialogVisible.value = false
    loadData()
  } catch (error: any) {
    ElMessage.error(error.message || '退回失敗')
    throw error
  }
}

// 搜尋
const handleSearch = () => {
  currentPage.value = 1
  loadData()
}

// 重置
const handleReset = () => {
  filters.value = { keyword: '', status: '' }
  dateRange.value = null
  currentPage.value = 1
  loadData()
}

// 頁碼變更
const handlePageChange = (page: number) => {
  currentPage.value = page
  loadData()
}

// 每頁數量變更
const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
  loadData()
}

// 對話框確認
const handleDialogConfirm = async (formData: any) => {
  try {
    if (dialogMode.value === 'create') {
      await saleOrdersApi.createSaleOrder(formData)
      ElMessage.success('建立成功')
    } else if (dialogMode.value === 'edit') {
      await saleOrdersApi.updateSaleOrder(currentOrder.value!.id!, formData)
      ElMessage.success('更新成功')
    }

    dialogVisible.value = false
    loadData()
  } catch (error: any) {
    ElMessage.error(error.message || (dialogMode.value === 'create' ? '建立失敗' : '更新失敗'))
    throw error // 讓 dialog 知道失敗，不要關閉
  }
}

// 組件名稱
defineOptions({
  name: 'SaleOrders',
})

onMounted(() => {
  loadData()
})
</script>

<style lang="scss" scoped>
.sale-orders-view {
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

.pagination {
  margin-top: 16px;
  text-align: right;
}

// 響應式設計
@media (max-width: 768px) {
  .sale-orders-view {
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