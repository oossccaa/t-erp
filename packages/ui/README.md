# @t-erp/ui

T-ERP 系統響應式 Vue3 組件庫，提供完整的 UI 組件和設計系統。

## ✨ 特色功能

- 🎨 **完整設計系統** - 基於 Design Tokens 的設計語言
- 📱 **響應式設計** - 完整支援手機、平板、桌機
- 🎯 **TypeScript** - 完整的類型支援
- 🌗 **主題切換** - 支援淺色/深色主題
- ♿ **無障礙** - 遵循 WCAG 2.1 AA 標準
- 🚀 **高性能** - Tree Shaking 和按需加載
- 📦 **零外部依賴** - 除 Vue 3 外無額外依賴

## 📦 安裝

```bash
# pnpm (推薦)
pnpm add @t-erp/ui

# npm
npm install @t-erp/ui

# yarn
yarn add @t-erp/ui
```

## 🚀 快速開始

### 全域註冊

```typescript
import { createApp } from 'vue'
import * as TErpUI from '@t-erp/ui'
import '@t-erp/ui/dist/style.css'

const app = createApp(App)

// 註冊所有組件
Object.entries(TErpUI).forEach(([name, component]) => {
  if (name.startsWith('T') && component?.name) {
    app.component(name, component)
  }
})

app.mount('#app')
```

### 按需導入

```vue
<template>
  <TButton @click="handleClick">
    點擊我
  </TButton>
</template>

<script setup lang="ts">
import { TButton } from '@t-erp/ui'

const handleClick = () => {
  console.log('按鈕被點擊了!')
}
</script>
```

### 主題配置

```typescript
import { createApp } from 'vue'
import { createThemeProvider } from '@t-erp/ui'

const app = createApp(App)

// 創建主題提供者
app.use({
  install(app) {
    createThemeProvider({
      mode: 'light', // 'light' | 'dark' | 'auto'
      customColors: {
        primary: '#1976d2',
      },
    })
  },
})
```

## 🎨 設計系統

### 顏色系統

```typescript
import { colors } from '@t-erp/ui'

// 使用預定義顏色
const primaryColor = colors.primary[500] // #0ea5e9
const successColor = colors.success[500] // #22c55e
```

### 響應式設計

```typescript
import { useResponsive } from '@t-erp/ui'

const { isMobile, isTablet, isDesktop } = useResponsive()
```

### 間距系統

```typescript
import { spacing, semanticSpacing } from '@t-erp/ui'

// 基礎間距
const small = spacing[2] // 0.5rem / 8px
const medium = spacing[4] // 1rem / 16px

// 語義化間距
const padding = semanticSpacing.padding.md // 1rem
const margin = semanticSpacing.margin.lg // 1.5rem
```

## 🧩 組件列表

### 基礎組件

| 組件 | 描述 | 範例 |
|------|------|------|
| `TButton` | 按鈕組件 | `<TButton variant="primary">按鈕</TButton>` |
| `TIcon` | 圖示組件 | `<TIcon name="search" size="20" />` |
| `TInput` | 輸入框組件 | `<TInput v-model="value" placeholder="請輸入" />` |

### 數據展示

| 組件 | 描述 | 範例 |
|------|------|------|
| `TDataTable` | 數據表格 | `<TDataTable :data="data" :columns="columns" />` |
| `TPagination` | 分頁組件 | `<TPagination :total="100" :page-size="10" />` |

## 🎯 組件範例

### TButton 按鈕

```vue
<template>
  <!-- 基本按鈕 -->
  <TButton>預設按鈕</TButton>
  
  <!-- 不同樣式 -->
  <TButton variant="primary">主要按鈕</TButton>
  <TButton variant="secondary">次要按鈕</TButton>
  <TButton variant="outline">輪廓按鈕</TButton>
  
  <!-- 不同尺寸 -->
  <TButton size="sm">小按鈕</TButton>
  <TButton size="md">中按鈕</TButton>
  <TButton size="lg">大按鈕</TButton>
  
  <!-- 帶圖示 -->
  <TButton prefix-icon="search">搜尋</TButton>
  <TButton suffix-icon="arrow_right">下一步</TButton>
  
  <!-- 載入狀態 -->
  <TButton :loading="isLoading" @click="handleSubmit">
    提交
  </TButton>
</template>
```

### TInput 輸入框

```vue
<template>
  <!-- 基本輸入框 -->
  <TInput 
    v-model="form.name"
    label="姓名"
    placeholder="請輸入姓名"
    required
  />
  
  <!-- 密碼輸入框 -->
  <TInput 
    v-model="form.password"
    type="password"
    label="密碼"
    show-password
    required
  />
  
  <!-- 帶驗證的輸入框 -->
  <TInput 
    v-model="form.email"
    type="email"
    label="電子郵件"
    :error-message="emailError"
    helper-text="請輸入有效的電子郵件地址"
  />
  
  <!-- 多行文字 -->
  <TInput 
    v-model="form.description"
    label="描述"
    multiline
    :rows="4"
    :maxlength="200"
    show-word-count
  />
</template>
```

### TDataTable 數據表格

```vue
<template>
  <TDataTable
    :data="products"
    :columns="columns"
    :loading="loading"
    searchable
    filterable
    selectable
    show-index
    @selection-change="handleSelectionChange"
  >
    <!-- 自定義操作欄 -->
    <template #actions="{ row }">
      <TButton size="sm" @click="editProduct(row)">編輯</TButton>
      <TButton size="sm" variant="error" @click="deleteProduct(row)">
        刪除
      </TButton>
    </template>
  </TDataTable>
</template>

<script setup lang="ts">
const columns = [
  { key: 'sku', label: 'SKU', sortable: true },
  { key: 'name', label: '產品名稱', sortable: true },
  { key: 'category', label: '分類' },
  { key: 'price', label: '價格', align: 'right', formatter: (val) => `$${val}` },
  { key: 'stock', label: '庫存', align: 'center' },
]
</script>
```

## 🎨 客製化主題

### CSS 變數覆寫

```css
:root {
  /* 主色調 */
  --t-primary-500: #1976d2;
  --t-primary-600: #1565c0;
  
  /* 圓角 */
  --t-radius-md: 8px;
  
  /* 字體 */
  --t-font-family-sans: 'Inter', system-ui, sans-serif;
}
```

### 動態主題切換

```vue
<template>
  <TButton @click="toggleTheme">
    {{ isDark ? '淺色模式' : '深色模式' }}
  </TButton>
</template>

<script setup lang="ts">
import { useTheme } from '@t-erp/ui'

const { isDark, toggleMode } = useTheme()

const toggleTheme = () => {
  toggleMode()
}
</script>
```

## 📱 響應式使用

```vue
<template>
  <div :class="containerClass">
    <!-- 手機版佈局 -->
    <div v-if="isMobile" class="mobile-layout">
      <!-- 手機版內容 -->
    </div>
    
    <!-- 桌面版佈局 -->
    <div v-else class="desktop-layout">
      <!-- 桌面版內容 -->
    </div>
  </div>
</template>

<script setup lang="ts">
import { useResponsive } from '@t-erp/ui'

const {
  isMobile,
  isTablet,
  isDesktop,
  currentBreakpoint,
  width,
  height
} = useResponsive()

const containerClass = computed(() => ({
  'mobile-container': isMobile.value,
  'tablet-container': isTablet.value,
  'desktop-container': isDesktop.value,
}))
</script>
```

## 🧪 測試

```bash
# 運行測試
pnpm test

# 測試 UI 介面
pnpm test:ui

# 類型檢查
pnpm typecheck
```

## 🛠 開發

```bash
# 安裝依賴
pnpm install

# 開發模式
pnpm dev

# 建置
pnpm build

# 檢查代碼風格
pnpm lint
```

## 📋 瀏覽器支援

| Browser | Version |
|---------|--------|
| Chrome | >= 88 |
| Firefox | >= 78 |
| Safari | >= 14 |
| Edge | >= 88 |

## 🤝 貢獻

歡迎提交 Pull Request 或建立 Issue！

## 📄 授權

[MIT License](LICENSE)
