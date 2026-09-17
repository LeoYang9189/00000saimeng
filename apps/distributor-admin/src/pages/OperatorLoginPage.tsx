import { LockOutlined, MobileOutlined, UserOutlined } from '@ant-design/icons'
import { Alert, Button, Form, Input } from 'antd'
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  distributorLogin,
  distributorLoginWithVerificationCode,
  requestDistributorVerificationCode,
} from '../api'
import type { OperatorAuthPayload, OperatorSessionData } from '../types'

const WEB_STORE_REGISTER_URL = 'http://localhost:5173/register'

interface PasswordLoginFormValues {
  phone: string
  password: string
}

interface SmsLoginFormValues {
  phone: string
  verificationCode: string
}

type LoginMode = 'password' | 'sms' | 'scan'

interface OperatorLoginPageProps {
  currentSession: OperatorSessionData | null
  onLogin: (session: OperatorSessionData) => void
}

/**
 * 经销商后台登录页，视觉与商城登录页保持一致。
 */
export function OperatorLoginPage({ currentSession, onLogin }: OperatorLoginPageProps) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [loginMode, setLoginMode] = useState<LoginMode>('password')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSendingCode, setIsSendingCode] = useState(false)
  const [countdownSeconds, setCountdownSeconds] = useState(0)
  const [messageType, setMessageType] = useState<'error' | 'success'>('error')
  const [message, setMessage] = useState('')
  const [smsForm] = Form.useForm<SmsLoginFormValues>()

  useEffect(() => {
    if (countdownSeconds <= 0) {
      return
    }

    const timer = window.setTimeout(() => {
      setCountdownSeconds((currentSeconds) => currentSeconds - 1)
    }, 1000)

    return () => {
      window.clearTimeout(timer)
    }
  }, [countdownSeconds])

  function finishLogin(payload: OperatorAuthPayload) {
    if (!payload.profile.roles.includes('DISTRIBUTOR')) {
      setMessageType('error')
      setMessage('当前账号不是经销商账号，请使用已绑定企业的经销商账号登录')
      return
    }

    const nextSession = {
      token: payload.token,
      profile: payload.profile,
    }

    onLogin(nextSession)

    const redirectUrl = searchParams.get('redirect')
    if (redirectUrl) {
      const targetUrl = new URL(redirectUrl)
      targetUrl.searchParams.set('token', payload.token)
      window.location.replace(targetUrl.toString())
      return
    }

    void navigate('/admin/dashboard', { replace: true })
  }

  useEffect(() => {
    if (!currentSession) {
      return
    }

    const redirectUrl = searchParams.get('redirect')
    if (redirectUrl) {
      const targetUrl = new URL(redirectUrl)
      targetUrl.searchParams.set('token', currentSession.token)
      window.location.replace(targetUrl.toString())
      return
    }

    void navigate('/admin/dashboard', { replace: true })
  }, [currentSession, navigate, searchParams])

  async function handlePasswordLogin(values: PasswordLoginFormValues) {
    try {
      setIsSubmitting(true)
      setMessage('')
      const payload = await distributorLogin(values.phone, values.password)
      finishLogin(payload)
    } catch (error) {
      setMessageType('error')
      setMessage(error instanceof Error ? error.message : '登录失败')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleSmsLogin(values: SmsLoginFormValues) {
    try {
      setIsSubmitting(true)
      setMessage('')
      const payload = await distributorLoginWithVerificationCode(values.phone, values.verificationCode)
      finishLogin(payload)
    } catch (error) {
      setMessageType('error')
      setMessage(error instanceof Error ? error.message : '登录失败')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleSendVerificationCode() {
    try {
      const phone = smsForm.getFieldValue('phone')
      if (!phone) {
        setMessageType('error')
        setMessage('请先输入手机号')
        return
      }

      setIsSendingCode(true)
      setMessage('')
      const payload = await requestDistributorVerificationCode(phone)
      setCountdownSeconds(payload.expiresInSeconds > 60 ? 60 : payload.expiresInSeconds)
      setMessageType('success')
      setMessage('验证码已发送，请留意短信')
    } catch (error) {
      setMessageType('error')
      setMessage(error instanceof Error ? error.message : '验证码发送失败')
    } finally {
      setIsSendingCode(false)
    }
  }

  return (
    <main className="auth-layout">
      <aside className="auth-layout__aside">
        <div className="auth-layout__visual" />
      </aside>

      <section className="auth-layout__main">
        <div className="auth-layout__toolbar" />

        <div className="auth-panel">
          <div className="auth-card">
            <button className="auth-card__corner" onClick={() => setLoginMode(loginMode === 'scan' ? 'password' : 'scan')} type="button">
              <span>{loginMode === 'scan' ? '返回账号登录' : '扫码登录更安全'}</span>
            </button>

            {message ? <Alert className="auth-panel__alert" message={message} showIcon type={messageType} /> : null}

            {loginMode === 'scan' ? (
              <div className="auth-card__scan">
                <h2>手机扫码，安全登录</h2>
                <div className="auth-card__qr" />
                <div className="auth-card__scan-tip">
                  <p>
                    <span>打开</span>
                    <strong>微信</strong>
                    <span>扫一扫登录</span>
                  </p>
                </div>
                <a className="auth-card__link auth-card__link--register" href={WEB_STORE_REGISTER_URL}>
                  免费注册
                </a>
              </div>
            ) : (
              <>
                <div className="auth-card__tabs">
                  <button
                    className={`auth-card__tab${loginMode === 'password' ? ' auth-card__tab--active' : ''}`}
                    onClick={() => setLoginMode('password')}
                    type="button"
                  >
                    密码登录
                  </button>
                  <button
                    className={`auth-card__tab${loginMode === 'sms' ? ' auth-card__tab--active' : ''}`}
                    onClick={() => setLoginMode('sms')}
                    type="button"
                  >
                    短信登录
                  </button>
                </div>

                {loginMode === 'password' ? (
                  <Form className="auth-card__form" layout="vertical" onFinish={handlePasswordLogin}>
                    <Form.Item name="phone" rules={[{ required: true, message: '请输入账号/手机号' }]}>
                      <div className="auth-field">
                        <div className="auth-field__icon">
                          <UserOutlined />
                        </div>
                        <Input bordered={false} placeholder="请输入账号/手机号" size="large" />
                      </div>
                    </Form.Item>

                    <Form.Item name="password" rules={[{ required: true, message: '请输入登录密码' }]}>
                      <div className="auth-field">
                        <div className="auth-field__icon">
                          <LockOutlined />
                        </div>
                        <Input.Password bordered={false} placeholder="请输入登录密码" size="large" visibilityToggle={false} />
                      </div>
                    </Form.Item>

                    <Button block className="auth-card__submit" htmlType="submit" loading={isSubmitting} type="primary">
                      登录
                    </Button>
                  </Form>
                ) : (
                  <Form className="auth-card__form" form={smsForm} layout="vertical" onFinish={handleSmsLogin}>
                    <Form.Item name="phone" rules={[{ required: true, message: '请输入手机号' }]}>
                      <div className="auth-field">
                        <div className="auth-field__icon">
                          <MobileOutlined />
                        </div>
                        <div className="auth-field__country">+86</div>
                        <Input bordered={false} placeholder="请输入手机号" size="large" />
                      </div>
                    </Form.Item>

                    <Form.Item name="verificationCode" rules={[{ required: true, message: '请输入验证码' }]}>
                      <div className="auth-field">
                        <div className="auth-field__icon auth-field__icon--code">123</div>
                        <Input bordered={false} placeholder="请输入验证码" size="large" />
                        <button
                          className="auth-field__action"
                          disabled={isSendingCode || countdownSeconds > 0}
                          onClick={handleSendVerificationCode}
                          type="button"
                        >
                          {countdownSeconds > 0 ? `${countdownSeconds}s` : '发送验证码'}
                        </button>
                      </div>
                    </Form.Item>

                    <Button block className="auth-card__submit" htmlType="submit" loading={isSubmitting} type="primary">
                      登录
                    </Button>
                  </Form>
                )}

                <div className="auth-card__footer-links">
                  {loginMode === 'password' ? (
                    <>
                      <button type="button">忘记密码</button>
                      <button type="button">忘记账号</button>
                    </>
                  ) : null}
                  <a className="auth-card__link" href={WEB_STORE_REGISTER_URL}>
                    免费注册
                  </a>
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
