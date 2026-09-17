import { message } from 'antd'
import { useCallback, useEffect, useState } from 'react'
import { getEnterpriseBootstrap } from '../api'
import type { EnterpriseBootstrapPayload } from '../types'

/**
 * 统一加载企业中心真实数据。
 */
export function useEnterpriseBootstrap() {
  const [bootstrap, setBootstrap] = useState<EnterpriseBootstrapPayload | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const reload = useCallback(async () => {
    setIsLoading(true)

    try {
      const payload = await getEnterpriseBootstrap()
      setBootstrap(payload)
    } catch (error) {
      void message.error(error instanceof Error ? error.message : '企业中心数据加载失败')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  return {
    bootstrap,
    isLoading,
    reload,
  }
}
