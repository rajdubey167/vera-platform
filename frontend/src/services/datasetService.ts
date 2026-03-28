import api from './api'
import type { Dataset, DatasetDetail, PaginatedDatasets } from '../types'

export const datasetService = {
  async list(params?: {
    page?: number
    limit?: number
    search?: string
    file_type?: string
  }): Promise<PaginatedDatasets> {
    const { data } = await api.get<PaginatedDatasets>('/datasets', { params })
    return data
  },

  async get(id: number): Promise<DatasetDetail> {
    const { data } = await api.get<DatasetDetail>(`/datasets/${id}`)
    return data
  },

  async upload(file: File, onProgress?: (pct: number) => void): Promise<Dataset> {
    const form = new FormData()
    form.append('file', file)
    const { data } = await api.post<Dataset>('/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress && e.total) {
          onProgress(Math.round((e.loaded / e.total) * 100))
        }
      },
    })
    return data
  },

  async delete(id: number): Promise<{ message: string }> {
    const { data } = await api.delete<{ message: string }>(`/dataset/${id}`)
    return data
  },
}
