import api from './api'
import type { TokenResponse, User } from '../types'

export const authService = {
  async login(email: string, password: string): Promise<TokenResponse> {
    const { data } = await api.post<TokenResponse>('/login', { email, password })
    return data
  },

  async register(email: string, password: string, full_name: string, role = 'user'): Promise<User> {
    const { data } = await api.post<User>('/register', { email, password, full_name, role })
    return data
  },

  async getMe(): Promise<User> {
    const { data } = await api.get<User>('/me')
    return data
  },
}
