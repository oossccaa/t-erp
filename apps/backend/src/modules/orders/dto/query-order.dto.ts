import { IsOptional, IsString, IsEnum, IsDateString, IsNumber, Min } from 'class-validator'
import { Type } from 'class-transformer'
import { PurchaseOrderStatus, PaymentStatus } from '../entities/purchase-order.entity'
import { SaleOrderStatus, ShippingStatus } from '../entities/sale-order.entity'

export class QueryPurchaseOrderDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10

  @IsOptional()
  @IsString()
  search?: string

  @IsOptional()
  @IsString()
  orderNumber?: string

  @IsOptional()
  @IsEnum(PurchaseOrderStatus)
  status?: PurchaseOrderStatus

  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  supplierId?: number

  @IsOptional()
  @IsDateString()
  startDate?: string

  @IsOptional()
  @IsDateString()
  endDate?: string

  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt'

  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC' = 'DESC'
}

export class QuerySaleOrderDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10

  @IsOptional()
  @IsString()
  search?: string

  @IsOptional()
  @IsString()
  orderNumber?: string

  @IsOptional()
  @IsEnum(SaleOrderStatus)
  status?: SaleOrderStatus

  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus

  @IsOptional()
  @IsEnum(ShippingStatus)
  shippingStatus?: ShippingStatus

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  customerId?: number

  @IsOptional()
  @IsDateString()
  startDate?: string

  @IsOptional()
  @IsDateString()
  endDate?: string

  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt'

  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC' = 'DESC'
}