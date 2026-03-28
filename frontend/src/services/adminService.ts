import api from './api'
import type { User } from '../types'

export const adminService = {
  async getUsers(): Promise<User[]> {
    const { data } = await api.get<User[]>('/users')
    return data
  },
}
