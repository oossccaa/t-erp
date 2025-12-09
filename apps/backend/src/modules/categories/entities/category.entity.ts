import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm'
import { ApiProperty } from '@nestjs/swagger'
import { BaseEntity } from '../../../common/entities/base.entity'

@Entity('categories')
export class Category extends BaseEntity {
  @ApiProperty({ description: '分類名稱' })
  @Column({ length: 100, comment: '分類名稱' })
  name: string

  @ApiProperty({ description: '分類描述', required: false })
  @Column({ type: 'text', nullable: true, comment: '分類描述' })
  description?: string

  @ApiProperty({ description: '父分類 ID', required: false })
  @Column({ name: 'parent_id', nullable: true, comment: '父分類 ID' })
  parentId?: number

  @ApiProperty({ description: '父分類', required: false })
  @ManyToOne(() => Category, (category) => category.children, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'parent_id' })
  parent?: Category

  @ApiProperty({ description: '子分類列表', type: () => [Category] })
  @OneToMany(() => Category, (category) => category.parent)
  children: Category[]
}