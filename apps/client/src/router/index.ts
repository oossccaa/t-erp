import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/home',
    },
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/auth/LoginView.vue'),
      meta: {
        requiresAuth: false,
      },
    },
    {
      path: '/',
      component: () => import('@/layouts/MainLayout.vue'),
      meta: {
        requiresAuth: true,
      },
      children: [
        {
          path: 'home',
          name: 'Home',
          component: () => import('@/views/home/HomeView.vue'),
        },
        {
          path: 'orders',
          name: 'Orders',
          component: () => import('@/views/orders/OrdersView.vue'),
        },
        {
          path: 'orders/create',
          name: 'CreateOrder',
          component: () => import('@/views/orders/CreateOrderView.vue'),
        },
        {
          path: 'orders/:id',
          name: 'OrderDetail',
          component: () => import('@/views/orders/OrderDetailView.vue'),
        },
        {
          path: 'products',
          name: 'Products',
          component: () => import('@/views/products/ProductsView.vue'),
        },
        {
          path: 'customers',
          name: 'Customers',
          component: () => import('@/views/customers/CustomersView.vue'),
        },
        {
          path: 'inventory',
          name: 'Inventory',
          component: () => import('@/views/inventory/InventoryView.vue'),
        },
        {
          path: 'reports',
          name: 'Reports',
          component: () => import('@/views/reports/ReportsView.vue'),
        },
        {
          path: 'settings',
          name: 'Settings',
          component: () => import('@/views/settings/SettingsView.vue'),
        },
      ],
    },
  ],
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  // 检查是否需要认证
  if (to.meta.requiresAuth !== false) {
    if (!authStore.isAuthenticated) {
      return next({ name: 'Login', query: { redirect: to.fullPath } })
    }
  }
  
  // 如果已登录访问登录页，重定向到首页
  if (to.name === 'Login' && authStore.isAuthenticated) {
    return next({ name: 'Home' })
  }
  
  next()
})

export default router