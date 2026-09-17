import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons'
import { Button, Card, Col, Descriptions, Empty, Form, Input, Row, Select, Space, Statistic, Switch, Table, Tabs, Tag, message } from 'antd'
import { useEffect, useMemo } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { createUserCenterEnterprise, updateUserCenterEnterprise } from '../api'
import { useUserCenterBootstrap } from '../hooks/useUserCenterBootstrap'
import type {
  EnterpriseUpsertPayload,
  UserCenterEnterpriseAssociatedUserRecord,
  UserCenterReviewDocumentRecord,
} from '../types'

const defaultEnterpriseFormValues: EnterpriseUpsertPayload = {
  userId: '',
  applicationId: '',
  sourceType: 'DIRECT',
  companyName: '',
  storeName: '',
  contactName: '',
  contactPhone: '',
  businessScope: '',
  enabled: true,
  reviewRemark: '',
  memberLevelKey: 'bronze',
}

const sourceTypeLabelMap: Record<string, string> = {
  APPLICATION: '认证转入',
  DIRECT: '强制新增',
}

const applicationStatusLabelMap: Record<string, string> = {
  APPROVED: '已通过',
  NONE: '未关联',
  PENDING: '待审核',
  REJECTED: '已驳回',
}

const aiRiskColorMap: Record<string, string> = {
  HIGH: 'red',
  LOW: 'green',
  MEDIUM: 'gold',
  UNKNOWN: 'default',
}

const aiRiskLabelMap: Record<string, string> = {
  HIGH: '高风险',
  LOW: '低风险',
  MEDIUM: '中风险',
  UNKNOWN: '待分析',
}

const aiRecommendationLabelMap: Record<string, string> = {
  APPROVE: '建议通过',
  REJECT: '建议拦截',
  REVIEW: '建议人工复核',
}

const realNameStatusLabelMap: Record<string, string> = {
  APPROVED: '已实名',
  PENDING: '待审核',
  REJECTED: '已驳回',
  UNSUBMITTED: '未提交',
}

const authenticityStatusLabelMap: Record<string, string> = {
  AUTHENTIC: '真实',
  MISSING: '缺失',
  SUSPECT: '疑似伪造',
}

const expiryStatusLabelMap: Record<string, string> = {
  EXPIRED: '已过期',
  EXPIRING_SOON: '即将到期',
  MISSING: '缺失',
  VALID: '有效',
}

const documentStatusLabelMap: Record<string, string> = {
  MISSING: '缺失',
  READY: '可通过',
  REQUIRES_REVIEW: '待复核',
}

function renderDocumentStatusTag(record: UserCenterReviewDocumentRecord) {
  const color =
    record.documentStatus === 'MISSING'
      ? 'red'
      : record.expiryStatus === 'EXPIRED'
        ? 'red'
        : record.authenticityStatus === 'SUSPECT'
          ? 'gold'
          : 'green'
  const label =
    record.documentStatus === 'MISSING'
      ? '缺失'
      : record.expiryStatus === 'EXPIRED'
        ? '已过期'
        : record.authenticityStatus === 'SUSPECT'
          ? '疑似异常'
          : '正常'

  return <Tag color={color}>{label}</Tag>
}

function renderAssociatedUserRoles(user: UserCenterEnterpriseAssociatedUserRecord) {
  if (!user.roles.length) {
    return <Tag>普通客户</Tag>
  }

  return (
    <Space size={[4, 4]} wrap>
      {user.roles.map((role) => (
        <Tag key={role}>{role}</Tag>
      ))}
    </Space>
  )
}

interface UserCenterCompanyDetailPageProps {
  isCreateMode?: boolean
}

/**
 * 用户中心-企业详情页。
 */
export function UserCenterCompanyDetailPage({ isCreateMode = false }: UserCenterCompanyDetailPageProps) {
  const navigate = useNavigate()
  const { enterpriseId } = useParams()
  const [searchParams] = useSearchParams()
  const { bootstrap, isLoading, reload } = useUserCenterBootstrap()
  const [form] = Form.useForm<EnterpriseUpsertPayload>()
  const selectedMemberLevelKey = Form.useWatch('memberLevelKey', form)

  const pageMode = isCreateMode ? 'create' : searchParams.get('mode') === 'view' ? 'view' : 'edit'
  const isViewMode = pageMode === 'view'
  const enterprise = useMemo(
    () => (isCreateMode ? null : (bootstrap?.enterprises ?? []).find((item) => item.id === enterpriseId) ?? null),
    [bootstrap?.enterprises, enterpriseId, isCreateMode],
  )

  const users = bootstrap?.users ?? []
  const memberLevels = bootstrap?.memberLevels ?? []
  const approvedReviews = useMemo(
    () => (bootstrap?.reviews ?? []).filter((review) => review.status === 'APPROVED'),
    [bootstrap?.reviews],
  )

  const userOptions = useMemo(
    () =>
      users.map((user) => ({
        label: `${user.displayName} / ${user.phone}`,
        value: user.id,
      })),
    [users],
  )

  const applicationOptions = useMemo(
    () =>
      approvedReviews.map((review) => ({
        label: `${review.companyName} / ${review.storeName}`,
        value: review.applicationId,
      })),
    [approvedReviews],
  )

  const approvedReviewMap = useMemo(
    () => new Map(approvedReviews.map((review) => [review.applicationId, review])),
    [approvedReviews],
  )

  const memberLevelOptions = useMemo(
    () =>
      memberLevels.map((level) => ({
        label: level.levelName,
        value: level.levelKey,
      })),
    [memberLevels],
  )

  const currentMemberLevel = useMemo(
    () => memberLevels.find((level) => level.levelKey === selectedMemberLevelKey),
    [memberLevels, selectedMemberLevelKey],
  )

  useEffect(() => {
    if (enterprise) {
      form.setFieldsValue({
        userId: enterprise.userId ?? '',
        applicationId: enterprise.applicationId ?? '',
        sourceType: enterprise.sourceType,
        companyName: enterprise.companyName,
        storeName: enterprise.storeName,
        contactName: enterprise.contactName,
        contactPhone: enterprise.contactPhone,
        businessScope: enterprise.businessScope,
        enabled: enterprise.enabled,
        reviewRemark: enterprise.reviewRemark ?? '',
        memberLevelKey: enterprise.memberLevelKey ?? '',
      })
      return
    }

    if (isCreateMode) {
      form.setFieldsValue(defaultEnterpriseFormValues)
    }
  }, [enterprise, form, isCreateMode])

  function handleApplicationChange(applicationId?: string) {
    if (!applicationId) {
      return
    }

    const review = approvedReviewMap.get(applicationId)
    if (!review) {
      return
    }

    form.setFieldsValue({
      userId: review.userId,
      sourceType: 'APPLICATION',
      companyName: review.companyName,
      storeName: review.storeName,
      contactName: review.contactName,
      contactPhone: review.phone,
      businessScope: review.businessScope,
      reviewRemark: review.reviewRemark ?? '',
      memberLevelKey: 'bronze',
    })
  }

  async function handleFinish(values: EnterpriseUpsertPayload) {
    try {
      if (isCreateMode) {
        await createUserCenterEnterprise(values)
        void message.success('企业档案已新增')
      } else if (enterprise) {
        await updateUserCenterEnterprise(enterprise.id, values)
        void message.success('企业档案已更新')
      }

      await reload()
      navigate('/admin/user-center/companies')
    } catch (error) {
      void message.error(error instanceof Error ? error.message : '企业档案保存失败')
    }
  }

  const documentColumns = useMemo(
    () => [
      { dataIndex: 'documentName', key: 'documentName', title: '证件名称', width: 160 },
      { dataIndex: 'documentNo', key: 'documentNo', render: (value: string | null) => value || '-', title: '证件编号', width: 160 },
      {
        dataIndex: 'authenticityStatus',
        key: 'authenticityStatus',
        render: (value: string, record: UserCenterReviewDocumentRecord) => (
          <Space size={8}>
            {renderDocumentStatusTag(record)}
            <span>{authenticityStatusLabelMap[value] ?? value}</span>
          </Space>
        ),
        title: '核验结论',
        width: 120,
      },
      {
        dataIndex: 'expiryStatus',
        key: 'expiryStatus',
        render: (value: string) => (
          <Tag color={value === 'VALID' ? 'green' : value === 'EXPIRING_SOON' ? 'gold' : value === 'EXPIRED' ? 'red' : 'default'}>
            {expiryStatusLabelMap[value] ?? value}
          </Tag>
        ),
        title: '有效期状态',
        width: 120,
      },
      { dataIndex: 'expiryDate', key: 'expiryDate', render: (value: string | null) => value || '-', title: '有效期至', width: 140 },
      {
        dataIndex: 'documentStatus',
        key: 'documentStatus',
        render: (value: string) => (
          <Tag color={value === 'READY' ? 'green' : value === 'REQUIRES_REVIEW' ? 'gold' : 'red'}>
            {documentStatusLabelMap[value] ?? value}
          </Tag>
        ),
        title: '审核状态',
        width: 120,
      },
      { dataIndex: 'riskNote', key: 'riskNote', render: (value: string | null) => value || '-', title: '风险说明' },
    ],
    [],
  )

  const associatedUserColumns = useMemo(
    () => [
      { dataIndex: 'displayName', key: 'displayName', title: '用户昵称', width: 160 },
      { dataIndex: 'phone', key: 'phone', title: '手机号', width: 140 },
      {
        dataIndex: 'realNameStatus',
        key: 'realNameStatus',
        render: (value: string, record: UserCenterEnterpriseAssociatedUserRecord) => (
          <Space size={8}>
            <Tag color={value === 'APPROVED' ? 'green' : 'default'}>
              {realNameStatusLabelMap[value] ?? value}
            </Tag>
            <span>{record.realName || '-'}</span>
          </Space>
        ),
        title: '实名信息',
        width: 220,
      },
      {
        dataIndex: 'applicationStatus',
        key: 'applicationStatus',
        render: (value: string) => <Tag color={value === 'APPROVED' ? 'green' : value === 'PENDING' ? 'gold' : 'default'}>{applicationStatusLabelMap[value] ?? value}</Tag>,
        title: '申请状态',
        width: 120,
      },
      {
        dataIndex: 'roles',
        key: 'roles',
        render: (_: string[], record: UserCenterEnterpriseAssociatedUserRecord) => renderAssociatedUserRoles(record),
        title: '角色',
      },
    ],
    [],
  )

  function renderEmptyTab(description: string) {
    return <Empty description={description} image={Empty.PRESENTED_IMAGE_SIMPLE} />
  }

  const tabItems = [
    {
      key: 'basic',
      label: '基本信息',
      children: (
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="来源类型" name="sourceType" rules={[{ required: true, message: '请选择来源类型' }]}>
              <Select
                disabled={isViewMode}
                options={[
                  { label: '强制新增', value: 'DIRECT' },
                  { label: '认证转入', value: 'APPLICATION' },
                ]}
                placeholder="请选择来源类型"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="主绑定用户" name="userId">
              <Select allowClear disabled={isViewMode} options={userOptions} placeholder="请选择企业主绑定用户" showSearch optionFilterProp="label" />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label="关联已通过申请" name="applicationId">
              <Select
                allowClear
                disabled={isViewMode}
                options={applicationOptions}
                placeholder="选择后自动回填企业基础资料"
                showSearch
                optionFilterProp="label"
                onChange={handleApplicationChange}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="企业名称" name="companyName" rules={[{ required: true, message: '请输入企业名称' }]}>
              <Input disabled={isViewMode} placeholder="请输入企业名称" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="店铺名称" name="storeName" rules={[{ required: true, message: '请输入店铺名称' }]}>
              <Input disabled={isViewMode} placeholder="请输入店铺名称" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="联系人" name="contactName" rules={[{ required: true, message: '请输入联系人姓名' }]}>
              <Input disabled={isViewMode} placeholder="请输入联系人姓名" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="联系电话" name="contactPhone" rules={[{ required: true, message: '请输入联系电话' }]}>
              <Input disabled={isViewMode} placeholder="请输入联系电话" />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label="经营范围" name="businessScope" rules={[{ required: true, message: '请输入经营范围' }]}>
              <Input.TextArea disabled={isViewMode} placeholder="请输入经营范围" rows={4} />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label="档案备注" name="reviewRemark">
              <Input.TextArea disabled={isViewMode} placeholder="可填写企业管理备注" rows={3} />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label="启用状态" name="enabled" valuePropName="checked">
              <Switch checkedChildren="启用" disabled={isViewMode} unCheckedChildren="禁用" />
            </Form.Item>
          </Col>
        </Row>
      ),
    },
    {
      key: 'qualification',
      label: '资质材料',
      children: enterprise ? (
        <Descriptions bordered column={2} size="small">
          <Descriptions.Item label="申请状态">{applicationStatusLabelMap[enterprise.applicationStatus] ?? enterprise.applicationStatus}</Descriptions.Item>
          <Descriptions.Item label="来源类型">{sourceTypeLabelMap[enterprise.sourceType] ?? enterprise.sourceType}</Descriptions.Item>
          <Descriptions.Item label="AI 风险等级">
            <Tag color={aiRiskColorMap[enterprise.aiRiskLevel] ?? 'default'}>
              {aiRiskLabelMap[enterprise.aiRiskLevel] ?? (enterprise.aiRiskLevel || '-')}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="AI 建议">
            <Tag color={enterprise.aiRecommendation === 'APPROVE' ? 'green' : enterprise.aiRecommendation === 'REJECT' ? 'red' : 'gold'}>
              {aiRecommendationLabelMap[enterprise.aiRecommendation] ?? (enterprise.aiRecommendation || '-')}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="真实性评分">{enterprise.authenticityScore || '-'}</Descriptions.Item>
          <Descriptions.Item label="完整度评分">{enterprise.completenessScore || '-'}</Descriptions.Item>
          <Descriptions.Item label="合规评分">{enterprise.complianceScore || '-'}</Descriptions.Item>
          <Descriptions.Item label="AI 分析时间">{enterprise.analyzedAt || '-'}</Descriptions.Item>
          <Descriptions.Item label="提交时间">{enterprise.submittedAt || '-'}</Descriptions.Item>
          <Descriptions.Item label="审核时间">{enterprise.reviewedAt || '-'}</Descriptions.Item>
          <Descriptions.Item label="缺失材料" span={2}>
            {enterprise.missingDocumentKeys.length ? enterprise.missingDocumentKeys.join('、') : '无'}
          </Descriptions.Item>
          <Descriptions.Item label="风险标签" span={2}>
            {enterprise.riskFlags.length ? (
              <Space size={[6, 6]} wrap>
                {enterprise.riskFlags.map((flag) => (
                  <Tag color="gold" key={flag}>
                    {flag}
                  </Tag>
                ))}
              </Space>
            ) : (
              '无'
            )}
          </Descriptions.Item>
          <Descriptions.Item label="AI 报告摘要" span={2}>
            {enterprise.aiSummary || '-'}
          </Descriptions.Item>
        </Descriptions>
      ) : (
        renderEmptyTab('保存企业档案后可查看资质材料与 AI 审核结果。')
      ),
    },
    {
      key: 'users',
      label: '关联用户',
      children: enterprise ? (
        <Table<UserCenterEnterpriseAssociatedUserRecord>
          columns={associatedUserColumns}
          dataSource={enterprise.associatedUsers}
          locale={{ emptyText: '暂无关联用户' }}
          pagination={false}
          rowKey="id"
          size="small"
        />
      ) : (
        renderEmptyTab('保存企业档案后可查看企业下的关联用户。')
      ),
    },
    {
      key: 'member',
      label: '会员信息',
      children: (
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="企业会员等级" name="memberLevelKey">
              <Select allowClear disabled={isViewMode} options={memberLevelOptions} placeholder="请选择企业会员等级" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Card bordered={false} style={{ background: '#f7f9fc' }}>
              <div style={{ fontSize: 12, marginBottom: 8, color: '#6b7280' }}>当前等级说明</div>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>{currentMemberLevel?.levelName ?? enterprise?.memberLevelName ?? '-'}</div>
              <div style={{ color: '#4b5563' }}>{currentMemberLevel?.levelDescription ?? '会员等级为企业维度，不属于个人用户。'}</div>
            </Card>
          </Col>
        </Row>
      ),
    },
    {
      key: 'finance',
      label: '财务信息',
      children: enterprise ? (
        <Row gutter={16}>
          <Col span={6}>
            <Statistic title="客单价" value={enterprise.avgOrderAmount ?? 0} precision={2} prefix="¥" />
          </Col>
          <Col span={6}>
            <Statistic title="回款速度" suffix="天" value={enterprise.repaymentDays ?? 0} />
          </Col>
          <Col span={6}>
            <Statistic title="外部数据状态" value={enterprise.externalDataStatus || '-'} />
          </Col>
          <Col span={6}>
            <Statistic title="最近同步" value={enterprise.lastPortraitSyncAt ?? '-'} valueStyle={{ fontSize: 14 }} />
          </Col>
          <Col span={24} style={{ marginTop: 16 }}>
            <Card bordered={false} style={{ background: '#f7f9fc' }}>
              <div style={{ fontSize: 12, marginBottom: 8, color: '#6b7280' }}>预留外部接口</div>
              <div style={{ fontWeight: 600 }}>{enterprise.externalDataEndpoint || '-'}</div>
            </Card>
          </Col>
        </Row>
      ) : (
        renderEmptyTab('保存企业档案后可查看企业维度的财务信息。')
      ),
    },
    {
      key: 'certificates',
      label: '资质证书',
      children: enterprise ? (
        <Table<UserCenterReviewDocumentRecord>
          columns={documentColumns}
          dataSource={enterprise.documentChecks}
          locale={{ emptyText: '暂无资质证书' }}
          pagination={false}
          rowKey="documentKey"
          size="small"
        />
      ) : (
        renderEmptyTab('保存企业档案后可查看证件核验明细。')
      ),
    },
    {
      key: 'business',
      label: '业务信息',
      children: enterprise ? (
        <Row gutter={16}>
          <Col span={6}>
            <Statistic title="客户分层" value={enterprise.portraitSegmentName || '-'} />
          </Col>
          <Col span={6}>
            <Statistic title="拿货频次" suffix="次/月" value={enterprise.pickupFrequencyPerMonth ?? 0} precision={1} />
          </Col>
          <Col span={12}>
            <Card bordered={false} style={{ background: '#f7f9fc' }}>
              <div style={{ fontSize: 12, marginBottom: 8, color: '#6b7280' }}>拿货品类</div>
              <div>{enterprise.primaryCategories.length ? enterprise.primaryCategories.join(' / ') : '-'}</div>
            </Card>
          </Col>
          <Col span={24} style={{ marginTop: 16 }}>
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="推荐货源政策">
                {enterprise.recommendedPolicy || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="策略标签">
                {enterprise.policyTags.length ? (
                  <Space size={[6, 6]} wrap>
                    {enterprise.policyTags.map((tag) => (
                      <Tag key={tag}>{tag}</Tag>
                    ))}
                  </Space>
                ) : (
                  '-'
                )}
              </Descriptions.Item>
            </Descriptions>
          </Col>
        </Row>
      ) : (
        renderEmptyTab('保存企业档案后可查看企业维度的业务画像。')
      ),
    },
  ]

  if (!isCreateMode && !isLoading && !enterprise) {
    return (
      <div className="operator-page">
        <Card bordered={false} className="operator-page__card">
          <Empty description="未找到对应企业档案" />
          <Space style={{ marginTop: 16 }}>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/admin/user-center/companies')}>
              返回企业管理
            </Button>
          </Space>
        </Card>
      </div>
    )
  }

  return (
    <div className="operator-page">
      <Card bordered={false} className="operator-page__card" loading={isLoading}>
        <Form form={form} initialValues={defaultEnterpriseFormValues} layout="vertical" onFinish={(values) => void handleFinish(values)}>
          <Space direction="vertical" size={20} style={{ width: '100%' }}>
          <Space align="center" style={{ justifyContent: 'space-between', width: '100%' }}>
            <Space>
              <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/admin/user-center/companies')}>
                返回企业管理
              </Button>
              <div>
                <div style={{ fontSize: 20, fontWeight: 600 }}>
                  {isCreateMode ? '新增企业档案' : enterprise?.companyName ?? '企业详情'}
                </div>
                <div style={{ color: '#6b7280', marginTop: 4 }}>
                  企业维度承载会员、画像、资质、财务与关联用户信息。
                </div>
              </div>
            </Space>

            {!isCreateMode && isViewMode ? (
              <Button type="primary" onClick={() => navigate(`/admin/user-center/companies/${enterpriseId}?mode=edit`)}>
                进入编辑
              </Button>
            ) : null}
          </Space>

          <Tabs items={tabItems} />

            {!isViewMode ? (
              <Space>
                <Button onClick={() => navigate('/admin/user-center/companies')}>取消</Button>
                <Button htmlType="submit" icon={<SaveOutlined />} type="primary">
                  保存企业档案
                </Button>
              </Space>
            ) : null}
          </Space>
        </Form>
      </Card>
    </div>
  )
}
