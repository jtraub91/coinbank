const API_BASE = '/api'

export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    })

    const data = await response.json()

    if (!response.ok) {
      return { error: data.error || 'An error occurred' }
    }

    return { data }
  } catch (error) {
    return { error: 'Network error' }
  }
}

export interface MintInfo {
  name?: string
  pubkey?: string
  version?: string
  description?: string
  description_long?: string
  contact?: Array<{ method: string; info: string }>
  motd?: string
  nuts?: Record<string, unknown>
  icon_url?: string
}

export const accountsApi = {
  list: () => apiRequest('/accounts/'),

  create: (username: string, password: string) =>
    apiRequest<CreateResponse>('/accounts/create/', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  login: (username: string, password: string) =>
    apiRequest<LoginResponse>('/accounts/login/', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
}

export interface Stats {
  total_accounts: number
  total_assets: number
  total_liabilities: number
  coin_name: string
  coin_symbol: string
}

export interface LoginResponse {
  message: string
  user_id: number
  username: string
  balance: number
  coin_name: string
  coin_symbol: string
  is_staff: boolean
}

export interface CreateResponse {
  message: string
  user_id: number
}

export const mintApi = {
  info: () => apiRequest<MintInfo>('/accounts/info/'),
}

export const statsApi = {
  get: () => apiRequest<Stats>('/accounts/stats/'),
}
