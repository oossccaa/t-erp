import { AppDataSource } from './data-source'

async function testConnection() {
  try {
    console.log('🔌 正在連接資料庫...')
    console.log('配置資訊：')
    console.log(`  主機: ${process.env.DB_HOST || 'localhost'}`)
    console.log(`  埠號: ${process.env.DB_PORT || '5432'}`)
    console.log(`  資料庫: ${process.env.DB_NAME || 't_erp'}`)
    console.log(`  用戶: ${process.env.DB_USER || 'postgres'}`)
    console.log('')

    await AppDataSource.initialize()
    console.log('✅ 資料庫連接成功！')
    console.log('')

    // 顯示待執行的 migrations
    const pendingMigrations = await AppDataSource.showMigrations()
    console.log(`📋 待執行的 migrations 數量: ${pendingMigrations ? '有' : '無'}`)
    console.log('')

    // 列出所有 migrations
    const migrations = await AppDataSource.migrations
    console.log(`📁 Migration 檔案列表 (${migrations.length} 個):`)
    migrations.forEach((migration, index) => {
      console.log(`  ${index + 1}. ${migration.name}`)
    })
    console.log('')

    await AppDataSource.destroy()
    console.log('👋 資料庫連接已關閉')
  } catch (error) {
    console.error('❌ 連接失敗:', error)
    process.exit(1)
  }
}

testConnection()
