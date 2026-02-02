import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { PurchaseOrder } from './entities/purchase-order.entity'
import { PurchaseOrderItem } from './entities/purchase-order-item.entity'
import { SaleOrder } from './entities/sale-order.entity'
import { SaleOrderItem } from './entities/sale-order-item.entity'
import { Product } from '../products/entities/product.entity'
import { User } from '../users/entities/user.entity'
import { PurchaseOrdersController } from './purchase-orders.controller'
import { SaleOrdersController } from './sale-orders.controller'
import { PurchaseOrdersService } from './purchase-orders.service'
import { SaleOrdersService } from './sale-orders.service'
import { InventoryModule } from '../inventory/inventory.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PurchaseOrder,
      PurchaseOrderItem,
      SaleOrder,
      SaleOrderItem,
      Product,
      User,
    ]),
    InventoryModule,
  ],
  controllers: [PurchaseOrdersController, SaleOrdersController],
  providers: [PurchaseOrdersService, SaleOrdersService],
  exports: [PurchaseOrdersService, SaleOrdersService],
})
export class OrdersModule {}