<template>
  <el-dialog
    v-model="visible"
    title="選擇產品"
    width="900px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <!-- 搜尋區 -->
    <div class="search-bar">
      <el-input
        v-model="searchKeyword"
        placeholder="搜尋產品名稱或 SKU"
        clearable
        style="width: 300px"
        @input="handleSearch"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <el-select
        v-model="categoryFilter"
        placeholder="篩選分類"
        clearable
        style="width: 200px; margin-left: 12px"
        @change="handleSearch"
      >
        <el-option
          v-for="category in categories"
          :key="category.id"
          :label="category.name"
          :value="category.id"
        />
      </el-select>
      <el-switch
        v-model="activeOnly"
        active-text="僅顯示啟用"
        style="margin-left: 12px"
        @change="handleSearch"
      />
    </div>

    <!-- 產品列表 -->
    <el-table
      v-loading="loading"
      :data="displayProducts"
      border
      stripe
      style="width: 100%; margin-top: 16px"
      height="500px"
      highlight-current-row
      @row-click="handleRowClick"
      @row-dblclick="handleRowDoubleClick"
    >
      <el-table-column type="index" label="#" width="50" />
      <el-table-column prop="sku" label="SKU" width="120" />
      <el-table-column prop="name" label="產品名稱" min-width="180" show-overflow-tooltip />
      <el-table-column label="分類" width="120">
        <template #default="{ row }">
          {{ row.category?.name || '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="stockQuantity" label="庫存" width="80" align="center">
        <template #default="{ row }">
          <el-tag :type="getStockTagType(row)" size="small">
            {{ row.stockQuantity }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="成本價" width="100" align="right">
        <template #default="{ row }">
          {{ formatCurrency(row.costPrice) }}
        </template>
      </el-table-column>
      <el-table-column label="售價" width="100" align="right">
        <template #default="{ row }">
          {{ formatCurrency(row.unitPrice) }}
        </template>
      </el-table-column>
      <el-table-column label="狀態" width="80" align="center">
        <template #default="{ row }">
          <el-tag :type="row.isActive ? 'success' : 'info'" size="small">
            {{ row.isActive ? '啟用' : '停用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="100" align="center" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" size="small" @click.stop="handleSelect(row)">
            選擇
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分頁 -->
    <div class="pagination-container">
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

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleConfirm" :disabled="!selectedProduct">
          確定
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { productsApi } from '@/api/products'
import { categoriesApi } from '@/api/categories'
import type { Product, Category } from '@/types'

interface Props {
  modelValue: boolean
  priceType?: 'cost' | 'sale' // 價格類型：cost=成本價, sale=售價
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'select', product: Product): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  priceType: 'cost'
})

const emit = defineEmits<Emits>()

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// 資料狀態
const loading = ref(false)
const products = ref<Product[]>([])
const categories = ref<Category[]>([])
const selectedProduct = ref<Product | null>(null)

// 搜尋和篩選
const searchKeyword = ref('')
const categoryFilter = ref<number>()
const activeOnly = ref(true)

// 分頁
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

// 顯示的產品列表
const displayProducts = computed(() => products.value)

// 獲取庫存標籤類型
const getStockTagType = (product: Product) => {
  if (product.stockQuantity === 0) return 'danger'
  if (product.stockQuantity <= product.minStockLevel) return 'warning'
  return 'success'
}

// 格式化金額
const formatCurrency = (amount: number | string | undefined | null) => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
  if (typeof numAmount === 'number' && !isNaN(numAmount)) {
    return `NT$ ${numAmount.toFixed(2)}`
  }
  return 'NT$ 0.00'
}

// 搜尋處理
const handleSearch = () => {
  currentPage.value = 1
  fetchProducts()
}

// 獲取產品列表
const fetchProducts = async () => {
  try {
    loading.value = true
    const params: any = {
      page: currentPage.value,
      limit: pageSize.value
    }

    if (searchKeyword.value) {
      params.search = searchKeyword.value
    }

    if (categoryFilter.value) {
      params.categoryId = categoryFilter.value
    }

    // 僅當啟用篩選時才傳遞 isActive 參數
    if (activeOnly.value) {
      params.isActive = true
    }

    console.log('API 請求參數:', params)

    const response = await productsApi.getProducts(params)

    console.log('產品列表 API 回應:', response)

    products.value = response.data.items || []
    total.value = response.data.total || 0
  } catch (error) {
    console.error('獲取產品列表失敗:', error)
    ElMessage.error('獲取產品列表失敗')
    products.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

// 獲取分類列表
const fetchCategories = async () => {
  try {
    const response = await categoriesApi.getCategories()
    categories.value = response.data || []
  } catch (error) {
    console.error('獲取分類列表失敗:', error)
  }
}

// 分頁處理
const handlePageChange = (page: number) => {
  currentPage.value = page
  fetchProducts()
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
  fetchProducts()
}

// 選擇處理
const handleRowClick = (row: Product) => {
  selectedProduct.value = row
}

const handleRowDoubleClick = (row: Product) => {
  handleSelect(row)
}

const handleSelect = (product: Product) => {
  emit('select', product)
  handleClose()
}

const handleConfirm = () => {
  if (selectedProduct.value) {
    emit('select', selectedProduct.value)
    handleClose()
  }
}

const handleClose = () => {
  visible.value = false
  selectedProduct.value = null
}

// 監聽對話框打開
watch(visible, (newVal) => {
  if (newVal) {
    fetchProducts()
    fetchCategories()
  }
})
</script>

<style scoped lang="scss">
.search-bar {
  display: flex;
  align-items: center;
}

.pagination-container {
  margin-top: 16px;
  display: flex;
  justify-content: center;
}

:deep(.el-table__row) {
  cursor: pointer;
}

:deep(.el-table__row:hover > td) {
  background-color: var(--el-table-row-hover-bg-color) !important;
}
</style>
