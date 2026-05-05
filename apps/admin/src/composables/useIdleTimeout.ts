import { onMounted, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import router from '@/router'

/**
 * 閒置自動登出
 *
 * 原理：
 *   - 每次有活動（mouse / keyboard / touch / scroll / click），把
 *     localStorage.lastActivityAt = Date.now() 寫進去
 *   - 每分鐘 setInterval 檢查 (Date.now() - lastActivityAt) > idleMs → 登出
 *   - App 第一次啟動也會檢查一次 → 你關 tab 兩天再開, 立刻被登出
 *
 * 為什麼不用 setTimeout：
 *   Chrome 對背景 tab 會 throttle setTimeout, 甚至暫停。setInterval 1min
 *   也會 throttle 但最多 ~1 分鐘, 兩天延遲不會超過幾分鐘, 可接受。
 *
 * 用法：
 *   useIdleTimeout()                    // 預設 30 分鐘
 *   useIdleTimeout({ minutes: 60 })     // 自訂
 */

const STORAGE_KEY = 'lastActivityAt'

export function useIdleTimeout(options: { minutes?: number } = {}) {
  const idleMinutes = options.minutes ?? 30
  const idleMs = idleMinutes * 60 * 1000
  const checkIntervalMs = 60 * 1000 // 每分鐘檢查

  const authStore = useAuthStore()
  let interval: ReturnType<typeof setInterval> | null = null

  const ACTIVITY_EVENTS = [
    'mousedown',
    'keydown',
    'touchstart',
    'scroll',
    'click',
  ] as const

  const recordActivity = () => {
    if (!authStore.token) return
    localStorage.setItem(STORAGE_KEY, String(Date.now()))
  }

  const checkIdle = async () => {
    if (!authStore.token) return
    const last = Number(localStorage.getItem(STORAGE_KEY) || 0)
    if (!last) {
      // 沒紀錄 → 視為剛剛有活動
      recordActivity()
      return
    }
    if (Date.now() - last > idleMs) {
      authStore.clearAuth()
      localStorage.removeItem(STORAGE_KEY)
      ElMessage.warning(`閒置超過 ${idleMinutes} 分鐘，已自動登出`)
      await router.push('/login')
    }
  }

  onMounted(() => {
    // 啟動立刻檢查一次（catch「關 tab 兩天再開」）
    checkIdle()

    // 監聽活動 → 更新 timestamp
    ACTIVITY_EVENTS.forEach((evt) => {
      window.addEventListener(evt, recordActivity, { passive: true })
    })

    // 每分鐘檢查一次
    interval = setInterval(checkIdle, checkIntervalMs)
  })

  onBeforeUnmount(() => {
    ACTIVITY_EVENTS.forEach((evt) => {
      window.removeEventListener(evt, recordActivity)
    })
    if (interval) clearInterval(interval)
  })
}
