import { Button, Result, Spin } from 'antd'
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import type { OperatorSessionData } from '../types'

interface AuthTransferPageProps {
  onTransfer: (session: OperatorSessionData) => void
}

/**
 * 接收商城登录态并写入经销商后台会话。
 */
export function AuthTransferPage({ onTransfer }: AuthTransferPageProps) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const payload = searchParams.get('payload')
    if (!payload) {
      setErrorMessage('登录信息缺失，请重新进入 AI 助手。')
      return
    }

    try {
      const nextSession = JSON.parse(payload) as OperatorSessionData
      if (!nextSession.token || !nextSession.profile?.displayName || !nextSession.profile?.phone) {
        setErrorMessage('登录信息不完整，请重新进入 AI 助手。')
        return
      }
      if (!nextSession.profile.roles?.includes('DISTRIBUTOR')) {
        setErrorMessage('当前登录账号未开通经销商后台权限，请先完成企业认证或使用经销商账号登录。')
        return
      }

      onTransfer(nextSession)
      void navigate('/admin/dashboard', { replace: true })
    } catch {
      setErrorMessage('登录信息解析失败，请重新进入 AI 助手。')
    }
  }, [navigate, onTransfer, searchParams])

  if (errorMessage) {
    return (
      <main className="auth-layout">
        <section className="auth-layout__main">
          <Result
            extra={
              <Button href="/login" type="primary">
                前往登录
              </Button>
            }
            status="error"
            subTitle={errorMessage}
            title="AI 助手进入失败"
          />
        </section>
      </main>
    )
  }

  return (
    <main className="auth-layout">
      <section className="auth-layout__main">
        <div className="auth-transfer__loading">
          <Spin size="large" />
          <p>正在进入 AI 工作台...</p>
        </div>
      </section>
    </main>
  )
}
