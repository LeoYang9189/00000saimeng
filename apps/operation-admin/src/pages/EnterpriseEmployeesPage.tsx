import { DeleteOutlined, EditOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons'
import { Button, Card, Col, Divider, Drawer, Form, Input, Popconfirm, Row, Select, Space, Switch, Tag, Typography, message } from 'antd'
import { useMemo, useState } from 'react'
import { createEnterpriseEmployee, deleteEnterpriseEmployee, updateEnterpriseEmployee } from '../api'
import { EmployeeProfileFormFields } from '../components/EmployeeProfileFormFields'
import { ConfigurableProTable, type ConfigurableColumn } from '../components/ConfigurableProTable'
import { useEnterpriseBootstrap } from '../hooks/useEnterpriseBootstrap'
import type { EmployeeAdminFormValues, EmployeeRecord, EmployeeStatus } from '../types'

interface EmployeeSearchValues {
  account?: string
  departmentId?: string
  email?: string
  employeeNo?: string
  joinDate?: string
  keyword?: string
  name?: string
  phone?: string
  position?: string
  roleId?: string
  status?: EmployeeStatus
}

interface EmployeeTableRow extends EmployeeRecord {
  departmentName: string
  roleNames: string[]
}

const employeeStatusColorMap: Record<EmployeeStatus, string> = {
  ACTIVE: 'green',
  INVITED: 'gold',
  DISABLED: 'default',
}

const employeeStatusLabelMap: Record<EmployeeStatus, string> = {
  ACTIVE: '在职',
  INVITED: '待激活',
  DISABLED: '已停用',
}

const defaultEmployeeFormValues: EmployeeAdminFormValues = {
  account: '',
  accountEnabled: true,
  name: '',
  phone: '',
  email: '',
  position: '',
  address: '',
  bio: '',
  emergencyContact: '',
  emergencyPhone: '',
  password: '',
  employeeNo: '',
  departmentId: '',
  roleIds: [],
  status: 'ACTIVE',
  joinDate: '',
}

const defaultSearchValues: EmployeeSearchValues = {}

/**
 * 企业中心-员工管理页。
 */
export function EnterpriseEmployeesPage() {
  const { bootstrap, isLoading, reload } = useEnterpriseBootstrap()
  const [form] = Form.useForm<EmployeeAdminFormValues>()
  const [searchForm] = Form.useForm<EmployeeSearchValues>()
  const [appliedFilters, setAppliedFilters] = useState<EmployeeSearchValues>(defaultSearchValues)
  const [editingEmployee, setEditingEmployee] = useState<EmployeeRecord | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isFilterExpanded, setIsFilterExpanded] = useState(false)

  const employees = bootstrap?.employees ?? []
  const organizations = bootstrap?.organizations ?? []
  const roles = bootstrap?.roles ?? []

  const departmentMap = useMemo(
    () => new Map(organizations.map((organization) => [organization.id, organization.name])),
    [organizations],
  )
  const roleMap = useMemo(() => new Map(roles.map((role) => [role.id, role.name])), [roles])

  const tableData = useMemo<EmployeeTableRow[]>(
    () =>
      employees.map((employee) => ({
        ...employee,
        departmentName: departmentMap.get(employee.departmentId) ?? '-',
        roleNames: employee.roleIds.map((roleId) => roleMap.get(roleId) ?? roleId),
      })),
    [departmentMap, employees, roleMap],
  )

  const filteredEmployees = useMemo(() => {
    const keyword = appliedFilters.keyword?.trim().toLowerCase()

    return tableData.filter((employee) => {
      const matchesKeyword = keyword
        ? [
            employee.account,
            employee.name,
            employee.employeeNo,
            employee.phone,
            employee.email,
            employee.position,
            employee.departmentName,
            employee.roleNames.join(' '),
          ].some((field) => field.toLowerCase().includes(keyword))
        : true

      const matchesAccount = appliedFilters.account ? employee.account.includes(appliedFilters.account.trim()) : true
      const matchesName = appliedFilters.name ? employee.name.includes(appliedFilters.name.trim()) : true
      const matchesEmployeeNo = appliedFilters.employeeNo ? employee.employeeNo.includes(appliedFilters.employeeNo.trim()) : true
      const matchesDepartment = appliedFilters.departmentId ? employee.departmentId === appliedFilters.departmentId : true
      const matchesPosition = appliedFilters.position ? employee.position.includes(appliedFilters.position.trim()) : true
      const matchesRole = appliedFilters.roleId ? employee.roleIds.includes(appliedFilters.roleId) : true
      const matchesPhone = appliedFilters.phone ? employee.phone.includes(appliedFilters.phone.trim()) : true
      const matchesEmail = appliedFilters.email ? employee.email.includes(appliedFilters.email.trim()) : true
      const matchesStatus = appliedFilters.status ? employee.status === appliedFilters.status : true
      const matchesJoinDate = appliedFilters.joinDate ? employee.joinDate.includes(appliedFilters.joinDate.trim()) : true

      return (
        matchesKeyword &&
        matchesAccount &&
        matchesName &&
        matchesEmployeeNo &&
        matchesDepartment &&
        matchesPosition &&
        matchesRole &&
        matchesPhone &&
        matchesEmail &&
        matchesStatus &&
        matchesJoinDate
      )
    })
  }, [appliedFilters, tableData])

  const columns = useMemo<ConfigurableColumn<EmployeeTableRow>[]>(
    () => [
      {
        dataIndex: 'account',
        key: 'account',
        sorter: (left, right) => left.account.localeCompare(right.account),
        title: '登录账号',
        width: 140,
      },
      {
        dataIndex: 'employeeNo',
        key: 'employeeNo',
        sorter: (left, right) => left.employeeNo.localeCompare(right.employeeNo),
        title: '员工工号',
        width: 120,
      },
      {
        dataIndex: 'name',
        key: 'name',
        sorter: (left, right) => left.name.localeCompare(right.name),
        title: '员工姓名',
        width: 120,
      },
      {
        dataIndex: 'departmentName',
        key: 'departmentName',
        sorter: (left, right) => left.departmentName.localeCompare(right.departmentName),
        title: '所属部门',
        width: 140,
      },
      {
        dataIndex: 'position',
        key: 'position',
        sorter: (left, right) => left.position.localeCompare(right.position),
        title: '岗位',
        width: 140,
      },
      {
        dataIndex: 'roleNames',
        key: 'roleNames',
        render: (_, record) => (
          <Space size={[4, 4]} wrap>
            {record.roleNames.map((roleName) => (
              <Tag key={roleName}>{roleName}</Tag>
            ))}
          </Space>
        ),
        sorter: (left, right) => left.roleNames.join(',').localeCompare(right.roleNames.join(',')),
        title: '角色',
        width: 220,
      },
      {
        dataIndex: 'phone',
        key: 'phone',
        sorter: (left, right) => left.phone.localeCompare(right.phone),
        title: '联系电话',
        width: 140,
      },
      {
        dataIndex: 'email',
        key: 'email',
        sorter: (left, right) => left.email.localeCompare(right.email),
        title: '邮箱地址',
        width: 220,
      },
      {
        dataIndex: 'accountEnabled',
        key: 'accountEnabled',
        render: (_, record) => <Tag color={record.accountEnabled ? 'blue' : 'default'}>{record.accountEnabled ? '已启用' : '已禁用'}</Tag>,
        sorter: (left, right) => Number(left.accountEnabled) - Number(right.accountEnabled),
        title: '账号状态',
        width: 120,
      },
      {
        dataIndex: 'status',
        key: 'status',
        render: (_, record) => <Tag color={employeeStatusColorMap[record.status]}>{employeeStatusLabelMap[record.status]}</Tag>,
        sorter: (left, right) => left.status.localeCompare(right.status),
        title: '员工状态',
        width: 120,
      },
      {
        dataIndex: 'joinDate',
        key: 'joinDate',
        sorter: (left, right) => left.joinDate.localeCompare(right.joinDate),
        title: '入职日期',
        width: 120,
      },
      {
        dataIndex: 'updatedAt',
        key: 'updatedAt',
        sorter: (left, right) => left.updatedAt.localeCompare(right.updatedAt),
        title: '最近更新',
        width: 180,
      },
      {
        hideInSetting: true,
        key: 'actions',
        render: (_, employee) => (
          <Space size={12}>
            <Button icon={<EditOutlined />} onClick={() => openEditDrawer(employee)} type="link">
              编辑
            </Button>
            <Popconfirm
              okText="删除"
              okType="danger"
              title="确认删除该员工吗？"
              onConfirm={() => void handleDelete(employee.id)}
            >
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
    setEditingEmployee(null)
    form.setFieldsValue(defaultEmployeeFormValues)
    setIsDrawerOpen(true)
  }

  function openEditDrawer(employee: EmployeeRecord) {
    setEditingEmployee(employee)
    form.setFieldsValue({
      account: employee.account,
      accountEnabled: employee.accountEnabled,
      address: employee.address,
      bio: employee.bio,
      departmentId: employee.departmentId,
      email: employee.email,
      emergencyContact: employee.emergencyContact,
      emergencyPhone: employee.emergencyPhone,
      employeeNo: employee.employeeNo,
      joinDate: employee.joinDate,
      name: employee.name,
      password: '',
      phone: employee.phone,
      position: employee.position,
      roleIds: employee.roleIds,
      status: employee.status,
    })
    setIsDrawerOpen(true)
  }

  function closeDrawer() {
    setIsDrawerOpen(false)
    setEditingEmployee(null)
    form.resetFields()
  }

  async function handleFinish(values: EmployeeAdminFormValues) {
    try {
      if (editingEmployee) {
        await updateEnterpriseEmployee(editingEmployee.id, values)
        void message.success('员工信息已更新')
      } else {
        await createEnterpriseEmployee(values)
        void message.success('员工已新增')
      }

      closeDrawer()
      await reload()
    } catch (error) {
      void message.error(error instanceof Error ? error.message : '员工保存失败')
    }
  }

  async function handleDelete(employeeId: string) {
    try {
      await deleteEnterpriseEmployee(employeeId)
      void message.success('员工已删除')
      await reload()
    } catch (error) {
      void message.error(error instanceof Error ? error.message : '员工删除失败')
    }
  }

  async function handleSearch(values: EmployeeSearchValues) {
    setAppliedFilters(values)
  }

  function handleReset() {
    searchForm.resetFields()
    setAppliedFilters(defaultSearchValues)
  }

  return (
    <div className="operator-page">
      <Card bordered={false} className="operator-page__card operator-list-shell" loading={isLoading}>
        <Form form={searchForm} initialValues={defaultSearchValues} layout="vertical" onFinish={handleSearch}>
          <div className="operator-list-shell__filters">
            <Row gutter={16}>
              <Col span={6}>
                <Form.Item label="综合搜索" name="keyword">
                  <Input placeholder="账号 / 姓名 / 工号 / 手机 / 邮箱 / 岗位" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="登录账号" name="account">
                  <Input placeholder="请输入登录账号" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="员工姓名" name="name">
                  <Input placeholder="请输入员工姓名" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="员工工号" name="employeeNo">
                  <Input placeholder="请输入员工工号" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="所属部门" name="departmentId">
                  <Select allowClear options={organizations.map((organization) => ({ label: organization.name, value: organization.id }))} placeholder="请选择所属部门" />
                </Form.Item>
              </Col>

              {isFilterExpanded ? (
                <>
                  <Col span={6}>
                    <Form.Item label="岗位名称" name="position">
                      <Input placeholder="请输入岗位名称" />
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Form.Item label="角色配置" name="roleId">
                      <Select allowClear options={roles.map((role) => ({ label: role.name, value: role.id }))} placeholder="请选择角色" />
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Form.Item label="联系电话" name="phone">
                      <Input placeholder="请输入联系电话" />
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Form.Item label="邮箱地址" name="email">
                      <Input placeholder="请输入邮箱地址" />
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Form.Item label="员工状态" name="status">
                      <Select
                        allowClear
                        options={[
                          { label: '在职', value: 'ACTIVE' },
                          { label: '待激活', value: 'INVITED' },
                          { label: '已停用', value: 'DISABLED' },
                        ]}
                        placeholder="请选择员工状态"
                      />
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Form.Item label="入职日期" name="joinDate">
                      <Input placeholder="例如 2026-08-24" />
                    </Form.Item>
                  </Col>
                </>
              ) : null}
            </Row>

            <div className="operator-list-shell__filter-actions">
              <Space size={12}>
                <Button htmlType="submit" icon={<SearchOutlined />} type="primary">
                  查询
                </Button>
                <Button onClick={handleReset}>重置</Button>
                <Button type="link" onClick={() => setIsFilterExpanded((currentValue) => !currentValue)}>
                  {isFilterExpanded ? '收起筛选' : '展开筛选'}
                </Button>
              </Space>
            </div>
          </div>
        </Form>

        <Divider className="operator-list-shell__divider" />

        <ConfigurableProTable<EmployeeTableRow>
          columns={columns}
          dataSource={filteredEmployees}
          headerTitle={false}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          rowKey="id"
          size="middle"
          storageKey="operation-enterprise-employees-table"
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
        title={editingEmployee ? '编辑员工信息' : '新增员工'}
        width={760}
        onClose={closeDrawer}
      >
        <Form form={form} initialValues={defaultEmployeeFormValues} layout="vertical" onFinish={(values) => void handleFinish(values)}>
          <Typography.Title level={5}>登录信息</Typography.Title>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="登录账号" name="account" rules={[{ required: true, message: '请输入登录账号' }]}>
                <Input placeholder="请输入登录账号" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={editingEmployee ? '重置密码' : '初始密码'}
                name="password"
                rules={editingEmployee ? [] : [{ required: true, message: '请输入初始密码' }]}
              >
                <Input.Password placeholder={editingEmployee ? '不填则保持原密码' : '请输入初始密码'} visibilityToggle={false} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="账号启用状态" name="accountEnabled" valuePropName="checked">
                <Switch checkedChildren="启用" unCheckedChildren="停用" />
              </Form.Item>
            </Col>
          </Row>

          <Typography.Title level={5}>个人信息</Typography.Title>
          <EmployeeProfileFormFields />

          <Typography.Title level={5}>后台管理信息</Typography.Title>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="员工工号" name="employeeNo" rules={[{ required: true, message: '请输入员工工号' }]}>
                <Input placeholder="请输入员工工号" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="入职日期" name="joinDate" rules={[{ required: true, message: '请输入入职日期' }]}>
                <Input placeholder="例如 2026-08-24" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="所属部门" name="departmentId" rules={[{ required: true, message: '请选择所属部门' }]}>
                <Select options={organizations.map((organization) => ({ label: organization.name, value: organization.id }))} placeholder="请选择所属部门" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="员工状态" name="status" rules={[{ required: true, message: '请选择员工状态' }]}>
                <Select
                  options={[
                    { label: '在职', value: 'ACTIVE' },
                    { label: '待激活', value: 'INVITED' },
                    { label: '已停用', value: 'DISABLED' },
                  ]}
                  placeholder="请选择员工状态"
                />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="角色配置" name="roleIds" rules={[{ required: true, message: '请至少选择一个角色' }]}>
                <Select mode="multiple" options={roles.map((role) => ({ label: role.name, value: role.id }))} placeholder="请选择角色" />
              </Form.Item>
            </Col>
          </Row>

          <Space className="operator-form-drawer__actions">
            <Button onClick={closeDrawer}>取消</Button>
            <Button htmlType="submit" type="primary">
              保存员工信息
            </Button>
          </Space>
        </Form>
      </Drawer>
    </div>
  )
}
