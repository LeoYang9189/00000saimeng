import { Alert, Button, Checkbox, Form, Input } from 'antd'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { register, requestVerificationCode } from '../api'
import { useI18nText } from '../i18n'
import { useStorefrontSession } from '../session'

const DISTRIBUTOR_LOGIN_URL = 'http://localhost:5175/login'

interface RegisterFormValues {
  phone: string
  verificationCode: string
  agreement: boolean
}

export function RegisterPage() {
  const { t } = useI18nText()
  const navigate = useNavigate()
  const { setSession } = useStorefrontSession()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSendingCode, setIsSendingCode] = useState(false)
  const [countdownSeconds, setCountdownSeconds] = useState(0)
  const [messageType, setMessageType] = useState<'error' | 'success'>('error')
  const [message, setMessage] = useState('')
  const [form] = Form.useForm<RegisterFormValues>()

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

  async function handleFinish(values: RegisterFormValues) {
    try {
      setIsSubmitting(true)
      setMessage('')
      const payload = await register(values.phone, values.verificationCode)
      setSession({
        token: payload.token,
        profile: payload.profile,
      })
      navigate('/member-center')
    } catch (error) {
      setMessageType('error')
      setMessage((error as Error).message)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleSendVerificationCode() {
    try {
      const phone = form.getFieldValue('phone')
      if (!phone) {
        setMessageType('error')
        setMessage(t('auth.enterPhoneFirst'))
        return
      }

      setIsSendingCode(true)
      setMessage('')
      const payload = await requestVerificationCode(phone)
      setCountdownSeconds(payload.expiresInSeconds > 60 ? 60 : payload.expiresInSeconds)
      setMessageType('success')
      setMessage(t('auth.verificationCodeSentHint'))
    } catch (error) {
      setMessageType('error')
      setMessage((error as Error).message)
    } finally {
      setIsSendingCode(false)
    }
  }

  async function validateAgreement(_: unknown, value: boolean) {
    if (value) {
      return
    }
    throw new Error(t('auth.agreementRequired'))
  }

  return (
    <main className="auth-panel auth-panel--register">
      <div className="register-card">
        <div className="register-card__header">
          <h2>{t('auth.registerPageTitle')}</h2>
        </div>

        {message ? <Alert className="auth-panel__alert" message={message} showIcon type={messageType} /> : null}

        <Form className="register-card__form" form={form} layout="vertical" onFinish={handleFinish}>
          <Form.Item
            className="register-card__item"
            label={t('auth.registerPhoneLabel')}
            name="phone"
            rules={[{ required: true, message: t('auth.phonePlaceholder') }]}
          >
            <div className="register-card__phone-row">
              <div className="register-card__country">
                <span>{t('auth.mainlandChina')}</span>
                <strong>+86</strong>
              </div>
              <Input bordered={false} placeholder={t('auth.phonePlaceholder')} size="large" />
            </div>
          </Form.Item>

          <Form.Item
            className="register-card__item"
            label={t('auth.registerVerificationCodeLabel')}
            name="verificationCode"
            rules={[{ required: true, message: t('auth.registerVerificationCodePlaceholder') }]}
          >
            <div className="register-card__code-row">
              <Input bordered={false} placeholder={t('auth.registerVerificationCodePlaceholder')} size="large" />
              <button
                className="register-card__code-action"
                disabled={isSendingCode || countdownSeconds > 0}
                onClick={handleSendVerificationCode}
                type="button"
              >
                {countdownSeconds > 0 ? `${countdownSeconds}s` : t('auth.sendVerificationCode')}
              </button>
            </div>
          </Form.Item>

          <Button block className="register-card__submit" htmlType="submit" loading={isSubmitting} type="primary">
            {t('auth.agreeAndRegister')}
          </Button>

          <Form.Item className="register-card__agreement" name="agreement" rules={[{ validator: validateAgreement }]} valuePropName="checked">
            <Checkbox>
              {t('auth.agreementPrefix')}
              <span className="register-card__agreement-link">{t('auth.mallServiceAgreement')}</span>
              {t('auth.agreementSeparator')}
              <span className="register-card__agreement-link">{t('auth.privacyPolicy')}</span>
              {t('auth.agreementSeparator')}
              <span className="register-card__agreement-link">{t('auth.legalStatement')}</span>
              {t('auth.agreementSeparator')}
              <span className="register-card__agreement-link">{t('auth.paymentClientAgreement')}</span>
            </Checkbox>
          </Form.Item>
        </Form>

        <div className="auth-panel__footer">
          <a href={DISTRIBUTOR_LOGIN_URL}>{t('auth.existingAccountLogin')}</a>
        </div>
      </div>
    </main>
  )
}
