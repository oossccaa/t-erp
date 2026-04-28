/**
 * 功能旗標 — 由 Vite 環境變數驅動，build 時固化。
 *
 * 旗標值：
 * - weight：是否顯示產品重量欄位 / 訂單即時重量總計（B 客戶用）
 * - target：cloud（瀏覽器 SaaS）或 desktop（A 客戶 Electron 桌機版）
 *
 * 設定來源：根目錄 package.json 的 dev:* / build:* scripts 透過 VITE_FEATURE_*
 * 與 VITE_TARGET 注入。
 */

export type Target = 'cloud' | 'desktop'

const parseBool = (v: string | undefined): boolean => v === 'true' || v === '1'

export const features = {
  weight: parseBool(import.meta.env.VITE_FEATURE_WEIGHT),
  target: ((import.meta.env.VITE_TARGET as Target) || 'cloud'),
} as const

export type Features = typeof features
