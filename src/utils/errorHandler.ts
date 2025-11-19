export const ErrorType = {
  NETWORK: 'NETWORK',
  DATA_LOAD: 'DATA_LOAD',
  SEARCH: 'SEARCH',
  EXPORT: 'EXPORT',
  STORAGE: 'STORAGE',
  VALIDATION: 'VALIDATION',
  UNKNOWN: 'UNKNOWN',
} as const

export type ErrorType = (typeof ErrorType)[keyof typeof ErrorType]

export interface AppError {
  type: ErrorType
  message: string
  originalError?: Error
  userMessage: string
  canRetry: boolean
  timestamp: number
}

class ErrorHandler {
  handleError(error: unknown, type: ErrorType = ErrorType.UNKNOWN): AppError {
    const timestamp = Date.now()
    let message = '發生未知錯誤'
    let userMessage = '操作失敗，請稍後再試'
    let canRetry = true
    let originalError: Error | undefined

    if (error instanceof Error) {
      message = error.message
      originalError = error
    } else if (typeof error === 'string') {
      message = error
    }

    switch (type) {
      case ErrorType.NETWORK:
        userMessage = this.getNetworkErrorMessage(message)
        canRetry = true
        break

      case ErrorType.DATA_LOAD:
        userMessage = this.getDataLoadErrorMessage(message)
        canRetry = true
        break

      case ErrorType.SEARCH:
        userMessage = this.getSearchErrorMessage(message)
        canRetry = false
        break

      case ErrorType.EXPORT:
        userMessage = this.getExportErrorMessage(message)
        canRetry = true
        break

      case ErrorType.STORAGE:
        userMessage = this.getStorageErrorMessage(message)
        canRetry = false
        break

      case ErrorType.VALIDATION:
        userMessage = this.getValidationErrorMessage(message)
        canRetry = false
        break

      default:
        userMessage = '操作失敗，請稍後再試'
        canRetry = true
    }

    if (import.meta.env.DEV) {
      console.error(`[${type}] ${message}`, originalError)
    }

    return {
      type,
      message,
      originalError,
      userMessage,
      canRetry,
      timestamp,
    }
  }

  private getNetworkErrorMessage(message: string): string {
    if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
      return '網路連線失敗，請檢查您的網路連線'
    }
    if (message.includes('timeout') || message.includes('逾時')) {
      return '連線逾時，請稍後再試'
    }
    if (message.includes('404')) {
      return '找不到請求的資源'
    }
    if (message.includes('500') || message.includes('502') || message.includes('503')) {
      return '伺服器暫時無法回應，請稍後再試'
    }
    return '網路請求失敗，請檢查網路連線後重試'
  }

  private getDataLoadErrorMessage(message: string): string {
    if (message.includes('JSON')) {
      return '資料格式錯誤，請聯絡系統管理員'
    }
    if (message.includes('HTTP 錯誤')) {
      return '無法載入資料檔案，請稍後再試'
    }
    if (message.includes('已重試')) {
      return '資料載入失敗，已嘗試多次重試。請檢查網路連線或稍後再試'
    }
    return '資料載入失敗，請重新整理頁面或稍後再試'
  }

  private getSearchErrorMessage(message: string): string {
    if (message.includes('條件') || message.includes('criteria')) {
      return '搜尋條件無效，請檢查輸入內容'
    }
    if (message.includes('資料') || message.includes('data')) {
      return '搜尋資料尚未載入，請稍候'
    }
    return '搜尋失敗，請重新輸入搜尋條件'
  }

  private getExportErrorMessage(message: string): string {
    if (message.includes('沒有資料')) {
      return '沒有可匯出的資料'
    }
    if (message.includes('權限') || message.includes('permission')) {
      return '沒有檔案下載權限，請檢查瀏覽器設定'
    }
    if (message.includes('不支援') || message.includes('not supported')) {
      return '您的瀏覽器不支援此匯出功能'
    }
    return '匯出失敗，請稍後再試'
  }

  private getStorageErrorMessage(message: string): string {
    if (message.includes('QuotaExceeded') || message.includes('容量')) {
      return '儲存空間已滿，請清除部分瀏覽器資料後再試'
    }
    if (message.includes('不可用') || message.includes('not available')) {
      return '瀏覽器儲存功能不可用，部分功能可能受限'
    }
    if (message.includes('IndexedDB')) {
      return '資料庫操作失敗，請重新整理頁面'
    }
    return '儲存失敗，您的設定可能無法保存'
  }

  private getValidationErrorMessage(message: string): string {
    if (message.includes('必填') || message.includes('required')) {
      return '請填寫必填欄位'
    }
    if (message.includes('格式') || message.includes('format')) {
      return '輸入格式不正確，請檢查後重試'
    }
    if (message.includes('長度') || message.includes('length')) {
      return '輸入長度超出限制'
    }
    return '輸入資料驗證失敗，請檢查後重試'
  }

  isNetworkError(error: unknown): boolean {
    if (error instanceof Error) {
      return (
        error.message.includes('Failed to fetch') ||
        error.message.includes('NetworkError') ||
        error.message.includes('Network request failed') ||
        error.name === 'NetworkError'
      )
    }
    return false
  }

  isQuotaExceededError(error: unknown): boolean {
    if (error instanceof Error) {
      return (
        error.name === 'QuotaExceededError' ||
        error.message.includes('QuotaExceeded') ||
        error.message.includes('容量已滿')
      )
    }
    return false
  }

  getErrorSummary(error: AppError): string {
    return `[${error.type}] ${error.userMessage} (${new Date(error.timestamp).toLocaleString()})`
  }

  shouldShowToUser(_error: AppError): boolean {
    return true
  }

  getRetryAdvice(error: AppError): string {
    if (!error.canRetry) {
      return ''
    }

    switch (error.type) {
      case ErrorType.NETWORK:
      case ErrorType.DATA_LOAD:
        return '請檢查網路連線後點擊重試'
      case ErrorType.EXPORT:
        return '請確認瀏覽器設定後重試'
      case ErrorType.STORAGE:
        return '請清除部分瀏覽器資料後重試'
      default:
        return '請稍後再試'
    }
  }
}

export const errorHandler = new ErrorHandler()

export { ErrorHandler }
