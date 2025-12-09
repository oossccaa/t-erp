<template>
  <div class="inventory-view">
    <!-- 顶部统计 -->
    <div class="inventory-stats">
      <van-grid :column-num="3" :border="false">
        <van-grid-item>
          <div class="stat-item">
            <div class="stat-value">1,234</div>
            <div class="stat-label">{{ $t('product.products') }}{{ $t('common.total') }}</div>
          </div>
        </van-grid-item>
        <van-grid-item>
          <div class="stat-item warning">
            <div class="stat-value">15</div>
            <div class="stat-label">{{ $t('inventory.lowStock') }}</div>
          </div>
        </van-grid-item>
        <van-grid-item>
          <div class="stat-item danger">
            <div class="stat-value">3</div>
            <div class="stat-label">{{ $t('inventory.outOfStock') }}</div>
          </div>
        </van-grid-item>
      </van-grid>
    </div>
    
    <!-- 搜索栏 -->
    <van-search
      v-model="searchValue"
      :placeholder="$t('inventory.searchPlaceholder')"
      @search="onSearch"
    />
    
    <!-- 库存列表 -->
    <div class="inventory-content">
      <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
        <van-list
          v-model:loading="loading"
          :finished="finished"
          :finished-text="$t('common.noMore')"
          @load="onLoad"
        >
          <van-card
            v-for="item in inventoryList"
            :key="item.id"
            class="inventory-card"
          >
            <template #header>
              <div class="inventory-header">
                <div class="product-info">
                  <h3 class="product-name">{{ item.name }}</h3>
                  <p class="product-sku">{{ item.sku }}</p>
                </div>
                <van-tag 
                  :type="getStockStatusType(item)"
                  size="medium"
                >
                  {{ getStockStatusText(item) }}
                </van-tag>
              </div>
            </template>
            
            <template #default>
              <div class="stock-info">
                <div class="stock-numbers">
                  <div class="stock-item">
                    <span class="label">{{ $t('product.currentStock') }}</span>
                    <span class="value current">{{ item.currentStock }}</span>
                  </div>
                  <div class="stock-item">
                    <span class="label">{{ $t('inventory.available') }}</span>
                    <span class="value safe">{{ item.safeStock }}</span>
                  </div>
                  <div class="stock-item">
                    <span class="label">{{ $t('product.minStock') }}</span>
                    <span class="value min">{{ item.minStock }}</span>
                  </div>
                </div>
                
                <div class="stock-progress">
                  <van-progress
                    :percentage="getStockPercentage(item)"
                    :color="getProgressColor(item)"
                    :show-pivot="false"
                    stroke-width="6"
                  />
                </div>
              </div>
            </template>
            
            <template #footer>
              <div class="inventory-actions">
                <van-button size="mini" plain @click="adjustStock(item)">
                  {{ $t('inventory.adjust') }}
                </van-button>
                <van-button size="mini" type="primary" @click="viewHistory(item)">
                  {{ $t('inventory.record') }}
                </van-button>
              </div>
            </template>
          </van-card>
        </van-list>
      </van-pull-refresh>
    </div>
    
    <!-- 库存调整弹窗 -->
    <van-popup v-model:show="showAdjustPopup" position="bottom" round>
      <div class="adjust-popup">
        <div class="popup-header">
          <h3>{{ $t('inventory.adjust') }} - {{ selectedItem?.name }}</h3>
        </div>
        
        <van-form @submit="submitAdjustment">
          <van-cell-group inset>
            <van-field
              v-model="adjustForm.quantity"
              name="quantity"
              type="number"
              :label="$t('order.create.quantity')"
              :placeholder="`${$t('common.submit')}${$t('order.create.quantity')}`"
              :rules="[{ required: true, message: `${$t('common.submit')}${$t('order.create.quantity')}` }]"
            />
            <van-field
              name="type"
              :label="$t('inventory.adjust')"
              readonly
              :value="adjustForm.type === 'in' ? $t('common.add') : $t('common.delete')"
              is-link
              @click="showTypePicker = true"
            />
            <van-field
              v-model="adjustForm.reason"
              name="reason"
              label="調整原因"
              :placeholder="`${$t('common.submit')}調整原因`"
            />
          </van-cell-group>

          <div class="popup-actions">
            <van-button block @click="showAdjustPopup = false">{{ $t('common.cancel') }}</van-button>
            <van-button block type="primary" native-type="submit">{{ $t('common.confirm') }}</van-button>
          </div>
        </van-form>
      </div>
    </van-popup>
    
    <!-- 类型选择器 -->
    <van-popup v-model:show="showTypePicker" position="bottom">
      <van-picker
        :columns="typeColumns"
        @confirm="onTypeConfirm"
        @cancel="showTypePicker = false"
      />
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { showToast, showSuccessToast, showLoadingToast, showConfirmDialog } from 'vant'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

// 搜索
const searchValue = ref('')

// 列表状态
const loading = ref(false)
const finished = ref(false)
const refreshing = ref(false)

// 弹窗状态
const showAdjustPopup = ref(false)
const showTypePicker = ref(false)
const selectedItem = ref<any>(null)

// 调整表单
const adjustForm = reactive({
  quantity: '',
  type: 'in',
  reason: '',
})

// 类型选择器数据
const typeColumns = ref([
  { text: '', value: 'in' },
  { text: '', value: 'out' },
])

// 初始化 typeColumns 文本
typeColumns.value[0].text = t('common.add')
typeColumns.value[1].text = t('common.delete')

// 库存数据
const inventoryList = ref([
  {
    id: 1,
    name: 'iPhone 15 Pro',
    sku: 'PHONE001',
    currentStock: 8,
    safeStock: 15,
    minStock: 10,
  },
  {
    id: 2,
    name: 'MacBook Air M2',
    sku: 'LAPTOP001',
    currentStock: 3,
    safeStock: 10,
    minStock: 5,
  },
  {
    id: 3,
    name: 'AirPods Pro',
    sku: 'AUDIO001',
    currentStock: 25,
    safeStock: 30,
    minStock: 20,
  },
  {
    id: 4,
    name: '原子笔',
    sku: 'PEN001',
    currentStock: 45,
    safeStock: 80,
    minStock: 100,
  },
])

// 获取库存状态类型
const getStockStatusType = (item: any) => {
  if (item.currentStock <= 0) return 'danger'
  if (item.currentStock <= item.minStock) return 'danger'
  if (item.currentStock <= item.safeStock) return 'warning'
  return 'success'
}

// 获取库存状态文字
const getStockStatusText = (item: any) => {
  if (item.currentStock <= 0) return t('inventory.outOfStock')
  if (item.currentStock <= item.minStock) return t('inventory.lowStock')
  if (item.currentStock <= item.safeStock) return t('home.inventoryWarning')
  return t('home.stockSufficient')
}

// 获取库存百分比
const getStockPercentage = (item: any) => {
  if (item.safeStock <= 0) return 0
  return Math.min((item.currentStock / item.safeStock) * 100, 100)
}

// 获取进度条颜色
const getProgressColor = (item: any) => {
  if (item.currentStock <= item.minStock) return '#ee0a24'
  if (item.currentStock <= item.safeStock) return '#ff976a'
  return '#07c160'
}

// 搜索
const onSearch = (value: string) => {
  console.log(t('common.search') + ':', value)
}

// 下拉刷新
const onRefresh = () => {
  setTimeout(() => {
    refreshing.value = false
    showToast(t('common.refreshSuccess'))
  }, 1000)
}

// 加载更多
const onLoad = () => {
  setTimeout(() => {
    loading.value = false
    finished.value = true
  }, 1000)
}

// 调整库存
const adjustStock = (item: any) => {
  selectedItem.value = item
  adjustForm.quantity = ''
  adjustForm.type = 'in'
  adjustForm.reason = ''
  showAdjustPopup.value = true
}

// 查看历史记录
const viewHistory = (item: any) => {
  showToast(`${t('common.viewAll')} ${item.name} ${t('inventory.record')}`)
}

// 类型确认
const onTypeConfirm = (value: any) => {
  adjustForm.type = value.value
  showTypePicker.value = false
}

// 提交调整
const submitAdjustment = async () => {
  try {
    await showConfirmDialog({
      title: t('common.confirm'),
      message: `${t('common.confirm')}${adjustForm.type === 'in' ? t('common.add') : t('common.delete')} ${adjustForm.quantity} ${t('product.product')} ${selectedItem.value?.name}?`,
    })

    // 更新库存
    if (selectedItem.value) {
      const adjustment = parseInt(adjustForm.quantity)
      if (adjustForm.type === 'in') {
        selectedItem.value.currentStock += adjustment
      } else {
        selectedItem.value.currentStock = Math.max(0, selectedItem.value.currentStock - adjustment)
      }
    }

    showAdjustPopup.value = false
    showSuccessToast(t('inventory.adjust') + t('common.success'))
  } catch {
    // 用户取消
  }
}

// 组件名称
defineOptions({
  name: 'Inventory',
})
</script>

<style lang="scss" scoped>
.inventory-view {
  background: #f7f8fa;
  min-height: 100vh;
}

.inventory-stats {
  background: white;
  padding: 16px 0;
  margin-bottom: 8px;
  
  .stat-item {
    text-align: center;
    
    .stat-value {
      font-size: 24px;
      font-weight: bold;
      color: #07c160;
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

.inventory-content {
  padding: 0 16px;
}

.inventory-card {
  margin-bottom: 12px;
  
  :deep(.van-card__header) {
    padding: 16px 16px 8px 16px;
  }
  
  :deep(.van-card__body) {
    padding: 0 16px;
  }
  
  :deep(.van-card__footer) {
    padding: 8px 16px 16px 16px;
  }
}

.inventory-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  
  .product-info {
    .product-name {
      font-size: 16px;
      font-weight: 600;
      color: #323233;
      margin: 0 0 4px 0;
    }
    
    .product-sku {
      font-size: 12px;
      color: #969799;
      margin: 0;
    }
  }
}

.stock-info {
  margin: 12px 0;
  
  .stock-numbers {
    display: flex;
    justify-content: space-between;
    margin-bottom: 12px;
    
    .stock-item {
      text-align: center;
      
      .label {
        display: block;
        font-size: 12px;
        color: #646566;
        margin-bottom: 4px;
      }
      
      .value {
        font-size: 16px;
        font-weight: 600;
        
        &.current {
          color: #1989fa;
        }
        
        &.safe {
          color: #ff976a;
        }
        
        &.min {
          color: #ee0a24;
        }
      }
    }
  }
  
  .stock-progress {
    margin-top: 8px;
  }
}

.inventory-actions {
  display: flex;
  gap: 8px;
}

// 弹窗样式
.adjust-popup {
  padding: 20px;
  
  .popup-header {
    text-align: center;
    margin-bottom: 20px;
    
    h3 {
      font-size: 18px;
      font-weight: 600;
      color: #323233;
      margin: 0;
    }
  }
  
  .popup-actions {
    display: flex;
    gap: 12px;
    margin-top: 20px;
  }
}
</style>