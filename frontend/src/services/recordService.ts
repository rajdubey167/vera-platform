import api from './api'
import type { PaginatedRecords, DataRecord } from '../types'

export const recordService = {
  async list(params: {
    dataset_id: number
    page?: number
    limit?: number
    search?: string
    sort_by?: string
    sort_order?: string
  }): Promise<PaginatedRecords> {
    const { data } = await api.get<PaginatedRecords>('/records', { params })
    return data
  },

  async update(id: number, recordData: Record<string, unknown>): Promise<DataRecord> {
    const { data } = await api.put<DataRecord>(`/records/${id}`, { data: recordData })
    return data
  },

  async delete(id: number): Promise<{ message: string }> {
    const { data } = await api.delete<{ message: string }>(`/records/${id}`)
    return data
  },
}
