import { Logger } from '@nestjs/common'
import { DataSource } from 'typeorm'
import * as bcrypt from 'bcrypt'
import { User, UserRole } from '../modules/users/entities/user.entity'

/**
 * 第一次啟動時，若 users 表為空，自動建立 admin / admin123 帳號。
 *
 * 由 main.ts 在 app.listen 之後直接呼叫，避免進 Nest DI graph
 * 引發 onApplicationBootstrap 循環解析（曾在 SQLite + repo 注入下炸過）。
 */
export async function ensureBootstrapAdmin(dataSource: DataSource): Promise<void> {
  const logger = new Logger('BootstrapSeed')
  const userRepo = dataSource.getRepository(User)

  const count = await userRepo.count()
  if (count > 0) return

  const password = await bcrypt.hash('admin123', 10)
  await userRepo.save(
    userRepo.create({
      username: 'admin',
      email: 'admin@terp.local',
      password,
      role: UserRole.ADMIN,
      isActive: true,
    }),
  )
  logger.log('🌱 已建立預設 admin 帳號 (admin / admin123)')
}
