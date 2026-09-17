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

export interface UserCenterCustomerRecord {
  id: string
  phone: string
  displayName: string
  enabled: boolean
  enterpriseId: string | null
  enterpriseName: string
  roles: string[]
  realNameStatus: string
  realName: string
  applicationStatus: string
  enterpriseStatus: string
  portraitSegmentCode: string
  portraitSegmentName: string
  primaryCategories: string[]
  pickupFrequencyPerMonth: number | null
  avgOrderAmount: number | null
  repaymentDays: number | null
  recommendedPolicy: string
  policyTags: string[]
  externalDataStatus: string
  externalDataEndpoint: string
  lastPortraitSyncAt: string | null
  createdAt: string
}

export interface UserCenterReviewDocumentRecord {
  documentKey: string
  documentName: string
  documentNo: string | null
  authenticityStatus: string
  expiryDate: string | null
  expiryStatus: string
  documentStatus: string
  riskNote: string | null
}

export interface UserCenterReviewRecord {
  applicationId: string
  userId: string
  phone: string
  displayName: string
  realNameStatus: string
  realName: string
  storeName: string
  companyName: string
  contactName: string
  businessScope: string
  status: string
  reviewRemark: string | null
  aiRiskLevel: string
  aiRecommendation: string
  aiSummary: string
  missingDocumentKeys: string[]
  riskFlags: string[]
  authenticityScore: number
  completenessScore: number
  complianceScore: number
  aiReportStatus: string
  documentChecks: UserCenterReviewDocumentRecord[]
  submittedAt: string
  reviewedAt: string | null
  analyzedAt: string | null
}

export interface UserCenterEnterpriseRecord {
  id: string
  enterpriseNo: string
  userId: string | null
  applicationId: string | null
  sourceType: string
  userPhone: string
  userDisplayName: string
  companyName: string
  storeName: string
  contactName: string
  contactPhone: string
  businessScope: string
  enabled: boolean
  reviewRemark: string | null
  memberLevelKey: string
  memberLevelName: string
  portraitSegmentCode: string
  portraitSegmentName: string
  primaryCategories: string[]
  pickupFrequencyPerMonth: number | null
  avgOrderAmount: number | null
  repaymentDays: number | null
  recommendedPolicy: string
  policyTags: string[]
  externalDataStatus: string
  externalDataEndpoint: string
  lastPortraitSyncAt: string | null
  applicationStatus: string
  aiRiskLevel: string
  aiRecommendation: string
  aiSummary: string
  riskFlags: string[]
  missingDocumentKeys: string[]
  authenticityScore: number
  completenessScore: number
  complianceScore: number
  documentChecks: UserCenterReviewDocumentRecord[]
  associatedUsers: UserCenterEnterpriseAssociatedUserRecord[]
  createdAt: string
  updatedAt: string
  submittedAt: string | null
  reviewedAt: string | null
  analyzedAt: string | null
}

export interface UserCenterEnterpriseAssociatedUserRecord {
  id: string
  phone: string
  displayName: string
  enabled: boolean
  roles: string[]
  realNameStatus: string
  realName: string
  applicationStatus: string
  createdAt: string
}

export interface MemberLevelConfigRecord {
  id: string
  levelKey: string
  levelName: string
  levelRank: number
  levelTitle: string
  levelDescription: string
  summaryText: string
  progressText: string
  missionText: string
  missionAction: string
  highlightTitle: string
  visualSrc: string
  heroStart: string
  heroMid: string
  heroEnd: string
  accent: string
  softAccent: string
  cardSurface: string
  placeholderTone: string
  glowColor: string
  sparkColor: string
  progressPercent: number
  highlightKeys: string[]
  benefitKeys: string[]
  enabled: boolean
  createdAt: string
  updatedAt: string
}

export interface BenefitOptionRecord {
  key: string
  group: string
  title: string
}

export interface HighlightOptionRecord {
  key: string
  title: string
}

export interface PortraitExternalDataTemplateRecord {
  providerName: string
  method: string
  endpoint: string
  requiredFields: string[]
  note: string
}

export interface UserCenterBootstrapPayload {
  users: UserCenterCustomerRecord[]
  reviews: UserCenterReviewRecord[]
  enterprises: UserCenterEnterpriseRecord[]
  memberLevels: MemberLevelConfigRecord[]
  benefitOptions: BenefitOptionRecord[]
  highlightOptions: HighlightOptionRecord[]
  portraitExternalDataTemplate: PortraitExternalDataTemplateRecord
}

export interface UserUpsertPayload {
  phone: string
  displayName: string
  password: string
  enabled: boolean
  enterpriseId?: string
}

export interface ReviewRejectPayload {
  reason: string
}

export interface EnterpriseUpsertPayload {
  userId: string
  applicationId: string
  sourceType: string
  companyName: string
  storeName: string
  contactName: string
  contactPhone: string
  businessScope: string
  enabled: boolean
  reviewRemark: string
  memberLevelKey: string
}

export interface MemberLevelUpsertPayload {
  levelKey: string
  levelName: string
  levelRank: number
  levelTitle: string
  levelDescription: string
  summaryText: string
  progressText: string
  missionText: string
  missionAction: string
  highlightTitle: string
  visualSrc: string
  heroStart: string
  heroMid: string
  heroEnd: string
  accent: string
  softAccent: string
  cardSurface: string
  placeholderTone: string
  glowColor: string
  sparkColor: string
  progressPercent: number
  highlightKeys: string[]
  benefitKeys: string[]
  enabled: boolean
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



export interface ProductCategoryRecord {
  id: string
  parentId: string | null
  categoryName: string
  categoryCode: string
  categoryLevel: number
  sortOrder: number
  enabled: boolean
  leaf: boolean
  pathNames: string[]
  createdAt: string
  updatedAt: string
}

export interface CatalogProductRecord {
  id: string
  productName: string
  productCode: string
  categoryId: string | null
  categoryName: string
  categoryPathNames: string[]
  brandName: string
  originCountry: string
  sellingPoint: string
  mainImage: string
  thumbnailImage: string
  boxImage: string
  galleryImages: string[]
  barcode: string
  netContent: string
  caseSpec: string
  palletsPerContainer: number | null
  casesPerPallet: number | null
  casesPerContainer: number | null
  shelfLifeMonths: number | null
  sizeCm: string
  grossWeightKg: string
  ingredients: string
  stockQuantity: number
  memberPriceBronze: number
  memberPriceSilver: number
  memberPriceGold: number
  memberPricePlatinum: number
  memberPriceDiamond: number
  memberPriceBlackDiamond: number
  retailPrice: number
  detailHtml: string
  sourceType: string
  auditStatus: string
  inPublicPool: boolean
  enabled: boolean
  createdAt: string
  updatedAt: string
}

export interface CatalogBootstrapPayload {
  categories: ProductCategoryRecord[]
  products: CatalogProductRecord[]
}

export interface CategoryUpsertPayload {
  parentId: string
  categoryName: string
  categoryCode: string
  sortOrder: number
  enabled: boolean
}

export interface ProductUpsertPayload {
  productName: string
  productCode: string
  categoryId: string
  brandName: string
  originCountry: string
  sellingPoint: string
  mainImage: string
  thumbnailImage: string
  boxImage: string
  galleryImages: string[]
  barcode: string
  netContent: string
  caseSpec: string
  palletsPerContainer: number
  casesPerPallet: number
  casesPerContainer: number
  shelfLifeMonths: number
  sizeCm: string
  grossWeightKg: string
  ingredients: string
  stockQuantity: number
  memberPriceBronze: number
  memberPriceSilver: number
  memberPriceGold: number
  memberPricePlatinum: number
  memberPriceDiamond: number
  memberPriceBlackDiamond: number
  retailPrice: number
  detailHtml: string
  enabled: boolean
}

export interface QuotationItemRecord {
  id: string
  productId: string
  categoryName: string
  originCountry: string
  brandName: string
  productName: string
  productCode: string
  barcode: string
  quantity: number
  stockQuantity: number
  memberPriceBronze: number
  memberPriceSilver: number
  memberPriceGold: number
  memberPricePlatinum: number
  memberPriceDiamond: number
  memberPriceBlackDiamond: number
  retailPrice: number
  mainImage: string
  boxImage: string
  netContent: string
  caseSpec: string
  shelfLifeMonths: number | null
  sizeCm: string
  grossWeightKg: string
  ingredients: string
}

export interface QuotationRecord {
  id: string
  quotationNo: string
  quotationTitle: string
  customerCompany: string
  customerName: string
  contactName: string
  contactPhone: string
  remark: string
  totalProductCount: number
  totalQuantity: number
  createdByUserId: string | null
  createdByUserName: string
  lastExportedAt: string | null
  items: QuotationItemRecord[]
  createdAt: string
  updatedAt: string
}

export interface QuotationBootstrapPayload {
  quotations: QuotationRecord[]
  products: CatalogProductRecord[]
}

export interface QuotationItemUpsertPayload {
  productId: string
  quantity: number
}

export interface QuotationUpsertPayload {
  quotationTitle: string
  customerCompany: string
  customerName: string
  contactName: string
  contactPhone: string
  remark: string
  items: QuotationItemUpsertPayload[]
}
