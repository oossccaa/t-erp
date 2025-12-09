import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { InventoryTransaction } from './entities/inventory-transaction.entity'
import { InventoryAdjustment } from './entities/inventory-adjustment.entity'
import { InventoryAdjustmentItem } from './entities/inventory-adjustment-item.entity'
import { Product } from '../products/entities/product.entity'
import { InventoryController } from './inventory.controller'
import { InventoryService } from './inventory.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([
      InventoryTransaction,
      InventoryAdjustment,
      InventoryAdjustmentItem,
      Product,
    ])
  ],
  controllers: [InventoryController],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}