import { Card, Descriptions, Space, Tag, Typography } from 'antd'
import { getStoredOperatorSession } from '../session'

/**
 * 系统设置-个人中心页。
 */
export function OperatorProfilePage() {
  const session = getStoredOperatorSession()

  return (
    <div className="operator-page operator-page--stack">
      <Card className="operator-page__card" variant="borderless">
        <Space className="operator-page__stack-space" orientation="vertical" size={16}>
          <div className="operator-page__section-title">
            <Typography.Title level={5}>个人中心</Typography.Title>
            <Typography.Text type="secondary">
              当前展示的是经销商后台登录账号信息。后续会补充与企业员工档案联动的个人资料维护能力。
            </Typography.Text>
          </div>

          <Descriptions bordered column={1}>
            <Descriptions.Item label="用户 ID">{session?.profile.userId ?? '-'}</Descriptions.Item>
            <Descriptions.Item label="登录账号">{session?.profile.phone ?? '-'}</Descriptions.Item>
            <Descriptions.Item label="显示名称">{session?.profile.displayName ?? '-'}</Descriptions.Item>
            <Descriptions.Item label="角色">
              <Space size={[8, 8]} wrap>
                {(session?.profile.roles ?? []).map((role) => (
                  <Tag key={role}>{role}</Tag>
                ))}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">{session?.profile.createdAt ?? '-'}</Descriptions.Item>
          </Descriptions>
        </Space>
      </Card>
    </div>
  )
}
