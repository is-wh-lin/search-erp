import type { FieldRecord } from '../types'

type IndexEntry = Set<string>

type FieldIndex = Map<string, IndexEntry>

type SearchIndex = Map<string, FieldIndex>

class SearchIndexService {
  private index: SearchIndex = new Map()
  private records: Map<string, FieldRecord> = new Map()
  private isBuilt = false

  buildIndex(records: FieldRecord[]): void {
    console.time('建立搜尋索引')

    this.index.clear()
    this.records.clear()

    records.forEach((record) => {
      this.records.set(record.id, record)
    })

    const indexFields: (keyof FieldRecord)[] = [
      'fieldNumber',
      'fieldName',
      'fileCode',
      'fileName',
      'dataType',
      'length',
      'fieldDescription',
      'remark',
    ]

    indexFields.forEach((field) => {
      const fieldIndex: FieldIndex = new Map()

      records.forEach((record) => {
        const value = record[field]
        if (!value) return

        const terms = this.tokenize(String(value))

        terms.forEach((term) => {
          if (!fieldIndex.has(term)) {
            fieldIndex.set(term, new Set())
          }
          fieldIndex.get(term)!.add(record.id)
        })
      })

      this.index.set(field, fieldIndex)
    })

    this.isBuilt = true
    console.timeEnd('建立搜尋索引')
    console.log(`索引已建立，共 ${records.length} 筆記錄`)
  }

  private tokenize(text: string): string[] {
    const lowerText = text.toLowerCase()

    const tokens = new Set<string>()

    tokens.add(lowerText)

    const words = lowerText.split(/[\s,，、。；;.]+/).filter((w) => w.length > 0)
    words.forEach((word) => tokens.add(word))

    if (lowerText.length >= 2) {
      for (let i = 0; i < lowerText.length - 1; i++) {
        tokens.add(lowerText.substring(i, i + 2))
      }
    }
    if (lowerText.length >= 3) {
      for (let i = 0; i < lowerText.length - 2; i++) {
        tokens.add(lowerText.substring(i, i + 3))
      }
    }

    return Array.from(tokens)
  }

  searchByIndex(field: keyof FieldRecord, term: string): Set<string> | null {
    if (!this.isBuilt) {
      return null
    }

    const fieldIndex = this.index.get(field)
    if (!fieldIndex) {
      return null
    }

    const lowerTerm = term.toLowerCase()
    const matchedIds = new Set<string>()

    if (fieldIndex.has(lowerTerm)) {
      fieldIndex.get(lowerTerm)!.forEach((id) => matchedIds.add(id))
    }

    fieldIndex.forEach((ids, indexedTerm) => {
      if (indexedTerm.includes(lowerTerm)) {
        ids.forEach((id) => matchedIds.add(id))
      }
    })

    return matchedIds
  }

  getRecordById(id: string): FieldRecord | undefined {
    return this.records.get(id)
  }

  getRecordsByIds(ids: Set<string>): FieldRecord[] {
    const records: FieldRecord[] = []
    ids.forEach((id) => {
      const record = this.records.get(id)
      if (record) {
        records.push(record)
      }
    })
    return records
  }

  isIndexBuilt(): boolean {
    return this.isBuilt
  }

  clearIndex(): void {
    this.index.clear()
    this.records.clear()
    this.isBuilt = false
  }

  getIndexStats(): {
    totalRecords: number
    indexedFields: number
    totalIndexEntries: number
  } {
    let totalIndexEntries = 0
    this.index.forEach((fieldIndex) => {
      totalIndexEntries += fieldIndex.size
    })

    return {
      totalRecords: this.records.size,
      indexedFields: this.index.size,
      totalIndexEntries,
    }
  }
}

export const searchIndexService = new SearchIndexService()

export { SearchIndexService }
