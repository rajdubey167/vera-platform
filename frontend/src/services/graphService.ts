import api from './api'

export interface GraphNode {
  id: string
  label: string
  type: 'dataset' | 'column'
  file_type?: string
  record_count?: number
  dataset_count?: number
}

export interface GraphLink {
  source: string
  target: string
}

export interface GraphData {
  nodes: GraphNode[]
  links: GraphLink[]
  available: boolean
}

export const graphService = {
  async getGraph(): Promise<GraphData> {
    const { data } = await api.get<GraphData>('/graph')
    return data
  },
}
