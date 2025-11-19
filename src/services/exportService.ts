import * as XLSX from 'xlsx'
import type { FieldRecord } from '../types'
import { generateFilename as generateFormattedFilename } from '../utils/formatters'
import { errorHandler, ErrorType } from '../utils/errorHandler'

class ExportService {
  generateFilename(prefix: string = 'ERP查詢結果', extension: string = 'csv'): string {
    return generateFormattedFilename(prefix, extension)
  }

  formatRecordForExport(record: FieldRecord): string[] {
    return [
      record.fieldNumber,
      record.fieldName,
      record.fileCode,
      record.fileName,
      record.dataType,
      record.length,
      record.fieldDescription,
      record.remark,
    ]
  }

  exportToCSV(records: FieldRecord[], filename?: string): void {
    if (!records || records.length === 0) {
      const appError = errorHandler.handleError(new Error('沒有資料可匯出'), ErrorType.EXPORT)
      throw new Error(appError.userMessage)
    }

    try {
      const headers = [
        '欄位編號',
        '欄位名稱',
        '檔案代碼',
        '檔案名稱',
        '型態',
        '長度',
        '欄位說明',
        'Remark',
      ]

      const csvRows: string[] = []

      csvRows.push(headers.map((header) => this.escapeCSVField(header)).join(','))

      records.forEach((record) => {
        const row = this.formatRecordForExport(record)
        csvRows.push(row.map((field) => this.escapeCSVField(field)).join(','))
      })

      const csvContent = '\uFEFF' + csvRows.join('\n')

      const finalFilename = filename || this.generateFilename('ERP查詢結果', 'csv')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      this.downloadFile(blob, finalFilename)
    } catch (error) {
      const appError = errorHandler.handleError(error, ErrorType.EXPORT)
      throw new Error(appError.userMessage)
    }
  }

  private escapeCSVField(field: string): string {
    if (field == null) {
      return ''
    }

    const fieldStr = String(field)

    if (fieldStr.includes(',') || fieldStr.includes('"') || fieldStr.includes('\n')) {
      return `"${fieldStr.replace(/"/g, '""')}"`
    }

    return fieldStr
  }

  exportToExcel(records: FieldRecord[], filename?: string): void {
    if (!records || records.length === 0) {
      const appError = errorHandler.handleError(new Error('沒有資料可匯出'), ErrorType.EXPORT)
      throw new Error(appError.userMessage)
    }

    try {
      const headers = [
        '欄位編號',
        '欄位名稱',
        '檔案代碼',
        '檔案名稱',
        '型態',
        '長度',
        '欄位說明',
        'Remark',
      ]

      const worksheetData: any[][] = []

      worksheetData.push(headers)

      records.forEach((record) => {
        worksheetData.push(this.formatRecordForExport(record))
      })

      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)

      const columnWidths = this.calculateColumnWidths(worksheetData)
      worksheet['!cols'] = columnWidths

      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'ERP查詢結果')

      const finalFilename = filename || this.generateFilename('ERP查詢結果', 'xlsx')

      XLSX.writeFile(workbook, finalFilename)
    } catch (error) {
      const appError = errorHandler.handleError(error, ErrorType.EXPORT)
      throw new Error(appError.userMessage)
    }
  }

  private calculateColumnWidths(data: any[][]): Array<{ wch: number }> {
    const columnWidths: number[] = []

    data.forEach((row) => {
      row.forEach((cell, colIndex) => {
        const cellValue = cell != null ? String(cell) : ''

        let width = 0
        for (let i = 0; i < cellValue.length; i++) {
          const char = cellValue.charCodeAt(i)

          if (char > 127) {
            width += 2
          } else {
            width += 1
          }
        }

        const currentWidth = columnWidths[colIndex]
        if (currentWidth === undefined || width > currentWidth) {
          columnWidths[colIndex] = width
        }
      })
    })

    return columnWidths.map((width) => ({
      wch: Math.min(Math.max(width + 2, 10), 50),
    }))
  }

  private downloadFile(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.style.display = 'none'

    document.body.appendChild(link)
    link.click()

    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}

export const exportService = new ExportService()
export default exportService
