import { App as AntdApp } from 'antd'
import { useCallback, useEffect, useState } from 'react'
import { getDistributorEnterpriseCompanyBootstrap } from '../api'
import type { DistributorEnterpriseCompanyBootstrapPayload } from '../types'

/**
 * 加载经销商企业管理首页数据。
 */
export function useDistributorEnterpriseCompanyBootstrap() {
  const { message } = AntdApp.useApp()
  const [bootstrap, setBootstrap] = useState<DistributorEnterpriseCompanyBootstrapPayload | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const reload = useCallback(async () => {
    setIsLoading(true)
    try {
      const payload = await getDistributorEnterpriseCompanyBootstrap()
      setBootstrap(payload)
    } catch (error) {
      void message.error(error instanceof Error ? error.message : '企业管理数据加载失败')
    } finally {
      setIsLoading(false)
    }
  }, [message])

  useEffect(() => {
    void reload()
  }, [reload])

  return {
    bootstrap,
    isLoading,
    reload,
  }
}
