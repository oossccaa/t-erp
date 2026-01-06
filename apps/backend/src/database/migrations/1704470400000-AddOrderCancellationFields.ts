import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm'

export class AddOrderCancellationFields1704470400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 為 purchase_orders 表添加取消相關欄位
    await queryRunner.addColumn(
      'purchase_orders',
      new TableColumn({
        name: 'cancelReason',
        type: 'varchar',
        length: '500',
        isNullable: true,
        comment: '取消原因',
      })
    )

    await queryRunner.addColumn(
      'purchase_orders',
      new TableColumn({
        name: 'cancelledAt',
        type: 'timestamp',
        isNullable: true,
        comment: '取消時間',
      })
    )

    await queryRunner.addColumn(
      'purchase_orders',
      new TableColumn({
        name: 'cancelledById',
        type: 'int',
        isNullable: true,
        comment: '取消操作者 ID',
      })
    )

    await queryRunner.addColumn(
      'purchase_orders',
      new TableColumn({
        name: 'statusHistory',
        type: 'jsonb',
        isNullable: true,
        comment: '狀態變更歷史記錄',
      })
    )

    // 為 purchase_orders.cancelledById 添加外鍵約束
    await queryRunner.createForeignKey(
      'purchase_orders',
      new TableForeignKey({
        name: 'FK_purchase_orders_cancelledBy',
        columnNames: ['cancelledById'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      })
    )

    // 為 sale_orders 表添加取消相關欄位
    await queryRunner.addColumn(
      'sale_orders',
      new TableColumn({
        name: 'cancelReason',
        type: 'varchar',
        length: '500',
        isNullable: true,
        comment: '取消原因',
      })
    )

    await queryRunner.addColumn(
      'sale_orders',
      new TableColumn({
        name: 'cancelledAt',
        type: 'timestamp',
        isNullable: true,
        comment: '取消時間',
      })
    )

    await queryRunner.addColumn(
      'sale_orders',
      new TableColumn({
        name: 'cancelledById',
        type: 'int',
        isNullable: true,
        comment: '取消操作者 ID',
      })
    )

    await queryRunner.addColumn(
      'sale_orders',
      new TableColumn({
        name: 'statusHistory',
        type: 'jsonb',
        isNullable: true,
        comment: '狀態變更歷史記錄',
      })
    )

    // 為 sale_orders.cancelledById 添加外鍵約束
    await queryRunner.createForeignKey(
      'sale_orders',
      new TableForeignKey({
        name: 'FK_sale_orders_cancelledBy',
        columnNames: ['cancelledById'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      })
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 回滾 sale_orders 的變更
    await queryRunner.dropForeignKey('sale_orders', 'FK_sale_orders_cancelledBy')
    await queryRunner.dropColumn('sale_orders', 'statusHistory')
    await queryRunner.dropColumn('sale_orders', 'cancelledById')
    await queryRunner.dropColumn('sale_orders', 'cancelledAt')
    await queryRunner.dropColumn('sale_orders', 'cancelReason')

    // 回滾 purchase_orders 的變更
    await queryRunner.dropForeignKey('purchase_orders', 'FK_purchase_orders_cancelledBy')
    await queryRunner.dropColumn('purchase_orders', 'statusHistory')
    await queryRunner.dropColumn('purchase_orders', 'cancelledById')
    await queryRunner.dropColumn('purchase_orders', 'cancelledAt')
    await queryRunner.dropColumn('purchase_orders', 'cancelReason')
  }
}
