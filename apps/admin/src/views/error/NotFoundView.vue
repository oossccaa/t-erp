<template>
  <div class="not-found-view">
    <div class="error-container">
      <div class="error-code">404</div>
      <div class="error-message">頁面不存在</div>
      <div class="error-description">
        抱歉，您訪問的頁面不存在或已被刪除
      </div>
      <div class="error-actions">
        <el-button type="primary" @click="goHome">
          <el-icon><HomeFilled /></el-icon>
          回到首頁
        </el-button>
        <el-button @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          返回上頁
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { HomeFilled, ArrowLeft } from '@element-plus/icons-vue'

const router = useRouter()

const goHome = () => {
  router.push('/')
}

const goBack = () => {
  router.go(-1)
}
</script>

<style scoped lang="scss">
.not-found-view {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #5eb8a8 0%, #3d8b7f 100%);
}

// 強制 light mode，避免按鈕 hover 配色衝突
.error-container {
  text-align: center;
  background: #ffffff;
  padding: 60px 40px;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  max-width: 500px;

  // 覆寫此卡片內所有 Element Plus 變數為 light 主題值
  --el-bg-color: #ffffff;
  --el-bg-color-page: #f2f3f5;
  --el-text-color-primary: #303133;
  --el-text-color-regular: #606266;
  --el-text-color-secondary: #909399;
  --el-fill-color: #f0f2f5;
  --el-fill-color-light: #f5f7fa;
  --el-fill-color-lighter: #fafafa;
  --el-border-color: #dcdfe6;
  --el-border-color-light: #e4e7ed;
  --el-border-color-lighter: #ebeef5;
}

.error-code {
  font-size: 120px;
  font-weight: bold;
  color: #3d8b7f;
  line-height: 1;
  margin-bottom: 20px;
}

.error-message {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 15px;
}

.error-description {
  font-size: 16px;
  color: #606266;
  margin-bottom: 40px;
  line-height: 1.6;
}

.error-actions {
  display: flex;
  gap: 16px;
  justify-content: center;

  // 強制按鈕走 light 配色，避免 dark mode 下的 hover 黑底
  :deep(.el-button) {
    --el-button-bg-color: #ffffff;
    --el-button-border-color: #dcdfe6;
    --el-button-text-color: #606266;
    --el-button-hover-bg-color: #ecf5ff;
    --el-button-hover-border-color: #c6e2ff;
    --el-button-hover-text-color: #3d8b7f;
    --el-button-active-bg-color: #d9ecff;
    --el-button-active-border-color: #a3c8f7;
    --el-button-active-text-color: #3d8b7f;
  }

  :deep(.el-button--primary) {
    --el-button-bg-color: #3d8b7f;
    --el-button-border-color: #3d8b7f;
    --el-button-text-color: #ffffff;
    --el-button-hover-bg-color: #5eb8a8;
    --el-button-hover-border-color: #5eb8a8;
    --el-button-hover-text-color: #ffffff;
    --el-button-active-bg-color: #2f6e64;
    --el-button-active-border-color: #2f6e64;
    --el-button-active-text-color: #ffffff;
  }
}
</style>