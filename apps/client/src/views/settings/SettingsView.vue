<template>
  <div class="settings-view">
    <!-- 用户信息 -->
    <van-card class="user-card">
      <template #header>
        <div class="user-header">
          <van-image
            :src="authStore.user?.avatar || ''"
            round
            width="60"
            height="60"
            fit="cover"
          >
            <template #error>
              <van-icon name="user-circle-o" size="60" />
            </template>
          </van-image>
          <div class="user-info">
            <h3 class="username">{{ authStore.user?.username }}</h3>
            <p class="user-role">{{ authStore.user?.role === 'admin' ? $t('settings.admin') : $t('settings.user') }}</p>
          </div>
          <van-icon name="arrow" color="#c8c9cc" />
        </div>
      </template>
    </van-card>
    
    <!-- 系统设置 -->
    <van-cell-group :title="$t('settings.systemSettings')">
      <van-cell
        :title="$t('settings.themeMode')"
        :value="appStore.theme === 'light' ? $t('settings.light') : $t('settings.dark')"
        is-link
        @click="toggleTheme"
      />
      <van-cell
        :title="$t('settings.language')"
        :value="$t('settings.chineseTraditional')"
        is-link
        @click="showLanguagePicker = true"
      />
      <van-cell
        :title="$t('settings.pushNotification')"
        @click="toggleNotification"
      >
        <template #right-icon>
          <van-switch v-model="appStore.settings.enableNotifications" size="20" />
        </template>
      </van-cell>
      <van-cell
        :title="$t('settings.autoSave')"
        @click="toggleAutoSave"
      >
        <template #right-icon>
          <van-switch v-model="appStore.settings.autoSave" size="20" />
        </template>
      </van-cell>
    </van-cell-group>
    
    <!-- 业务设置 -->
    <van-cell-group :title="$t('settings.businessSettings')">
      <van-cell :title="$t('settings.defaultCurrency')" value="TWD (新台币)" is-link />
      <van-cell :title="$t('settings.inventoryWarningThreshold')" value="10%" is-link />
      <van-cell :title="$t('settings.orderApprovalProcess')" :value="$t('settings.enabled')" is-link />
      <van-cell :title="$t('settings.dataSyncFrequency')" :value="$t('settings.realTime')" is-link />
    </van-cell-group>
    
    <!-- 账户管理 -->
    <van-cell-group :title="$t('settings.accountManagement')">
      <van-cell :title="$t('settings.changePassword')" is-link @click="changePassword" />
      <van-cell :title="$t('settings.bindEmail')" :value="authStore.user?.email || $t('settings.notBound')" is-link />
      <van-cell :title="$t('settings.exportData')" is-link @click="exportData" />
      <van-cell :title="$t('settings.clearCache')" is-link @click="clearCache" />
    </van-cell-group>
    
    <!-- 关于应用 -->
    <van-cell-group :title="$t('settings.about')">
      <van-cell :title="$t('settings.appVersion')" value="1.0.0" />
      <van-cell :title="$t('settings.userAgreement')" is-link />
      <van-cell :title="$t('settings.privacyPolicy')" is-link />
      <van-cell :title="$t('settings.feedback')" is-link />
    </van-cell-group>
    
    <!-- 退出登录 -->
    <div class="logout-section">
      <van-button
        block
        type="danger"
        plain
        @click="handleLogout"
      >
        {{ $t('settings.logout') }}
      </van-button>
    </div>
    
    <!-- 语言选择器 -->
    <van-popup v-model:show="showLanguagePicker" position="bottom">
      <van-picker
        :columns="languageColumns"
        @confirm="onLanguageConfirm"
        @cancel="showLanguagePicker = false"
      />
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { showToast, showConfirmDialog, showNotify, showSuccessToast, showLoadingToast } from 'vant'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'

const router = useRouter()
const authStore = useAuthStore()
const appStore = useAppStore()
const { t } = useI18n()

const showLanguagePicker = ref(false)

// 语言选项
const languageColumns = [
  { text: t('settings.chineseSimplified'), value: 'zh-CN' },
  { text: t('settings.chineseTraditional'), value: 'zh-TW' },
  { text: t('settings.english'), value: 'en-US' },
]

// 切换主题
const toggleTheme = () => {
  appStore.toggleTheme()
  const themeText = appStore.theme === 'light' ? t('settings.light') : t('settings.dark')
  showSuccessToast(`${t('settings.switchedTo')}${themeText}${t('settings.theme')}`)
}

// 切换通知
const toggleNotification = () => {
  const enabled = appStore.settings.enableNotifications
  appStore.updateSettings({ enableNotifications: !enabled })
  const message = enabled ? t('settings.notificationDisabled') : t('settings.notificationEnabled')
  showSuccessToast(message)
}

// 切换自动保存
const toggleAutoSave = () => {
  const enabled = appStore.settings.autoSave
  appStore.updateSettings({ autoSave: !enabled })
  const message = enabled ? t('settings.autoSaveDisabled') : t('settings.autoSaveEnabled')
  showSuccessToast(message)
}

// 语言确认
const onLanguageConfirm = (value: any) => {
  appStore.setLocale(value.value)
  showLanguagePicker.value = false
  showSuccessToast(t('settings.languageSwitched', { language: value.text }))
}

// 修改密码
const changePassword = () => {
  showToast(t('settings.changePasswordDeveloping'))
}

// 导出数据
const exportData = async () => {
  try {
    await showConfirmDialog({
      title: t('settings.exportData'),
      message: t('settings.exportDataConfirm'),
    })

    showLoadingToast({
      message: t('settings.exporting'),
      forbidClick: true,
      duration: 2000,
    })

    setTimeout(() => {
      showSuccessToast(t('settings.exportSuccess'))
    }, 2000)
  } catch {
    // 用户取消
  }
}

// 清除缓存
const clearCache = async () => {
  try {
    await showConfirmDialog({
      title: t('settings.clearCache'),
      message: t('settings.clearCacheConfirm'),
    })

    // 清除各种缓存
    localStorage.removeItem('app_theme')
    localStorage.removeItem('app_settings')
    sessionStorage.clear()

    showSuccessToast(t('settings.clearCacheSuccess'))
  } catch {
    // 用户取消
  }
}

// 退出登录
const handleLogout = async () => {
  try {
    await showConfirmDialog({
      title: t('settings.logout'),
      message: t('settings.logoutConfirm'),
    })

    await authStore.logout()

    showNotify({
      type: 'success',
      message: t('settings.logoutSuccess'),
    })

    router.replace('/login')
  } catch {
    // 用户取消
  }
}

// 组件名称
defineOptions({
  name: 'Settings',
})
</script>

<style lang="scss" scoped>
.settings-view {
  background: #f7f8fa;
  min-height: 100vh;
}

.user-card {
  margin: 0 16px 16px 16px;
  
  :deep(.van-card__header) {
    padding: 20px;
  }
}

.user-header {
  display: flex;
  align-items: center;
  
  .user-info {
    flex: 1;
    margin-left: 16px;
    
    .username {
      font-size: 18px;
      font-weight: 600;
      color: #323233;
      margin: 0 0 4px 0;
    }
    
    .user-role {
      font-size: 14px;
      color: #646566;
      margin: 0;
    }
  }
}

:deep(.van-cell-group) {
  margin-bottom: 16px;
  
  .van-cell-group__title {
    padding: 16px 16px 8px 16px;
    font-weight: 600;
  }
  
  .van-cell {
    padding: 12px 16px;
  }
}

.logout-section {
  padding: 32px 16px 60px 16px;
  
  .van-button {
    height: 50px;
    font-size: 16px;
    font-weight: 600;
  }
}
</style>