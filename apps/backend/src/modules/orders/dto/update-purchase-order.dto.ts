import { PartialType, OmitType } from '@nestjs/mapped-types'
import { IsOptional, IsEnum, IsNumber, Min, IsArray, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'
import { CreatePurchaseOrderDto, CreatePurchaseOrderItemDto } from './create-purchase-order.dto'
import { PurchaseOrderStatus, PaymentStatus } from '../entities/purchase-order.entity'

export class UpdatePurchaseOrderDto extends PartialType(
  OmitType(CreatePurchaseOrderDto, ['supplierId'] as const)
) {
  @IsOptional()
  @IsEnum(PurchaseOrderStatus)
  status?: PurchaseOrderStatus

  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus

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
  @IsNumber()
  @Min(0)
  subtotal?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  taxAmount?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  totalAmount?: number

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseOrderItemDto)
  items?: CreatePurchaseOrderItemDto[]
}