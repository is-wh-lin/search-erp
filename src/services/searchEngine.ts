import type { FieldRecord, SearchCriteria } from '../types'
import { searchIndexService } from './searchIndex'
import { performanceMonitor } from '../utils/performanceMonitor'

class SearchEngine {
  parseMultipleConditions(input: string): string[] {
    if (!input || input.trim() === '') {
      return []
    }

    return input
      .split(/[\s,]+/)
      .map((condition) => condition.trim())
      .filter((condition) => condition.length > 0)
  }

  matchRecord(record: FieldRecord, criteria: SearchCriteria): boolean {
    for (const [field, conditions] of Object.entries(criteria)) {
      if (!conditions || conditions.length === 0) {
        continue
      }

      const fieldValue = record[field as keyof FieldRecord]

      if (fieldValue === undefined || fieldValue === null) {
        return false
      }

      const fieldValueLower = String(fieldValue).toLowerCase()

      const matched = conditions.some((condition: string) => {
        const conditionLower = condition.toLowerCase().trim()

        return fieldValueLower.includes(conditionLower)
      })

      if (!matched) {
        return false
      }
    }

    return true
  }

  search(criteria: SearchCriteria, records: FieldRecord[]): FieldRecord[] {
    return performanceMonitor.measure('搜尋執行', () => {
      const hasAnyCriteria = Object.values(criteria).some(
        (conditions) => conditions && conditions.length > 0
      )

      if (!hasAnyCriteria) {
        return []
      }

      if (searchIndexService.isIndexBuilt()) {
        return this.searchWithIndex(criteria)
      }

      return records.filter((record) => this.matchRecord(record, criteria))
    })
  }

  private searchWithIndex(criteria: SearchCriteria): FieldRecord[] {
    let resultIds: Set<string> | null = null

    for (const [field, conditions] of Object.entries(criteria)) {
      if (!conditions || conditions.length === 0) {
        continue
      }

      const fieldMatchIds = new Set<string>()

      conditions.forEach((condition: string) => {
        const matchIds = searchIndexService.searchByIndex(
          field as keyof FieldRecord,
          condition.trim()
        )
        if (matchIds) {
          matchIds.forEach((id) => fieldMatchIds.add(id))
        }
      })

      if (resultIds === null) {
        resultIds = fieldMatchIds
      } else {
        const intersection = new Set<string>()
        resultIds.forEach((id) => {
          if (fieldMatchIds.has(id)) {
            intersection.add(id)
          }
        })
        resultIds = intersection
      }

      if (resultIds.size === 0) {
        return []
      }
    }

    if (resultIds && resultIds.size > 0) {
      return searchIndexService.getRecordsByIds(resultIds)
    }

    return []
  }

  buildCriteria(inputs: Partial<Record<keyof SearchCriteria, string>>): SearchCriteria {
    const criteria: SearchCriteria = {}

    for (const [field, input] of Object.entries(inputs)) {
      if (input && input.trim() !== '') {
        criteria[field as keyof SearchCriteria] = this.parseMultipleConditions(input)
      }
    }

    return criteria
  }
}

export const searchEngine = new SearchEngine()

export { SearchEngine }
