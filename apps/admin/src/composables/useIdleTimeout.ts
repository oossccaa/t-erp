import { onMounted, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import router from '@/router'

/**
 * 閒置自動登出
 *
 * 監聽 mouse / keyboard / touch / scroll 事件，
 * 超過 idleMinutes 沒任何活動 → 清掉 token + 跳回 login。
 *
 * 後端 JWT 還是 7 天有效，所以「使用中持續操作」永遠不會被打斷；
 * 只有「離開電腦 X 分鐘」才會被踢，避免同事路過看到別人帳號。
 *
 * 用法（在 App.vue 之類的根元件）：
 *   useIdleTimeout()                    // 預設 30 分鐘
 *   useIdleTimeout({ minutes: 60 })     // 自訂
 */
export function useIdleTimeout(options: { minutes?: number } = {}) {
  const idleMinutes = options.minutes ?? 30
  const idleMs = idleMinutes * 60 * 1000

  let timer: ReturnType<typeof setTimeout> | null = null
  const authStore = useAuthStore()

  const ACTIVITY_EVENTS = [
    'mousedown',
    'keydown',
    'touchstart',
    'scroll',
    'click',
  ] as const

  const doLogout = async () => {
    if (!authStore.token) return // 已經登出了，不用做事
    authStore.clearAuth()
    ElMessage.warning(`閒置超過 ${idleMinutes} 分鐘，已自動登出`)
    await router.push('/login')
  }

  const reset = () => {
    if (!authStore.token) return // 沒登入時不啟動 timer
    if (timer) clearTimeout(timer)
    timer = setTimeout(doLogout, idleMs)
  }

  const handleActivity = () => reset()

  onMounted(() => {
    ACTIVITY_EVENTS.forEach((evt) => {
      window.addEventListener(evt, handleActivity, { passive: true })
    })
    reset()
  })

  onBeforeUnmount(() => {
    ACTIVITY_EVENTS.forEach((evt) => {
      window.removeEventListener(evt, handleActivity)
    })
    if (timer) clearTimeout(timer)
  })
}
