export const SAIMENG_PORTALS = {
  distributorAdmin: 'distributor-admin',
  operationAdmin: 'operation-admin',
  webStore: 'web-store',
} as const

export type SaimengPortalCode =
  (typeof SAIMENG_PORTALS)[keyof typeof SAIMENG_PORTALS]
