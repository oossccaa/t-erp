/**
 * 功能旗標 — 由環境變數驅動，讓單一 codebase 服務多客戶。
 *
 * 旗標值：
 * - weight：是否啟用產品重量 / 訂單重量計算（B 客戶用）
 * - target：cloud（雲端 SaaS 部署）或 desktop（A 客戶 Electron 桌機版）
 * - dbType：postgres（雲端）或 sqlite（桌機本地）
 *
 * 旗標只在啟動時讀一次。
 */

export type Target = 'cloud' | 'desktop'
export type DbType = 'postgres' | 'sqlite'

const parseBool = (v: string | undefined): boolean => v === 'true' || v === '1'

export const features = {
  weight: parseBool(process.env.FEATURE_WEIGHT),
  target: ((process.env.TARGET as Target) || 'cloud'),
  dbType: ((process.env.DB_TYPE as DbType) || 'postgres'),
} as const

export type Features = typeof features
