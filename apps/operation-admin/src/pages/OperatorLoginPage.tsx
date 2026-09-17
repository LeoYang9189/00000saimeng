import { LockOutlined, QrcodeOutlined, UserOutlined } from '@ant-design/icons'
import { Button, Form, Input, message } from 'antd'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { operatorLogin } from '../api'
import loginHeroImage from '../assets/hero.png'
import type { OperatorSessionData } from '../types'

type LoginMode = 'password' | 'wecom'

interface OperatorLoginPageProps {
  onLogin: (session: OperatorSessionData) => void
}

interface OperatorLoginFormValues {
  account: string
  password: string
}

/**
 * 运营后台登录页。
 */
export function OperatorLoginPage({ onLogin }: OperatorLoginPageProps) {
  const navigate = useNavigate()
  const [loginMode, setLoginMode] = useState<LoginMode>('password')

  async function handleFinish(values: OperatorLoginFormValues) {
    try {
      const payload = await operatorLogin(values.account, values.password)
      onLogin({
        token: payload.token,
        profile: payload.profile,
      })
      void message.success(`欢迎回来，${payload.profile.displayName}`)
      void navigate('/admin/dashboard', { replace: true })
    } catch (error) {
      void message.error(error instanceof Error ? error.message : '员工登录失败')
    }
  }

  function handleWecomPlaceholderClick() {
    void message.info('待接入企微授权')
  }

  return (
    <main className="auth-layout">
      <aside className="auth-layout__aside">
        <div className="auth-layout__visual" style={{ backgroundImage: `url(${loginHeroImage})` }} />
      </aside>

      <section className="auth-layout__main">
        <div className="auth-layout__toolbar">
          <span className="auth-layout__badge">赛盟商城 / 运营后台</span>
        </div>

        <div className="auth-panel">
          <div className="auth-card">
            <button
              className="auth-card__corner"
              onClick={() => setLoginMode(loginMode === 'wecom' ? 'password' : 'wecom')}
              type="button"
            >
              <span>{loginMode === 'wecom' ? '返回账号登录' : '企微授权登录'}</span>
            </button>

            {loginMode === 'wecom' ? (
              <div className="auth-card__scan">
                <h2>企微授权登录</h2>
                <button className="auth-card__qr auth-card__qr--button" onClick={handleWecomPlaceholderClick} type="button">
                  <QrcodeOutlined />
                </button>
                <div className="auth-card__scan-tip">
                  <p>
                    <span>打开</span>
                    <strong>企业微信</strong>
                    <span>扫一扫登录</span>
                  </p>
                </div>
                <Button className="auth-card__secondary-action" onClick={handleWecomPlaceholderClick} size="large">
                  待接入企微授权
                </Button>
              </div>
            ) : (
              <>
                <div className="auth-card__tabs">
                  <button className="auth-card__tab auth-card__tab--active" type="button">
                    员工账号登录
                  </button>
                </div>

                <Form className="auth-card__form" layout="vertical" onFinish={handleFinish}>
                  <Form.Item name="account" rules={[{ required: true, message: '请输入员工账号' }]}>
                    <div className="auth-field">
                      <div className="auth-field__icon">
                        <UserOutlined />
                      </div>
                      <Input bordered={false} placeholder="员工账号" size="large" />
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

                  <Button block className="auth-card__submit" htmlType="submit" type="primary">
                    登录运营后台
                  </Button>
                </Form>

                <div className="auth-card__footer-note">员工账号仅限后台分配，不支持自助注册。当前已接入独立员工账号与真实鉴权。</div>
              </>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
