import axios from 'axios'
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { ElMessage, ElNotification } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import router from '@/router'

// API 回應類型
export interface ApiResponse<T = any> {
  success: boolean
  data: T
  message: string
  code?: number
}

// 建立 axios 實例
class Request {
  private instance: AxiosInstance
  private baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1'
  
  constructor() {
    this.instance = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    this.initInterceptors()
  }
  
  private initInterceptors() {
    // 請求攻取器
    this.instance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const authStore = useAuthStore()
        
        // 添加 token
        if (authStore.token) {
          config.headers.Authorization = `Bearer ${authStore.token}`
        }
        
        return config
      },
      (error) => {
        console.error('請求攻取器錯誤:', error)
        return Promise.reject(error)
      }
    )
    
    // 回應攻取器
    this.instance.interceptors.response.use(
      (response: AxiosResponse<ApiResponse>) => {
        const { data } = response
        
        // 檢查業務成功狀態
        if (data.success) {
          return response
        } else {
          // 業務錯誤
          ElMessage.error(data.message || '請求失敗')
          return Promise.reject(new Error(data.message || '請求失敗'))
        }
      },
      async (error) => {
        const { response, message } = error
        
        if (response) {
          const { status, data } = response
          
          switch (status) {
            case 401:
              // 未授權，嘗試刷新 token
              try {
                const authStore = useAuthStore()
                await authStore.refreshAccessToken()
                // 重試原請求
                return this.instance.request(error.config)
              } catch {
                // 刷新失敗，跳轉登入
                const authStore = useAuthStore()
                authStore.clearAuth()
                router.push('/login')
                ElMessage.error('登入已過期，請重新登入')
              }
              break
              
            case 403:
              ElMessage.error('權限不足')
              break
              
            case 404:
              ElMessage.error('資源不存在')
              break
              
            case 422:
              // 表單驗證錯誤
              if (data.errors) {
                Object.values(data.errors).forEach((messages: any) => {
                  if (Array.isArray(messages)) {
                    messages.forEach((msg: string) => {
                      ElMessage.error(msg)
                    })
                  }
                })
              } else {
                ElMessage.error(data.message || '表單驗證失敗')
              }
              break
              
            case 500:
              ElMessage.error('伺服器內部錯誤')
              break
              
            default:
              ElMessage.error(data?.message || `請求失敗 (${status})`)
          }
        } else if (message.includes('timeout')) {
          ElMessage.error('請求逾時，請稍後重試')
        } else if (message.includes('Network Error')) {
          ElNotification({
            title: '網絡連線錯誤',
            message: '無法連接到伺服器，請檢查網路連線',
            type: 'error',
            duration: 5000,
          })
        } else {
          ElMessage.error('請求失敗，請稍後重試')
        }
        
        return Promise.reject(error)
      }
    )
  }
  
  // GET 請求
  public async get<T = any>(
    url: string,
    params?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.instance.get(url, { params, ...config })
    return response.data
  }

  // POST 請求
  public async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.instance.post(url, data, config)
    return response.data
  }

  // PUT 請求
  public async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.instance.put(url, data, config)
    return response.data
  }

  // DELETE 請求
  public async delete<T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.instance.delete(url, config)
    return response.data
  }

  // PATCH 請求
  public async patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.instance.patch(url, data, config)
    return response.data
  }
  
  // 上傳文件
  public upload<T = any>(
    url: string,
    formData: FormData,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    return this.instance.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      ...config,
    })
  }
  
  // 下載文件
  public download(
    url: string,
    params?: any,
    filename?: string
  ): Promise<void> {
    return this.instance.get(url, {
      params,
      responseType: 'blob',
    }).then((response: any) => {
      const blob = new Blob([response.data])
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      
      link.href = downloadUrl
      link.download = filename || '下載文件'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      window.URL.revokeObjectURL(downloadUrl)
    })
  }
}

export const request = new Request()
export default request
