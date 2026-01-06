import { DataSource } from 'typeorm'
import { config } from 'dotenv'
import { resolve } from 'path'
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

// 載入環境變數（從專案根目錄）
config({ path: resolve(__dirname, '../../../..', '.env') })

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres123',
  database: process.env.DB_NAME || 't_erp',
  entities: [
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
  ],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false, // Migration 模式下不使用自動同步
  logging: process.env.NODE_ENV === 'development',
})
