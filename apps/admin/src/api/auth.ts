import request from './request'
import type { User } from '@t-erp/shared'

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  user: User
  access_token: string
}

export const authApi = {
  // 登入
  login(data: LoginRequest) {
    return request.post<LoginResponse>('/auth/login', data)
  },
  
  // 登出
  logout() {
    return request.post('/auth/logout')
  },
  
  // 獲取用戶信息
  profile() {
    return request.get<User>('/auth/profile')
  },
  
  // 更新用戶信息
  updateProfile(data: Partial<User>) {
    return request.put<User>('/auth/profile', data)
  },
  
  // 修改密碼
  changePassword(data: { oldPassword: string; newPassword: string }) {
    return request.post('/auth/change-password', data)
  },
  
  // 刷新 token
  refresh(refreshToken: string) {
    return request.post<{ token: string; refreshToken: string }>('/auth/refresh', {
      refreshToken,
    })
  },
}
