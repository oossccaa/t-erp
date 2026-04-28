import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm'
import * as path from 'path'
import * as fs from 'fs'
import { User } from '../modules/users/entities/user.entity'
import { Category } from '../modules/categories/entities/category.entity'
import { Product } from '../modules/products/entities/product.entity'
import { Supplier } from '../modules/suppliers/entities/supplier.entity'
import { Customer } from '../modules/customers/entities/customer.entity'
import { SaleOrder } from '../modules/orders/entities/sale-order.entity'
import { SaleOrderItem } from '../modules/orders/entities/sale-order-item.entity'
import { PurchaseOrder } from '../modules/orders/entities/purchase-order.entity'
import { PurchaseOrderItem } from '../modules/orders/entities/purchase-order-item.entity'
import { InventoryTransaction } from '../modules/inventory/entities/inventory-transaction.entity'
import { InventoryAdjustment } from '../modules/inventory/entities/inventory-adjustment.entity'
import { InventoryAdjustmentItem } from '../modules/inventory/entities/inventory-adjustment-item.entity'

const ENTITIES = [
  User,
  Category,
  Product,
  Supplier,
  Customer,
  SaleOrder,
  SaleOrderItem,
  PurchaseOrder,
  PurchaseOrderItem,
  InventoryTransaction,
  InventoryAdjustment,
  InventoryAdjustmentItem,
]

@Injectable()
export class DatabaseConfig implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    const dbType = this.configService.get<string>('DB_TYPE', 'postgres')
    const isProduction = this.configService.get('NODE_ENV') === 'production'
    const isDev = this.configService.get('NODE_ENV') === 'development'

    if (dbType === 'sqlite') {
      // SQLite_PATH 優先 > Electron app userData > 預設本機 dev 路徑
      const dbPath =
        this.configService.get<string>('SQLITE_PATH') ||
        path.resolve(process.cwd(), 'data', 't-erp.db')

      const dir = path.dirname(dbPath)
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }

      return {
        type: 'better-sqlite3',
        database: dbPath,
        entities: ENTITIES,
        // SQLite 桌機版尚未引入 migrations，先用 synchronize 自動建表
        synchronize: true,
        logging: isDev,
      }
    }

    return {
      type: 'postgres',
      host: this.configService.get('DB_HOST', 'localhost'),
      port: this.configService.get('DB_PORT', 5432),
      username: this.configService.get('DB_USER', 'postgres'),
      password: this.configService.get('DB_PASSWORD', 'postgres123'),
      database: this.configService.get('DB_NAME', 't_erp'),
      entities: ENTITIES,
      synchronize: !isProduction,
      logging: isDev,
      ssl: isProduction ? { rejectUnauthorized: false } : false,
      extra: {
        max: this.configService.get('DB_CONNECTION_LIMIT', 20),
        connectionTimeoutMillis: this.configService.get('DB_CONNECTION_TIMEOUT', 60000),
        idleTimeoutMillis: this.configService.get('DB_IDLE_TIMEOUT', 600000),
      },
    }
  }
}
