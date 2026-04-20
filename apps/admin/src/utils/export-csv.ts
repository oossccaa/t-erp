export interface CsvColumn<T> {
  header: string
  value: (row: T) => string | number | null | undefined
}

/**
 * 把資料陣列轉成 CSV 並觸發下載。
 * - 自動加上 UTF-8 BOM，Excel 開中文不會亂碼
 * - 含逗號、引號、換行的值會自動被加上雙引號跳脫
 */
export function downloadCsv<T>(
  rows: T[],
  columns: CsvColumn<T>[],
  filename: string,
): void {
  const escape = (raw: unknown): string => {
    if (raw === null || raw === undefined) return ''
    const s = String(raw)
    if (/[",\n\r]/.test(s)) {
      return `"${s.replace(/"/g, '""')}"`
    }
    return s
  }

  const headerLine = columns.map((c) => escape(c.header)).join(',')
  const bodyLines = rows.map((row) =>
    columns.map((c) => escape(c.value(row))).join(','),
  )
  const csv = [headerLine, ...bodyLines].join('\r\n')

  const BOM = '\uFEFF'
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
