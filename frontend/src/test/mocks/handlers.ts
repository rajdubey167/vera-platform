import { http, HttpResponse } from 'msw'

const BASE = 'http://localhost:8000'

// ── Fixtures ──────────────────────────────────────────────────────────────────

export const mockUser = {
  id: 1,
  email: 'user@test.com',
  full_name: 'Test User',
  role: 'user' as const,
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
}

export const mockAdmin = {
  id: 2,
  email: 'admin@test.com',
  full_name: 'Admin User',
  role: 'admin' as const,
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
}

export const mockDataset = {
  id: 1,
  filename: 'sales.csv',
  file_type: 'csv' as const,
  upload_time: '2024-01-15T10:00:00Z',
  record_count: 100,
  file_size: 4096,
  user_id: 1,
  status: 'ready',
}

export const mockRecord = {
  id: 1,
  dataset_id: 1,
  data: { id: 1, value: 10.5, category: 'cat_0' },
  row_number: 1,
  created_at: '2024-01-15T10:00:00Z',
}

export const mockAnalytics = {
  dataset_id: 1,
  total_records: 100,
  column_stats: [
    {
      column: 'value',
      type: 'numeric',
      count: 100,
      missing: 0,
      mean: 50.0,
      median: 50.0,
      std: 28.87,
      min: 1.0,
      max: 100.0,
      q1: 25.0,
      q3: 75.0,
    },
    {
      column: 'category',
      type: 'categorical',
      count: 100,
      missing: 0,
      unique: 3,
      top_values: [
        { value: 'cat_0', count: 34 },
        { value: 'cat_1', count: 33 },
        { value: 'cat_2', count: 33 },
      ],
    },
  ],
  insights: ['value has no missing values.', 'category has 3 unique values.'],
  anomalies: [],
  trends: null,
}

// ── Handlers ──────────────────────────────────────────────────────────────────

export const handlers = [
  // Auth
  http.post(`${BASE}/register`, () =>
    HttpResponse.json(mockUser, { status: 201 })
  ),
  http.post(`${BASE}/login`, () =>
    HttpResponse.json({ access_token: 'fake-jwt-token', token_type: 'bearer', user: mockUser })
  ),
  http.get(`${BASE}/me`, () =>
    HttpResponse.json(mockUser)
  ),

  // Datasets
  http.get(`${BASE}/datasets`, () =>
    HttpResponse.json({ items: [mockDataset], total: 1, page: 1, limit: 20, pages: 1 })
  ),
  http.get(`${BASE}/datasets/:id`, ({ params }) => {
    const id = Number(params.id)
    if (id === 99999) return new HttpResponse(null, { status: 404 })
    return HttpResponse.json({ ...mockDataset, id, preview: [mockRecord.data] })
  }),
  http.delete(`${BASE}/dataset/:id`, () =>
    HttpResponse.json({ message: 'Deleted' })
  ),

  // Upload
  http.post(`${BASE}/upload`, () =>
    HttpResponse.json(mockDataset, { status: 201 })
  ),

  // Records
  http.get(`${BASE}/records`, () =>
    HttpResponse.json({ items: [mockRecord], total: 1, page: 1, limit: 20, pages: 1 })
  ),
  http.put(`${BASE}/records/:id`, ({ params }) => {
    const id = Number(params.id)
    if (id === 99999) return new HttpResponse(null, { status: 404 })
    return HttpResponse.json({ ...mockRecord, id })
  }),
  http.delete(`${BASE}/records/:id`, ({ params }) => {
    const id = Number(params.id)
    if (id === 99999) return new HttpResponse(null, { status: 404 })
    return HttpResponse.json({ message: 'Deleted' })
  }),

  // Analytics
  http.post(`${BASE}/analyze/:id`, ({ params }) => {
    const id = Number(params.id)
    if (id === 99999) return new HttpResponse(null, { status: 404 })
    return HttpResponse.json({ ...mockAnalytics, dataset_id: id })
  }),

  // Graph
  http.get(`${BASE}/graph`, () =>
    HttpResponse.json({
      nodes: [
        { id: 'dataset_1', label: 'sales.csv', type: 'dataset', dataset_id: 1 },
        { id: 'col_value', label: 'value', type: 'column', shared: false },
      ],
      links: [{ source: 'dataset_1', target: 'col_value', shared: false }],
      available: true,
    })
  ),
]
