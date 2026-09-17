import type {
  ApiResponse,
  DistributorEnterpriseCertificationApplicationRecord,
  DistributorEnterpriseCertificationPayload,
  DistributorEnterpriseCompanyBootstrapPayload,
  DistributorEnterpriseEmployeeBootstrapPayload,
  DistributorEnterpriseEmployeeRecord,
  DistributorEnterpriseEmployeeUpsertPayload,
  DistributorEnterpriseJoinPayload,
  DistributorEnterpriseJoinReviewPayload,
  DistributorEnterpriseSearchRecord,
  OperatorAuthPayload,
} from './types'
import { getStoredOperatorSession, setStoredOperatorSession } from './session'

const API_BASE_URL = 'http://localhost:8080'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const session = getStoredOperatorSession()
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
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
    if (response.status === 403) {
      if (session && !session.profile.roles.includes('DISTRIBUTOR')) {
        setStoredOperatorSession(null)
        throw new Error('当前登录账号不是经销商账号，请重新登录经销商后台')
      }
      throw new Error(result?.message || '当前账号无权访问经销商后台接口，请重新登录')
    }

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

/**
 * 分销商账号密码登录。
 */
export async function distributorLogin(phone: string, password: string) {
  return request<OperatorAuthPayload>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ phone, password }),
  })
}

/**
 * 分销商短信验证码登录。
 */
export async function distributorLoginWithVerificationCode(phone: string, verificationCode: string) {
  return request<OperatorAuthPayload>('/api/auth/login/sms', {
    method: 'POST',
    body: JSON.stringify({ phone, verificationCode }),
  })
}

/**
 * 发送短信验证码。
 */
export async function requestDistributorVerificationCode(phone: string) {
  return request<{ expiresInSeconds: number }>('/api/auth/verification-code', {
    method: 'POST',
    body: JSON.stringify({ phone }),
  })
}

/**
 * 获取当前企业员工管理初始化数据。
 */
export async function getDistributorEmployeeBootstrap() {
  return request<DistributorEnterpriseEmployeeBootstrapPayload>('/api/distributor/enterprise/employees/bootstrap')
}

/**
 * 获取经销商企业管理首页数据。
 */
export async function getDistributorEnterpriseCompanyBootstrap() {
  return request<DistributorEnterpriseCompanyBootstrapPayload>('/api/distributor/enterprise/company/bootstrap')
}

/**
 * 搜索可申请加入的企业。
 */
export async function searchDistributorEnterprises(keyword: string) {
  const query = new URLSearchParams()
  if (keyword.trim()) {
    query.set('keyword', keyword.trim())
  }
  const suffix = query.toString() ? `?${query.toString()}` : ''
  return request<DistributorEnterpriseSearchRecord[]>(`/api/distributor/enterprise/company/search${suffix}`)
}

/**
 * 提交新企业认证申请。
 */
export async function submitDistributorEnterpriseCertification(payload: DistributorEnterpriseCertificationPayload) {
  return request<DistributorEnterpriseCertificationApplicationRecord>('/api/distributor/enterprise/company/certification', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

/**
 * 提交加入企业申请。
 */
export async function submitDistributorEnterpriseJoinRequest(payload: DistributorEnterpriseJoinPayload) {
  return request<void>('/api/distributor/enterprise/company/join-requests', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

/**
 * 新增当前企业员工。
 */
export async function createDistributorEmployee(payload: DistributorEnterpriseEmployeeUpsertPayload) {
  return request<DistributorEnterpriseEmployeeRecord>('/api/distributor/enterprise/employees', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

/**
 * 更新当前企业员工。
 */
export async function updateDistributorEmployee(userId: string, payload: DistributorEnterpriseEmployeeUpsertPayload) {
  return request<DistributorEnterpriseEmployeeRecord>(`/api/distributor/enterprise/employees/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

/**
 * 将员工移出当前企业。
 */
export async function deleteDistributorEmployee(userId: string) {
  return request<void>(`/api/distributor/enterprise/employees/${userId}`, {
    method: 'DELETE',
  })
}

/**
 * 通过加入企业申请。
 */
export async function approveDistributorEnterpriseJoinRequest(requestId: string) {
  return request<void>(`/api/distributor/enterprise/employees/join-requests/${requestId}/approve`, {
    method: 'POST',
  })
}

/**
 * 驳回加入企业申请。
 */
export async function rejectDistributorEnterpriseJoinRequest(requestId: string, payload: DistributorEnterpriseJoinReviewPayload) {
  return request<void>(`/api/distributor/enterprise/employees/join-requests/${requestId}/reject`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

/**
 * 移交企业超级管理员。
 */
export async function transferDistributorEnterpriseSuperAdmin(userId: string) {
  return request<void>(`/api/distributor/enterprise/employees/${userId}/transfer-super-admin`, {
    method: 'POST',
  })
}
