import { ApartmentOutlined } from '@ant-design/icons'
import { Button, Result, Typography } from 'antd'
import { useNavigate } from 'react-router-dom'

interface EnterpriseAccessGateProps {
  description: string
  title: string
}

/**
 * 企业中心统一未认证控态页。
 */
export function EnterpriseAccessGate({ description, title }: EnterpriseAccessGateProps) {
  const navigate = useNavigate()

  return (
    <div className="operator-page">
      <div className="operator-page__card">
        <Result
          extra={
            <Button
              icon={<ApartmentOutlined />}
              type="primary"
              onClick={() => {
                void navigate('/admin/enterprise/companies')
              }}
            >
              去企业管理认证
            </Button>
          }
          icon={<ApartmentOutlined />}
          subTitle={
            <Typography.Text type="secondary">
              {description}
            </Typography.Text>
          }
          title={title}
        />
      </div>
    </div>
  )
}
