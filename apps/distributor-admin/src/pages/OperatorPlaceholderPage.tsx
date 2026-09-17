import { AppstoreOutlined } from '@ant-design/icons'
import { Button, Card, Col, Empty, Row, Space, message } from 'antd'

interface OperatorPlaceholderPageProps {
  description: string
}

/**
 * 运营后台占位页。
 */
export function OperatorPlaceholderPage({ description }: OperatorPlaceholderPageProps) {
  function handlePlaceholderClick() {
    void message.info('当前仅完成页面与按钮占位')
  }

  return (
    <div className="operator-page">
      <Row gutter={[16, 16]}>
        <Col span={16}>
          <Card bordered={false} className="operator-page__card" title="页面内容占位">
            <Empty
              description={description}
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card bordered={false} className="operator-page__card" title="预留动作">
            <Space className="operator-page__actions" direction="vertical" size={12}>
              <Button block icon={<AppstoreOutlined />} onClick={handlePlaceholderClick} type="primary">
                新建占位任务
              </Button>
              <Button block onClick={handlePlaceholderClick}>查看接口清单</Button>
              <Button block onClick={handlePlaceholderClick}>打开设计说明</Button>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  )
}
