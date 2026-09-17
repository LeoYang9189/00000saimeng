export interface UserProfile {
  userId: number
  phone: string
  displayName: string
  roles: string[]
  createdAt: string
}

export interface AuthPayload {
  token: string
  profile: UserProfile
}

export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

export interface RealNameAuthRecord {
  authId: number
  userId: number
  realName: string
  idCardNo: string
  status: string
  reviewRemark: string | null
  submittedAt: string
  reviewedAt: string | null
}

export interface MemberProfileResponse {
  userProfile: UserProfile
  realNameAuthRecord: RealNameAuthRecord | null
}

export interface MerchantApplicationRecord {
  applicationId: number
  userId: number
  storeName: string
  companyName: string
  contactName: string
  businessScope: string
  status: string
  reviewRemark: string | null
  submittedAt: string
  reviewedAt: string | null
}

export interface ProductRecord {
  productId: number
  productName: string
  originCountry: string
  sellingPoint: string
  sourceType: string
  sourceMerchantUserId: number | null
  auditStatus: string
  inPublicPool: boolean
  createdByUserId: number
  createdAt: string
  reviewedByUserId: number | null
  reviewedAt: string | null
}

export interface ProductDetailRecord {
  productId: number
  productName: string
  productCode: string
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
  createdAt: string
  updatedAt: string
}

export interface MemberCenterLevelConfigRecord {
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

export interface PublicMemberCenterConfigPayload {
  levels: MemberCenterLevelConfigRecord[]
}

export interface FeedbackSubmitPayload {
  feedbackType: string
  relatedOrderNo?: string | null
  content: string
  contact?: string | null
  attachmentNames: string[]
}

export interface FeedbackRecord {
  feedbackId: number
  userId: number | null
  feedbackType: string
  relatedOrderNo: string | null
  content: string
  contact: string | null
  attachmentNames: string[]
  status: string
  sourceChannel: string
  createdAt: string
}
