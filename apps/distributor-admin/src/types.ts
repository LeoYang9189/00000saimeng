export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

export interface OperatorProfile {
  userId: number
  phone: string
  displayName: string
  roles: string[]
  createdAt: string
}

export interface OperatorAuthPayload {
  token: string
  profile: OperatorProfile
}

export interface OperatorSessionData {
  token: string
  profile: OperatorProfile
}

export type EmployeeStatus = 'ACTIVE' | 'INVITED' | 'DISABLED'

export interface EmployeeRecord {
  id: string
  account: string
  accountEnabled: boolean
  name: string
  employeeNo: string
  phone: string
  email: string
  departmentId: string
  position: string
  roleIds: string[]
  status: EmployeeStatus
  joinDate: string
  address: string
  bio: string
  emergencyContact: string
  emergencyPhone: string
  updatedAt: string
}

export interface RoleRecord {
  id: string
  name: string
  code: string
  description: string
  permissionKeys: string[]
  isBuiltIn?: boolean
}

export interface PermissionRecord {
  key: string
  title: string
  children?: PermissionRecord[]
}

export interface OrganizationRecord {
  id: string
  parentId: string | null
  name: string
  code: string
  managerEmployeeId: string | null
  description: string
  sortOrder: number
}

export interface EnterpriseBootstrapPayload {
  currentEmployee: EmployeeRecord
  employees: EmployeeRecord[]
  roles: RoleRecord[]
  permissions: PermissionRecord[]
  organizations: OrganizationRecord[]
}

export interface DistributorEnterpriseEmployeeRecord {
  id: string
  phone: string
  displayName: string
  enabled: boolean
  enterpriseId: string
  enterpriseName: string
  roles: string[]
  realNameStatus: string
  realName: string
  applicationStatus: string
  enterpriseStatus: string
  createdAt: string
}

export interface DistributorEnterpriseJoinRequestRecord {
  requestId: string
  enterpriseId: string
  userId: string
  applicantName: string
  applicantPhone: string
  position: string
  applyRemark: string
  status: string
  reviewRemark: string | null
  createdAt: string
  reviewedAt: string | null
}

export interface DistributorEnterpriseEmployeeBootstrapPayload {
  enterpriseId: string
  enterpriseNo: string
  companyName: string
  storeName: string
  currentUserId: string
  currentUserIsSuperAdmin: boolean
  superAdminUserId: string | null
  superAdminName: string
  joinRequests: DistributorEnterpriseJoinRequestRecord[]
  employees: DistributorEnterpriseEmployeeRecord[]
}

export interface DistributorEnterpriseEmployeeUpsertPayload {
  phone: string
  displayName: string
  password: string
  enabled: boolean
}

export interface EnterpriseProfileSnapshot {
  basicInfo: {
    companyAddress: string
    legalRepresentative: string
    unifiedSocialCreditCode: string
  }
  financeInfo: {
    bankName: string
    bankAccountName: string
    bankAccountNo: string
    invoiceTitle: string
  }
  businessInfo: {
    preferredCategories: string[]
    expectedMonthlyPurchase: string
    expectedRepaymentDays: string
    recommendedPolicy: string
  }
}

export interface DistributorEnterpriseSummaryRecord {
  id: string
  enterpriseNo: string
  companyName: string
  storeName: string
  contactName: string
  contactPhone: string
  businessScope: string
  enabled: boolean
  applicationStatus: string
  superAdminUserId: string | null
  superAdminName: string
  memberLevelName: string
  associatedUserCount: number
  profileSnapshot: EnterpriseProfileSnapshot
  createdAt: string
  updatedAt: string
}

export interface DistributorEnterpriseCertificationApplicationRecord {
  applicationId: string
  userId: string
  companyName: string
  storeName: string
  contactName: string
  contactPhone: string
  businessScope: string
  status: string
  reviewRemark: string | null
  profileSnapshot: EnterpriseProfileSnapshot
  submittedAt: string
  reviewedAt: string | null
}

export interface DistributorEnterpriseCurrentJoinRequestRecord {
  requestId: string
  enterpriseId: string
  enterpriseNo: string
  companyName: string
  applicantName: string
  applicantPhone: string
  position: string
  applyRemark: string
  status: string
  reviewRemark: string | null
  createdAt: string
  reviewedAt: string | null
}

export interface DistributorEnterpriseCompanyBootstrapPayload {
  currentUserId: string
  currentUserDisplayName: string
  hasEnterprise: boolean
  isSuperAdmin: boolean
  enterprise: DistributorEnterpriseSummaryRecord | null
  certificationApplication: DistributorEnterpriseCertificationApplicationRecord | null
  currentJoinRequest: DistributorEnterpriseCurrentJoinRequestRecord | null
}

export interface DistributorEnterpriseSearchRecord {
  enterpriseId: string
  enterpriseNo: string
  companyName: string
  storeName: string
  contactName: string
  contactPhone: string
  enabled: boolean
  updatedAt: string
}

export interface DistributorEnterpriseCertificationPayload {
  companyName: string
  storeName: string
  contactName: string
  contactPhone: string
  businessScope: string
  profileSnapshot: EnterpriseProfileSnapshot
}

export interface DistributorEnterpriseJoinPayload {
  enterpriseId?: number
  position: string
  applyRemark: string
}

export interface DistributorEnterpriseJoinReviewPayload {
  reviewRemark: string
}

export interface EmployeeProfileFormValues {
  name: string
  phone: string
  email: string
  position: string
  address: string
  bio: string
  emergencyContact: string
  emergencyPhone: string
}

export interface EmployeeAdminFormValues extends EmployeeProfileFormValues {
  account: string
  accountEnabled: boolean
  password: string
  employeeNo: string
  departmentId: string
  roleIds: string[]
  status: EmployeeStatus
  joinDate: string
}


