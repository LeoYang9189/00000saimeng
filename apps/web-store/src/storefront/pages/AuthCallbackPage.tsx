import { Button, Result, Spin } from 'antd'
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getMemberProfile } from '../api'
import { useStorefrontSession } from '../session'

/**
 * 跨端口登录回调页。
 */
export function AuthCallbackPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { setSession } = useStorefrontSession()
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let isCancelled = false

    async function hydrateSession() {
      const token = searchParams.get('token')
      const next = searchParams.get('next') || '/member-center'

      if (!token) {
        if (!isCancelled) {
          setErrorMessage('登录信息缺失，请重新登录。')
        }
        return
      }

      try {
        const payload = await getMemberProfile(token)
        if (isCancelled) {
          return
        }

        setSession({
          token,
          profile: payload.userProfile,
        })
        void navigate(next, { replace: true })
      } catch (error) {
        if (!isCancelled) {
          setErrorMessage(error instanceof Error ? error.message : '登录信息同步失败，请重新登录。')
        }
      }
    }

    void hydrateSession()

    return () => {
      isCancelled = true
    }
  }, [navigate, searchParams, setSession])

  if (errorMessage) {
    return (
      <main className="member-auth-callback">
        <Result
          extra={
            <Button href="/" type="primary">
              返回首页
            </Button>
          }
          status="error"
          subTitle={errorMessage}
          title="登录回调失败"
        />
      </main>
    )
  }

  return (
    <main className="member-auth-callback">
      <div className="member-auth-callback__loading">
        <Spin size="large" />
        <p>正在同步登录状态并进入会员中心...</p>
      </div>
    </main>
  )
}
