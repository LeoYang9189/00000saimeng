import { DeleteOutlined, EditOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons'
import { Alert, App as AntdApp, Button, Card, Col, Divider, Drawer, Form, Input, Modal, Popconfirm, Row, Select, Space, Switch, Table, Tag, Typography } from 'antd'
import { useMemo, useState } from 'react'
import {
  approveDistributorEnterpriseJoinRequest,
  createDistributorEmployee,
  deleteDistributorEmployee,
  rejectDistributorEnterpriseJoinRequest,
  transferDistributorEnterpriseSuperAdmin,
  updateDistributorEmployee,
} from '../api'
import { EnterpriseAccessGate } from '../components/EnterpriseAccessGate'
import { ConfigurableProTable, type ConfigurableColumn } from '../components/ConfigurableProTable'
import { useDistributorEmployeeBootstrap } from '../hooks/useDistributorEmployeeBootstrap'
import type {
  DistributorEnterpriseEmployeeRecord,
  DistributorEnterpriseEmployeeUpsertPayload,
  DistributorEnterpriseJoinReviewPayload,
} from '../types'

interface EmployeeSearchValues {
  applicationStatus?: string
  displayName?: string
  enabled?: 'enabled' | 'disabled'
  keyword?: string
  phone?: string
  realNameStatus?: string
}

const defaultFormValues: DistributorEnterpriseEmployeeUpsertPayload = {
  phone: '',
  displayName: '',
  password: '',
  enabled: true,
}

const defaultSearchValues: EmployeeSearchValues = {}

const realNameStatusLabelMap: Record<string, string> = {
  APPROVED: '已实名',
  PENDING: '待审核',
  REJECTED: '已驳回',
  UNSUBMITTED: '未提交',
}

const applicationStatusLabelMap: Record<string, string> = {
  APPROVED: '已通过',
  PENDING: '待审核',
  REJECTED: '已驳回',
  NONE: '未申请',
}

/**
 * 企业中心-员工管理页。
 */
export function EnterpriseEmployeesPage() {
  const { message } = AntdApp.useApp()
  const { bootstrap, isLoading, reload } = useDistributorEmployeeBootstrap()
  const [form] = Form.useForm<DistributorEnterpriseEmployeeUpsertPayload>()
  const [searchForm] = Form.useForm<EmployeeSearchValues>()
  const [rejectForm] = Form.useForm<DistributorEnterpriseJoinReviewPayload>()
  const [editingEmployee, setEditingEmployee] = useState<DistributorEnterpriseEmployeeRecord | null>(null)
  const [rejectingRequestId, setRejectingRequestId] = useState<string | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [appliedFilters, setAppliedFilters] = useState<EmployeeSearchValues>(defaultSearchValues)

  const employees = bootstrap?.employees ?? []

  const filteredEmployees = useMemo(() => {
    const keyword = appliedFilters.keyword?.trim().toLowerCase()
    return employees.filter((employee) => {
      const matchesKeyword = keyword
        ? [employee.phone, employee.displayName, employee.realName, employee.roles.join(' ')].some((field) =>
            field.toLowerCase().includes(keyword),
          )
        : true

      const matchesPhone = appliedFilters.phone ? employee.phone.includes(appliedFilters.phone.trim()) : true
      const matchesDisplayName = appliedFilters.displayName
        ? employee.displayName.includes(appliedFilters.displayName.trim())
        : true
      const matchesEnabled = appliedFilters.enabled
        ? employee.enabled === (appliedFilters.enabled === 'enabled')
        : true
      const matchesRealNameStatus = appliedFilters.realNameStatus
        ? employee.realNameStatus === appliedFilters.realNameStatus
        : true
      const matchesApplicationStatus = appliedFilters.applicationStatus
        ? employee.applicationStatus === appliedFilters.applicationStatus
        : true

      return matchesKeyword && matchesPhone && matchesDisplayName && matchesEnabled && matchesRealNameStatus && matchesApplicationStatus
    })
  }, [appliedFilters, employees])

  const columns = useMemo<ConfigurableColumn<DistributorEnterpriseEmployeeRecord>[]>(
    () => [
      { dataIndex: 'phone', key: 'phone', title: '手机号', width: 140 },
      { dataIndex: 'displayName', key: 'displayName', title: '用户昵称', width: 160 },
      {
        dataIndex: 'roles',
        key: 'roles',
        render: (_, record) => (
          <Space size={[4, 4]} wrap>
            {bootstrap?.superAdminUserId === record.id ? <Tag color="gold">超级管理员</Tag> : null}
            {record.roles.length ? record.roles.map((role) => <Tag key={role}>{role}</Tag>) : <Tag>普通用户</Tag>}
          </Space>
        ),
        title: '角色标签',
        width: 180,
      },
      {
        dataIndex: 'enabled',
        key: 'enabled',
        render: (_, record) => <Tag color={record.enabled ? 'blue' : 'default'}>{record.enabled ? '已启用' : '已禁用'}</Tag>,
        title: '账号状态',
        width: 120,
      },
      {
        dataIndex: 'realNameStatus',
        key: 'realNameStatus',
        render: (_, record) => <Tag color={record.realNameStatus === 'APPROVED' ? 'green' : 'default'}>{realNameStatusLabelMap[record.realNameStatus] ?? record.realNameStatus}</Tag>,
        title: '实名状态',
        width: 120,
      },
      { dataIndex: 'realName', key: 'realName', title: '实名姓名', width: 120 },
      {
        dataIndex: 'applicationStatus',
        key: 'applicationStatus',
        render: (_, record) => <Tag color={record.applicationStatus === 'APPROVED' ? 'green' : record.applicationStatus === 'PENDING' ? 'gold' : 'default'}>{applicationStatusLabelMap[record.applicationStatus] ?? record.applicationStatus}</Tag>,
        title: '经销商认证',
        width: 120,
      },
      {
        dataIndex: 'enterpriseStatus',
        key: 'enterpriseStatus',
        render: (_, record) => <Tag color={record.enterpriseStatus === 'ENABLED' ? 'green' : 'default'}>{record.enterpriseStatus === 'ENABLED' ? '已启用' : '已禁用'}</Tag>,
        title: '企业档案',
        width: 120,
      },
      { dataIndex: 'createdAt', key: 'createdAt', title: '注册时间', width: 180 },
      {
        hideInSetting: true,
        key: 'actions',
        render: (_, record) => (
          <Space size={12}>
            <Button icon={<EditOutlined />} onClick={() => openEditDrawer(record)} type="link">
              编辑
            </Button>
            {bootstrap?.currentUserIsSuperAdmin && bootstrap.superAdminUserId !== record.id ? (
              <Popconfirm
                okText="确认移交"
                title="确认将该员工设为新的企业超级管理员吗？"
                onConfirm={() => void handleTransferSuperAdmin(record.id)}
              >
                <Button type="link">移交超管</Button>
              </Popconfirm>
            ) : null}
            <Popconfirm okText="移出企业" okType="danger" title="确认将该员工移出当前企业吗？" onConfirm={() => void handleDelete(record.id)}>
              <Button danger icon={<DeleteOutlined />} type="link">
                移出企业
              </Button>
            </Popconfirm>
          </Space>
        ),
        title: '操作',
        width: 160,
      },
    ],
    [bootstrap],
  )

  function openCreateDrawer() {
    setEditingEmployee(null)
    form.setFieldsValue(defaultFormValues)
    setIsDrawerOpen(true)
  }

  function openEditDrawer(employee: DistributorEnterpriseEmployeeRecord) {
    setEditingEmployee(employee)
    form.setFieldsValue({
      phone: employee.phone,
      displayName: employee.displayName,
      password: '',
      enabled: employee.enabled,
    })
    setIsDrawerOpen(true)
  }

  function closeDrawer() {
    setEditingEmployee(null)
    setIsDrawerOpen(false)
    form.resetFields()
  }

  async function handleFinish(values: DistributorEnterpriseEmployeeUpsertPayload) {
    try {
      if (editingEmployee) {
        await updateDistributorEmployee(editingEmployee.id, values)
        void message.success('员工信息已更新')
      } else {
        await createDistributorEmployee(values)
        void message.success('员工已新增')
      }
      closeDrawer()
      await reload()
    } catch (error) {
      void message.error(error instanceof Error ? error.message : '员工保存失败')
    }
  }

  async function handleDelete(userId: string) {
    try {
      await deleteDistributorEmployee(userId)
      void message.success('员工已移出当前企业')
      await reload()
    } catch (error) {
      void message.error(error instanceof Error ? error.message : '员工移除失败')
    }
  }

  async function handleApproveJoinRequest(requestId: string) {
    try {
      await approveDistributorEnterpriseJoinRequest(requestId)
      void message.success('加入申请已通过，员工已绑定到当前企业')
      await reload()
    } catch (error) {
      void message.error(error instanceof Error ? error.message : '加入申请审核失败')
    }
  }

  async function handleRejectJoinRequest(values: DistributorEnterpriseJoinReviewPayload) {
    if (!rejectingRequestId) {
      return
    }
    try {
      await rejectDistributorEnterpriseJoinRequest(rejectingRequestId, values)
      void message.success('加入申请已驳回')
      setRejectingRequestId(null)
      rejectForm.resetFields()
      await reload()
    } catch (error) {
      void message.error(error instanceof Error ? error.message : '驳回加入申请失败')
    }
  }

  async function handleTransferSuperAdmin(userId: string) {
    try {
      await transferDistributorEnterpriseSuperAdmin(userId)
      void message.success('企业超级管理员已移交')
      await reload()
    } catch (error) {
      void message.error(error instanceof Error ? error.message : '超级管理员移交失败')
    }
  }

  function handleReset() {
    searchForm.resetFields()
    setAppliedFilters(defaultSearchValues)
  }

  if (!bootstrap && !isLoading) {
    return (
      <EnterpriseAccessGate
        description="员工管理依赖企业认证与企业绑定。请先到企业管理页完成新企业认证，或搜索现有企业并提交加入申请。"
        title="当前账号暂未绑定企业"
      />
    )
  }

  return (
    <div className="operator-page">
      <Card className="operator-page__card operator-list-shell" loading={isLoading} variant="borderless">
        <Space className="operator-page__stack-space" orientation="vertical" size={16}>
          {bootstrap ? (
            <Alert
              description={`企业编号：${bootstrap.enterpriseNo || '-'}；当前企业：${bootstrap.companyName}；超级管理员：${bootstrap.superAdminName || '-'}`}
              showIcon
              type="info"
            />
          ) : null}

          <div className="operator-page__section-title">
            <Typography.Title level={5}>当前企业员工</Typography.Title>
            <Typography.Text type="secondary">
              当前企业：{bootstrap?.companyName ?? '-'}，这里展示的是已绑定到本企业名下的平台用户。
            </Typography.Text>
          </div>

          {bootstrap?.currentUserIsSuperAdmin ? (
            <Card title="待审核加入申请" variant="borderless" style={{ background: '#f8fbff' }}>
              <Table
                columns={[
                  { dataIndex: 'applicantName', key: 'applicantName', title: '申请人', width: 120 },
                  { dataIndex: 'applicantPhone', key: 'applicantPhone', title: '手机号', width: 140 },
                  { dataIndex: 'position', key: 'position', title: '拟加入岗位', width: 140 },
                  { dataIndex: 'applyRemark', key: 'applyRemark', title: '申请说明' },
                  { dataIndex: 'createdAt', key: 'createdAt', title: '申请时间', width: 180 },
                  {
                    key: 'actions',
                    render: (_, record) => (
                      <Space size={12}>
                        <Popconfirm
                          okText="通过"
                          title="确认通过该入企申请吗？"
                          onConfirm={() => void handleApproveJoinRequest(record.requestId)}
                        >
                          <Button type="link">通过</Button>
                        </Popconfirm>
                        <Button
                          danger
                          type="link"
                          onClick={() => {
                            setRejectingRequestId(record.requestId)
                            rejectForm.setFieldsValue({ reviewRemark: '' })
                          }}
                        >
                          驳回
                        </Button>
                      </Space>
                    ),
                    title: '操作',
                    width: 140,
                  },
                ]}
                dataSource={bootstrap.joinRequests}
                locale={{ emptyText: '暂无待审核加入申请' }}
                pagination={false}
                rowKey="requestId"
                size="small"
              />
            </Card>
          ) : bootstrap ? (
            <Alert description="只有企业超级管理员可以审核加入申请和移交超级管理员。" showIcon type="warning" />
          ) : null}

          <Form form={searchForm} initialValues={defaultSearchValues} layout="vertical" onFinish={setAppliedFilters}>
            <div className="operator-list-shell__filters">
              <Row gutter={16}>
                <Col span={6}>
                  <Form.Item label="综合搜索" name="keyword">
                    <Input placeholder="手机号 / 昵称 / 实名 / 角色" />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item label="手机号" name="phone">
                    <Input placeholder="请输入手机号" />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item label="用户昵称" name="displayName">
                    <Input placeholder="请输入用户昵称" />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item label="账号状态" name="enabled">
                    <Select
                      allowClear
                      options={[
                        { label: '已启用', value: 'enabled' },
                        { label: '已禁用', value: 'disabled' },
                      ]}
                      placeholder="请选择账号状态"
                    />
                  </Form.Item>
                </Col>
                <Col span={6}>
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
                <Col span={6}>
                  <Form.Item label="经销商认证" name="applicationStatus">
                    <Select
                      allowClear
                      options={[
                        { label: '待审核', value: 'PENDING' },
                        { label: '已通过', value: 'APPROVED' },
                        { label: '已驳回', value: 'REJECTED' },
                        { label: '未申请', value: 'NONE' },
                      ]}
                      placeholder="请选择经销商认证状态"
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
        </Space>

        <Divider className="operator-list-shell__divider" />

        <ConfigurableProTable<DistributorEnterpriseEmployeeRecord>
          columns={columns}
          dataSource={filteredEmployees}
          headerTitle={false}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          rowKey="id"
          size="middle"
          storageKey="distributor-enterprise-employees-table"
          tableClassName="operator-pro-table"
          toolBarRender={() => [
            <Button icon={<PlusOutlined />} key="create-employee" onClick={openCreateDrawer} type="primary">
              新增员工
            </Button>,
          ]}
        />
      </Card>

      <Drawer
        className="operator-form-drawer"
        destroyOnHidden
        open={isDrawerOpen}
        size={560}
        title={editingEmployee ? '编辑员工' : '新增员工'}
        onClose={closeDrawer}
      >
        <Form form={form} initialValues={defaultFormValues} layout="vertical" onFinish={(values) => void handleFinish(values)}>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item label="手机号" name="phone" rules={[{ required: true, message: '请输入手机号' }]}>
                <Input placeholder="请输入手机号" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="用户昵称" name="displayName" rules={[{ required: true, message: '请输入用户昵称' }]}>
                <Input placeholder="请输入用户昵称" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item
                label={editingEmployee ? '重置密码' : '初始密码'}
                name="password"
                rules={editingEmployee ? [] : [{ required: true, message: '请输入初始密码' }]}
              >
                <Input.Password placeholder={editingEmployee ? '不填则保持原密码' : '请输入初始密码'} visibilityToggle={false} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="账号启用状态" name="enabled" valuePropName="checked">
                <Switch checkedChildren="启用" unCheckedChildren="禁用" />
              </Form.Item>
            </Col>
          </Row>

          <Space className="operator-form-drawer__actions">
            <Button onClick={closeDrawer}>取消</Button>
            <Button htmlType="submit" type="primary">
              保存员工
            </Button>
          </Space>
        </Form>
      </Drawer>

      <Modal
        destroyOnHidden
        okText="确认驳回"
        open={Boolean(rejectingRequestId)}
        title="驳回加入企业申请"
        onCancel={() => {
          setRejectingRequestId(null)
          rejectForm.resetFields()
        }}
        onOk={() => rejectForm.submit()}
      >
        <Form form={rejectForm} layout="vertical" onFinish={(values) => void handleRejectJoinRequest(values)}>
          <Form.Item label="驳回原因" name="reviewRemark" rules={[{ required: true, message: '请输入驳回原因' }]}>
            <Input.TextArea placeholder="请填写驳回原因，申请人会看到该说明" rows={4} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
