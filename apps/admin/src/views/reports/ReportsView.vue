<template>
  <div class="reports-view">
    <div class="page-header">
      <h1>報表中心</h1>
    </div>

    <el-row :gutter="20">
      <el-col :span="8">
        <el-card class="report-card" @click="handleSalesReport">
          <div class="report-icon">
            <el-icon size="40"><TrendCharts /></el-icon>
          </div>
          <div class="report-title">銀售報表</div>
          <div class="report-desc">檢視銀售資料和趋勢分析</div>
        </el-card>
      </el-col>
      
      <el-col :span="8">
        <el-card class="report-card" @click="handlePurchaseReport">
          <div class="report-icon">
            <el-icon size="40"><ShoppingCart /></el-icon>
          </div>
          <div class="report-title">採購報表</div>
          <div class="report-desc">檢視採購資料和供應商分析</div>
        </el-card>
      </el-col>
      
      <el-col :span="8">
        <el-card class="report-card" @click="handleInventoryReport">
          <div class="report-icon">
            <el-icon size="40"><Grid /></el-icon>
          </div>
          <div class="report-title">庫存報表</div>
          <div class="report-desc">檢視庫存週轉和庫存分析</div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="8">
        <el-card class="report-card" @click="handleFinancialReport">
          <div class="report-icon">
            <el-icon size="40"><Money /></el-icon>
          </div>
          <div class="report-title">財務報表</div>
          <div class="report-desc">檢視收入支出和利潤分析</div>
        </el-card>
      </el-col>
      
      <el-col :span="8">
        <el-card class="report-card" @click="handleCustomerReport">
          <div class="report-icon">
            <el-icon size="40"><User /></el-icon>
          </div>
          <div class="report-title">客戶報表</div>
          <div class="report-desc">檢視客戶資料和行為分析</div>
        </el-card>
      </el-col>
      
      <el-col :span="8">
        <el-card class="report-card" @click="handleProductReport">
          <div class="report-icon">
            <el-icon size="40"><Box /></el-icon>
          </div>
          <div class="report-title">商品報表</div>
          <div class="report-desc">檢視商品銀售和庫存分析</div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { TrendCharts, ShoppingCart, Grid, Money, User, Box } from '@element-plus/icons-vue'

const router = useRouter()

const handleSalesReport = () => {
  router.push('/sale-orders')
}

const handlePurchaseReport = () => {
  router.push('/purchase-orders')
}

const handleInventoryReport = () => {
  router.push('/inventory')
}

const handleFinancialReport = () => {
  ElMessage.info('財務報表功能開發中')
}

const handleCustomerReport = () => {
  ElMessage.info('客戶報表功能開發中')
}

const handleProductReport = () => {
  ElMessage.info('商品報表功能開發中')
}
</script>

<style scoped>
.reports-view {
  padding: 20px;
}

.page-header {
  margin-bottom: 30px;
}

.report-card {
  text-align: center;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  height: 200px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.report-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.report-icon {
  color: #409eff;
  margin-bottom: 15px;
}

.report-title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 8px;
  color: #303133;
}

.report-desc {
  color: #606266;
  font-size: 14px;
  line-height: 1.4;
}
</style>