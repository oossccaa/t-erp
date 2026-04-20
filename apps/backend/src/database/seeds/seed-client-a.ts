import { Pool, PoolClient } from 'pg'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(__dirname, '../../../..', '.env') })

const dbName = process.env.DB_NAME
if (dbName !== 't_erp_a') {
  console.error(`❌ 拒絕執行：此腳本僅用於 t_erp_a，當前 DB_NAME="${dbName}"`)
  process.exit(1)
}

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rand = mulberry32(20260420)
const randInt = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min
const pick = <T>(arr: T[]): T => arr[Math.floor(rand() * arr.length)]
const pickN = <T>(arr: T[], n: number): T[] => {
  const copy = [...arr]
  const out: T[] = []
  for (let i = 0; i < n && copy.length > 0; i++) out.push(copy.splice(Math.floor(rand() * copy.length), 1)[0])
  return out
}

const startDate = new Date('2025-11-01')
const endDate = new Date('2026-04-20')
function randomDate(): Date {
  const ms = startDate.getTime() + rand() * (endDate.getTime() - startDate.getTime())
  return new Date(ms)
}
function fmtDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}
function fmtTs(d: Date): string {
  return d.toISOString().slice(0, 19).replace('T', ' ')
}

const CATEGORIES: Array<{ name: string; parent?: string }> = [
  { name: '越野車' },
  { name: '輪胎' },
  { name: 'SUV', parent: '越野車' },
  { name: 'ATV', parent: '越野車' },
  { name: 'UTV', parent: '越野車' },
  { name: '越野機車', parent: '越野車' },
  { name: '14吋', parent: '輪胎' },
  { name: '15吋', parent: '輪胎' },
  { name: '16吋', parent: '輪胎' },
]

type ProductSeed = {
  sku: string
  name: string
  category: string
  unitPrice: number
  costPrice: number
  unit: string
  minStock: number
}
const PRODUCTS: ProductSeed[] = [
  { sku: 'SUV-RAPTOR-3000', name: 'RAPTOR 3000 四驅越野車', category: 'SUV', unitPrice: 1850000, costPrice: 1480000, unit: '輛', minStock: 1 },
  { sku: 'SUV-LANDMAX-5000', name: 'LANDMAX 5000 四驅越野車', category: 'SUV', unitPrice: 2200000, costPrice: 1760000, unit: '輛', minStock: 1 },
  { sku: 'SUV-DESERT-KING', name: 'DESERT KING 沙漠王者', category: 'SUV', unitPrice: 1680000, costPrice: 1344000, unit: '輛', minStock: 1 },
  { sku: 'SUV-MOUNTAIN-X', name: 'MOUNTAIN X 山岳越野', category: 'SUV', unitPrice: 1520000, costPrice: 1216000, unit: '輛', minStock: 1 },
  { sku: 'SUV-TRAIL-PRO', name: 'TRAIL PRO 專業越野', category: 'SUV', unitPrice: 1280000, costPrice: 1024000, unit: '輛', minStock: 2 },

  { sku: 'ATV-250', name: 'ATV 250 四輪越野車', category: 'ATV', unitPrice: 180000, costPrice: 135000, unit: '輛', minStock: 2 },
  { sku: 'ATV-450', name: 'ATV 450 越野四輪車', category: 'ATV', unitPrice: 260000, costPrice: 195000, unit: '輛', minStock: 2 },
  { sku: 'ATV-650', name: 'ATV 650 大馬力四輪', category: 'ATV', unitPrice: 340000, costPrice: 255000, unit: '輛', minStock: 2 },
  { sku: 'ATV-QUAD-700', name: 'QUAD 700 競技型 ATV', category: 'ATV', unitPrice: 380000, costPrice: 285000, unit: '輛', minStock: 2 },
  { sku: 'ATV-SPORT-800', name: 'SPORT 800 運動型 ATV', category: 'ATV', unitPrice: 420000, costPrice: 315000, unit: '輛', minStock: 2 },

  { sku: 'UTV-900X', name: 'UTV 900X 雙人越野', category: 'UTV', unitPrice: 620000, costPrice: 465000, unit: '輛', minStock: 1 },
  { sku: 'UTV-1000R', name: 'UTV 1000R 競速越野', category: 'UTV', unitPrice: 780000, costPrice: 585000, unit: '輛', minStock: 1 },
  { sku: 'UTV-TURBO-1000', name: 'TURBO 1000 渦輪越野', category: 'UTV', unitPrice: 880000, costPrice: 660000, unit: '輛', minStock: 1 },
  { sku: 'UTV-SIDE-1200', name: 'SIDE 1200 雙人 UTV', category: 'UTV', unitPrice: 960000, costPrice: 720000, unit: '輛', minStock: 1 },
  { sku: 'UTV-CREW-1400', name: 'CREW 1400 四人越野', category: 'UTV', unitPrice: 1180000, costPrice: 885000, unit: '輛', minStock: 1 },

  { sku: 'MOTO-KTM-350', name: 'KTM 350 EXC 越野機車', category: '越野機車', unitPrice: 148000, costPrice: 118000, unit: '輛', minStock: 3 },
  { sku: 'MOTO-HONDA-CRF450', name: 'HONDA CRF 450 越野機車', category: '越野機車', unitPrice: 136000, costPrice: 108000, unit: '輛', minStock: 3 },
  { sku: 'MOTO-YAMAHA-WR250', name: 'YAMAHA WR 250 越野機車', category: '越野機車', unitPrice: 98000, costPrice: 78000, unit: '輛', minStock: 3 },
  { sku: 'MOTO-SUZUKI-RMZ450', name: 'SUZUKI RMZ 450 越野機車', category: '越野機車', unitPrice: 128000, costPrice: 102000, unit: '輛', minStock: 3 },
  { sku: 'MOTO-KAWASAKI-KLX300', name: 'KAWASAKI KLX 300 越野機車', category: '越野機車', unitPrice: 108000, costPrice: 86000, unit: '輛', minStock: 3 },

  { sku: 'TIRE-14-AT1', name: '14吋 AT 全地形胎', category: '14吋', unitPrice: 2800, costPrice: 1850, unit: '條', minStock: 20 },
  { sku: 'TIRE-14-AT2', name: '14吋 AT 強化全地形胎', category: '14吋', unitPrice: 3200, costPrice: 2100, unit: '條', minStock: 20 },
  { sku: 'TIRE-14-MT1', name: '14吋 MT 泥地胎', category: '14吋', unitPrice: 3600, costPrice: 2400, unit: '條', minStock: 20 },
  { sku: 'TIRE-14-MT2', name: '14吋 MT 重泥地胎', category: '14吋', unitPrice: 4200, costPrice: 2800, unit: '條', minStock: 15 },
  { sku: 'TIRE-14-HT1', name: '14吋 HT 公路胎', category: '14吋', unitPrice: 2400, costPrice: 1600, unit: '條', minStock: 25 },
  { sku: 'TIRE-14-SAND', name: '14吋 沙地胎', category: '14吋', unitPrice: 3800, costPrice: 2500, unit: '條', minStock: 10 },
  { sku: 'TIRE-14-MUD', name: '14吋 深泥胎', category: '14吋', unitPrice: 4000, costPrice: 2650, unit: '條', minStock: 10 },

  { sku: 'TIRE-15-AT1', name: '15吋 AT 全地形胎', category: '15吋', unitPrice: 3400, costPrice: 2250, unit: '條', minStock: 20 },
  { sku: 'TIRE-15-AT2', name: '15吋 AT 強化全地形胎', category: '15吋', unitPrice: 3800, costPrice: 2500, unit: '條', minStock: 20 },
  { sku: 'TIRE-15-MT1', name: '15吋 MT 泥地胎', category: '15吋', unitPrice: 4400, costPrice: 2900, unit: '條', minStock: 20 },
  { sku: 'TIRE-15-MT2', name: '15吋 MT 重泥地胎', category: '15吋', unitPrice: 5200, costPrice: 3450, unit: '條', minStock: 15 },
  { sku: 'TIRE-15-HT1', name: '15吋 HT 公路胎', category: '15吋', unitPrice: 3000, costPrice: 2000, unit: '條', minStock: 25 },
  { sku: 'TIRE-15-SAND', name: '15吋 沙地胎', category: '15吋', unitPrice: 4600, costPrice: 3050, unit: '條', minStock: 10 },
  { sku: 'TIRE-15-MUD', name: '15吋 深泥胎', category: '15吋', unitPrice: 4800, costPrice: 3200, unit: '條', minStock: 10 },

  { sku: 'TIRE-16-AT1', name: '16吋 AT 全地形胎', category: '16吋', unitPrice: 4200, costPrice: 2800, unit: '條', minStock: 20 },
  { sku: 'TIRE-16-AT2', name: '16吋 AT 強化全地形胎', category: '16吋', unitPrice: 4800, costPrice: 3200, unit: '條', minStock: 15 },
  { sku: 'TIRE-16-MT1', name: '16吋 MT 泥地胎', category: '16吋', unitPrice: 5600, costPrice: 3700, unit: '條', minStock: 15 },
  { sku: 'TIRE-16-MT2', name: '16吋 MT 重泥地胎', category: '16吋', unitPrice: 6800, costPrice: 4500, unit: '條', minStock: 10 },
  { sku: 'TIRE-16-HT1', name: '16吋 HT 公路胎', category: '16吋', unitPrice: 3800, costPrice: 2550, unit: '條', minStock: 20 },
  { sku: 'TIRE-16-SAND', name: '16吋 沙地胎', category: '16吋', unitPrice: 6200, costPrice: 4100, unit: '條', minStock: 10 },
]

const SUPPLIERS = [
  { name: '大和引擎工業', person: '山田太郎', phone: '03-2501-8800', email: 'sales@yamato-engine.co.jp', addr: '日本東京都大田區' },
  { name: '富士避震器', person: '佐藤健一', phone: '03-2501-9200', email: 'contact@fuji-damper.co.jp', addr: '日本靜岡縣濱松市' },
  { name: '台中越野車架廠', person: '林志明', phone: '04-2356-7788', email: 'sales@tc-frame.com.tw', addr: '台中市北屯區工業路 88 號' },
  { name: '高雄電裝零件', person: '陳文龍', phone: '07-811-5566', email: 'info@ks-electric.com.tw', addr: '高雄市楠梓區加昌路 123 號' },
  { name: '桃園輪胎代工', person: '王建華', phone: '03-451-2288', email: 'sales@ty-tire.com.tw', addr: '桃園市龜山區工業一路 56 號' },
  { name: 'KTM 台灣代理', person: '黃品嘉', phone: '02-2712-8899', email: 'taipei@ktm-tw.com', addr: '台北市松山區敦化北路 168 號' },
  { name: 'HONDA 越野配件', person: '張淑芬', phone: '02-2798-4400', email: 'offroad@honda-parts.tw', addr: '台北市內湖區瑞光路 200 號' },
  { name: 'Polaris 台灣總代理', person: '吳俊傑', phone: '04-2329-1122', email: 'taiwan@polaris-dealer.com', addr: '台中市西屯區台灣大道 500 號' },
  { name: 'CanAm 越野車行', person: '李承宗', phone: '02-8751-3344', email: 'sales@canam-tw.com', addr: '新北市汐止區新台五路 88 號' },
  { name: 'Yamaha Motor 台灣', person: '林美慧', phone: '02-2504-6677', email: 'offroad@yamaha-tw.com', addr: '台北市中山區南京東路 2 段 1 號' },
  { name: '上益化工油品', person: '蔡秉諺', phone: '04-2529-8822', email: 'order@sang-yi-oil.com.tw', addr: '台中市大雅區中清路 1200 號' },
  { name: '大揚避震改裝', person: '許文傑', phone: '04-2492-3355', email: 'tuning@dayang-susp.com.tw', addr: '台中市大里區工業路 55 號' },
  { name: '南僑輪圈工業', person: '周建志', phone: '06-253-7700', email: 'wheel@nanchiao-rim.com.tw', addr: '台南市永康區中華路 900 號' },
  { name: '東洋機車配件', person: '謝宗翰', phone: '02-8992-5566', email: 'moto@toyo-parts.com.tw', addr: '新北市新莊區思源路 88 號' },
  { name: '明欣越野改裝', person: '劉家豪', phone: '03-332-4411', email: 'tuning@mingshin-4x4.com.tw', addr: '桃園市桃園區介壽路 300 號' },
  { name: '巨鑫車架製造', person: '楊銘哲', phone: '04-7825-9988', email: 'sales@jushin-frame.com.tw', addr: '彰化縣和美鎮彰新路 500 號' },
  { name: '新竹 LED 車燈', person: '賴柏翰', phone: '03-563-1188', email: 'light@hc-led.com.tw', addr: '新竹市香山區中華路 1000 號' },
  { name: '東元卡鉗煞車', person: '鄭宇翔', phone: '07-615-2266', email: 'brake@toyuan-brake.com.tw', addr: '高雄市岡山區介壽路 200 號' },
  { name: 'BRIDGESTONE 台灣', person: '朱雅婷', phone: '02-8752-7777', email: 'offroad@bridgestone.com.tw', addr: '台北市信義區信義路 5 段 7 號' },
  { name: 'MICHELIN 台灣越野部', person: '趙之翰', phone: '02-8758-3344', email: 'offroad@michelin.com.tw', addr: '台北市信義區忠孝東路 5 段 88 號' },
  { name: 'MAXXIS 正新橡膠', person: '魏政賢', phone: '04-7811-3344', email: 'offroad@maxxis.com.tw', addr: '彰化縣花壇鄉中山路 1 段 2 號' },
]

const CUSTOMERS = [
  { name: '越野狂熱車行', person: '王大衛', phone: '02-2792-3344' },
  { name: '山林越野俱樂部', person: '林俊宏', phone: '03-472-8899' },
  { name: '沙漠風暴車隊', person: '陳偉誠', phone: '04-2315-6677' },
  { name: '北部越野聯盟', person: '李家豪', phone: '02-8751-2233' },
  { name: '中部 4x4 俱樂部', person: '張智翔', phone: '04-2258-9900' },
  { name: '南部越野車隊', person: '黃志明', phone: '07-291-4455' },
  { name: '東部極限越野', person: '吳建志', phone: '03-833-5566' },
  { name: '阿里山越野租車', person: '蔡坤霖', phone: '05-267-8822' },
  { name: '玉山越野體驗營', person: '許志豪', phone: '04-2873-1100' },
  { name: '墾丁沙灘車出租', person: '周明德', phone: '08-886-2233' },
  { name: '花蓮越野冒險', person: '謝俊傑', phone: '03-834-7788' },
  { name: '台北越野改裝廠', person: '劉建宏', phone: '02-2798-5544' },
  { name: '新北極限車行', person: '楊哲偉', phone: '02-2252-3366' },
  { name: '桃園越野世界', person: '賴政勳', phone: '03-361-4477' },
  { name: '新竹越野樂園', person: '鄭凱文', phone: '03-555-8899' },
  { name: '台中 4x4 越野中心', person: '朱建良', phone: '04-2471-2211' },
  { name: '彰化越野俱樂部', person: '趙俊豪', phone: '04-722-3344' },
  { name: '南投山區越野隊', person: '魏宗霖', phone: '049-220-7788' },
  { name: '嘉義農場越野', person: '宋嘉偉', phone: '05-224-9900' },
  { name: '台南古都越野隊', person: '馮家瑋', phone: '06-214-6677' },
  { name: '高雄極限車迷會', person: '范承翰', phone: '07-215-5544' },
  { name: '屏東墾丁車行', person: '唐俊宇', phone: '08-733-2299' },
  { name: '宜蘭越野生活', person: '沈柏言', phone: '03-931-8822' },
  { name: '苗栗越野體驗', person: '曾志偉', phone: '037-323-4411' },
  { name: '雲林越野農場', person: '孫政達', phone: '05-532-7788' },
  { name: '越野玩家 - 陳先生', person: '陳志遠', phone: '0920-112-233' },
  { name: '越野玩家 - 王先生', person: '王大明', phone: '0932-445-566' },
  { name: '越野玩家 - 李小姐', person: '李佩芬', phone: '0955-778-899' },
  { name: '越野玩家 - 張先生', person: '張家豪', phone: '0911-223-344' },
  { name: '越野玩家 - 林先生', person: '林俊男', phone: '0928-667-788' },
  { name: '越野玩家 - 吳小姐', person: '吳宜芳', phone: '0916-334-455' },
  { name: '越野玩家 - 黃先生', person: '黃建志', phone: '0952-998-877' },
  { name: '越野玩家 - 蔡先生', person: '蔡文賢', phone: '0938-221-100' },
  { name: '越野玩家 - 許先生', person: '許俊豪', phone: '0926-554-433' },
  { name: '越野車部落客 - 阿泰', person: '泰勒', phone: '0912-876-543' },
  { name: '越野攝影師工作室', person: '阮志遠', phone: '02-8791-2020' },
  { name: '極地探險協會', person: '戴宗翰', phone: '02-2712-8800' },
  { name: '台灣越野運動協會', person: '彭家豪', phone: '04-2229-6677' },
  { name: '亞洲越野賽事公司', person: '胡俊男', phone: '02-7730-4411' },
]

type ProductRow = { id: number; sku: string; name: string; unit: string; unitPrice: number; costPrice: number; stock: number }

async function seed() {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres123',
    database: dbName,
  })
  const client = await pool.connect()

  try {
    await client.query('BEGIN')
    console.log(`🎯 開始灌 A 客戶（越野車廠）demo 資料到 ${dbName}...`)

    await client.query(`
      TRUNCATE TABLE inventory_transactions, inventory_adjustment_items, inventory_adjustments,
                     sale_order_items, sale_orders, purchase_order_items, purchase_orders,
                     products, categories, customers, suppliers, users
      RESTART IDENTITY CASCADE
    `)
    console.log('🧹 清空既有資料')

    // admin 使用者（跟 B 對齊）
    const bcryptHash = '$2b$10$24bdmL1TrH94q95xSwsQUuF/2Rf4r5RQ521ufXlTM2plaSyAFpwoW' // admin123
    const adminRes = await client.query(
      `INSERT INTO users (username, email, password, role, is_active) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      ['admin', 'admin@terp.dev', bcryptHash, 'admin', true],
    )
    const adminId = adminRes.rows[0].id
    console.log(`👤 admin user id=${adminId}`)

    const catIds: Record<string, number> = {}
    for (const c of CATEGORIES.filter((c) => !c.parent)) {
      const r = await client.query(`INSERT INTO categories (name) VALUES ($1) RETURNING id`, [c.name])
      catIds[c.name] = r.rows[0].id
    }
    for (const c of CATEGORIES.filter((c) => c.parent)) {
      const r = await client.query(`INSERT INTO categories (name, parent_id) VALUES ($1, $2) RETURNING id`, [c.name, catIds[c.parent!]])
      catIds[c.name] = r.rows[0].id
    }
    console.log(`📂 ${CATEGORIES.length} 個分類建立`)

    const products: ProductRow[] = []
    for (const p of PRODUCTS) {
      const initialStock = randInt(p.minStock * 4, p.minStock * 12)
      const r = await client.query(
        `INSERT INTO products (sku, name, category_id, unit_price, cost_price, unit, stock_quantity, min_stock_level)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
        [p.sku, p.name, catIds[p.category], p.unitPrice, p.costPrice, p.unit, initialStock, p.minStock],
      )
      products.push({ id: r.rows[0].id, sku: p.sku, name: p.name, unit: p.unit, unitPrice: p.unitPrice, costPrice: p.costPrice, stock: initialStock })
    }
    console.log(`📦 ${products.length} 個產品建立`)

    // 生成假統編（8 碼，deterministic 不重複，不保證合法但格式正確）
    const genTaxId = (i: number) => String(22100000 + i * 37).padStart(8, '0').slice(-8)

    const supplierIds: number[] = []
    for (let i = 0; i < SUPPLIERS.length; i++) {
      const s = SUPPLIERS[i]
      const r = await client.query(
        `INSERT INTO suppliers (name, contact_person, phone, email, tax_id, address, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, true) RETURNING id`,
        [s.name, s.person, s.phone, s.email, genTaxId(i), s.addr],
      )
      supplierIds.push(r.rows[0].id)
    }
    console.log(`🏭 ${SUPPLIERS.length} 個供應商建立`)

    const customerIds: number[] = []
    for (let i = 0; i < CUSTOMERS.length; i++) {
      const c = CUSTOMERS[i]
      const email = `customer${i + 1}@demo-offroad.tw`
      const r = await client.query(
        `INSERT INTO customers (name, contact_person, phone, email, tax_id, is_active)
         VALUES ($1, $2, $3, $4, $5, true) RETURNING id`,
        [c.name, c.person, c.phone, email, genTaxId(i + SUPPLIERS.length)],
      )
      customerIds.push(r.rows[0].id)
    }
    console.log(`🤝 ${CUSTOMERS.length} 個客戶建立`)

    // === 產生進貨單 128 張 ===
    const poCount = 128
    const poStatuses = ['received', 'received', 'received', 'received', 'received', 'received', 'completed', 'completed', 'cancelled']
    let poOrderSeq = 0
    let inventoryTxnCount = 0
    const targetTxnCount = 246
    const poDates = Array.from({ length: poCount }, () => randomDate()).sort((a, b) => a.getTime() - b.getTime())

    for (let i = 0; i < poCount; i++) {
      const orderDate = poDates[i]
      const supplierId = pick(supplierIds)
      const status = pick(poStatuses)
      const itemCount = randInt(1, 3)
      const poProducts = pickN(products, itemCount)

      poOrderSeq++
      const orderNumber = `PO${fmtDate(orderDate).replace(/-/g, '')}${String(poOrderSeq).padStart(4, '0')}`

      let subtotal = 0
      const itemsData = poProducts.map((p, idx) => {
        const qty = randInt(2, 12)
        const unitPrice = p.costPrice
        const totalPrice = qty * unitPrice
        subtotal += totalPrice
        return { p, qty, unitPrice, totalPrice, line: idx + 1 }
      })

      const poRes = await client.query(
        `INSERT INTO purchase_orders ("orderNumber", status, "paymentStatus", "supplierId", "createdById", "orderDate",
          subtotal, "totalAmount", "taxAmount", "taxRate", "discountAmount", "discountRate", "shippingCost", "paidAmount")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, 0, 0, 0, 0, $9) RETURNING id`,
        [
          orderNumber,
          status,
          status === 'received' || status === 'completed' ? 'paid' : 'unpaid',
          supplierId,
          adminId,
          fmtDate(orderDate),
          subtotal,
          subtotal,
          status === 'received' || status === 'completed' ? subtotal : 0,
        ],
      )
      const poId = poRes.rows[0].id

      for (const it of itemsData) {
        await client.query(
          `INSERT INTO purchase_order_items ("purchaseOrderId", "productId", "productName", "productSku", unit, quantity, "unitPrice", "totalPrice", "receivedQuantity", "lineNumber")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [poId, it.p.id, it.p.name, it.p.sku, it.p.unit, it.qty, it.unitPrice, it.totalPrice, status === 'cancelled' ? 0 : it.qty, it.line],
        )

        if (status !== 'cancelled' && inventoryTxnCount < targetTxnCount) {
          const before = it.p.stock
          const after = before + it.qty
          it.p.stock = after
          await client.query(
            `UPDATE products SET stock_quantity = $1 WHERE id = $2`,
            [after, it.p.id],
          )
          await client.query(
            `INSERT INTO inventory_transactions ("productId", type, "quantityBefore", "quantityChanged", "quantityAfter",
              "unitCost", "totalCost", "referenceType", "referenceId", "referenceNumber", "createdById", "transactionDate")
             VALUES ($1, 'purchase_receive', $2, $3, $4, $5, $6, 'purchase_order', $7, $8, $9, $10)`,
            [it.p.id, before, it.qty, after, it.unitPrice, it.totalPrice, poId, orderNumber, adminId, fmtTs(orderDate)],
          )
          inventoryTxnCount++
        }
      }
    }
    console.log(`📥 ${poCount} 張進貨單（${inventoryTxnCount} 筆進貨異動）`)

    // === 產生銷貨單 305 張 ===
    const soCount = 305
    const soStatuses = ['confirmed', 'confirmed', 'completed', 'completed', 'completed', 'delivered', 'delivered', 'cancelled']
    const shippingStatuses: Record<string, string> = {
      confirmed: 'not_shipped',
      completed: 'delivered',
      delivered: 'delivered',
      cancelled: 'not_shipped',
    }
    let soOrderSeq = 0
    const soDates = Array.from({ length: soCount }, () => randomDate()).sort((a, b) => a.getTime() - b.getTime())

    for (let i = 0; i < soCount; i++) {
      const orderDate = soDates[i]
      const customerId = pick(customerIds)
      const status = pick(soStatuses)
      const itemCount = randInt(1, 3)
      const soProducts = pickN(products.filter((p) => p.stock > 0), itemCount)
      if (soProducts.length === 0) continue

      soOrderSeq++
      const orderNumber = `SO${fmtDate(orderDate).replace(/-/g, '')}${String(soOrderSeq).padStart(4, '0')}`

      let subtotal = 0
      const itemsData = soProducts.map((p, idx) => {
        const maxQty = Math.min(p.stock, p.unit === '輛' ? 3 : 20)
        const qty = randInt(1, Math.max(1, maxQty))
        const unitPrice = p.unitPrice
        const totalPrice = qty * unitPrice
        subtotal += totalPrice
        return { p, qty, unitPrice, totalPrice, line: idx + 1 }
      })

      const soRes = await client.query(
        `INSERT INTO sale_orders ("orderNumber", status, "paymentStatus", "shippingStatus", "customerId", "createdById", "orderDate",
          subtotal, "totalAmount", "taxAmount", "taxRate", "discountAmount", "discountRate", "shippingCost", "paidAmount")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 0, 0, 0, 0, 0, $10) RETURNING id`,
        [
          orderNumber,
          status,
          status === 'completed' || status === 'delivered' ? 'paid' : status === 'cancelled' ? 'unpaid' : 'partially_paid',
          shippingStatuses[status],
          customerId,
          adminId,
          fmtDate(orderDate),
          subtotal,
          subtotal,
          status === 'completed' || status === 'delivered' ? subtotal : status === 'cancelled' ? 0 : subtotal / 2,
        ],
      )
      const soId = soRes.rows[0].id

      for (const it of itemsData) {
        await client.query(
          `INSERT INTO sale_order_items ("saleOrderId", "productId", "productName", "productSku", unit, quantity, "unitPrice", "totalPrice", "shippedQuantity", "discountRate", "discountAmount", "lineNumber")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 0, 0, $10)`,
          [soId, it.p.id, it.p.name, it.p.sku, it.p.unit, it.qty, it.unitPrice, it.totalPrice, status === 'cancelled' ? 0 : it.qty, it.line],
        )

        if (status !== 'cancelled' && inventoryTxnCount < targetTxnCount) {
          const before = it.p.stock
          const after = before - it.qty
          it.p.stock = after
          await client.query(
            `UPDATE products SET stock_quantity = $1 WHERE id = $2`,
            [after, it.p.id],
          )
          await client.query(
            `INSERT INTO inventory_transactions ("productId", type, "quantityBefore", "quantityChanged", "quantityAfter",
              "unitCost", "totalCost", "referenceType", "referenceId", "referenceNumber", "createdById", "transactionDate")
             VALUES ($1, 'sale_ship', $2, $3, $4, $5, $6, 'sale_order', $7, $8, $9, $10)`,
            [it.p.id, before, -it.qty, after, it.p.costPrice, it.p.costPrice * it.qty, soId, orderNumber, adminId, fmtTs(orderDate)],
          )
          inventoryTxnCount++
        }
      }
    }
    console.log(`📤 ${soCount} 張銷貨單（累計 ${inventoryTxnCount} 筆庫存異動）`)

    await client.query('COMMIT')

    const counts = await client.query(`
      SELECT 'categories' AS t, COUNT(*) FROM categories
      UNION ALL SELECT 'products', COUNT(*) FROM products
      UNION ALL SELECT 'suppliers', COUNT(*) FROM suppliers
      UNION ALL SELECT 'customers', COUNT(*) FROM customers
      UNION ALL SELECT 'purchase_orders', COUNT(*) FROM purchase_orders
      UNION ALL SELECT 'purchase_order_items', COUNT(*) FROM purchase_order_items
      UNION ALL SELECT 'sale_orders', COUNT(*) FROM sale_orders
      UNION ALL SELECT 'sale_order_items', COUNT(*) FROM sale_order_items
      UNION ALL SELECT 'inventory_transactions', COUNT(*) FROM inventory_transactions
      UNION ALL SELECT 'users', COUNT(*) FROM users
    `)
    console.log('\n✅ A 客戶 demo 完成，各表資料量：')
    counts.rows.forEach((r) => console.log(`  ${r.t}: ${r.count}`))
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('❌ seed 失敗，已 rollback：', err)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

seed()
