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
  urls?: Array<string>
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
  bank_name: string
  coin_name: string
  coin_symbol: string
  wallet_api_url?: string
}

export interface LoginResponse {
  message: string
  user_id: number
  username: string
  balance: number
  bank_name: string
  coin_name: string
  coin_symbol: string
  is_staff: boolean
  is_superuser: boolean
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

// Transaction types
export interface SendToUserRequest {
  recipient_username: string
  amount: number
}

export interface SendToLightningRequest {
  invoice: string
  amount: number
}

export interface WithdrawBearerResponse {
  success: boolean
  token: string
  amount: number
  new_balance: number
}

export interface TransactionResponse {
  success: boolean
  message?: string
  error?: string
  new_balance?: number
}

export interface RedeemBearerResponse {
  success: boolean
  message?: string
  amount: number
  new_balance: number
}

// Transaction API
export const transactionsApi = {
  // Send to another bank user
  sendToUser: (data: SendToUserRequest) =>
    apiRequest<TransactionResponse>('/accounts/send/user/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Send to lightning invoice
  sendToLightning: (data: SendToLightningRequest) =>
    apiRequest<TransactionResponse>('/accounts/send/lightning/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Withdraw as bearer token
  withdrawBearer: (amount: number) =>
    apiRequest<WithdrawBearerResponse>('/accounts/withdraw/bearer/', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    }),

  // Redeem a bearer token
  redeemBearer: (token: string) =>
    apiRequest<RedeemBearerResponse>('/accounts/redeem/', {
      method: 'POST',
      body: JSON.stringify({ token }),
    }),

  // Simulate deposit (for demo)
  simulateDeposit: (amount: number) =>
    apiRequest<TransactionResponse>('/accounts/deposit/simulate/', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    }),
}
