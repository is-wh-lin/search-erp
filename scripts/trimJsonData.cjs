#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const dataDir = path.join(__dirname, '../public/data')
const files = ['1-10000.json', '10001-20000.json', '20001-30000.json', '30001-37834.json']

console.log('開始處理 JSON 檔案，移除欄位中的空格...\n')

files.forEach((filename) => {
  const filePath = path.join(dataDir, filename)

  console.log(`處理: ${filename}`)

  try {
    const rawData = fs.readFileSync(filePath, 'utf8')
    const data = JSON.parse(rawData)

    let trimmedCount = 0

    if (data.rows && Array.isArray(data.rows)) {
      data.rows.forEach((row) => {
        if (row.cell && Array.isArray(row.cell)) {
          row.cell = row.cell.map((value) => {
            if (typeof value === 'string') {
              const trimmed = value.trim()
              if (trimmed !== value) {
                trimmedCount++
              }
              return trimmed
            }
            return value
          })
        }
      })
    }

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8')

    console.log(`  ✓ 完成 - 修正了 ${trimmedCount} 個欄位\n`)
  } catch (error) {
    console.error(`  ✗ 錯誤: ${error.message}\n`)
  }
})

console.log('所有檔案處理完成！')
