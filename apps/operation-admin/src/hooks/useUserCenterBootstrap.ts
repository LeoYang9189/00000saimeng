import { message } from 'antd'
import { useCallback, useEffect, useState } from 'react'
import { getUserCenterBootstrap } from '../api'
import type { UserCenterBootstrapPayload } from '../types'

/**
 * 统一加载用户中心真实数据。
 */
export function useUserCenterBootstrap() {
  const [bootstrap, setBootstrap] = useState<UserCenterBootstrapPayload | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const reload = useCallback(async () => {
    setIsLoading(true)
    try {
      const payload = await getUserCenterBootstrap()
      setBootstrap(payload)
    } catch (error) {
      void message.error(error instanceof Error ? error.message : '用户中心数据加载失败')
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
