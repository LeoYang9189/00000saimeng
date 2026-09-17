import { DeleteOutlined, EditOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons'
import { Button, Card, Col, Divider, Drawer, Form, Input, Popconfirm, Row, Select, Space, Switch, Tag, message } from 'antd'
import { useMemo, useState } from 'react'
import {
  createUserCenterUser,
  deleteUserCenterUser,
  updateUserCenterUser,
} from '../api'
import { ConfigurableProTable, type ConfigurableColumn } from '../components/ConfigurableProTable'
import { useUserCenterBootstrap } from '../hooks/useUserCenterBootstrap'
import type { UserCenterCustomerRecord, UserUpsertPayload } from '../types'

interface UserSearchValues {
  keyword?: string
  phone?: string
  displayName?: string
  enabled?: 'enabled' | 'disabled'
  realNameStatus?: string
  applicationStatus?: string
  enterpriseStatus?: string
}

const defaultUserFormValues: UserUpsertPayload = {
  phone: '',
  displayName: '',
  password: '',
  enabled: true,
  enterpriseId: '',
}

const defaultSearchValues: UserSearchValues = {}

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

const enterpriseStatusLabelMap: Record<string, string> = {
  ENABLED: '已启用',
  DISABLED: '已禁用',
  NONE: '未建档',
}

/**
 * 用户中心-用户管理页。
 */
export function UserCenterUsersPage() {
  const { bootstrap, isLoading, reload } = useUserCenterBootstrap()
  const [form] = Form.useForm<UserUpsertPayload>()
  const [searchForm] = Form.useForm<UserSearchValues>()
  const [editingUser, setEditingUser] = useState<UserCenterCustomerRecord | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [appliedFilters, setAppliedFilters] = useState<UserSearchValues>(defaultSearchValues)

  const users = bootstrap?.users ?? []
  const enterpriseOptions = (bootstrap?.enterprises ?? []).map((enterprise) => ({
    label: enterprise.companyName,
    value: enterprise.id,
  }))

  const filteredUsers = useMemo(() => {
    const keyword = appliedFilters.keyword?.trim().toLowerCase()
    return users.filter((user) => {
      const matchesKeyword = keyword
        ? [user.phone, user.displayName, user.realName, user.roles.join(' ')].some((field) =>
            field.toLowerCase().includes(keyword),
          )
        : true

      const matchesPhone = appliedFilters.phone ? user.phone.includes(appliedFilters.phone.trim()) : true
      const matchesDisplayName = appliedFilters.displayName
        ? user.displayName.includes(appliedFilters.displayName.trim())
        : true
      const matchesEnabled = appliedFilters.enabled
        ? user.enabled === (appliedFilters.enabled === 'enabled')
        : true
      const matchesRealNameStatus = appliedFilters.realNameStatus ? user.realNameStatus === appliedFilters.realNameStatus : true
      const matchesApplicationStatus = appliedFilters.applicationStatus ? user.applicationStatus === appliedFilters.applicationStatus : true
      const matchesEnterpriseStatus = appliedFilters.enterpriseStatus ? user.enterpriseStatus === appliedFilters.enterpriseStatus : true

      return (
        matchesKeyword &&
        matchesPhone &&
        matchesDisplayName &&
        matchesEnabled &&
        matchesRealNameStatus &&
        matchesApplicationStatus &&
        matchesEnterpriseStatus
      )
    })
  }, [appliedFilters, users])

  const columns = useMemo<ConfigurableColumn<UserCenterCustomerRecord>[]>(
    () => [
      { dataIndex: 'phone', key: 'phone', title: '手机号', width: 140 },
      { dataIndex: 'displayName', key: 'displayName', title: '客户昵称', width: 160 },
      {
        dataIndex: 'enterpriseName',
        key: 'enterpriseName',
        render: (_, record) => (record.enterpriseName ? <Tag color="geekblue">{record.enterpriseName}</Tag> : <Tag>未绑定</Tag>),
        title: '所属企业',
        width: 200,
      },
      {
        dataIndex: 'roles',
        key: 'roles',
        render: (_, record) => (
          <Space size={[4, 4]} wrap>
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
        render: (_, record) => <Tag color={record.applicationStatus === 'PENDING' ? 'gold' : record.applicationStatus === 'APPROVED' ? 'green' : 'default'}>{applicationStatusLabelMap[record.applicationStatus] ?? record.applicationStatus}</Tag>,
        title: '经销商认证',
        width: 120,
      },
      {
        dataIndex: 'enterpriseStatus',
        key: 'enterpriseStatus',
        render: (_, record) => <Tag color={record.enterpriseStatus === 'ENABLED' ? 'green' : 'default'}>{enterpriseStatusLabelMap[record.enterpriseStatus] ?? record.enterpriseStatus}</Tag>,
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
            <Popconfirm okText="删除" okType="danger" title="确认删除该客户吗？" onConfirm={() => void handleDelete(record.id)}>
              <Button danger icon={<DeleteOutlined />} type="link">
                删除
              </Button>
            </Popconfirm>
          </Space>
        ),
        title: '操作',
        width: 140,
      },
    ],
    [],
  )

  function openCreateDrawer() {
    setEditingUser(null)
    form.setFieldsValue(defaultUserFormValues)
    setIsDrawerOpen(true)
  }

  function openEditDrawer(user: UserCenterCustomerRecord) {
    setEditingUser(user)
    form.setFieldsValue({
      phone: user.phone,
      displayName: user.displayName,
      password: '',
      enabled: user.enabled,
      enterpriseId: user.enterpriseId ?? '',
    })
    setIsDrawerOpen(true)
  }

  function closeDrawer() {
    setIsDrawerOpen(false)
    setEditingUser(null)
    form.resetFields()
  }

  async function handleFinish(values: UserUpsertPayload) {
    try {
      if (editingUser) {
        await updateUserCenterUser(editingUser.id, values)
        void message.success('客户信息已更新')
      } else {
        await createUserCenterUser(values)
        void message.success('客户已新增')
      }
      closeDrawer()
      await reload()
    } catch (error) {
      void message.error(error instanceof Error ? error.message : '客户保存失败')
    }
  }

  async function handleDelete(userId: string) {
    try {
      await deleteUserCenterUser(userId)
      void message.success('客户已删除')
      await reload()
    } catch (error) {
      void message.error(error instanceof Error ? error.message : '客户删除失败')
    }
  }

  function handleReset() {
    searchForm.resetFields()
    setAppliedFilters(defaultSearchValues)
  }

  return (
    <div className="operator-page">
      <Card bordered={false} className="operator-page__card operator-list-shell" loading={isLoading}>
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
                <Form.Item label="客户昵称" name="displayName">
                  <Input placeholder="请输入客户昵称" />
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
              <Col span={6}>
                <Form.Item label="企业档案" name="enterpriseStatus">
                  <Select
                    allowClear
                    options={[
                      { label: '已启用', value: 'ENABLED' },
                      { label: '已禁用', value: 'DISABLED' },
                      { label: '未建档', value: 'NONE' },
                    ]}
                    placeholder="请选择企业档案状态"
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

        <ConfigurableProTable<UserCenterCustomerRecord>
          columns={columns}
          dataSource={filteredUsers}
          headerTitle={false}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          rowKey="id"
          size="middle"
          storageKey="operation-user-center-users-table"
          tableClassName="operator-pro-table"
          toolBarRender={() => [
            <Button icon={<PlusOutlined />} key="create-user" onClick={openCreateDrawer} type="primary">
              新增客户
            </Button>,
          ]}
        />
      </Card>

      <Drawer
        className="operator-form-drawer"
        destroyOnHidden
        open={isDrawerOpen}
        title={editingUser ? '编辑客户' : '新增客户'}
        width={560}
        onClose={closeDrawer}
      >
        <Form form={form} initialValues={defaultUserFormValues} layout="vertical" onFinish={(values) => void handleFinish(values)}>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item label="手机号" name="phone" rules={[{ required: true, message: '请输入手机号' }]}>
                <Input placeholder="请输入手机号" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="客户昵称" name="displayName" rules={[{ required: true, message: '请输入客户昵称' }]}>
                <Input placeholder="请输入客户昵称" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="绑定企业" name="enterpriseId">
                <Select allowClear options={enterpriseOptions} placeholder="可将用户强制绑定到某个企业" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item
                label={editingUser ? '重置密码' : '初始密码'}
                name="password"
                rules={editingUser ? [] : [{ required: true, message: '请输入初始密码' }]}
              >
                <Input.Password placeholder={editingUser ? '不填则保持原密码' : '请输入初始密码'} visibilityToggle={false} />
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
              保存客户
            </Button>
          </Space>
        </Form>
      </Drawer>
    </div>
  )
}
