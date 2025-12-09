import { defineStore } from 'pinia'
import type { User as BaseUser } from '@t-erp/shared'
import { authApi } from '@/api/auth'
import { ElMessage } from 'element-plus'

// 擴展 User 類型
export interface User extends BaseUser {
  avatar?: string
  permissions?: string[]
}

export interface AuthState {
  user: User | null
  token: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  permissions: string[]
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    token: localStorage.getItem('token'),
    refreshToken: localStorage.getItem('refreshToken'),
    isAuthenticated: false,
    permissions: [],
  }),
  
  getters: {
    userInfo: (state) => state.user,
    hasPermission: (state) => (permission: string) => {
      return state.permissions.includes(permission) || state.user?.role === 'admin'
    },
    isAdmin: (state) => state.user?.role === 'admin',
    isManager: (state) => ['admin', 'manager'].includes(state.user?.role || ''),
  },
  
  actions: {
    // 登入
    async login(credentials: { username: string; password: string }) {
      try {
        const response = await authApi.login(credentials)
        const { user, access_token } = response.data

        this.user = user as User
        this.token = access_token
        this.refreshToken = null // 目前後端未返回 refreshToken
        this.isAuthenticated = true
        this.permissions = (user as User).permissions || []

        // 储存到 localStorage
        localStorage.setItem('token', access_token)
        if (this.refreshToken) {
          localStorage.setItem('refreshToken', this.refreshToken)
        }
        localStorage.setItem('user', JSON.stringify(user))

        ElMessage.success('登入成功')
        return response
      } catch (error: any) {
        ElMessage.error(error.message || '登入失敗')
        throw error
      }
    },
    
    // 登出
    async logout() {
      try {
        if (this.token) {
          await authApi.logout()
        }
      } catch (error) {
        console.warn('登出 API 請求失敗:', error)
      } finally {
        this.clearAuth()
        ElMessage.success('已登出')
      }
    },
    
    // 清除認證信息
    clearAuth() {
      this.user = null
      this.token = null
      this.refreshToken = null
      this.isAuthenticated = false
      this.permissions = []
      
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
    },
    
    // 檢查認證狀態
    async checkAuth() {
      const token = localStorage.getItem('token')
      const userStr = localStorage.getItem('user')
      
      if (!token || !userStr) {
        this.clearAuth()
        return false
      }
      
      try {
        const user = JSON.parse(userStr)
        
        // 驗證 token 是否有效
        const response = await authApi.profile()
        
        this.user = response.data as User
        this.token = token
        this.isAuthenticated = true
        this.permissions = (response.data as User).permissions || []
        
        return true
      } catch (error) {
        console.warn('認證檢查失敗:', error)
        this.clearAuth()
        return false
      }
    },
    
    // 更新用戶信息
    async updateProfile(data: Partial<User>) {
      try {
        const response = await authApi.updateProfile(data)
        this.user = response.data
        
        localStorage.setItem('user', JSON.stringify(response.data))
        ElMessage.success('資料更新成功')
        
        return response
      } catch (error: any) {
        ElMessage.error(error.message || '更新失敗')
        throw error
      }
    },
    
    // 修改密碼
    async changePassword(data: { oldPassword: string; newPassword: string }) {
      try {
        await authApi.changePassword(data)
        ElMessage.success('密碼修改成功')
      } catch (error: any) {
        ElMessage.error(error.message || '密碼修改失敗')
        throw error
      }
    },
    
    // 刷新 token
    async refreshAccessToken() {
      try {
        if (!this.refreshToken) {
          throw new Error('缺少 refresh token')
        }
        
        const response = await authApi.refresh(this.refreshToken)
        const { token, refreshToken } = response.data
        
        this.token = token
        this.refreshToken = refreshToken
        
        localStorage.setItem('token', token)
        localStorage.setItem('refreshToken', refreshToken)
        
        return token
      } catch (error) {
        console.warn('Token 刷新失敗:', error)
        this.clearAuth()
        throw error
      }
    },
  },
})
