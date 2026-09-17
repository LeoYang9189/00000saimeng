const WEB_STORE_ORIGIN = 'http://localhost:5173'
const DISTRIBUTOR_APP_ORIGIN = 'http://localhost:5175'

export const DISTRIBUTOR_LOGIN_URL = `${DISTRIBUTOR_APP_ORIGIN}/login`
export const DISTRIBUTOR_ADMIN_DASHBOARD_URL = `${DISTRIBUTOR_APP_ORIGIN}/admin/dashboard`
export const DISTRIBUTOR_ADMIN_AI_WORKBENCH_URL = DISTRIBUTOR_ADMIN_DASHBOARD_URL

interface DistributorSessionBridgePayload {
  token: string
  profile: {
    userId: number
    phone: string
    displayName: string
    roles: string[]
    createdAt: string
  }
}

/**
 * 构建分销登录地址。
 */
export function buildDistributorLoginUrl(mode: 'admin' | 'member' = 'admin') {
  if (mode === 'admin') {
    return DISTRIBUTOR_LOGIN_URL
  }

  const callbackUrl = new URL('/auth/callback', WEB_STORE_ORIGIN)
  callbackUrl.searchParams.set('next', '/member-center')

  const loginUrl = new URL('/login', DISTRIBUTOR_APP_ORIGIN)
  loginUrl.searchParams.set('redirect', callbackUrl.toString())
  return loginUrl.toString()
}

/**
 * 构建经销商 AI 工作台地址。
 */
export function buildDistributorAiWorkbenchUrl(session?: DistributorSessionBridgePayload | null) {
  if (!session) {
    return DISTRIBUTOR_LOGIN_URL
  }

  const transferUrl = new URL('/auth/transfer', DISTRIBUTOR_APP_ORIGIN)
  transferUrl.searchParams.set(
    'payload',
    JSON.stringify({
      token: session.token,
      profile: session.profile,
    }),
  )
  return transferUrl.toString()
}
