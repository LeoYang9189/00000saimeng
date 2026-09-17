import type {
  ApiResponse,
  CatalogBootstrapPayload,
  CatalogProductRecord,
  CategoryUpsertPayload,
  EnterpriseUpsertPayload,
  EmployeeAdminFormValues,
  EmployeeProfileFormValues,
  EmployeeRecord,
  EnterpriseBootstrapPayload,
  MemberLevelConfigRecord,
  MemberLevelUpsertPayload,
  OrganizationRecord,
  OperatorAuthPayload,
  PortraitExternalDataTemplateRecord,
  ProductCategoryRecord,
  ProductUpsertPayload,
  QuotationBootstrapPayload,
  QuotationRecord,
  QuotationUpsertPayload,
  ReviewRejectPayload,
  RoleRecord,
  UserCenterBootstrapPayload,
  UserCenterCustomerRecord,
  UserCenterEnterpriseRecord,
  UserCenterReviewRecord,
  UserUpsertPayload,
} from './types'
import { getStoredOperatorSession } from './session'
import type { AiCapabilities, AiTurn, MaterialRequest, MaterialResult, AnalysisResult, SelectionResult, KnowledgeSource, KnowledgeDocument } from './workbench'

const API_BASE_URL = 'http://localhost:8080'

export type AiStreamEvent =
  | { event: 'stage' | 'prompt_delta' | 'text_delta'; data: string }
  | { event: 'material'; data: MaterialResult }
  | { event: 'selection'; data: SelectionResult }
  | { event: 'analysis'; data: AnalysisResult }
  | { event: 'sources'; data: KnowledgeSource[] }
  | { event: 'done'; data: boolean }
  | { event: 'error'; data: { message: string } }

export async function streamAi(
  kind: 'materials' | 'chat' | 'selection' | 'analysis',
  payload: MaterialRequest | { skill: string; message: string; history: AiTurn[] }
    | { category: string; benchmark: string; notes: string } | { productId: string; notes: string },
  signal: AbortSignal,
  onEvent: (event: AiStreamEvent) => void,
) {
  const session = getStoredOperatorSession()
  const response = await fetch(`${API_BASE_URL}/api/admin/ai/workbench/${kind}/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream', Authorization: `Bearer ${session?.token ?? ''}` },
    body: JSON.stringify(payload),
    signal: AbortSignal.any([signal, AbortSignal.timeout(900000)]),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => null)
    throw new Error(error?.message || `请求失败（${response.status}），请检查登录状态。`)
  }
  if (!response.body || !response.headers.get('content-type')?.includes('text/event-stream'))
    throw new Error('服务未返回对话流，请重新登录后重试。')
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let completed = false
  try {
    while (true) {
      const { value, done } = await reader.read()
      buffer += decoder.decode(value, { stream: !done })
      buffer = buffer.replace(/\r\n/g, '\n')
      let boundary: number
      while ((boundary = buffer.indexOf('\n\n')) >= 0) {
        const block = buffer.slice(0, boundary)
        buffer = buffer.slice(boundary + 2)
        const lines = block.split('\n')
        const event = lines.find(line => line.startsWith('event:'))?.slice(6).trim()
        const data = lines.filter(line => line.startsWith('data:')).map(line => line.slice(5).trimStart()).join('\n')
        if (!event || !data) continue
        const item = { event, data: JSON.parse(data) } as AiStreamEvent
        if (item.event === 'error') throw new Error(item.data.message)
        if (item.event === 'done') completed = true
        onEvent(item)
      }
      if (done) break
    }
    if (!completed) throw new Error('连接已中断，已生成内容已保留。')
  } finally {
    await reader.cancel().catch(() => undefined)
    reader.releaseLock()
  }
}

export function listKnowledge(kind: string, keyword = '', uploader = '') {
  return request<KnowledgeDocument[]>(`/api/admin/knowledge?${new URLSearchParams({ kind, keyword, uploader })}`)
}
export function getKnowledge(id: string) { return request<KnowledgeDocument>(`/api/admin/knowledge/${encodeURIComponent(id)}`) }
export function deleteKnowledge(id: string) { return request<void>(`/api/admin/knowledge/${encodeURIComponent(id)}`, { method: 'DELETE' }) }
export function createKnowledge(payload: Pick<KnowledgeDocument, 'kind' | 'fileName' | 'keywords' | 'content' | 'sourceUrl'>) {
  return request<KnowledgeDocument>('/api/admin/knowledge', { method: 'POST', body: JSON.stringify(payload) })
}

export async function getAiWorkbench() {
  return request<AiCapabilities>('/api/admin/ai/workbench')
}

export async function createAiMaterial(payload: MaterialRequest, signal: AbortSignal) {
  return request<MaterialResult>('/api/admin/ai/workbench/materials', {
    method: 'POST', body: JSON.stringify(payload), signal: AbortSignal.any([signal, AbortSignal.timeout(150000)]),
  })
}

export async function sendAiMessage(skill: string, message: string, history: AiTurn[], signal: AbortSignal) {
  return request<{ id: string; content: string }>('/api/admin/ai/workbench/chat', {
    method: 'POST', body: JSON.stringify({ skill, message, history }), signal: AbortSignal.any([signal, AbortSignal.timeout(150000)]),
  })
}

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

  const result = (await response.json()) as ApiResponse<T>
  if (!response.ok || result.code !== 0) {
    throw new Error(result.message || '请求失败')
  }

  return result.data
}

async function requestBlob(path: string, options?: RequestInit) {
  const session = getStoredOperatorSession()
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
      ...(options?.headers ?? {}),
    },
    ...options,
  })

  if (!response.ok) {
    throw new Error('文件下载失败')
  }

  return response.blob()
}

/**
 * 运营员工账号登录。
 */
export async function operatorLogin(account: string, password: string) {
  return request<OperatorAuthPayload>('/api/auth/operator/login', {
    method: 'POST',
    body: JSON.stringify({ account, password }),
  })
}

/**
 * 获取企业中心初始化数据。
 */
export async function getEnterpriseBootstrap() {
  return request<EnterpriseBootstrapPayload>('/api/admin/operator-enterprise/bootstrap')
}

/**
 * 获取当前员工档案。
 */
export async function getCurrentEmployeeProfile() {
  return request<EmployeeRecord>('/api/admin/operator-enterprise/me')
}

/**
 * 更新当前员工档案。
 */
export async function updateCurrentEmployeeProfile(payload: EmployeeProfileFormValues) {
  return request<EmployeeRecord>('/api/admin/operator-enterprise/me/profile', {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

/**
 * 创建员工。
 */
export async function createEnterpriseEmployee(payload: EmployeeAdminFormValues) {
  return request<EmployeeRecord>('/api/admin/operator-enterprise/employees', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

/**
 * 更新员工。
 */
export async function updateEnterpriseEmployee(employeeId: string, payload: EmployeeAdminFormValues) {
  return request<EmployeeRecord>(`/api/admin/operator-enterprise/employees/${employeeId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

/**
 * 删除员工。
 */
export async function deleteEnterpriseEmployee(employeeId: string) {
  return request<void>(`/api/admin/operator-enterprise/employees/${employeeId}`, {
    method: 'DELETE',
  })
}

interface RoleUpsertPayload {
  code: string
  description: string
  name: string
  permissionKeys: string[]
}

/**
 * 创建角色。
 */
export async function createEnterpriseRole(payload: RoleUpsertPayload) {
  return request<RoleRecord>('/api/admin/operator-enterprise/roles', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

/**
 * 更新角色。
 */
export async function updateEnterpriseRole(roleId: string, payload: RoleUpsertPayload) {
  return request<RoleRecord>(`/api/admin/operator-enterprise/roles/${roleId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

/**
 * 删除角色。
 */
export async function deleteEnterpriseRole(roleId: string) {
  return request<void>(`/api/admin/operator-enterprise/roles/${roleId}`, {
    method: 'DELETE',
  })
}

/**
 * 更新角色权限。
 */
export async function updateEnterpriseRolePermissions(roleId: string, permissionKeys: string[]) {
  return request<void>(`/api/admin/operator-enterprise/roles/${roleId}/permissions`, {
    method: 'PUT',
    body: JSON.stringify({ permissionKeys }),
  })
}

interface DepartmentUpsertPayload {
  code: string
  description: string
  managerEmployeeId: string | null
  name: string
  parentId: string | null
  sortOrder: number
}

/**
 * 创建部门。
 */
export async function createEnterpriseDepartment(payload: DepartmentUpsertPayload) {
  return request<OrganizationRecord>('/api/admin/operator-enterprise/departments', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

/**
 * 更新部门。
 */
export async function updateEnterpriseDepartment(departmentId: string, payload: DepartmentUpsertPayload) {
  return request<OrganizationRecord>(`/api/admin/operator-enterprise/departments/${departmentId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

/**
 * 删除部门。
 */
export async function deleteEnterpriseDepartment(departmentId: string) {
  return request<void>(`/api/admin/operator-enterprise/departments/${departmentId}`, {
    method: 'DELETE',
  })
}

/**
 * 获取用户中心初始化数据。
 */
export async function getUserCenterBootstrap() {
  return request<UserCenterBootstrapPayload>('/api/admin/user-center/bootstrap')
}

/**
 * 获取客户画像外部数据接口模板。
 */
export async function getUserCenterPortraitExternalTemplate() {
  return request<PortraitExternalDataTemplateRecord>('/api/admin/user-center/portraits/external-template')
}

/**
 * 创建客户。
 */
export async function createUserCenterUser(payload: UserUpsertPayload) {
  return request<UserCenterCustomerRecord>('/api/admin/user-center/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

/**
 * 更新客户。
 */
export async function updateUserCenterUser(userId: string, payload: UserUpsertPayload) {
  return request<UserCenterCustomerRecord>(`/api/admin/user-center/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

/**
 * 删除客户。
 */
export async function deleteUserCenterUser(userId: string) {
  return request<void>(`/api/admin/user-center/users/${userId}`, {
    method: 'DELETE',
  })
}

/**
 * 通过分销商认证。
 */
export async function approveUserCenterReview(applicationId: string) {
  return request<UserCenterReviewRecord>(`/api/admin/user-center/reviews/${applicationId}/approve`, {
    method: 'POST',
  })
}

/**
 * 驳回分销商认证。
 */
export async function rejectUserCenterReview(applicationId: string, payload: ReviewRejectPayload) {
  return request<UserCenterReviewRecord>(`/api/admin/user-center/reviews/${applicationId}/reject`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

/**
 * 创建企业档案。
 */
export async function createUserCenterEnterprise(payload: EnterpriseUpsertPayload) {
  return request<UserCenterEnterpriseRecord>('/api/admin/user-center/companies', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

/**
 * 更新企业档案。
 */
export async function updateUserCenterEnterprise(enterpriseId: string, payload: EnterpriseUpsertPayload) {
  return request<UserCenterEnterpriseRecord>(`/api/admin/user-center/companies/${enterpriseId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

/**
 * 创建会员等级。
 */
export async function createUserCenterMemberLevel(payload: MemberLevelUpsertPayload) {
  return request<MemberLevelConfigRecord>('/api/admin/user-center/members', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

/**
 * 更新会员等级。
 */
export async function updateUserCenterMemberLevel(levelId: string, payload: MemberLevelUpsertPayload) {
  return request<MemberLevelConfigRecord>(`/api/admin/user-center/members/${levelId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

/**
 * 删除会员等级。
 */
export async function deleteUserCenterMemberLevel(levelId: string) {
  return request<void>(`/api/admin/user-center/members/${levelId}`, {
    method: 'DELETE',
  })
}

/**
 * 获取商品中心初始化数据。
 */
export async function getCatalogBootstrap() {
  return request<CatalogBootstrapPayload>('/api/admin/catalog/bootstrap')
}

/**
 * 创建分类。
 */
export async function createProductCategory(payload: CategoryUpsertPayload) {
  return request<ProductCategoryRecord>('/api/admin/catalog/categories', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

/**
 * 更新分类。
 */
export async function updateProductCategory(categoryId: string, payload: CategoryUpsertPayload) {
  return request<ProductCategoryRecord>(`/api/admin/catalog/categories/${categoryId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

/**
 * 删除分类。
 */
export async function deleteProductCategory(categoryId: string) {
  return request<void>(`/api/admin/catalog/categories/${categoryId}`, {
    method: 'DELETE',
  })
}

/**
 * 创建商品。
 */
export async function createCatalogProduct(payload: ProductUpsertPayload) {
  return request<CatalogProductRecord>('/api/admin/catalog/products', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

/**
 * 更新商品。
 */
export async function updateCatalogProduct(productId: string, payload: ProductUpsertPayload) {
  return request<CatalogProductRecord>(`/api/admin/catalog/products/${productId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

/**
 * 删除商品。
 */
export async function deleteCatalogProduct(productId: string) {
  return request<void>(`/api/admin/catalog/products/${productId}`, {
    method: 'DELETE',
  })
}

/**
 * 获取报价单初始化数据。
 */
export async function getQuotationBootstrap() {
  return request<QuotationBootstrapPayload>('/api/admin/quotations/bootstrap')
}

/**
 * 获取报价单详情。
 */
export async function getQuotation(quotationId: string) {
  return request<QuotationRecord>(`/api/admin/quotations/${quotationId}`)
}

/**
 * 创建报价单。
 */
export async function createQuotation(payload: QuotationUpsertPayload) {
  return request<QuotationRecord>('/api/admin/quotations', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

/**
 * 更新报价单。
 */
export async function updateQuotation(quotationId: string, payload: QuotationUpsertPayload) {
  return request<QuotationRecord>(`/api/admin/quotations/${quotationId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

/**
 * 删除报价单。
 */
export async function deleteQuotation(quotationId: string) {
  return request<void>(`/api/admin/quotations/${quotationId}`, {
    method: 'DELETE',
  })
}

/**
 * 下载报价单 Excel。
 */
export async function exportQuotationExcel(quotationId: string) {
  return requestBlob(`/api/admin/quotations/${quotationId}/export`)
}
