import { ApartmentOutlined, AuditOutlined, CheckCircleOutlined, SearchOutlined, SendOutlined, SolutionOutlined } from '@ant-design/icons'
import {
  Alert,
  App as AntdApp,
  Button,
  Card,
  Col,
  Descriptions,
  Empty,
  Form,
  Input,
  Row,
  Select,
  Space,
  Steps,
  Table,
  Tabs,
  Tag,
  Typography,
} from 'antd'
import { useMemo, useState } from 'react'
import {
  searchDistributorEnterprises,
  submitDistributorEnterpriseCertification,
  submitDistributorEnterpriseJoinRequest,
} from '../api'
import { useDistributorEnterpriseCompanyBootstrap } from '../hooks/useDistributorEnterpriseCompanyBootstrap'
import type {
  DistributorEnterpriseCertificationPayload,
  DistributorEnterpriseJoinPayload,
  DistributorEnterpriseSearchRecord,
  EnterpriseProfileSnapshot,
} from '../types'

type SearchMode = 'create' | 'join' | null

const certificationStatusLabelMap: Record<string, string> = {
  APPROVED: '已通过',
  NONE: '未提交',
  PENDING: '待审核',
  REJECTED: '已驳回',
}

const defaultProfileSnapshot: EnterpriseProfileSnapshot = {
  basicInfo: {
    companyAddress: '',
    legalRepresentative: '',
    unifiedSocialCreditCode: '',
  },
  financeInfo: {
    bankName: '',
    bankAccountName: '',
    bankAccountNo: '',
    invoiceTitle: '',
  },
  businessInfo: {
    preferredCategories: [],
    expectedMonthlyPurchase: '',
    expectedRepaymentDays: '',
    recommendedPolicy: '',
  },
}

const defaultCertificationValues: DistributorEnterpriseCertificationPayload = {
  businessScope: '',
  companyName: '',
  contactName: '',
  contactPhone: '',
  profileSnapshot: defaultProfileSnapshot,
  storeName: '',
}

const defaultJoinValues: DistributorEnterpriseJoinPayload = {
  applyRemark: '',
  position: '',
}

/**
 * 企业中心-企业管理页。
 */
export function EnterpriseCompanyPage() {
  const { message } = AntdApp.useApp()
  const { bootstrap, isLoading, reload } = useDistributorEnterpriseCompanyBootstrap()
  const [searchForm] = Form.useForm<{ companyName: string }>()
  const [certificationForm] = Form.useForm<DistributorEnterpriseCertificationPayload>()
  const [joinForm] = Form.useForm<DistributorEnterpriseJoinPayload>()
  const [searchResults, setSearchResults] = useState<DistributorEnterpriseSearchRecord[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [searchMode, setSearchMode] = useState<SearchMode>(null)
  const [isSubmittingCertification, setIsSubmittingCertification] = useState(false)
  const [isSubmittingJoin, setIsSubmittingJoin] = useState(false)

  const enterprise = bootstrap?.enterprise ?? null
  const certificationApplication = bootstrap?.certificationApplication ?? null
  const currentJoinRequest = bootstrap?.currentJoinRequest ?? null
  const canSubmitCertification = !enterprise && certificationApplication?.status !== 'PENDING'
  const canSubmitJoinRequest = !enterprise && currentJoinRequest?.status !== 'PENDING'
  const currentStep = enterprise ? 1 : hasSearched ? 1 : 0

  const searchColumns = useMemo(
    () => [
      { dataIndex: 'enterpriseNo', key: 'enterpriseNo', title: '企业编号', width: 140 },
      { dataIndex: 'companyName', key: 'companyName', title: '企业名称', width: 220 },
      { dataIndex: 'storeName', key: 'storeName', title: '企业简称', width: 180 },
      { dataIndex: 'contactName', key: 'contactName', title: '联系人', width: 120 },
      { dataIndex: 'contactPhone', key: 'contactPhone', title: '联系电话', width: 140 },
      {
        dataIndex: 'enabled',
        key: 'enabled',
        render: (enabled: boolean) => <Tag color={enabled ? 'green' : 'default'}>{enabled ? '合作中' : '已停用'}</Tag>,
        title: '状态',
        width: 100,
      },
      {
        key: 'actions',
        render: (_: unknown, record: DistributorEnterpriseSearchRecord) => (
          <Button
            type="link"
            onClick={() => {
              joinForm.setFieldsValue({ enterpriseId: Number(record.enterpriseId) })
            }}
          >
            选择加入
          </Button>
        ),
        title: '操作',
        width: 120,
      },
    ],
    [joinForm],
  )

  async function handleSearch(values: { companyName: string }) {
    const keyword = values.companyName.trim()
    if (!keyword) {
      return
    }

    try {
      setIsSearching(true)
      const results = await searchDistributorEnterprises(keyword)
      setSearchKeyword(keyword)
      setSearchResults(results)
      setHasSearched(true)

      if (results.length) {
        setSearchMode('join')
        joinForm.setFieldsValue({ enterpriseId: Number(results[0]?.enterpriseId) })
      } else {
        setSearchMode('create')
        certificationForm.setFieldsValue({ companyName: keyword })
      }
    } catch (error) {
      void message.error(error instanceof Error ? error.message : '企业搜索失败')
    } finally {
      setIsSearching(false)
    }
  }

  async function handleSubmitCertification(values: DistributorEnterpriseCertificationPayload) {
    try {
      setIsSubmittingCertification(true)
      await submitDistributorEnterpriseCertification({
        ...values,
        businessScope: values.businessScope.trim(),
        companyName: values.companyName.trim(),
        contactName: values.contactName.trim(),
        contactPhone: values.contactPhone.trim(),
        profileSnapshot: {
          basicInfo: {
            companyAddress: values.profileSnapshot.basicInfo.companyAddress.trim(),
            legalRepresentative: values.profileSnapshot.basicInfo.legalRepresentative.trim(),
            unifiedSocialCreditCode: values.profileSnapshot.basicInfo.unifiedSocialCreditCode.trim(),
          },
          businessInfo: {
            expectedMonthlyPurchase: values.profileSnapshot.businessInfo.expectedMonthlyPurchase.trim(),
            expectedRepaymentDays: values.profileSnapshot.businessInfo.expectedRepaymentDays.trim(),
            preferredCategories: values.profileSnapshot.businessInfo.preferredCategories,
            recommendedPolicy: values.profileSnapshot.businessInfo.recommendedPolicy.trim(),
          },
          financeInfo: {
            bankAccountName: values.profileSnapshot.financeInfo.bankAccountName.trim(),
            bankAccountNo: values.profileSnapshot.financeInfo.bankAccountNo.trim(),
            bankName: values.profileSnapshot.financeInfo.bankName.trim(),
            invoiceTitle: values.profileSnapshot.financeInfo.invoiceTitle.trim(),
          },
        },
        storeName: values.storeName.trim(),
      })
      void message.success('企业认证申请已提交，已进入运营后台审核管理')
      await reload()
    } catch (error) {
      void message.error(error instanceof Error ? error.message : '企业认证提交失败')
    } finally {
      setIsSubmittingCertification(false)
    }
  }

  async function handleSubmitJoin(values: DistributorEnterpriseJoinPayload) {
    try {
      setIsSubmittingJoin(true)
      await submitDistributorEnterpriseJoinRequest({
        applyRemark: values.applyRemark.trim(),
        enterpriseId: values.enterpriseId,
        position: values.position.trim(),
      })
      void message.success('加入企业申请已提交，等待企业超级管理员审核')
      await reload()
    } catch (error) {
      void message.error(error instanceof Error ? error.message : '加入企业申请提交失败')
    } finally {
      setIsSubmittingJoin(false)
    }
  }

  function renderEnterpriseProfile() {
    if (!enterprise) {
      return null
    }

    return (
      <Card className="operator-page__card" loading={isLoading} variant="borderless">
        <Space className="operator-page__stack-space" orientation="vertical" size={20}>
          <div className="operator-page__section-title">
            <Typography.Title level={4}>企业档案</Typography.Title>
            <Typography.Text type="secondary">
              当前账号已完成企业认证并绑定到企业，可前往员工管理处理加入申请、组织协同与超级管理员移交。
            </Typography.Text>
          </div>

          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="企业编号">{enterprise.enterpriseNo || '-'}</Descriptions.Item>
            <Descriptions.Item label="认证状态">
              <Tag color="green">{certificationStatusLabelMap[enterprise.applicationStatus] ?? enterprise.applicationStatus}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="企业名称">{enterprise.companyName}</Descriptions.Item>
            <Descriptions.Item label="企业简称">{enterprise.storeName}</Descriptions.Item>
            <Descriptions.Item label="联系人">{enterprise.contactName}</Descriptions.Item>
            <Descriptions.Item label="联系电话">{enterprise.contactPhone || '-'}</Descriptions.Item>
            <Descriptions.Item label="超级管理员">{enterprise.superAdminName || '-'}</Descriptions.Item>
            <Descriptions.Item label="企业会员等级">{enterprise.memberLevelName || '待开通'}</Descriptions.Item>
            <Descriptions.Item label="关联员工数">{enterprise.associatedUserCount}</Descriptions.Item>
            <Descriptions.Item label="合作状态">
              <Tag color={enterprise.enabled ? 'green' : 'default'}>{enterprise.enabled ? '已启用' : '已禁用'}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="经营范围" span={2}>
              {enterprise.businessScope}
            </Descriptions.Item>
          </Descriptions>

          <Tabs
            items={[
              {
                key: 'basic',
                label: '基本信息',
                children: (
                  <Descriptions bordered column={2} size="small">
                    <Descriptions.Item label="企业地址">{enterprise.profileSnapshot.basicInfo.companyAddress || '-'}</Descriptions.Item>
                    <Descriptions.Item label="法定代表人">{enterprise.profileSnapshot.basicInfo.legalRepresentative || '-'}</Descriptions.Item>
                    <Descriptions.Item label="统一社会信用代码" span={2}>
                      {enterprise.profileSnapshot.basicInfo.unifiedSocialCreditCode || '-'}
                    </Descriptions.Item>
                  </Descriptions>
                ),
              },
              {
                key: 'finance',
                label: '财务信息',
                children: (
                  <Descriptions bordered column={2} size="small">
                    <Descriptions.Item label="开户银行">{enterprise.profileSnapshot.financeInfo.bankName || '-'}</Descriptions.Item>
                    <Descriptions.Item label="账户名称">{enterprise.profileSnapshot.financeInfo.bankAccountName || '-'}</Descriptions.Item>
                    <Descriptions.Item label="银行账号">{enterprise.profileSnapshot.financeInfo.bankAccountNo || '-'}</Descriptions.Item>
                    <Descriptions.Item label="发票抬头">{enterprise.profileSnapshot.financeInfo.invoiceTitle || '-'}</Descriptions.Item>
                  </Descriptions>
                ),
              },
              {
                key: 'business',
                label: '业务信息',
                children: (
                  <Descriptions bordered column={2} size="small">
                    <Descriptions.Item label="核心品类" span={2}>
                      {enterprise.profileSnapshot.businessInfo.preferredCategories.length
                        ? enterprise.profileSnapshot.businessInfo.preferredCategories.join(' / ')
                        : '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="预估月采购频次">
                      {enterprise.profileSnapshot.businessInfo.expectedMonthlyPurchase || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="目标账期">
                      {enterprise.profileSnapshot.businessInfo.expectedRepaymentDays || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="推荐货源政策" span={2}>
                      {enterprise.profileSnapshot.businessInfo.recommendedPolicy || '-'}
                    </Descriptions.Item>
                  </Descriptions>
                ),
              },
            ]}
          />
        </Space>
      </Card>
    )
  }

  function renderSearchResultGuide() {
    if (!hasSearched) {
      return (
        <Alert
          description="先输入企业名称并完成校验，系统会自动判断当前账号应该走“新企业认证”还是“申请加入已有企业”。"
          showIcon
          type="info"
        />
      )
    }

    if (searchMode === 'create') {
      return (
        <Alert
          description={`未检索到“${searchKeyword}”的企业记录，请继续完成新企业认证。首次认证通过后，当前账号将自动成为该企业超级管理员。`}
          showIcon
          type="success"
        />
      )
    }

    return (
      <Alert
        description={`已检索到“${searchKeyword}”对应的企业记录，请在下方填写加入申请，提交后由该企业超级管理员在员工管理页审核。`}
        showIcon
        type="warning"
      />
    )
  }

  function renderCertificationStep() {
    return (
      <Card
        title={
          <Space>
            <AuditOutlined />
            <span>第二步：填写新企业认证资料</span>
          </Space>
        }
        variant="borderless"
      >
        <Form
          form={certificationForm}
          initialValues={defaultCertificationValues}
          layout="vertical"
          onFinish={(values) => void handleSubmitCertification(values)}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="企业名称" name="companyName" rules={[{ required: true, message: '请输入企业名称' }]}>
                <Input disabled={!canSubmitCertification} placeholder="请输入企业名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="企业简称" name="storeName" rules={[{ required: true, message: '请输入企业简称' }]}>
                <Input disabled={!canSubmitCertification} placeholder="请输入企业简称/店铺名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="联系人" name="contactName" rules={[{ required: true, message: '请输入联系人' }]}>
                <Input disabled={!canSubmitCertification} placeholder="请输入联系人姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="联系电话" name="contactPhone" rules={[{ required: true, message: '请输入联系电话' }]}>
                <Input disabled={!canSubmitCertification} placeholder="请输入联系电话" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="经营范围" name="businessScope" rules={[{ required: true, message: '请输入经营范围' }]}>
                <Input.TextArea disabled={!canSubmitCertification} placeholder="请输入主营品类、渠道场景与经营说明" rows={3} />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Typography.Text strong>基础信息</Typography.Text>
            </Col>
            <Col span={24}>
              <Form.Item label="企业地址" name={['profileSnapshot', 'basicInfo', 'companyAddress']} rules={[{ required: true, message: '请输入企业地址' }]}>
                <Input disabled={!canSubmitCertification} placeholder="请输入企业注册地址或经营地址" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="法定代表人"
                name={['profileSnapshot', 'basicInfo', 'legalRepresentative']}
                rules={[{ required: true, message: '请输入法定代表人' }]}
              >
                <Input disabled={!canSubmitCertification} placeholder="请输入法定代表人" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="统一社会信用代码"
                name={['profileSnapshot', 'basicInfo', 'unifiedSocialCreditCode']}
                rules={[{ required: true, message: '请输入统一社会信用代码' }]}
              >
                <Input disabled={!canSubmitCertification} placeholder="请输入统一社会信用代码" />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Typography.Text strong>财务信息</Typography.Text>
            </Col>
            <Col span={12}>
              <Form.Item label="开户银行" name={['profileSnapshot', 'financeInfo', 'bankName']} rules={[{ required: true, message: '请输入开户银行' }]}>
                <Input disabled={!canSubmitCertification} placeholder="请输入开户银行" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="账户名称"
                name={['profileSnapshot', 'financeInfo', 'bankAccountName']}
                rules={[{ required: true, message: '请输入账户名称' }]}
              >
                <Input disabled={!canSubmitCertification} placeholder="请输入账户名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="银行账号"
                name={['profileSnapshot', 'financeInfo', 'bankAccountNo']}
                rules={[{ required: true, message: '请输入银行账号' }]}
              >
                <Input disabled={!canSubmitCertification} placeholder="请输入银行账号" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="发票抬头" name={['profileSnapshot', 'financeInfo', 'invoiceTitle']} rules={[{ required: true, message: '请输入发票抬头' }]}>
                <Input disabled={!canSubmitCertification} placeholder="请输入发票抬头" />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Typography.Text strong>业务信息</Typography.Text>
            </Col>
            <Col span={24}>
              <Form.Item
                label="核心经营品类"
                name={['profileSnapshot', 'businessInfo', 'preferredCategories']}
                rules={[{ required: true, message: '请输入核心经营品类' }]}
                getValueFromEvent={(event) =>
                  String(event.target.value)
                    .split(/[，,]/)
                    .map((value) => value.trim())
                    .filter(Boolean)
                }
              >
                <Input disabled={!canSubmitCertification} placeholder="多个品类请用逗号分隔，如：进口零食, 酒饮, 礼赠" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="预估月采购频次" name={['profileSnapshot', 'businessInfo', 'expectedMonthlyPurchase']}>
                <Input disabled={!canSubmitCertification} placeholder="例如：32 单 / 月" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="目标账期" name={['profileSnapshot', 'businessInfo', 'expectedRepaymentDays']}>
                <Input disabled={!canSubmitCertification} placeholder="例如：30 天" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="推荐货源政策" name={['profileSnapshot', 'businessInfo', 'recommendedPolicy']}>
                <Input.TextArea disabled={!canSubmitCertification} placeholder="请输入目标货源政策、合作偏好与渠道诉求" rows={3} />
              </Form.Item>
            </Col>
          </Row>

          <Button block disabled={!canSubmitCertification} htmlType="submit" icon={<SendOutlined />} loading={isSubmittingCertification} type="primary">
            提交企业认证
          </Button>
        </Form>
      </Card>
    )
  }

  function renderJoinStep() {
    return (
      <Card
        title={
          <Space>
            <ApartmentOutlined />
            <span>第二步：提交加入企业申请</span>
          </Space>
        }
        variant="borderless"
      >
        {searchResults.length ? (
          <Table columns={searchColumns} dataSource={searchResults} pagination={false} rowKey="enterpriseId" size="small" style={{ marginBottom: 16 }} />
        ) : (
          <Empty description="未找到匹配企业，请返回第一步重新输入企业名称。" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}

        <Form form={joinForm} initialValues={defaultJoinValues} layout="vertical" onFinish={(values) => void handleSubmitJoin(values)}>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item label="目标企业" name="enterpriseId" rules={[{ required: true, message: '请先选择目标企业' }]}>
                <Select
                  disabled={!searchResults.length || !canSubmitJoinRequest}
                  options={searchResults.map((item) => ({
                    label: `${item.enterpriseNo || '-'} / ${item.companyName}`,
                    value: Number(item.enterpriseId),
                  }))}
                  placeholder="请从检索结果中选择目标企业"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="拟加入岗位" name="position" rules={[{ required: true, message: '请输入拟加入岗位' }]}>
                <Input disabled={!canSubmitJoinRequest} placeholder="例如：采购主管 / 业务经理 / 门店运营" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="申请人姓名">
                <Input disabled value={bootstrap?.currentUserDisplayName || ''} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="申请说明" name="applyRemark" rules={[{ required: true, message: '请输入申请说明' }]}>
                <Input.TextArea
                  disabled={!canSubmitJoinRequest}
                  placeholder="请说明你负责的业务、加入该企业后的职责以及希望协同的事项"
                  rows={5}
                />
              </Form.Item>
            </Col>
          </Row>

          <Button block disabled={!canSubmitJoinRequest} htmlType="submit" icon={<SendOutlined />} loading={isSubmittingJoin} type="primary">
            提交加入申请
          </Button>
        </Form>
      </Card>
    )
  }

  return (
    <div className="operator-page operator-page--stack">
      {enterprise ? (
        renderEnterpriseProfile()
      ) : (
        <Card className="operator-page__card" loading={isLoading} variant="borderless">
          <Space className="operator-page__stack-space" orientation="vertical" size={20}>
            <div className="operator-page__section-title">
              <Typography.Title level={4}>企业认证与入企引导</Typography.Title>
              <Typography.Text type="secondary">
                未认证账号先输入企业名称，系统会自动判断当前账号应该走新企业认证还是加入已有企业。首次认证通过的账号默认为企业超级管理员。
              </Typography.Text>
            </div>

            {certificationApplication ? (
              <Alert
                description={certificationApplication.reviewRemark || '认证申请已进入运营后台审核管理，可在审核通过后自动绑定当前账号到企业。'}
                message={`当前认证状态：${certificationStatusLabelMap[certificationApplication.status] ?? certificationApplication.status}`}
                showIcon
                type={certificationApplication.status === 'REJECTED' ? 'error' : certificationApplication.status === 'APPROVED' ? 'success' : 'info'}
              />
            ) : null}

            {currentJoinRequest ? (
              <Alert
                description={currentJoinRequest.reviewRemark || '已提交给该企业超级管理员，请等待员工管理页审核结果。'}
                message={`当前入企申请：${currentJoinRequest.companyName}（${certificationStatusLabelMap[currentJoinRequest.status] ?? currentJoinRequest.status}）`}
                showIcon
                type={currentJoinRequest.status === 'REJECTED' ? 'error' : currentJoinRequest.status === 'APPROVED' ? 'success' : 'info'}
              />
            ) : null}

            <Steps
              current={currentStep}
              items={[
                {
                  description: '先输入企业名称并校验是否已有记录',
                  icon: <SearchOutlined />,
                  title: '输入企业',
                },
                {
                  description: enterprise
                    ? '已完成企业绑定'
                    : searchMode === 'join'
                      ? '已自动切换到加入已有企业流程'
                      : searchMode === 'create'
                        ? '已自动切换到新企业认证流程'
                        : '根据校验结果自动进入对应流程',
                  icon: enterprise ? <CheckCircleOutlined /> : <SolutionOutlined />,
                  title: enterprise ? '企业已认证' : '系统分流',
                },
              ]}
            />

            <Card
              title={
                <Space>
                  <SearchOutlined />
                  <span>第一步：输入企业名称</span>
                </Space>
              }
              variant="borderless"
            >
              <Form form={searchForm} layout="vertical" onFinish={(values) => void handleSearch(values)}>
                <Row gutter={16}>
                  <Col span={18}>
                    <Form.Item label="企业名称" name="companyName" rules={[{ required: true, message: '请输入企业名称' }]}>
                      <Input placeholder="请输入企业全称，系统将自动判断是新企业认证还是加入已有企业" />
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Form.Item label=" ">
                      <Button block htmlType="submit" loading={isSearching} type="primary">
                        校验企业
                      </Button>
                    </Form.Item>
                  </Col>
                </Row>
              </Form>

              {renderSearchResultGuide()}
            </Card>

            {hasSearched ? (searchMode === 'join' ? renderJoinStep() : renderCertificationStep()) : null}
          </Space>
        </Card>
      )}
    </div>
  )
}
