import { ApartmentOutlined } from '@ant-design/icons'
import { Alert, Card, Space, Typography } from 'antd'
import { EnterpriseAccessGate } from '../components/EnterpriseAccessGate'
import { useDistributorEnterpriseAccess } from '../hooks/useDistributorEnterpriseAccess'

/**
 * 企业中心-角色管理页。
 */
export function EnterpriseRolesPage() {
  const { enterprise, isLoading } = useDistributorEnterpriseAccess()

  if (!enterprise && !isLoading) {
    return (
      <EnterpriseAccessGate
        description="角色管理需要挂在已认证企业下。请先到企业管理页完成企业认证，或申请加入已有企业。"
        title="当前账号暂未进入企业角色体系"
      />
    )
  }

  return (
    <div className="operator-page">
      <Card className="operator-page__card" loading={isLoading} variant="borderless">
        <Space className="operator-page__stack-space" orientation="vertical" size={16}>
          <Alert
            description="经销商角色管理正在切换到真实企业体系。当前企业已绑定后，可先通过员工管理完成加入申请审核与超级管理员移交。"
            showIcon
            type="info"
          />
          <div className="operator-page__section-title">
            <Typography.Title level={5}>角色管理</Typography.Title>
            <Typography.Text type="secondary">
              当前企业：{enterprise?.companyName ?? '-'}。该页后续将直接承接经销商企业自己的角色定义、权限绑定和员工授权。
            </Typography.Text>
          </div>
          <div className="operator-permission-shell__empty">
            <ApartmentOutlined />
            <span>真实经销商角色体系正在接入中，当前先完成企业认证与员工管理配置。</span>
          </div>
        </Space>
      </Card>
    </div>
  )
}
