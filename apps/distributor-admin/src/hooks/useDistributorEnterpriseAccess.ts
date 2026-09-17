import { useDistributorEnterpriseCompanyBootstrap } from './useDistributorEnterpriseCompanyBootstrap'

/**
 * 统一读取经销商企业接入状态。
 */
export function useDistributorEnterpriseAccess() {
  const { bootstrap, isLoading, reload } = useDistributorEnterpriseCompanyBootstrap()

  return {
    bootstrap,
    enterprise: bootstrap?.enterprise ?? null,
    hasEnterprise: Boolean(bootstrap?.enterprise),
    isLoading,
    reload,
  }
}
