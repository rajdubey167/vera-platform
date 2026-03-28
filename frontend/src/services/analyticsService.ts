import api from './api'
import type { AnalyticsResponse } from '../types'

export const analyticsService = {
  async analyze(datasetId: number, dateFrom?: string, dateTo?: string): Promise<AnalyticsResponse> {
    const { data } = await api.post<AnalyticsResponse>(`/analyze/${datasetId}`, {
      date_from: dateFrom || null,
      date_to: dateTo || null,
    })
    return data
  },
}
