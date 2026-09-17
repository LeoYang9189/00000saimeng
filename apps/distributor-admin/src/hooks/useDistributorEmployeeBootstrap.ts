import { App as AntdApp } from 'antd'
import { useCallback, useEffect, useState } from 'react'
import { getDistributorEmployeeBootstrap } from '../api'
import type { DistributorEnterpriseEmployeeBootstrapPayload } from '../types'

/**
 * 加载经销商企业员工管理数据。
 */
export function useDistributorEmployeeBootstrap() {
  const { message } = AntdApp.useApp()
  const [bootstrap, setBootstrap] = useState<DistributorEnterpriseEmployeeBootstrapPayload | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const reload = useCallback(async () => {
    setIsLoading(true)
    try {
      const payload = await getDistributorEmployeeBootstrap()
      setBootstrap(payload)
    } catch (error) {
      setBootstrap(null)
      const errorMessage = error instanceof Error ? error.message : '员工管理数据加载失败'
      if (!/未绑定企业|未加入企业|未认证企业|企业不存在/.test(errorMessage)) {
        void message.error(errorMessage)
      }
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
