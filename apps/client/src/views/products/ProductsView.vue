<template>
  <div class="products-view">
    <!-- 顶部搜索栏 -->
    <van-search
      v-model="searchValue"
      :placeholder="$t('product.searchPlaceholder')"
      @search="onSearch"
      @clear="onClear"
      show-action
    >
      <template #action>
        <van-icon name="filter-o" size="18" @click="showFilter = true" />
      </template>
    </van-search>
    
    <!-- 产品列表 -->
    <div class="products-content">
      <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
        <van-list
          v-model:loading="loading"
          :finished="finished"
          :finished-text="$t('common.noMore')"
          @load="onLoad"
        >
          <div class="product-grid">
            <div 
              v-for="product in products"
              :key="product.id"
              class="product-card"
              @click="viewProductDetail(product)"
            >
              <div class="product-image">
                <van-image
                  :src="product.image"
                  fit="cover"
                  :loading-icon="'goods-collect-o'"
                >
                  <template #error>
                    <van-icon name="goods-collect-o" size="40" />
                  </template>
                </van-image>
                
                <div v-if="product.stock <= product.minStock" class="stock-warning">
                  <van-tag type="danger" size="medium">{{ $t('product.stockWarning') }}</van-tag>
                </div>
              </div>
              
              <div class="product-info">
                <h3 class="product-name">{{ product.name }}</h3>
                <p class="product-sku">SKU: {{ product.sku }}</p>
                <div class="product-price">
                  <span class="current-price">NT$ {{ formatMoney(product.price) }}</span>
                  <span v-if="product.originalPrice && product.originalPrice > product.price" 
                        class="original-price">
                    NT$ {{ formatMoney(product.originalPrice) }}
                  </span>
                </div>
                <div class="product-stock">
                  <span class="stock-label">{{ $t('product.stock') }}:</span>
                  <span :class="['stock-value', { 'low-stock': product.stock <= product.minStock }]">
                    {{ product.stock }}
                  </span>
                </div>
              </div>
              
              <div class="product-actions">
                <van-button size="mini" plain @click.stop="editProduct(product)">
                  {{ $t('common.edit') }}
                </van-button>
                <van-button size="mini" type="primary" @click.stop="addToOrder(product)">
                  {{ $t('product.addToOrder') }}
                </van-button>
              </div>
            </div>
          </div>
        </van-list>
      </van-pull-refresh>
      
      <van-empty v-if="!loading && !products.length" :description="$t('product.noProducts')" />
    </div>
    
    <!-- 筛选弹窗 -->
    <van-popup v-model:show="showFilter" position="right" :style="{ width: '80%', height: '100%' }">
      <div class="filter-panel">
        <van-nav-bar
          :title="$t('product.filter.title')"
          :left-text="$t('product.filter.reset')"
          :right-text="$t('product.filter.apply')"
          @click-left="resetFilter"
          @click-right="applyFilter"
        />
        
        <van-form>
          <van-cell-group :title="$t('product.filter.priceRange')">
            <van-field
              v-model="filterForm.minPrice"
              type="number"
              :label="$t('product.filter.minPrice')"
              :placeholder="$t('product.filter.pleaseEnterMinPrice')"
            />
            <van-field
              v-model="filterForm.maxPrice"
              type="number"
              :label="$t('product.filter.maxPrice')"
              :placeholder="$t('product.filter.pleaseEnterMaxPrice')"
            />
          </van-cell-group>
          
          <van-cell-group :title="$t('product.filter.stockStatus')">
            <van-radio-group v-model="filterForm.stockStatus">
              <van-cell-group>
                <van-cell :title="$t('product.filter.all')" clickable @click="filterForm.stockStatus = 'all'">
                  <template #right-icon>
                    <van-radio name="all" />
                  </template>
                </van-cell>
                <van-cell :title="$t('product.filter.inStock')" clickable @click="filterForm.stockStatus = 'in-stock'">
                  <template #right-icon>
                    <van-radio name="in-stock" />
                  </template>
                </van-cell>
                <van-cell :title="$t('product.filter.lowStock')" clickable @click="filterForm.stockStatus = 'low-stock'">
                  <template #right-icon>
                    <van-radio name="low-stock" />
                  </template>
                </van-cell>
                <van-cell :title="$t('product.filter.outOfStock')" clickable @click="filterForm.stockStatus = 'out-of-stock'">
                  <template #right-icon>
                    <van-radio name="out-of-stock" />
                  </template>
                </van-cell>
              </van-cell-group>
            </van-radio-group>
          </van-cell-group>
        </van-form>
      </div>
    </van-popup>
    
    <!-- 创建产品按钮 -->
    <van-floating-bubble
      axis="xy"
      icon="plus"
      @click="createProduct"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const { t } = useI18n()

// 搜索和筛选
const searchValue = ref('')
const showFilter = ref(false)
const filterForm = reactive({
  minPrice: '',
  maxPrice: '',
  stockStatus: 'all',
})

// 列表状态
const loading = ref(false)
const finished = ref(false)
const refreshing = ref(false)

// 产品数据
const products = ref([
  {
    id: 1,
    name: 'iPhone 15 Pro',
    sku: 'PHONE001',
    price: 35900,
    originalPrice: 39900,
    stock: 25,
    minStock: 10,
    image: '',
  },
  {
    id: 2,
    name: 'MacBook Air M2',
    sku: 'LAPTOP001',
    price: 36900,
    stock: 3,
    minStock: 5,
    image: '',
  },
  {
    id: 3,
    name: 'AirPods Pro',
    sku: 'AUDIO001',
    price: 7490,
    stock: 50,
    minStock: 20,
    image: '',
  },
  {
    id: 4,
    name: '原子笔',
    sku: 'PEN001',
    price: 15,
    stock: 120,
    minStock: 100,
    image: '',
  },
])

// 格式化金额
const formatMoney = (amount: number) => {
  return new Intl.NumberFormat('zh-TW').format(amount)
}

// 搜索产品
const onSearch = (value: string) => {
  console.log(t('common.search') + ':', value)
}

// 清空搜索
const onClear = () => {
  searchValue.value = ''
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

// 查看产品详情
const viewProductDetail = (product: any) => {
  showToast(`${t('product.viewProduct')}: ${product.name}`)
}

// 编辑产品
const editProduct = (product: any) => {
  showToast(`${t('product.editProduct')}: ${product.name}`)
}

// 加入订单
const addToOrder = (product: any) => {
  showToast(`${t('product.addedToCart')} ${product.name}`)
}

// 重置筛选
const resetFilter = () => {
  filterForm.minPrice = ''
  filterForm.maxPrice = ''
  filterForm.stockStatus = 'all'
}

// 应用筛选
const applyFilter = () => {
  showFilter.value = false
  showToast(t('product.filter.applied'))
}

// 创建产品
const createProduct = () => {
  showToast(t('product.createProduct'))
}

// 组件名称
defineOptions({
  name: 'Products',
})
</script>

<style lang="scss" scoped>
.products-view {
  background: #f7f8fa;
  min-height: 100vh;
}

.products-content {
  padding: 0 16px;
}

.product-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  padding: 12px 0;
}

.product-card {
  background: white;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  
  .product-image {
    position: relative;
    margin-bottom: 8px;
    
    :deep(.van-image) {
      width: 100%;
      height: 120px;
      border-radius: 6px;
      background: #f5f5f5;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .stock-warning {
      position: absolute;
      top: 6px;
      right: 6px;
    }
  }
  
  .product-info {
    margin-bottom: 10px;
    
    .product-name {
      font-size: 14px;
      font-weight: 600;
      color: #323233;
      margin: 0 0 4px 0;
      line-height: 1.2;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    
    .product-sku {
      font-size: 11px;
      color: #969799;
      margin: 0 0 6px 0;
    }
    
    .product-price {
      margin-bottom: 4px;
      
      .current-price {
        font-size: 16px;
        font-weight: 600;
        color: #1989fa;
      }
      
      .original-price {
        font-size: 12px;
        color: #c8c9cc;
        text-decoration: line-through;
        margin-left: 4px;
      }
    }
    
    .product-stock {
      font-size: 12px;
      
      .stock-label {
        color: #646566;
      }
      
      .stock-value {
        color: #07c160;
        font-weight: 600;
        
        &.low-stock {
          color: #ee0a24;
        }
      }
    }
  }
  
  .product-actions {
    display: flex;
    gap: 6px;
    
    .van-button {
      flex: 1;
      font-size: 12px;
      height: 28px;
    }
  }
}

// 筛选面板
.filter-panel {
  height: 100%;
  background: #f7f8fa;
  
  :deep(.van-cell-group__title) {
    padding: 16px 16px 8px 16px;
  }
}
</style>