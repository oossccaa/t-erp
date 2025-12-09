<template>
  <div class="login-container">
    <div class="login-form-wrapper">
      <!-- Logo 和標題 -->
      <div class="login-header">
        <div class="logo">
          <el-icon size="48" color="#409eff">
            <Box />
          </el-icon>
        </div>
        <h1 class="title">T-ERP 管理後台</h1>
        <p class="subtitle">小工廠進銷存管理系統</p>
      </div>
      
      <!-- 登入表單 -->
      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        class="login-form"
        size="large"
        @keyup.enter="handleLogin"
      >
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="請輸入用戶名"
            prefix-icon="User"
            :disabled="loading"
            clearable
          />
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="請輸入密碼"
            prefix-icon="Lock"
            :disabled="loading"
            show-password
            clearable
          />
        </el-form-item>
        
        <el-form-item>
          <div class="login-options">
            <el-checkbox v-model="rememberMe">記住我</el-checkbox>
            <el-link type="primary" :underline="false" @click="handleForgotPassword">
              忘記密碼？
            </el-link>
          </div>
        </el-form-item>
        
        <el-form-item>
          <el-button
            type="primary"
            class="login-button"
            :loading="loading"
            @click="handleLogin"
          >
            {{ loading ? '登入中...' : '登入' }}
          </el-button>
        </el-form-item>
      </el-form>
      
      <!-- 快速登入 -->
      <div class="quick-login">
        <el-divider>測試用戶</el-divider>
        <div class="demo-accounts">
          <el-button 
            v-for="account in demoAccounts" 
            :key="account.username"
            text 
            @click="fillDemoAccount(account)"
          >
            {{ account.label }}
          </el-button>
        </div>
      </div>
    </div>
    
    <!-- 背景裝飾 -->
    <div class="login-bg">
      <div class="bg-circle circle-1"></div>
      <div class="bg-circle circle-2"></div>
      <div class="bg-circle circle-3"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { Box, User, Lock } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// 表單參考
const loginFormRef = ref<FormInstance>()

// 表單數據
const loginForm = reactive({
  username: '',
  password: '',
})

// 表單驗證規則
const loginRules: FormRules = {
  username: [
    { required: true, message: '請輸入用戶名', trigger: 'blur' },
    { min: 3, max: 20, message: '用戶名長度3-20字元', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '請輸入密碼', trigger: 'blur' },
    { min: 6, message: '密碼長度不能少於6位', trigger: 'blur' },
  ],
}

// 狀態
const loading = ref(false)
const rememberMe = ref(false)

// 測試用戶
const demoAccounts = [
  { username: 'admin', password: 'admin123', label: '管理員' },
  { username: 'manager', password: 'manager123', label: '經理' },
  { username: 'user', password: 'user123', label: '一般用戶' },
]

// 登入處理
const handleLogin = async () => {
  console.log('嘗試登入...',loginFormRef.value)
  if (!loginFormRef.value) return
  console.log('驗證表單...')
  const valid = await loginFormRef.value.validate().catch(() => false)
  console.log('表單驗證結果:', valid)
  if (!valid) return
  loading.value = true
  
  try {
    await authStore.login({
      username: loginForm.username,
      password: loginForm.password,
    })
    
    // 如果勾選「記住我」，保存用戶名
    if (rememberMe.value) {
      localStorage.setItem('rememberedUsername', loginForm.username)
    } else {
      localStorage.removeItem('rememberedUsername')
    }
    
    // 登入成功後跳轉
    const redirect = route.query.redirect as string
    await router.push(redirect || '/dashboard')
    
  } catch (error) {
    console.error('登入失敗:', error)
  } finally {
    loading.value = false
  }
}

// 忘記密碼
const handleForgotPassword = () => {
  ElMessage.info('請聯繫管理員重設密碼')
}

// 填入測試用戶
const fillDemoAccount = (account: typeof demoAccounts[0]) => {
  loginForm.username = account.username
  loginForm.password = account.password
}

// 初始化
// 恢復記住的用戶名
const rememberedUsername = localStorage.getItem('rememberedUsername')
if (rememberedUsername) {
  loginForm.username = rememberedUsername
  rememberMe.value = true
}
</script>

<style lang="scss" scoped>
.login-container {
  position: relative;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}

.login-form-wrapper {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  padding: 40px;
  width: 100%;
  max-width: 420px;
  margin: 20px;
  position: relative;
  z-index: 1;
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
  
  .logo {
    margin-bottom: 16px;
  }
  
  .title {
    font-size: 28px;
    font-weight: bold;
    color: #2c3e50;
    margin: 0 0 8px 0;
  }
  
  .subtitle {
    color: #7f8c8d;
    margin: 0;
    font-size: 14px;
  }
}

.login-form {
  .login-button {
    width: 100%;
    height: 48px;
    font-size: 16px;
    border-radius: 8px;
  }
}

.login-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.quick-login {
  margin-top: 24px;
  
  .demo-accounts {
    display: flex;
    gap: 8px;
    justify-content: center;
    flex-wrap: wrap;
  }
}

// 背景裝飾
.login-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  z-index: 0;
}

.bg-circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  animation: float 6s ease-in-out infinite;
  
  &.circle-1 {
    width: 300px;
    height: 300px;
    top: -150px;
    left: -150px;
    animation-delay: 0s;
  }
  
  &.circle-2 {
    width: 200px;
    height: 200px;
    bottom: -100px;
    right: -100px;
    animation-delay: 2s;
  }
  
  &.circle-3 {
    width: 150px;
    height: 150px;
    top: 50%;
    right: -75px;
    animation-delay: 4s;
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(180deg);
  }
}

// 響應式設計
@media (max-width: 768px) {
  .login-form-wrapper {
    padding: 24px;
    margin: 12px;
  }
  
  .login-header {
    .title {
      font-size: 24px;
    }
  }
  
  .bg-circle {
    &.circle-1 {
      width: 200px;
      height: 200px;
      top: -100px;
      left: -100px;
    }
    
    &.circle-2 {
      width: 150px;
      height: 150px;
      bottom: -75px;
      right: -75px;
    }
    
    &.circle-3 {
      display: none;
    }
  }
}

// 深色主題
.dark {
  .login-form-wrapper {
    background: rgba(0, 0, 0, 0.8);
    
    .title {
      color: #fff;
    }
    
    .subtitle {
      color: #a0a0a0;
    }
  }
}
</style>
