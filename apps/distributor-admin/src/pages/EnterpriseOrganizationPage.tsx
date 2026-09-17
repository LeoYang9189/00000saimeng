import { ApartmentOutlined } from '@ant-design/icons'
import { Alert, Card, Space, Typography } from 'antd'
import { EnterpriseAccessGate } from '../components/EnterpriseAccessGate'
import { useDistributorEnterpriseAccess } from '../hooks/useDistributorEnterpriseAccess'

/**
 * 企业中心-组织架构页。
 */
export function EnterpriseOrganizationPage() {
  const { enterprise, isLoading } = useDistributorEnterpriseAccess()

  if (!enterprise && !isLoading) {
    return (
      <EnterpriseAccessGate
        description="组织架构页需要企业主体。请先到企业管理页完成企业认证，或申请加入现有企业。"
        title="当前账号暂未进入企业组织"
      />
    )
  }

  return (
    <div className="operator-page">
      <Card className="operator-page__card" loading={isLoading} variant="borderless">
        <Space className="operator-page__stack-space" orientation="vertical" size={16}>
          <Alert
            description="组织架构正在切换到真实经销商企业体系。后续会与员工归属、角色权限和超级管理员移交一起联动。"
            showIcon
            type="info"
          />
          <div className="operator-page__section-title">
            <Typography.Title level={5}>组织架构</Typography.Title>
            <Typography.Text type="secondary">
              当前企业：{enterprise?.companyName ?? '-'}。该页后续将承接经销商企业自己的部门树、负责人、部门员工归属与组织协同关系。
            </Typography.Text>
          </div>
          <div className="operator-permission-shell__empty">
            <ApartmentOutlined />
            <span>真实经销商组织体系正在接入中，当前先完成企业认证与员工管理配置。</span>
          </div>
        </Space>
      </Card>
    </div>
  )
}
