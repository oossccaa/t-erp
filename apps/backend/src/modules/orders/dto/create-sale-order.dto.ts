import { IsNotEmpty, IsString, IsNumber, IsOptional, IsArray, ValidateNested, IsDateString, IsEnum, Min, IsPositive } from 'class-validator'
import { Type } from 'class-transformer'
import { SaleOrderStatus } from '../entities/sale-order.entity'

export class CreateSaleOrderItemDto {
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
  @IsNumber()
  @Min(0)
  discountRate?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number

  @IsOptional()
  @IsString()
  notes?: string
}

export class CreateSaleOrderDto {
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  customerId: number

  @IsNotEmpty()
  @IsDateString()
  orderDate: string

  @IsOptional()
  @IsDateString()
  expectedShippingDate?: string

  @IsOptional()
  @IsDateString()
  expectedDeliveryDate?: string

  @IsOptional()
  @IsEnum(SaleOrderStatus)
  status?: SaleOrderStatus

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
  billingAddress?: string

  @IsOptional()
  @IsString()
  paymentMethod?: string

  @IsOptional()
  @IsString()
  shippingMethod?: string

  @IsOptional()
  @IsString()
  referenceNumber?: string

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSaleOrderItemDto)
  items: CreateSaleOrderItemDto[]
}