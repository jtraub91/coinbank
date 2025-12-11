const MINT_URL = import.meta.env.VITE_CASHU_MINT_URL

export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${MINT_URL}${endpoint}`, {
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
  nuts?: Record<string, unknown>
  motd?: string
}

export const mintApi = {
  info: () => apiRequest<MintInfo>('/v1/info'),
}

export function getMintUrl(): string {
  return MINT_URL
}
