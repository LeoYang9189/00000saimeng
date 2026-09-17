import { CheckOutlined, CloseOutlined, SearchOutlined } from '@ant-design/icons'
import { Button, Card, Col, Descriptions, Divider, Drawer, Form, Input, Modal, Popconfirm, Progress, Row, Select, Space, Table, Tag, message } from 'antd'
import { useMemo, useState } from 'react'
import { approveUserCenterReview, rejectUserCenterReview } from '../api'
import { ConfigurableProTable, type ConfigurableColumn } from '../components/ConfigurableProTable'
import { useUserCenterBootstrap } from '../hooks/useUserCenterBootstrap'
import type { ReviewRejectPayload, UserCenterReviewRecord } from '../types'

interface ReviewSearchValues {
  companyName?: string
  keyword?: string
  realNameStatus?: string
  status?: string
}

const defaultSearchValues: ReviewSearchValues = {}

const reviewStatusLabelMap: Record<string, string> = {
  APPROVED: '已通过',
  PENDING: '待审核',
  REJECTED: '已驳回',
}

const reviewStatusColorMap: Record<string, string> = {
  APPROVED: 'green',
  PENDING: 'gold',
  REJECTED: 'red',
}

const aiRiskLevelColorMap: Record<string, string> = {
  HIGH: 'red',
  LOW: 'green',
  MEDIUM: 'gold',
  UNKNOWN: 'default',
}

const aiRiskLevelLabelMap: Record<string, string> = {
  HIGH: '高风险',
  LOW: '低风险',
  MEDIUM: '中风险',
  UNKNOWN: '待分析',
}

const aiRecommendationLabelMap: Record<string, string> = {
  APPROVE: '建议通过',
  REVIEW: '建议人工复核',
  REJECT: '建议拦截',
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

/**
 * 用户中心-审核管理页。
 */
export function UserCenterReviewsPage() {
  const { bootstrap, isLoading, reload } = useUserCenterBootstrap()
  const [searchForm] = Form.useForm<ReviewSearchValues>()
  const [rejectForm] = Form.useForm<ReviewRejectPayload>()
  const [appliedFilters, setAppliedFilters] = useState<ReviewSearchValues>(defaultSearchValues)
  const [rejectingRecord, setRejectingRecord] = useState<UserCenterReviewRecord | null>(null)
  const [activeReportRecord, setActiveReportRecord] = useState<UserCenterReviewRecord | null>(null)

  const reviews = bootstrap?.reviews ?? []

  const filteredReviews = useMemo(() => {
    const keyword = appliedFilters.keyword?.trim().toLowerCase()

    return reviews.filter((review) => {
      const matchesKeyword = keyword
        ? [
            review.phone,
            review.displayName,
            review.realName,
            review.storeName,
            review.companyName,
            review.contactName,
            review.businessScope,
          ].some((field) => field.toLowerCase().includes(keyword))
        : true

      const matchesCompanyName = appliedFilters.companyName
        ? review.companyName.includes(appliedFilters.companyName.trim())
        : true
      const matchesRealNameStatus = appliedFilters.realNameStatus
        ? review.realNameStatus === appliedFilters.realNameStatus
        : true
      const matchesStatus = appliedFilters.status ? review.status === appliedFilters.status : true

      return matchesKeyword && matchesCompanyName && matchesRealNameStatus && matchesStatus
    })
  }, [appliedFilters, reviews])

  const columns = useMemo<ConfigurableColumn<UserCenterReviewRecord>[]>(
    () => [
      { dataIndex: 'phone', key: 'phone', title: '客户手机号', width: 140 },
      { dataIndex: 'displayName', key: 'displayName', title: '客户昵称', width: 140 },
      {
        dataIndex: 'realNameStatus',
        key: 'realNameStatus',
        render: (_, record) => (
          <Tag color={record.realNameStatus === 'APPROVED' ? 'green' : 'default'}>
            {realNameStatusLabelMap[record.realNameStatus] ?? record.realNameStatus}
          </Tag>
        ),
        title: '实名状态',
        width: 120,
      },
      { dataIndex: 'realName', key: 'realName', title: '实名姓名', width: 120 },
      { dataIndex: 'companyName', key: 'companyName', title: '企业名称', width: 220 },
      { dataIndex: 'storeName', key: 'storeName', title: '店铺名称', width: 180 },
      { dataIndex: 'contactName', key: 'contactName', title: '联系人', width: 120 },
      { dataIndex: 'businessScope', key: 'businessScope', title: '经营范围', width: 260 },
      {
        dataIndex: 'status',
        key: 'status',
        render: (_, record) => (
          <Tag color={reviewStatusColorMap[record.status] ?? 'default'}>
            {reviewStatusLabelMap[record.status] ?? record.status}
          </Tag>
        ),
        title: '审核状态',
        width: 120,
      },
      {
        dataIndex: 'aiRiskLevel',
        key: 'aiRiskLevel',
        render: (_, record) => <Tag color={aiRiskLevelColorMap[record.aiRiskLevel] ?? 'default'}>{aiRiskLevelLabelMap[record.aiRiskLevel] ?? record.aiRiskLevel}</Tag>,
        title: 'AI风险',
        width: 100,
      },
      {
        dataIndex: 'aiRecommendation',
        key: 'aiRecommendation',
        render: (_, record) => <Tag color={record.aiRecommendation === 'REJECT' ? 'red' : record.aiRecommendation === 'APPROVE' ? 'green' : 'gold'}>{aiRecommendationLabelMap[record.aiRecommendation] ?? record.aiRecommendation}</Tag>,
        title: 'AI建议',
        width: 120,
      },
      {
        dataIndex: 'reviewRemark',
        key: 'reviewRemark',
        render: (_, record) => record.reviewRemark || '-',
        title: '审核备注',
        width: 220,
      },
      { dataIndex: 'submittedAt', key: 'submittedAt', title: '提交时间', width: 180 },
      { dataIndex: 'reviewedAt', key: 'reviewedAt', render: (_, record) => record.reviewedAt || '-', title: '审核时间', width: 180 },
      {
        hideInSetting: true,
        key: 'actions',
        render: (_, record) => {
          const canApprove =
            record.aiRecommendation !== 'REJECT' &&
            record.documentChecks.every(
              (document) =>
                document.documentStatus !== 'MISSING' &&
                document.authenticityStatus !== 'SUSPECT' &&
                document.expiryStatus !== 'EXPIRED',
            )

          return (
            <Space size={12}>
              <Button type="link" onClick={() => setActiveReportRecord(record)}>
                AI报告
              </Button>
              {record.status === 'PENDING' ? (
                <>
                  <Popconfirm
                    disabled={!canApprove}
                    okText="通过"
                    title={canApprove ? '确认通过该经销商企业认证申请吗？' : 'AI 已识别出阻断风险，请先处理证件问题'}
                    onConfirm={() => void handleApprove(record.applicationId)}
                  >
                    <Button disabled={!canApprove} icon={<CheckOutlined />} type="link">
                      通过
                    </Button>
                  </Popconfirm>
                  <Button danger icon={<CloseOutlined />} type="link" onClick={() => openRejectModal(record)}>
                    驳回
                  </Button>
                </>
              ) : (
                <span style={{ color: '#8c8c8c' }}>已处理</span>
              )}
            </Space>
          )
        },
        title: '操作',
        width: 220,
      },
    ],
    [],
  )

  function handleReset() {
    searchForm.resetFields()
    setAppliedFilters(defaultSearchValues)
  }

  function openRejectModal(record: UserCenterReviewRecord) {
    setRejectingRecord(record)
    rejectForm.setFieldsValue({ reason: record.reviewRemark ?? '' })
  }

  function closeRejectModal() {
    setRejectingRecord(null)
    rejectForm.resetFields()
  }

  async function handleApprove(applicationId: string) {
    try {
      await approveUserCenterReview(applicationId)
      void message.success('认证申请已通过')
      await reload()
    } catch (error) {
      void message.error(error instanceof Error ? error.message : '审核通过失败')
    }
  }

  async function handleReject(values: ReviewRejectPayload) {
    if (!rejectingRecord) {
      return
    }

    try {
      await rejectUserCenterReview(rejectingRecord.applicationId, values)
      void message.success('认证申请已驳回')
      closeRejectModal()
      await reload()
    } catch (error) {
      void message.error(error instanceof Error ? error.message : '审核驳回失败')
    }
  }

  return (
    <div className="operator-page">
      <Card bordered={false} className="operator-page__card operator-list-shell" loading={isLoading}>
        <Form form={searchForm} initialValues={defaultSearchValues} layout="vertical" onFinish={setAppliedFilters}>
          <div className="operator-list-shell__filters">
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item label="综合搜索" name="keyword">
                  <Input placeholder="手机号 / 昵称 / 企业 / 店铺 / 联系人" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="企业名称" name="companyName">
                  <Input placeholder="请输入企业名称" />
                </Form.Item>
              </Col>
              <Col span={4}>
                <Form.Item label="实名状态" name="realNameStatus">
                  <Select
                    allowClear
                    options={[
                      { label: '已实名', value: 'APPROVED' },
                      { label: '待审核', value: 'PENDING' },
                      { label: '已驳回', value: 'REJECTED' },
                      { label: '未提交', value: 'UNSUBMITTED' },
                    ]}
                    placeholder="请选择实名状态"
                  />
                </Form.Item>
              </Col>
              <Col span={4}>
                <Form.Item label="审核状态" name="status">
                  <Select
                    allowClear
                    options={[
                      { label: '待审核', value: 'PENDING' },
                      { label: '已通过', value: 'APPROVED' },
                      { label: '已驳回', value: 'REJECTED' },
                    ]}
                    placeholder="请选择审核状态"
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

        <ConfigurableProTable<UserCenterReviewRecord>
          columns={columns}
          dataSource={filteredReviews}
          headerTitle={false}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          rowKey="applicationId"
          size="middle"
          storageKey="operation-user-center-reviews-table"
          tableClassName="operator-pro-table"
        />
      </Card>

      <Modal
        destroyOnHidden
        okText="确认驳回"
        open={Boolean(rejectingRecord)}
        title="驳回经销商企业认证"
        onCancel={closeRejectModal}
        onOk={() => rejectForm.submit()}
      >
        <Form form={rejectForm} layout="vertical" onFinish={(values) => void handleReject(values)}>
          <Form.Item
            label="驳回理由"
            name="reason"
            rules={[
              { required: true, message: '请输入驳回理由' },
              { max: 200, message: '驳回理由不能超过 200 个字符' },
            ]}
          >
            <Input.TextArea placeholder="请填写驳回原因，前端客户会看到该说明" rows={4} />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        className="operator-form-drawer"
        destroyOnHidden
        open={Boolean(activeReportRecord)}
        title="AI 分析报告"
        width={860}
        onClose={() => setActiveReportRecord(null)}
      >
        {activeReportRecord ? (
          <>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="企业名称">{activeReportRecord.companyName}</Descriptions.Item>
              <Descriptions.Item label="店铺名称">{activeReportRecord.storeName}</Descriptions.Item>
              <Descriptions.Item label="AI 风险等级">
                <Tag color={aiRiskLevelColorMap[activeReportRecord.aiRiskLevel] ?? 'default'}>
                  {aiRiskLevelLabelMap[activeReportRecord.aiRiskLevel] ?? activeReportRecord.aiRiskLevel}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="AI 建议">
                <Tag color={activeReportRecord.aiRecommendation === 'REJECT' ? 'red' : activeReportRecord.aiRecommendation === 'APPROVE' ? 'green' : 'gold'}>
                  {aiRecommendationLabelMap[activeReportRecord.aiRecommendation] ?? activeReportRecord.aiRecommendation}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="真实性评分">
                <Progress percent={activeReportRecord.authenticityScore} size="small" />
              </Descriptions.Item>
              <Descriptions.Item label="资料完整度">
                <Progress percent={activeReportRecord.completenessScore} size="small" />
              </Descriptions.Item>
              <Descriptions.Item label="合规评分">
                <Progress percent={activeReportRecord.complianceScore} size="small" />
              </Descriptions.Item>
              <Descriptions.Item label="分析时间">{activeReportRecord.analyzedAt || '-'}</Descriptions.Item>
              <Descriptions.Item label="风险摘要" span={2}>
                {activeReportRecord.aiSummary}
              </Descriptions.Item>
              <Descriptions.Item label="缺失证件" span={2}>
                {activeReportRecord.missingDocumentKeys.length
                  ? activeReportRecord.missingDocumentKeys.map((item) => <Tag color="red" key={item}>{item}</Tag>)
                  : '无'}
              </Descriptions.Item>
              <Descriptions.Item label="风险标记" span={2}>
                {activeReportRecord.riskFlags.length
                  ? activeReportRecord.riskFlags.map((item) => <Tag color="gold" key={item}>{item}</Tag>)
                  : '无'}
              </Descriptions.Item>
            </Descriptions>

            <Divider>证件核验明细</Divider>

            <Table
              columns={[
                { dataIndex: 'documentName', key: 'documentName', title: '证件类型', width: 140 },
                { dataIndex: 'documentNo', key: 'documentNo', render: (value: string | null) => value || '-', title: '证件编号', width: 150 },
                {
                  dataIndex: 'authenticityStatus',
                  key: 'authenticityStatus',
                  render: (value: string) => <Tag color={value === 'AUTHENTIC' ? 'green' : value === 'SUSPECT' ? 'red' : 'default'}>{authenticityStatusLabelMap[value] ?? value}</Tag>,
                  title: '真伪识别',
                  width: 120,
                },
                {
                  dataIndex: 'expiryStatus',
                  key: 'expiryStatus',
                  render: (value: string) => <Tag color={value === 'VALID' ? 'green' : value === 'EXPIRING_SOON' ? 'gold' : value === 'EXPIRED' ? 'red' : 'default'}>{expiryStatusLabelMap[value] ?? value}</Tag>,
                  title: '有效期状态',
                  width: 120,
                },
                { dataIndex: 'expiryDate', key: 'expiryDate', render: (value: string | null) => value || '-', title: '到期时间', width: 120 },
                {
                  dataIndex: 'documentStatus',
                  key: 'documentStatus',
                  render: (value: string) => <Tag color={value === 'READY' ? 'green' : value === 'REQUIRES_REVIEW' ? 'gold' : 'red'}>{documentStatusLabelMap[value] ?? value}</Tag>,
                  title: '审核状态',
                  width: 120,
                },
                { dataIndex: 'riskNote', key: 'riskNote', render: (value: string | null) => value || '-', title: '风险说明' },
              ]}
              dataSource={activeReportRecord.documentChecks}
              pagination={false}
              rowKey="documentKey"
              size="small"
            />
          </>
        ) : null}
      </Drawer>
    </div>
  )
}
