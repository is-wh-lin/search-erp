export interface FieldRecord {
  id: string
  fieldNumber: string
  fieldName: string
  fieldDescription: string
  fileCode: string
  fileName: string
  dataType: string
  length: string
  detailedDescription: string
  remark: string
}

export interface SearchCriteria {
  fieldNumber?: string[]
  fieldName?: string[]
  fileCode?: string[]
  fileName?: string[]
  dataType?: string[]
  length?: string[]
  fieldDescription?: string[]
  remark?: string[]
}

export interface SearchHistory {
  id: string
  criteria: SearchCriteria
  timestamp: number
  resultCount: number
}

export interface SearchTemplate {
  id: string
  name: string
  criteria: SearchCriteria
  createdAt: number
}

export interface UserSettings {
  theme: 'light' | 'dark'
  fontSize: 'small' | 'medium' | 'large'
  visibleColumns: string[]
  columnOrder?: string[]
  searchHistoryEnabled: boolean
}

export interface PopularSearch {
  term: string
  field: keyof SearchCriteria
  count: number
  lastSearched: number
}
