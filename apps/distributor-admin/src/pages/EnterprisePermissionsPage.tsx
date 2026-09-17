import { SafetyCertificateOutlined } from '@ant-design/icons'
import { Alert, Card, Space, Typography } from 'antd'
import { EnterpriseAccessGate } from '../components/EnterpriseAccessGate'
import { useDistributorEnterpriseAccess } from '../hooks/useDistributorEnterpriseAccess'

/**
 * 企业中心-权限管理页。
 */
export function EnterprisePermissionsPage() {
  const { enterprise, isLoading } = useDistributorEnterpriseAccess()

  if (!enterprise && !isLoading) {
    return (
      <EnterpriseAccessGate
        description="权限管理依赖企业角色体系。请先到企业管理页完成企业认证，或申请加入现有企业。"
        title="当前账号暂未接入企业权限体系"
      />
    )
  }

  return (
    <div className="operator-page">
      <Card className="operator-page__card" loading={isLoading} variant="borderless">
        <Space className="operator-page__stack-space" orientation="vertical" size={16}>
          <Alert
            description="权限管理正在切换到真实经销商企业体系。后续会与企业角色、员工授权、组织架构统一联动。"
            showIcon
            type="info"
          />
          <div className="operator-page__section-title">
            <Typography.Title level={5}>权限管理</Typography.Title>
            <Typography.Text type="secondary">
              当前企业：{enterprise?.companyName ?? '-'}。该页将承接经销商企业自己的菜单权限、动作权限与角色授权配置。
            </Typography.Text>
          </div>
          <div className="operator-permission-shell__empty">
            <SafetyCertificateOutlined />
            <span>真实经销商权限体系正在接入中，当前先完成企业认证与员工管理配置。</span>
          </div>
        </Space>
      </Card>
    </div>
  )
}
