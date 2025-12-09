<template>
  <div class="settings-view">
    <div class="page-header">
      <h1>系統設定</h1>
    </div>

    <el-tabs v-model="activeTab" class="settings-tabs">
      <el-tab-pane label="基本設定" name="basic">
        <el-form label-width="120px" style="max-width: 600px;">
          <el-form-item label="系統名稱">
            <el-input v-model="basicSettings.systemName" />
          </el-form-item>
          <el-form-item label="公司名稱">
            <el-input v-model="basicSettings.companyName" />
          </el-form-item>
          <el-form-item label="聯絡電話">
            <el-input v-model="basicSettings.phone" />
          </el-form-item>
          <el-form-item label="電子郵箱">
            <el-input v-model="basicSettings.email" />
          </el-form-item>
          <el-form-item label="公司地址">
            <el-input type="textarea" v-model="basicSettings.address" :rows="3" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="saveBasicSettings">儲存設定</el-button>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <el-tab-pane label="用戶管理" name="users">
        <div class="user-management">
          <div style="margin-bottom: 20px;">
            <el-button type="primary" @click="handleAddUser">
              <el-icon><Plus /></el-icon>
              新增用戶
            </el-button>
          </div>
          
          <el-table :data="users" border stripe>
            <el-table-column prop="username" label="用戶名" />
            <el-table-column prop="email" label="電子郵箱" />
            <el-table-column prop="role" label="角色" />
            <el-table-column prop="status" label="狀態">
              <template #default="{ row }">
                <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
                  {{ row.status === 'active' ? '啟用' : '停用' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="lastLoginAt" label="最後登入" />
            <el-table-column label="操作" width="200">
              <template #default="{ row }">
                <el-button size="small" @click="handleEditUser(row)">編輯</el-button>
                <el-button size="small" type="danger" @click="handleDeleteUser(row)">刪除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <el-tab-pane label="系統日誌" name="logs">
        <div class="logs-section">
          <div class="filters" style="margin-bottom: 20px;">
            <el-form :inline="true">
              <el-form-item label="日期範圍">
                <el-date-picker
                  v-model="logFilters.dateRange"
                  type="daterange"
                  range-separator="至"
                  start-placeholder="開始日期"
                  end-placeholder="結束日期"
                />
              </el-form-item>
              <el-form-item label="操作類型">
                <el-select v-model="logFilters.action" placeholder="選擇操作" clearable>
                  <el-option label="登入" value="login" />
                  <el-option label="登出" value="logout" />
                  <el-option label="創建" value="create" />
                  <el-option label="編輯" value="update" />
                  <el-option label="刪除" value="delete" />
                </el-select>
              </el-form-item>
              <el-form-item>
                <el-button @click="searchLogs">搜尋</el-button>
                <el-button @click="resetLogFilters">重置</el-button>
              </el-form-item>
            </el-form>
          </div>

          <el-table :data="logs" border stripe>
            <el-table-column prop="timestamp" label="時間" width="180" />
            <el-table-column prop="username" label="用戶" />
            <el-table-column prop="action" label="操作" />
            <el-table-column prop="resource" label="資源" />
            <el-table-column prop="ip" label="IP地址" />
            <el-table-column prop="userAgent" label="用戶代理" show-overflow-tooltip />
          </el-table>
        </div>
      </el-tab-pane>

      <el-tab-pane label="備份管理" name="backup">
        <div class="backup-section">
          <el-alert
            title="資料備份"
            description="定期備份重要資料，確保資料安全"
            type="info"
            style="margin-bottom: 20px;"
          />
          
          <div style="margin-bottom: 20px;">
            <el-button type="primary" @click="handleBackup">
              <el-icon><Download /></el-icon>
              立即備份
            </el-button>
            <el-button @click="handleRestore">
              <el-icon><Upload /></el-icon>
              還原資料
            </el-button>
          </div>

          <el-table :data="backups" border stripe>
            <el-table-column prop="filename" label="檔案名稱" />
            <el-table-column prop="size" label="檔案大小" />
            <el-table-column prop="createdAt" label="創建時間" />
            <el-table-column label="操作" width="150">
              <template #default="{ row }">
                <el-button size="small" @click="handleDownloadBackup(row)">下載</el-button>
                <el-button size="small" type="danger" @click="handleDeleteBackup(row)">刪除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Download, Upload } from '@element-plus/icons-vue'

const activeTab = ref('basic')

const basicSettings = ref({
  systemName: 'T-ERP 進銷存系統',
  companyName: '',
  phone: '',
  email: '',
  address: ''
})

const users = ref([])
const logs = ref([])
const backups = ref([])

const logFilters = ref({
  dateRange: null,
  action: ''
})

const saveBasicSettings = () => {
  ElMessage.success('設定儲存成功')
}

const handleAddUser = () => {
  ElMessage.info('新增用戶功能開發中')
}

const handleEditUser = (row: any) => {
  ElMessage.info('編輯用戶功能開發中')
}

const handleDeleteUser = async (row: any) => {
  try {
    await ElMessageBox.confirm('確定要刪除此用戶嗎？', '提示', {
      confirmButtonText: '確定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    ElMessage.success('刪除成功')
  } catch {}
}

const searchLogs = () => {
  ElMessage.info('搜尋日誌功能開發中')
}

const resetLogFilters = () => {
  logFilters.value = {
    dateRange: null,
    action: ''
  }
}

const handleBackup = () => {
  ElMessage.info('備份功能開發中')
}

const handleRestore = () => {
  ElMessage.info('還原功能開發中')
}

const handleDownloadBackup = (row: any) => {
  ElMessage.info('下載備份功能開發中')
}

const handleDeleteBackup = async (row: any) => {
  try {
    await ElMessageBox.confirm('確定要刪除此備份檔案嗎？', '提示', {
      confirmButtonText: '確定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    ElMessage.success('刪除成功')
  } catch {}
}

onMounted(() => {
  // 載入設定和數據
})
</script>

<style scoped>
.settings-view {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.settings-tabs {
  background: white;
  padding: 20px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.user-management,
.logs-section,
.backup-section {
  padding: 20px 0;
}

.filters {
  background: #f5f5f5;
  padding: 16px;
  border-radius: 4px;
  margin-bottom: 20px;
}
</style>