import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'

// 路由定義
const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/auth/LoginView.vue'),
    meta: {
      title: '登入',
      requiresAuth: false,
    },
  },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    redirect: '/dashboard',
    meta: {
      requiresAuth: true,
    },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/DashboardView.vue'),
        meta: {
          title: '儀表板',
          icon: 'Dashboard',
        },
      },
      {
        path: 'products',
        name: 'Products',
        component: () => import('@/views/products/ProductsView.vue'),
        meta: {
          title: '產品管理',
          icon: 'Box',
        },
      },
      {
        path: 'categories',
        name: 'Categories',
        component: () => import('@/views/categories/CategoriesView.vue'),
        meta: {
          title: '分類管理',
          icon: 'Collection',
        },
      },
      {
        path: 'customers',
        name: 'Customers',
        component: () => import('@/views/customers/CustomersView.vue'),
        meta: {
          title: '客戶管理',
          icon: 'User',
        },
      },
      {
        path: 'suppliers',
        name: 'Suppliers',
        component: () => import('@/views/suppliers/SuppliersView.vue'),
        meta: {
          title: '供應商管理',
          icon: 'OfficeBuilding',
        },
      },
      {
        path: 'purchase-orders',
        name: 'PurchaseOrders',
        component: () => import('@/views/orders/PurchaseOrdersView.vue'),
        meta: {
          title: '進貨單',
          icon: 'ShoppingCart',
        },
      },
      {
        path: 'sale-orders',
        name: 'SaleOrders',
        component: () => import('@/views/orders/SaleOrdersView.vue'),
        meta: {
          title: '銷貨單',
          icon: 'Sell',
        },
      },
      {
        path: 'inventory',
        name: 'Inventory',
        component: () => import('@/views/inventory/InventoryView.vue'),
        meta: {
          title: '庫存管理',
          icon: 'Grid',
        },
      },
      {
        path: 'reports',
        name: 'Reports',
        component: () => import('@/views/reports/ReportsView.vue'),
        meta: {
          title: '報表中心',
          icon: 'DataAnalysis',
        },
      },
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('@/views/settings/SettingsView.vue'),
        meta: {
          title: '系統設定',
          icon: 'Setting',
        },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/error/NotFoundView.vue'),
    meta: {
      title: '頁面不存在',
    },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  },
})

// 全局導航守衛
router.beforeEach(async (to, from, next) => {
  NProgress.start()
  
  const authStore = useAuthStore()
  const requiresAuth = to.meta.requiresAuth !== false
  
  // 設定頁面標題
  if (to.meta.title) {
    document.title = `${to.meta.title} - T-ERP`
  }
  
  if (requiresAuth && !authStore.isAuthenticated) {
    // 需要認證但未登入
    next({ name: 'Login', query: { redirect: to.fullPath } })
  } else if (to.name === 'Login' && authStore.isAuthenticated) {
    // 已登入但訪問登入頁面
    next({ name: 'Dashboard' })
  } else {
    next()
  }
})

router.afterEach(() => {
  NProgress.done()
})

export default router
