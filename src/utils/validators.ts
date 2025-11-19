import type { SearchCriteria } from '../types'

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

export function validateSearchCriteria(criteria: SearchCriteria): ValidationResult {
  const errors: string[] = []

  const hasAnyCriteria = Object.values(criteria).some(
    (values) => values && values.length > 0 && values.some((v: string) => v.trim() !== '')
  )

  if (!hasAnyCriteria) {
    errors.push('請至少輸入一個搜尋條件')
  }

  for (const [field, values] of Object.entries(criteria)) {
    if (!values || values.length === 0) continue

    const emptyValues = values.filter((v: string) => !v || v.trim() === '')
    if (emptyValues.length > 0) {
      errors.push(`${getFieldDisplayName(field)} 包含空白條件`)
    }

    const tooLongValues = values.filter((v: string) => v.length > 100)
    if (tooLongValues.length > 0) {
      errors.push(`${getFieldDisplayName(field)} 的條件過長（最多 100 字元）`)
    }

    if (values.length > 20) {
      errors.push(`${getFieldDisplayName(field)} 的條件數量過多（最多 20 個）`)
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

export function validateSearchValue(value: string, fieldName?: string): ValidationResult {
  const errors: string[] = []
  const field = fieldName || '搜尋條件'

  if (!value || value.trim() === '') {
    errors.push(`${field}不能為空`)
  }

  if (value && value.length > 100) {
    errors.push(`${field}過長（最多 100 字元）`)
  }

  if (value && /[<>{}]/.test(value)) {
    errors.push(`${field}包含不允許的字元`)
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

export function parseMultipleConditions(input: string): string[] {
  if (!input || input.trim() === '') {
    return []
  }

  const conditions = input
    .split(/[\s,]+/)
    .map((condition) => condition.trim())
    .filter((condition) => condition !== '')

  return [...new Set(conditions)]
}

export function validateTemplateName(name: string): ValidationResult {
  const errors: string[] = []

  if (!name || name.trim() === '') {
    errors.push('樣板名稱不能為空')
  }

  if (name && name.length > 50) {
    errors.push('樣板名稱過長（最多 50 字元）')
  }

  if (name && /[<>:"/\\|?*]/.test(name)) {
    errors.push('樣板名稱包含不允許的字元')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * 驗證檔案名稱
 * @param filename 檔案名稱
 * @returns 驗證結果
 */
export function validateFilename(filename: string): ValidationResult {
  const errors: string[] = []

  if (!filename || filename.trim() === '') {
    errors.push('檔案名稱不能為空')
  }

  if (filename && filename.length > 255) {
    errors.push('檔案名稱過長（最多 255 字元）')
  }

  // Windows 不允許的字元
  if (filename && /[<>:"/\\|?*\x00-\x1f]/.test(filename)) {
    errors.push('檔案名稱包含不允許的字元')
  }

  if (filename) {
    const reservedNames = [
      'CON',
      'PRN',
      'AUX',
      'NUL',
      'COM1',
      'COM2',
      'COM3',
      'COM4',
      'LPT1',
      'LPT2',
    ]
    const nameWithoutExt = filename.split('.')[0]?.toUpperCase()
    if (nameWithoutExt && reservedNames.includes(nameWithoutExt)) {
      errors.push('檔案名稱使用了系統保留名稱')
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

export function validateVisibleColumns(
  visibleColumns: string[],
  allColumns: string[]
): ValidationResult {
  const errors: string[] = []

  if (!visibleColumns || visibleColumns.length === 0) {
    errors.push('至少需要顯示一個欄位')
  }

  if (visibleColumns) {
    const invalidColumns = visibleColumns.filter((col) => !allColumns.includes(col))
    if (invalidColumns.length > 0) {
      errors.push(`包含無效的欄位: ${invalidColumns.join(', ')}`)
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

export function validateExportCount(count: number, maxCount: number = 10000): ValidationResult {
  const errors: string[] = []

  if (count <= 0) {
    errors.push('沒有可匯出的記錄')
  }

  if (count > maxCount) {
    errors.push(`匯出記錄數量過多（最多 ${maxCount} 筆）`)
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

export function validateFontSize(fontSize: string): ValidationResult {
  const errors: string[] = []
  const validSizes = ['small', 'medium', 'large']

  if (!validSizes.includes(fontSize)) {
    errors.push(`無效的字體大小設定，必須是: ${validSizes.join(', ')}`)
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

export function validateTheme(theme: string): ValidationResult {
  const errors: string[] = []
  const validThemes = ['light', 'dark']

  if (!validThemes.includes(theme)) {
    errors.push(`無效的主題設定，必須是: ${validThemes.join(', ')}`)
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

export function isValidDate(date: Date | number): boolean {
  if (typeof date === 'number') {
    return !isNaN(date) && date > 0
  }

  return date instanceof Date && !isNaN(date.getTime())
}

export function isEmpty(value: string | null | undefined): boolean {
  return value === null || value === undefined || value.trim() === ''
}

export function isEmptyArray<T>(array: T[] | null | undefined): boolean {
  return !array || array.length === 0
}

function getFieldDisplayName(field: string): string {
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

  return fieldNames[field] || field
}

export function sanitizeAndValidateSearchCriteria(criteria: SearchCriteria): {
  sanitized: SearchCriteria
  validation: ValidationResult
} {
  const sanitized: SearchCriteria = {}

  for (const [field, values] of Object.entries(criteria)) {
    if (!values || values.length === 0) continue

    const cleanedValues = values
      .map((v: string) => v.trim())
      .filter((v: string) => v !== '')
      .slice(0, 20)

    if (cleanedValues.length > 0) {
      sanitized[field as keyof SearchCriteria] = cleanedValues
    }
  }

  const validation = validateSearchCriteria(sanitized)

  return { sanitized, validation }
}
