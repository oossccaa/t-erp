import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

interface User {
  id: number
  username: string
  email?: string
  role: string
  avatar?: string
}

interface LoginForm {
  username: string
  password: string
  remember?: boolean
}

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const user = ref<User | null>(null)
  const token = ref<string>('')
  const loading = ref(false)

  // 计算属性
  const isAuthenticated = computed(() => !!token.value && !!user.value)

  // 登录
  const login = async (form: LoginForm) => {
    try {
      loading.value = true
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      if (form.username === 'admin' && form.password === '123456') {
        // 模拟用户数据
        user.value = {
          id: 1,
          username: 'admin',
          email: 'admin@t-erp.com',
          role: 'admin',
          avatar: '',
        }
        
        token.value = 'mock-jwt-token-' + Date.now()
        
        // 保存到本地存储
        if (form.remember) {
          localStorage.setItem('auth_token', token.value)
          localStorage.setItem('auth_user', JSON.stringify(user.value))
        } else {
          sessionStorage.setItem('auth_token', token.value)
          sessionStorage.setItem('auth_user', JSON.stringify(user.value))
        }
      } else {
        throw new Error('用户名或密码错误')
      }
    } catch (error: any) {
      console.error('登录失败:', error.message)
      throw error
    } finally {
      loading.value = false
    }
  }

  // 登出
  const logout = async () => {
    user.value = null
    token.value = ''
    
    // 清除本地存储
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    sessionStorage.removeItem('auth_token')
    sessionStorage.removeItem('auth_user')
  }

  // 检查认证状态
  const checkAuth = () => {
    const savedToken = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
    const savedUser = localStorage.getItem('auth_user') || sessionStorage.getItem('auth_user')
    
    if (savedToken && savedUser) {
      token.value = savedToken
      user.value = JSON.parse(savedUser)
    }
  }

  // 更新用户信息
  const updateUser = (userData: Partial<User>) => {
    if (user.value) {
      user.value = { ...user.value, ...userData }
      
      // 更新本地存储
      const storage = localStorage.getItem('auth_user') ? localStorage : sessionStorage
      storage.setItem('auth_user', JSON.stringify(user.value))
    }
  }

  return {
    // 状态
    user,
    token,
    loading,
    
    // 计算属性
    isAuthenticated,
    
    // 方法
    login,
    logout,
    checkAuth,
    updateUser,
  }
})