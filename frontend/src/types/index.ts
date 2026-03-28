export interface User {
  id: number
  email: string
  full_name: string
  role: 'admin' | 'user'
  is_active: boolean
  created_at: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
  user: User
}

export interface Dataset {
  id: number
  filename: string
  file_type: 'csv' | 'json'
  upload_time: string
  record_count: number
  file_size: number
  user_id: number
  status: string
  owner_email?: string
  owner_name?: string
}

export interface DatasetDetail extends Dataset {
  metadata_?: Record<string, unknown>
  preview: Record<string, unknown>[]
}

export interface PaginatedDatasets {
  items: Dataset[]
  total: number
  page: number
  limit: number
  pages: number
}

export interface DataRecord {
  id: number
  dataset_id: number
  data: Record<string, unknown>
  row_number: number
  created_at: string
}

export interface PaginatedRecords {
  items: DataRecord[]
  total: number
  page: number
  limit: number
  pages: number
}

export interface ColumnStats {
  type: 'numeric' | 'categorical' | 'datetime'
  count: number
  missing: number
  unique?: number
  mean?: number
  median?: number
  std?: number
  min?: number | string
  max?: number | string
  q1?: number
  q3?: number
  top_values?: { value: string; count: number }[]
}

export interface AnalyticsResponse {
  dataset_id: number
  total_records: number
  columns: Record<string, ColumnStats>
  insights: string[]
  anomalies: { row_index: number; data: Record<string, unknown>; flags: string[] }[]
  trends?: {
    date_column: string
    earliest: string
    latest: string
    span_days: number
  } | null
}
