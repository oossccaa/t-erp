<template>
  <div class="login-view">
    <!-- 头部logo区域 -->
    <div class="login-header">
      <div class="logo-section">
        <div class="logo-icon">
          <van-icon name="shop-o" size="60" />
        </div>
        <h1 class="app-title">T-ERP</h1>
        <p class="app-subtitle">{{ $t('auth.appTitle') }}</p>
      </div>
    </div>

    <!-- 登录表单 -->
    <div class="login-form">
      <van-form @submit="handleLogin">
        <van-cell-group inset>
          <van-field
            v-model="form.username"
            name="username"
            :label="$t('auth.username')"
            :placeholder="$t('auth.pleaseEnterUsername')"
            :rules="[{ required: true, message: $t('auth.pleaseEnterUsername') }]"
            left-icon="contact"
          />
          <van-field
            v-model="form.password"
            type="password"
            name="password"
            :label="$t('auth.password')"
            :placeholder="$t('auth.pleaseEnterPassword')"
            :rules="[{ required: true, message: $t('auth.pleaseEnterPassword') }]"
            left-icon="lock"
          />
        </van-cell-group>
        
        <div class="login-options">
          <van-checkbox v-model="form.remember">{{ $t('auth.rememberPassword') }}</van-checkbox>
          <van-button type="primary" size="small" plain>{{ $t('auth.forgotPassword') }}</van-button>
        </div>
        
        <div class="login-button">
          <van-button
            round
            block
            type="primary"
            native-type="submit"
            :loading="loading"
            :loading-text="$t('auth.loggingIn')"
          >
            {{ $t('auth.login') }}
          </van-button>
        </div>
      </van-form>
    </div>

    <!-- 底部信息 -->
    <div class="login-footer">
      <p class="version">{{ $t('auth.version') }} 1.0.0</p>
      <p class="copyright">{{ $t('auth.copyright') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast, showSuccessToast, showFailToast } from 'vant'
import { useAuthStore } from '@/stores/auth'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const { t } = useI18n()

const loading = ref(false)
const form = reactive({
  username: 'admin',
  password: '123456',
  remember: false,
})

// 登录处理
const handleLogin = async () => {
  try {
    loading.value = true

    await authStore.login({
      username: form.username,
      password: form.password,
      remember: form.remember,
    })

    showSuccessToast(t('auth.loginSuccess'))

    // 重定向到目标页面或首页
    const redirect = (route.query.redirect as string) || '/home'
    router.replace(redirect)
  } catch (error: any) {
    showFailToast(error.message || t('auth.loginFailed'))
  } finally {
    loading.value = false
  }
}

// 组件名称
defineOptions({
  name: 'Login',
})
</script>

<style lang="scss" scoped>
.login-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
  padding: 0 24px;
}

.login-header {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-top: 60px;
}

.logo-section {
  text-align: center;
  color: white;
  
  .logo-icon {
    margin-bottom: 20px;
    
    .van-icon {
      background: rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      padding: 20px;
      backdrop-filter: blur(10px);
    }
  }
  
  .app-title {
    font-size: 36px;
    font-weight: bold;
    margin: 0 0 8px 0;
    text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  }
  
  .app-subtitle {
    font-size: 16px;
    opacity: 0.9;
    margin: 0;
  }
}

.login-form {
  padding: 40px 0;
  
  :deep(.van-cell-group) {
    margin-bottom: 24px;
    
    .van-cell {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
    }
  }
}

.login-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  
  :deep(.van-checkbox) {
    color: white;
    
    .van-checkbox__label {
      color: white;
    }
  }
}

.login-button {
  margin-bottom: 24px;
  
  :deep(.van-button) {
    height: 50px;
    font-size: 18px;
    font-weight: 600;
  }
}

.login-footer {
  text-align: center;
  color: rgba(255, 255, 255, 0.8);
  font-size: 12px;
  padding-bottom: 30px;
  
  .version {
    margin-bottom: 8px;
  }
  
  .copyright {
    margin: 0;
  }
}
</style>