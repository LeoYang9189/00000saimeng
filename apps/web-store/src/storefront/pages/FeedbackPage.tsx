import { Alert, Button, Form, Input, Radio, Upload } from 'antd'
import type { UploadFile } from 'antd/es/upload/interface'
import { useState } from 'react'
import { submitFeedback } from '../api'
import { useI18nText } from '../i18n'
import { useStorefrontSession } from '../session'

interface FeedbackFormValues {
  feedbackType: string
  relatedOrderNo?: string
  content: string
  contact?: string
}

export function FeedbackPage() {
  const { t } = useI18nText()
  const { session } = useStorefrontSession()
  const [form] = Form.useForm<FeedbackFormValues>()
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')
  const [message, setMessage] = useState('')

  async function handleFinish(values: FeedbackFormValues) {
    try {
      setIsSubmitting(true)
      setMessage('')
      await submitFeedback(
        {
          feedbackType: values.feedbackType,
          relatedOrderNo: values.relatedOrderNo?.trim() || null,
          content: values.content.trim(),
          contact: values.contact?.trim() || null,
          attachmentNames: fileList.map((file) => file.name),
        },
        session?.token,
      )
      form.resetFields()
      setFileList([])
      setMessageType('success')
      setMessage(t('feedback.submitSuccess'))
    } catch (error) {
      setMessageType('error')
      setMessage((error as Error).message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="feedback-page">
      <section className="feedback-page__panel">
        <header className="feedback-page__header">
          <h1>
            {t('feedback.headingPrefix')}
            <span>{t('common.brand')}</span>
            {t('feedback.headingSuffix')}
          </h1>
        </header>

        <div className="feedback-page__body">
          <div className="feedback-page__section-title">{t('feedback.sectionTitle')}</div>

          {message ? <Alert className="feedback-page__alert" message={message} showIcon type={messageType} /> : null}

          <Form className="feedback-page__form" form={form} layout="vertical" onFinish={handleFinish}>
            <Form.Item
              label={t('feedback.typeLabel')}
              name="feedbackType"
              rules={[{ required: true, message: t('feedback.typeRequired') }]}
            >
              <Radio.Group className="feedback-page__radio-group">
                <Radio value="CONSULTATION">{t('feedback.typeConsultation')}</Radio>
                <Radio value="SUGGESTION">{t('feedback.typeSuggestion')}</Radio>
                <Radio value="COMPLAINT">{t('feedback.typeComplaint')}</Radio>
              </Radio.Group>
            </Form.Item>

            <Form.Item label={t('feedback.orderLabel')} name="relatedOrderNo">
              <Input className="feedback-page__input" placeholder={t('feedback.orderPlaceholder')} />
            </Form.Item>

            <Form.Item
              label={t('feedback.contentLabel')}
              name="content"
              rules={[
                { required: true, message: t('feedback.contentRequired') },
                { min: 5, message: t('feedback.contentMin') },
              ]}
            >
              <Input.TextArea
                className="feedback-page__textarea"
                maxLength={800}
                placeholder={t('feedback.contentPlaceholder')}
                rows={7}
                showCount
              />
            </Form.Item>

            <div className="feedback-page__tip">{t('feedback.tip')}</div>

            <Form.Item label={t('feedback.uploadLabel')}>
              <Upload
                beforeUpload={() => false}
                className="feedback-page__upload"
                fileList={fileList}
                listType="text"
                multiple
                onChange={({ fileList: nextFileList }) => setFileList(nextFileList)}
              >
                <Button className="feedback-page__upload-button" type="default">
                  {t('feedback.uploadAction')}
                </Button>
              </Upload>
            </Form.Item>

            <Form.Item label={t('feedback.contactLabel')} name="contact">
              <Input className="feedback-page__input" placeholder={t('feedback.contactPlaceholder')} />
            </Form.Item>

            <div className="feedback-page__actions">
              <Button className="feedback-page__submit" htmlType="submit" loading={isSubmitting} type="primary">
                {t('feedback.submitAction')}
              </Button>
            </div>
          </Form>
        </div>
      </section>
    </main>
  )
}
