import { EyeOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons'
import { Button, Card, Col, Divider, Form, Input, Row, Select, Space, Statistic, Tag } from 'antd'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { updateUserCenterEnterprise } from '../api'
import { ConfigurableProTable, type ConfigurableColumn } from '../components/ConfigurableProTable'
import { useUserCenterBootstrap } from '../hooks/useUserCenterBootstrap'
import type { UserCenterEnterpriseRecord } from '../types'

interface EnterpriseSearchValues {
  enabled?: 'enabled' | 'disabled'
  keyword?: string
  sourceType?: string
}

const defaultSearchValues: EnterpriseSearchValues = {}

const sourceTypeLabelMap: Record<string, string> = {
  APPLICATION: '认证转入',
  DIRECT: '强制新增',
}

const portraitSegmentColorMap: Record<string, string> = {
  KEY_ACCOUNT: 'gold',
  LOW_FREQUENCY: 'default',
  POTENTIAL_STORE: 'blue',
}

/**
 * 用户中心-企业管理页。
 */
export function UserCenterCompaniesPage() {
  const navigate = useNavigate()
  const { bootstrap, isLoading, reload } = useUserCenterBootstrap()
  const [searchForm] = Form.useForm<EnterpriseSearchValues>()
  const [appliedFilters, setAppliedFilters] = useState<EnterpriseSearchValues>(defaultSearchValues)

  const enterprises = bootstrap?.enterprises ?? []

  const overview = useMemo(() => {
    const keyAccountCount = enterprises.filter((enterprise) => enterprise.portraitSegmentCode === 'KEY_ACCOUNT').length
    const potentialStoreCount = enterprises.filter((enterprise) => enterprise.portraitSegmentCode === 'POTENTIAL_STORE').length
    const lowFrequencyCount = enterprises.filter((enterprise) => enterprise.portraitSegmentCode === 'LOW_FREQUENCY').length

    return {
      keyAccountCount,
      potentialStoreCount,
      lowFrequencyCount,
    }
  }, [enterprises])

  const filteredEnterprises = useMemo(() => {
    const keyword = appliedFilters.keyword?.trim().toLowerCase()

    return enterprises.filter((enterprise) => {
      const matchesKeyword = keyword
        ? [
            enterprise.userPhone,
            enterprise.userDisplayName,
            enterprise.companyName,
            enterprise.storeName,
            enterprise.contactName,
            enterprise.contactPhone,
            enterprise.businessScope,
            enterprise.portraitSegmentName,
            enterprise.recommendedPolicy,
          ].some((field) => field.toLowerCase().includes(keyword))
        : true
      const matchesSourceType = appliedFilters.sourceType ? enterprise.sourceType === appliedFilters.sourceType : true
      const matchesEnabled = appliedFilters.enabled
        ? enterprise.enabled === (appliedFilters.enabled === 'enabled')
        : true

      return matchesKeyword && matchesSourceType && matchesEnabled
    })
  }, [appliedFilters, enterprises])

  const columns = useMemo<ConfigurableColumn<UserCenterEnterpriseRecord>[]>(
    () => [
      { dataIndex: 'enterpriseNo', key: 'enterpriseNo', render: (_, record) => record.enterpriseNo || '-', title: '企业编号', width: 140 },
      {
        dataIndex: 'sourceType',
        key: 'sourceType',
        render: (_, record) => <Tag>{sourceTypeLabelMap[record.sourceType] ?? record.sourceType}</Tag>,
        title: '来源类型',
        width: 120,
      },
      { dataIndex: 'companyName', key: 'companyName', title: '企业名称', width: 220 },
      { dataIndex: 'storeName', key: 'storeName', title: '店铺名称', width: 180 },
      { dataIndex: 'userDisplayName', key: 'userDisplayName', render: (_, record) => record.userDisplayName || '-', title: '主绑定用户', width: 160 },
      { dataIndex: 'memberLevelName', key: 'memberLevelName', render: (_, record) => record.memberLevelName || '-', title: '企业会员等级', width: 140 },
      {
        dataIndex: 'portraitSegmentName',
        key: 'portraitSegmentName',
        render: (_, record) => <Tag color={portraitSegmentColorMap[record.portraitSegmentCode] ?? 'default'}>{record.portraitSegmentName || '-'}</Tag>,
        title: '客户分层',
        width: 120,
      },
      {
        dataIndex: 'primaryCategories',
        key: 'primaryCategories',
        render: (_, record) => (record.primaryCategories.length ? record.primaryCategories.join(' / ') : '-'),
        title: '拿货品类',
        width: 220,
      },
      {
        dataIndex: 'pickupFrequencyPerMonth',
        key: 'pickupFrequencyPerMonth',
        render: (_, record) => (record.pickupFrequencyPerMonth == null ? '-' : `${record.pickupFrequencyPerMonth.toFixed(1)} 次/月`),
        title: '拿货频次',
        width: 120,
      },
      {
        dataIndex: 'avgOrderAmount',
        key: 'avgOrderAmount',
        render: (_, record) => (record.avgOrderAmount == null ? '-' : `¥ ${record.avgOrderAmount.toLocaleString()}`),
        title: '客单价',
        width: 140,
      },
      {
        dataIndex: 'repaymentDays',
        key: 'repaymentDays',
        render: (_, record) => (record.repaymentDays == null ? '-' : `${record.repaymentDays} 天`),
        title: '回款速度',
        width: 120,
      },
      {
        dataIndex: 'recommendedPolicy',
        key: 'recommendedPolicy',
        render: (_, record) => record.recommendedPolicy || '-',
        title: '推荐货源政策',
        width: 260,
      },
      {
        dataIndex: 'enabled',
        key: 'enabled',
        render: (_, record) => <Tag color={record.enabled ? 'green' : 'default'}>{record.enabled ? '已启用' : '已禁用'}</Tag>,
        title: '状态',
        width: 120,
      },
      { dataIndex: 'updatedAt', key: 'updatedAt', title: '最近更新', width: 180 },
      {
        hideInSetting: true,
        key: 'actions',
        render: (_, record) => (
          <Space size={12}>
            <Button icon={<EyeOutlined />} type="link" onClick={() => navigate(`/admin/user-center/companies/${record.id}?mode=view`)}>
              查看
            </Button>
            <Button type="link" onClick={() => navigate(`/admin/user-center/companies/${record.id}?mode=edit`)}>
              编辑
            </Button>
            <Button type="link" onClick={() => void handleToggleEnabled(record)}>
              {record.enabled ? '禁用' : '启用'}
            </Button>
          </Space>
        ),
        title: '操作',
        width: 200,
      },
    ],
    [navigate],
  )

  function handleReset() {
    searchForm.resetFields()
    setAppliedFilters(defaultSearchValues)
  }

  async function handleToggleEnabled(record: UserCenterEnterpriseRecord) {
    await updateUserCenterEnterprise(record.id, {
      userId: record.userId ?? '',
      applicationId: record.applicationId ?? '',
      sourceType: record.sourceType,
      companyName: record.companyName,
      storeName: record.storeName,
      contactName: record.contactName,
      contactPhone: record.contactPhone,
      businessScope: record.businessScope,
      enabled: !record.enabled,
      reviewRemark: record.reviewRemark ?? '',
      memberLevelKey: record.memberLevelKey ?? '',
    })
    await reload()
  }

  return (
    <div className="operator-page">
      <Card bordered={false} className="operator-page__card" loading={isLoading} style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={8}>
            <Statistic title="优质大客户企业" value={overview.keyAccountCount} />
          </Col>
          <Col span={8}>
            <Statistic title="潜力小店企业" value={overview.potentialStoreCount} />
          </Col>
          <Col span={8}>
            <Statistic title="低频散户企业" value={overview.lowFrequencyCount} />
          </Col>
        </Row>
      </Card>

      <Card bordered={false} className="operator-page__card operator-list-shell" loading={isLoading}>
        <Form form={searchForm} initialValues={defaultSearchValues} layout="vertical" onFinish={setAppliedFilters}>
          <div className="operator-list-shell__filters">
            <Row gutter={16}>
              <Col span={10}>
                <Form.Item label="综合搜索" name="keyword">
                  <Input placeholder="企业 / 店铺 / 联系人 / 分层 / 政策" />
                </Form.Item>
              </Col>
              <Col span={7}>
                <Form.Item label="来源类型" name="sourceType">
                  <Select
                    allowClear
                    options={[
                      { label: '强制新增', value: 'DIRECT' },
                      { label: '认证转入', value: 'APPLICATION' },
                    ]}
                    placeholder="请选择来源类型"
                  />
                </Form.Item>
              </Col>
              <Col span={7}>
                <Form.Item label="企业状态" name="enabled">
                  <Select
                    allowClear
                    options={[
                      { label: '已启用', value: 'enabled' },
                      { label: '已禁用', value: 'disabled' },
                    ]}
                    placeholder="请选择企业状态"
                  />
                </Form.Item>
              </Col>
            </Row>

            <div className="operator-list-shell__filter-actions">
              <Space size={12}>
                <Button htmlType="submit" icon={<SearchOutlined />} type="primary">
                  查询
                </Button>
                <Button onClick={handleReset}>重置</Button>
              </Space>
            </div>
          </div>
        </Form>

        <Divider className="operator-list-shell__divider" />

        <ConfigurableProTable<UserCenterEnterpriseRecord>
          columns={columns}
          dataSource={filteredEnterprises}
          headerTitle={false}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          rowKey="id"
          size="middle"
          storageKey="operation-user-center-companies-table"
          tableClassName="operator-pro-table"
          toolBarRender={() => [
            <Button icon={<PlusOutlined />} key="create-company" onClick={() => navigate('/admin/user-center/companies/new')} type="primary">
              强制新增企业
            </Button>,
          ]}
        />
      </Card>
    </div>
  )
}
