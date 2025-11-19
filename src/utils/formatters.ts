export function formatDateTime(
  date: Date | number,
  format: string = 'YYYY-MM-DD HH:mm:ss'
): string {
  const d = typeof date === 'number' ? new Date(date) : date

  if (!(d instanceof Date) || isNaN(d.getTime())) {
    return ''
  }

  if (format === 'relative') {
    return formatRelativeTime(d)
  }

  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')

  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds)
}

export function formatRelativeTime(date: Date | number): string {
  const d = typeof date === 'number' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSeconds < 10) {
    return '剛剛'
  } else if (diffSeconds < 60) {
    return `${diffSeconds}秒前`
  } else if (diffMinutes < 60) {
    return `${diffMinutes}分鐘前`
  } else if (diffHours < 24) {
    return `${diffHours}小時前`
  } else if (diffDays < 7) {
    return `${diffDays}天前`
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7)
    return `${weeks}週前`
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30)
    return `${months}個月前`
  } else {
    const years = Math.floor(diffDays / 365)
    return `${years}年前`
  }
}

export function generateFilename(
  prefix: string = '檔案',
  extension: string = 'txt',
  includeMilliseconds: boolean = false
): string {
  const now = new Date()
  let timestamp = formatDateTime(now, 'YYYYMMDD_HHmmss')

  if (includeMilliseconds) {
    const ms = String(now.getMilliseconds()).padStart(3, '0')
    timestamp += `_${ms}`
  }

  const cleanPrefix = sanitizeFilename(prefix)

  return `${cleanPrefix}_${timestamp}.${extension}`
}

export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
    .replace(/\s+/g, '_') // 將空白替換為底線
    .replace(/_{2,}/g, '_') // 將多個底線合併為一個
    .replace(/^_+|_+$/g, '') // 移除開頭和結尾的底線
    .substring(0, 200) // 限制長度
}

/**
 * 格式化檔案大小
 * @param bytes 位元組數
 * @param decimals 小數位數
 * @returns 格式化後的檔案大小字串（例如：1.5 MB）
 */
export function formatFileSize(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes'
  if (bytes < 0) return ''

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`
}

/**
 * 格式化數字，加入千分位逗號
 * @param num 數字
 * @param decimals 小數位數
 * @returns 格式化後的數字字串（例如：1,234,567.89）
 */
export function formatNumber(num: number, decimals?: number): string {
  if (typeof num !== 'number' || isNaN(num)) {
    return ''
  }

  const parts = decimals !== undefined ? num.toFixed(decimals).split('.') : String(num).split('.')
  if (parts[0]) {
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }

  return parts.join('.')
}

/**
 * 截斷文字並加入省略符號
 * @param text 原始文字
 * @param maxLength 最大長度
 * @param ellipsis 省略符號
 * @returns 截斷後的文字
 */
export function truncateText(text: string, maxLength: number, ellipsis: string = '...'): string {
  if (!text || text.length <= maxLength) {
    return text
  }

  return text.substring(0, maxLength - ellipsis.length) + ellipsis
}

/**
 * 格式化搜尋條件為可讀字串
 * @param criteria 搜尋條件物件
 * @returns 格式化後的搜尋條件字串
 */
export function formatSearchCriteria(criteria: Record<string, string[] | undefined>): string {
  const parts: string[] = []

  const fieldNames: Record<string, string> = {
    fieldNumber: '欄位編號',
    fieldName: '欄位名稱',
    fileCode: '檔案代碼',
    fileName: '檔案名稱',
    dataType: '型態',
    length: '長度',
    fieldDescription: '欄位說明',
    remark: 'Remark',
  }

  for (const [field, values] of Object.entries(criteria)) {
    if (values && values.length > 0) {
      const fieldName = fieldNames[field] || field
      const valueStr = values.join(', ')
      parts.push(`${fieldName}: ${valueStr}`)
    }
  }

  return parts.join(' | ') || '無搜尋條件'
}

/**
 * 高亮顯示搜尋關鍵字
 * @param text 原始文字
 * @param keywords 關鍵字陣列
 * @param highlightClass CSS 類別名稱
 * @returns 包含高亮標記的 HTML 字串
 */
export function highlightKeywords(
  text: string,
  keywords: string[],
  highlightClass: string = 'highlight'
): string {
  if (!text || !keywords || keywords.length === 0) {
    return text
  }

  let result = text

  // 按關鍵字長度排序（長的先處理，避免部分匹配問題）
  const sortedKeywords = [...keywords].sort((a, b) => b.length - a.length)

  sortedKeywords.forEach((keyword) => {
    if (!keyword) return

    // 轉義特殊字元
    const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(`(${escapedKeyword})`, 'gi')

    result = result.replace(regex, `<span class="${highlightClass}">$1</span>`)
  })

  return result
}
