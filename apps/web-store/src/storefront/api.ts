import type {
  ApiResponse,
  AuthPayload,
  FeedbackRecord,
  FeedbackSubmitPayload,
  PublicMemberCenterConfigPayload,
  MemberProfileResponse,
  MerchantApplicationRecord,
  ProductDetailRecord,
  ProductRecord,
  RealNameAuthRecord,
} from './types'

const API_BASE_URL = 'http://localhost:8080'

export interface SessionData {
  token: string
  profile: AuthPayload['profile']
}

const SESSION_STORAGE_KEY = 'saimeng-web-session'

export function getStoredSession(): SessionData | null {
  const rawValue = window.localStorage.getItem(SESSION_STORAGE_KEY)
  if (!rawValue) {
    return null
  }

  try {
    return JSON.parse(rawValue) as SessionData
  } catch {
    window.localStorage.removeItem(SESSION_STORAGE_KEY)
    return null
  }
}

export function setStoredSession(session: SessionData | null) {
  if (!session) {
    window.localStorage.removeItem(SESSION_STORAGE_KEY)
    return
  }

  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
    ...options,
  })

  const rawText = await response.text()
  let result: ApiResponse<T> | null = null

  if (rawText) {
    try {
      result = JSON.parse(rawText) as ApiResponse<T>
    } catch {
      result = null
    }
  }

  if (!response.ok) {
    throw new Error(result?.message || rawText || `请求失败（${response.status}）`)
  }

  if (!result) {
    throw new Error('服务响应格式无效，请稍后重试')
  }

  if (result.code !== 0) {
    throw new Error(result.message || '请求失败')
  }

  return result.data
}

export async function login(phone: string, password: string) {
  return request<AuthPayload>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ phone, password }),
  })
}

export async function loginWithVerificationCode(phone: string, verificationCode: string) {
  return request<AuthPayload>('/api/auth/login/sms', {
    method: 'POST',
    body: JSON.stringify({ phone, verificationCode }),
  })
}

export async function requestVerificationCode(phone: string) {
  return request<{ expiresInSeconds: number }>('/api/auth/verification-code', {
    method: 'POST',
    body: JSON.stringify({ phone }),
  })
}

export async function register(phone: string, verificationCode: string) {
  return request<AuthPayload>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ phone, verificationCode }),
  })
}

export async function getMemberProfile(token: string) {
  return request<MemberProfileResponse>('/api/member/profile', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export async function submitRealNameAuth(token: string, realName: string, idCardNo: string) {
  return request<RealNameAuthRecord>('/api/member/real-name-auth', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ realName, idCardNo }),
  })
}

export async function submitMerchantApplication(
  token: string,
  payload: {
    storeName: string
    companyName: string
    contactName: string
    businessScope: string
  },
) {
  return request<MerchantApplicationRecord>('/api/merchant/applications', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })
}

export async function getMerchantApplication(token: string) {
  return request<MerchantApplicationRecord | null>('/api/merchant/applications/current', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export async function getPublicPoolProducts() {
  return request<ProductRecord[]>('/api/products/public-pool')
}

export async function getPublicProductDetail(productId: number) {
  return request<ProductDetailRecord>(`/api/products/${productId}`)
}

export async function getPublicMemberCenterConfig() {
  return request<PublicMemberCenterConfigPayload>('/api/admin/user-center/public/member-center-config')
}

export async function submitFeedback(payload: FeedbackSubmitPayload, token?: string) {
  return request<FeedbackRecord>('/api/feedback', {
    method: 'POST',
    headers: token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : undefined,
    body: JSON.stringify(payload),
  })
}
