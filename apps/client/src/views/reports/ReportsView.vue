<template>
  <div class="reports-view">
    <van-nav-bar :title="$t('home.actions.reports')" />
    
    <!-- 报表类型选择 -->
    <van-tabs v-model:active="activeTab" sticky>
      <van-tab :title="$t('report.sales')" name="sales" />
      <van-tab :title="$t('report.inventory')" name="inventory" />
      <van-tab :title="$t('report.customer')" name="customer" />
    </van-tabs>
    
    <!-- 时间筛选 -->
    <div class="date-filter">
      <van-cell-group>
        <van-cell
          :title="$t('report.dateRange')"
          :value="`${startDate} 至 ${endDate}`"
          is-link
          @click="showDatePicker = true"
        />
      </van-cell-group>
    </div>
    
    <!-- 报表内容 -->
    <div class="reports-content">
      <van-card v-if="activeTab === 'sales'" :title="`${$t('report.sales')} - ${$t('common.stats')}`">
        <div class="report-stats">
          <div class="stat-item">
            <div class="stat-value">NT$ 892K</div>
            <div class="stat-label">{{ $t('report.totalSalesAmount') }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">128</div>
            <div class="stat-label">{{ $t('report.orderCount') }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">NT$ 6,969</div>
            <div class="stat-label">{{ $t('report.avgOrderValue') }}</div>
          </div>
        </div>
      </van-card>
      
      <van-card v-if="activeTab === 'inventory'" :title="`${$t('report.inventory')} - ${$t('common.stats')}`">
        <div class="report-stats">
          <div class="stat-item">
            <div class="stat-value">1,234</div>
            <div class="stat-label">{{ $t('report.totalProducts') }}</div>
          </div>
          <div class="stat-item warning">
            <div class="stat-value">15</div>
            <div class="stat-label">{{ $t('report.warningProducts') }}</div>
          </div>
          <div class="stat-item danger">
            <div class="stat-value">3</div>
            <div class="stat-label">{{ $t('report.outOfStockProducts') }}</div>
          </div>
        </div>
      </van-card>
      
      <van-card v-if="activeTab === 'customer'" :title="`${$t('report.customer')} - ${$t('common.stats')}`">
        <div class="report-stats">
          <div class="stat-item">
            <div class="stat-value">456</div>
            <div class="stat-label">{{ $t('report.totalCustomers') }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">89</div>
            <div class="stat-label">{{ $t('report.activeCustomers') }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">12</div>
            <div class="stat-label">{{ $t('report.vipCustomers') }}</div>
          </div>
        </div>
      </van-card>
    </div>
    
    <!-- 导出按钮 -->
    <div class="export-actions">
      <van-button block type="primary" @click="exportReport">
        {{ $t('report.exportExcel') }}
      </van-button>
    </div>
    
    <!-- 日期选择器 -->
    <van-popup v-model:show="showDatePicker" position="bottom">
      <van-calendar
        v-model:show="showDatePicker"
        type="range"
        @confirm="onDateConfirm"
      />
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { showToast, showSuccessToast, showLoadingToast } from 'vant'
import dayjs from 'dayjs'

const { t } = useI18n()

const activeTab = ref('sales')
const showDatePicker = ref(false)
const startDate = ref(dayjs().subtract(30, 'day').format('YYYY-MM-DD'))
const endDate = ref(dayjs().format('YYYY-MM-DD'))

const onDateConfirm = (values: Date[]) => {
  if (values.length === 2) {
    startDate.value = dayjs(values[0]).format('YYYY-MM-DD')
    endDate.value = dayjs(values[1]).format('YYYY-MM-DD')
  }
  showDatePicker.value = false
}

const exportReport = () => {
  showLoadingToast({
    message: t('common.loading'),
    forbidClick: true,
    duration: 2000,
  })

  setTimeout(() => {
    showSuccessToast(t('report.exportSuccess'))
  }, 2000)
}

defineOptions({
  name: 'Reports',
})
</script>

<style lang="scss" scoped>
.reports-view {
  background: #f7f8fa;
  min-height: 100vh;
}

.date-filter {
  margin-bottom: 16px;
}

.reports-content {
  padding: 0 16px;
  margin-bottom: 80px;
}

.report-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  padding: 16px 0;
  
  .stat-item {
    text-align: center;
    
    .stat-value {
      font-size: 20px;
      font-weight: bold;
      color: #1989fa;
      margin-bottom: 4px;
    }
    
    .stat-label {
      font-size: 12px;
      color: #646566;
    }
    
    &.warning .stat-value {
      color: #ff976a;
    }
    
    &.danger .stat-value {
      color: #ee0a24;
    }
  }
}

.export-actions {
  position: fixed;
  bottom: 60px;
  left: 16px;
  right: 16px;
  
  .van-button {
    height: 50px;
    font-size: 16px;
  }
}
</style>