import { message } from 'antd'
import { useCallback, useEffect, useState } from 'react'
import { getQuotationBootstrap } from '../api'
import type { QuotationBootstrapPayload } from '../types'

/**
 * 统一加载报价单数据。
 */
export function useQuotationBootstrap() {
  const [bootstrap, setBootstrap] = useState<QuotationBootstrapPayload | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const reload = useCallback(async () => {
    setIsLoading(true)
    try {
      const payload = await getQuotationBootstrap()
      setBootstrap(payload)
    } catch (error) {
      void message.error(error instanceof Error ? error.message : '报价单数据加载失败')
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
