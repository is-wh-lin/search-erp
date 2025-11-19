import type { FieldRecord } from '../types'
import { errorHandler, ErrorType } from '../utils/errorHandler'

export interface LoadProgress {
  loaded: number
  total: number
  percentage: number
  currentFile: string
}

export type ProgressCallback = (progress: LoadProgress) => void

interface JsonResponse {
  page: string
  total: number
  records: number
  rows: Array<{
    id: string
    cell: string[]
  }>
}

class DataLoader {
  private readonly baseUrl = import.meta.env.BASE_URL || '/'

  private readonly dataFiles = [
    'data/1-10000.json',
    'data/10001-20000.json',
    'data/20001-30000.json',
    'data/30001-37834.json',
  ]

  private getFullPath(filename: string): string {
    const base = this.baseUrl.endsWith('/') ? this.baseUrl : `${this.baseUrl}/`
    const file = filename.startsWith('/') ? filename.slice(1) : filename
    return `${base}${file}`
  }

  private readonly maxRetries = 3
  private readonly retryDelay = 1000

  async loadAllFiles(onProgress?: ProgressCallback): Promise<FieldRecord[]> {
    const totalFiles = this.dataFiles.length
    const allRecords: FieldRecord[] = []
    let loadedFiles = 0

    try {
      const loadPromises = this.dataFiles.map(async (file) => {
        const fullPath = this.getFullPath(file)
        const records = await this.loadFileWithRetry(fullPath)
        loadedFiles++

        if (onProgress) {
          onProgress({
            loaded: loadedFiles,
            total: totalFiles,
            percentage: Math.round((loadedFiles / totalFiles) * 100),
            currentFile: this.getFullPath(file),
          })
        }

        return records
      })

      const results = await Promise.all(loadPromises)

      results.forEach((records) => {
        allRecords.push(...records)
      })

      return allRecords
    } catch (error) {
      const appError = errorHandler.handleError(error, ErrorType.DATA_LOAD)
      throw new Error(appError.userMessage)
    }
  }

  private async loadFileWithRetry(filename: string): Promise<FieldRecord[]> {
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await this.loadFile(filename)
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('未知錯誤')
        console.warn(
          `載入檔案 ${filename} 失敗 (嘗試 ${attempt}/${this.maxRetries}):`,
          lastError.message
        )

        if (attempt < this.maxRetries) {
          await this.delay(this.retryDelay * attempt)
        }
      }
    }

    const appError = errorHandler.handleError(lastError, ErrorType.DATA_LOAD)
    throw new Error(
      `載入檔案 ${filename} 失敗，已重試 ${this.maxRetries} 次: ${appError.userMessage}`
    )
  }

  private async loadFile(filename: string): Promise<FieldRecord[]> {
    try {
      const response = await fetch(filename)

      if (!response.ok) {
        const error = new Error(`HTTP 錯誤: ${response.status} ${response.statusText}`)
        const appError = errorHandler.handleError(error, ErrorType.NETWORK)
        throw new Error(appError.userMessage)
      }

      const data: JsonResponse = await response.json()

      if (!data.rows || !Array.isArray(data.rows)) {
        throw new Error('無效的 JSON 格式: 缺少 rows 陣列')
      }

      return this.parseJsonData(data)
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('載入檔案時發生未知錯誤')
    }
  }

  parseJsonData(data: JsonResponse): FieldRecord[] {
    return data.rows
      .map((row) => {
        const cell = row.cell

        if (!cell || cell.length < 9) {
          console.warn(`記錄 ${row.id} 的 cell 陣列長度不足，已跳過`)
          return null
        }

        return {
          id: row.id,
          fieldNumber: (cell[1] || '').trim(),
          fieldName: (cell[2] || '').trim(),
          fieldDescription: (cell[7] || '').trim(),
          fileCode: (cell[3] || '').trim(),
          fileName: (cell[4] || '').trim(),
          dataType: (cell[5] || '').trim(),
          length: (cell[6] || '').trim(),
          detailedDescription: (cell[7] || '').trim(),
          remark: (cell[8] || '').trim(),
        }
      })
      .filter((record): record is FieldRecord => record !== null)
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  calculateProgress(loaded: number, total: number): number {
    if (total === 0) return 0
    return Math.round((loaded / total) * 100)
  }
}

export const dataLoader = new DataLoader()

export { DataLoader }
