import { PartialType, OmitType } from '@nestjs/mapped-types'
import { IsOptional, IsEnum, IsNumber, Min, IsArray, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'
import { CreateSaleOrderDto, CreateSaleOrderItemDto } from './create-sale-order.dto'
import { SaleOrderStatus, PaymentStatus, ShippingStatus } from '../entities/sale-order.entity'

export class UpdateSaleOrderDto extends PartialType(
  OmitType(CreateSaleOrderDto, ['customerId'] as const)
) {
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
  @Type(() => CreateSaleOrderItemDto)
  items?: CreateSaleOrderItemDto[]
}