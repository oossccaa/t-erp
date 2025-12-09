import { IsNotEmpty, IsString, IsNumber, IsOptional, IsArray, ValidateNested, IsDateString, IsEnum, Min, IsPositive } from 'class-validator'
import { Type } from 'class-transformer'
import { PurchaseOrderStatus } from '../entities/purchase-order.entity'

export class CreatePurchaseOrderItemDto {
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  productId: number

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  quantity: number

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  unitPrice: number

  @IsOptional()
  @IsString()
  notes?: string
}

export class CreatePurchaseOrderDto {
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  supplierId: number

  @IsNotEmpty()
  @IsDateString()
  orderDate: string

  @IsOptional()
  @IsDateString()
  expectedDeliveryDate?: string

  @IsOptional()
  @IsEnum(PurchaseOrderStatus)
  status?: PurchaseOrderStatus

  @IsOptional()
  @IsNumber()
  @Min(0)
  taxRate?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  discountRate?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  shippingCost?: number

  @IsOptional()
  @IsString()
  notes?: string

  @IsOptional()
  @IsString()
  shippingAddress?: string

  @IsOptional()
  @IsString()
  paymentTerms?: string

  @IsOptional()
  @IsString()
  deliveryTerms?: string

  @IsOptional()
  @IsString()
  referenceNumber?: string

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseOrderItemDto)
  items: CreatePurchaseOrderItemDto[]
}