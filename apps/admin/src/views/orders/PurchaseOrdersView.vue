<template>
  <div class="purchase-orders-view">
    <!-- 頁面標題 -->
    <div class="page-header">
      <div class="header-content">
        <h2 class="page-title">進貨單管理</h2>
        <p class="page-description">管理進貨訂單、追蹤進貨狀態及收貨記錄</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="handleCreate">
          <el-icon><Plus /></el-icon>
          新增進貨單
        </el-button>
      </div>
    </div>

    <!-- 搜尋和篩選 -->
    <el-card class="filter-card" shadow="never">
      <el-form :model="filters" :inline="true" class="search-form">
        <el-form-item label="關鍵字">
          <el-input
            v-model="filters.keyword"
            placeholder="單號或供應商名稱"
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
            <el-option label="草稿" value="draft" />
            <el-option label="待審核" value="pending" />
            <el-option label="已審核" value="approved" />
            <el-option label="處理中" value="processing" />
            <el-option label="部分收貨" value="partially_received" />
            <el-option label="已收貨" value="received" />
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

    <!-- 進貨單列表 -->
    <el-card class="table-card" shadow="never">
      <el-table
        v-loading="loading"
        :data="tableData"
        border
        stripe
        style="width: 100%"
      >
        <el-table-column prop="orderNumber" label="單號" width="160" />
        <el-table-column prop="supplierName" label="供應商" min-width="150" />
        <el-table-column prop="orderDate" label="訂單日期" width="120" />
        <el-table-column prop="expectedDeliveryDate" label="預計交貨" width="120" />
        <el-table-column prop="status" label="狀態" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="totalAmount" label="總金額" width="140" align="right">
          <template #default="{ row }">
            <span class="amount-cell">NT$ {{ Number(row.totalAmount || 0).toLocaleString() }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button size="small" @click="handleView(row)">
                <el-icon><View /></el-icon>
                檢視
              </el-button>
              <el-button
                v-if="row.status === 'draft' || row.status === 'pending'"
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
                @click="handleApprove(row)"
              >
                <el-icon><Check /></el-icon>
                審核
              </el-button>
              <el-button
                v-if="['approved', 'processing', 'partially_received'].includes(row.status)"
                size="small"
                type="primary"
                @click="handleReceive(row)"
              >
                <el-icon><Box /></el-icon>
                收貨
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
            </div>
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

    <!-- 進貨單對話框 -->
    <PurchaseOrderDialog
      v-model="dialogVisible"
      :mode="dialogMode"
      :purchase-order="currentOrder"
      @confirm="handleDialogConfirm"
    />

    <!-- 收貨對話框 -->
    <ReceiveItemsDialog
      v-model="receiveDialogVisible"
      :purchase-order="currentOrder"
      @confirm="handleReceiveConfirm"
    />

    <!-- 取消訂單對話框 -->
    <CancelOrderDialog
      v-model="cancelDialogVisible"
      order-type="purchase"
      :order="currentOrder"
      @confirm="handleCancelConfirm"
    />

    <!-- 退回訂單對話框 -->
    <RevertOrderDialog
      v-model="revertDialogVisible"
      order-type="purchase"
      :current-status="currentOrder?.status"
      :target-status="(currentOrder ? getRevertTargetStatus(currentOrder.status) : null) ?? undefined"
      @confirm="handleRevertConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Refresh, View, Edit, Check, Close, Box, Back } from '@element-plus/icons-vue'
import { purchaseOrdersApi, PurchaseOrderStatus, type PurchaseOrder, type CancelOrderParams, type RevertOrderParams } from '@/api/purchase-orders'
import PurchaseOrderDialog from '@/components/purchase-orders/PurchaseOrderDialog.vue'
import ReceiveItemsDialog from '@/components/purchase-orders/ReceiveItemsDialog.vue'
import CancelOrderDialog from '@/components/common/CancelOrderDialog.vue'
import RevertOrderDialog from '@/components/common/RevertOrderDialog.vue'

const loading = ref(false)
const tableData = ref<PurchaseOrder[]>([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const dialogVisible = ref(false)
const dialogMode = ref<'create' | 'edit' | 'view'>('create')
const currentOrder = ref<PurchaseOrder | null>(null)
const receiveDialogVisible = ref(false)
const cancelDialogVisible = ref(false)
const revertDialogVisible = ref(false)
const dateRange = ref<[string, string] | null>(null)

const filters = ref({
  keyword: '',
  status: '' as PurchaseOrderStatus | '',
})

const getStatusType = (status: PurchaseOrderStatus): string => {
  const types: Record<PurchaseOrderStatus, string> = {
    [PurchaseOrderStatus.DRAFT]: 'info',
    [PurchaseOrderStatus.PENDING]: 'warning',
    [PurchaseOrderStatus.APPROVED]: 'success',
    [PurchaseOrderStatus.PROCESSING]: 'primary',
    [PurchaseOrderStatus.PARTIALLY_RECEIVED]: 'primary',
    [PurchaseOrderStatus.RECEIVED]: 'success',
    [PurchaseOrderStatus.COMPLETED]: 'success',
    [PurchaseOrderStatus.CANCELLED]: 'danger',
  }
  return types[status] || ''
}

const getStatusText = (status: PurchaseOrderStatus): string => {
  const texts: Record<PurchaseOrderStatus, string> = {
    [PurchaseOrderStatus.DRAFT]: '草稿',
    [PurchaseOrderStatus.PENDING]: '待審核',
    [PurchaseOrderStatus.APPROVED]: '已審核',
    [PurchaseOrderStatus.PROCESSING]: '處理中',
    [PurchaseOrderStatus.PARTIALLY_RECEIVED]: '部分收貨',
    [PurchaseOrderStatus.RECEIVED]: '已收貨',
    [PurchaseOrderStatus.COMPLETED]: '已完成',
    [PurchaseOrderStatus.CANCELLED]: '已取消',
  }
  return texts[status] || status
}

// 獲取進貨單列表
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

    const response = await purchaseOrdersApi.getPurchaseOrders(query)
    tableData.value = response.data.items || []
    total.value = response.data.total || 0
  } catch (error) {
    ElMessage.error('獲取進貨單列表失敗')
  } finally {
    loading.value = false
  }
}

// 新增進貨單
const handleCreate = () => {
  currentOrder.value = null
  dialogMode.value = 'create'
  dialogVisible.value = true
}

// 檢視進貨單
const handleView = (row: PurchaseOrder) => {
  currentOrder.value = row
  dialogMode.value = 'view'
  dialogVisible.value = true
}

// 編輯進貨單
const handleEdit = (row: PurchaseOrder) => {
  currentOrder.value = row
  dialogMode.value = 'edit'
  dialogVisible.value = true
}

// 審核進貨單
const handleApprove = async (row: PurchaseOrder) => {
  try {
    await ElMessageBox.confirm(
      `確定要審核通過進貨單 "${row.orderNumber}" 嗎？`,
      '審核確認',
      {
        confirmButtonText: '確定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    await purchaseOrdersApi.approvePurchaseOrder(row.id!)
    ElMessage.success('審核成功')
    loadData()
  } catch (error: any) {
    if (error !== 'cancel') {
      // 錯誤訊息已由 request.ts 攔截器處理
    }
  }
}

// 判斷是否可以取消（放寬限制：除了 COMPLETED 和 CANCELLED 都可以取消）
const canCancelOrder = (order: PurchaseOrder): boolean => {
  return !['completed', 'cancelled'].includes(order.status)
}

// 判斷是否可以退回
const canRevertOrder = (order: PurchaseOrder): boolean => {
  return ['pending', 'approved', 'processing'].includes(order.status)
}

// 檢查是否有入庫記錄
const hasReceivedItems = (order: PurchaseOrder | null): boolean => {
  if (!order || !order.items) return false
  return order.items.some(item => (item.receivedQuantity || 0) > 0)
}

// 取得退回目標狀態
const getRevertTargetStatus = (currentStatus: PurchaseOrderStatus): PurchaseOrderStatus | null => {
  const statusMap: Record<string, PurchaseOrderStatus> = {
    'pending': PurchaseOrderStatus.DRAFT,
    'approved': PurchaseOrderStatus.PENDING,
    'processing': PurchaseOrderStatus.APPROVED,
  }
  return statusMap[currentStatus] || null
}

// 取消進貨單（舊的方法，保留給舊按鈕使用）
const handleCancel = async (row: PurchaseOrder) => {
  // 使用新的取消對話框
  currentOrder.value = row
  cancelDialogVisible.value = true
}

// 處理取消訂單（新方法）
const handleCancelOrder = (row: PurchaseOrder) => {
  currentOrder.value = row
  cancelDialogVisible.value = true
}

// 處理退回
const handleRevert = (row: PurchaseOrder) => {
  if (hasReceivedItems(row)) {
    ElMessage.warning('該訂單已有入庫記錄，請使用「取消」功能並選擇扣減庫存')
    return
  }
  currentOrder.value = row
  revertDialogVisible.value = true
}

// 取消確認
const handleCancelConfirm = async (data: CancelOrderParams) => {
  try {
    await purchaseOrdersApi.cancelPurchaseOrder(currentOrder.value!.id!, data)
    ElMessage.success('取消成功')
    cancelDialogVisible.value = false
    loadData()
  } catch (error: any) {
    throw error
  }
}

// 退回確認
const handleRevertConfirm = async (data: RevertOrderParams) => {
  try {
    await purchaseOrdersApi.revertPurchaseOrder(currentOrder.value!.id!, data)
    ElMessage.success('退回成功')
    revertDialogVisible.value = false
    loadData()
  } catch (error: any) {
    throw error
  }
}

// 收貨
const handleReceive = (row: PurchaseOrder) => {
  currentOrder.value = row
  receiveDialogVisible.value = true
}

// 收貨確認
const handleReceiveConfirm = async (items: Array<{ itemId: number; receivedQuantity: number }>) => {
  try {
    await purchaseOrdersApi.receiveItems(currentOrder.value!.id!, items)
    ElMessage.success('收貨成功')
    receiveDialogVisible.value = false
    loadData()
  } catch (error: any) {
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
      await purchaseOrdersApi.createPurchaseOrder(formData)
      ElMessage.success('建立成功')
    } else if (dialogMode.value === 'edit') {
      // 編輯時排除 supplierId，因為後端不允許修改供應商
      const { supplierId, ...updateData } = formData
      await purchaseOrdersApi.updatePurchaseOrder(currentOrder.value!.id!, updateData)
      ElMessage.success('更新成功')
    }

    dialogVisible.value = false
    loadData()
  } catch (error: any) {
    throw error // 讓 dialog 知道失敗，不要關閉
  }
}

// 組件名稱
defineOptions({
  name: 'PurchaseOrders',
})

onMounted(() => {
  loadData()
})
</script>

<style lang="scss" scoped>
.purchase-orders-view {
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
  .purchase-orders-view {
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

.amount-cell {
  white-space: nowrap;
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