import { message } from 'antd'
import { useCallback, useEffect, useState } from 'react'
import { getCatalogBootstrap } from '../api'
import type { CatalogBootstrapPayload } from '../types'

/**
 * 统一加载商品中心与分类管理数据。
 */
export function useCatalogBootstrap() {
  const [bootstrap, setBootstrap] = useState<CatalogBootstrapPayload | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const reload = useCallback(async () => {
    setIsLoading(true)
    try {
      const payload = await getCatalogBootstrap()
      setBootstrap(payload)
    } catch (error) {
      void message.error(error instanceof Error ? error.message : '商品中心数据加载失败')
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
