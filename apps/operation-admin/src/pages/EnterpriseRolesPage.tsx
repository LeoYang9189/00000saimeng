import { DeleteOutlined, EditOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons'
import { Button, Card, Col, Divider, Drawer, Form, Input, InputNumber, Popconfirm, Row, Select, Space, Tag, message } from 'antd'
import { useMemo, useState } from 'react'
import { createEnterpriseRole, deleteEnterpriseRole, updateEnterpriseRole } from '../api'
import { ConfigurableProTable, type ConfigurableColumn } from '../components/ConfigurableProTable'
import { useEnterpriseBootstrap } from '../hooks/useEnterpriseBootstrap'
import type { RoleRecord } from '../types'

interface RoleFormValues {
  code: string
  description: string
  name: string
}

interface RoleSearchValues {
  code?: string
  keyword?: string
  minMemberCount?: number
  minPermissionCount?: number
  name?: string
  roleType?: 'BUILT_IN' | 'CUSTOM'
}

interface RoleTableRow extends RoleRecord {
  memberCount: number
  roleType: 'BUILT_IN' | 'CUSTOM'
}

const defaultRoleFormValues: RoleFormValues = {
  code: '',
  description: '',
  name: '',
}

const defaultSearchValues: RoleSearchValues = {}

/**
 * 企业中心-角色管理页。
 */
export function EnterpriseRolesPage() {
  const { bootstrap, isLoading, reload } = useEnterpriseBootstrap()
  const [form] = Form.useForm<RoleFormValues>()
  const [searchForm] = Form.useForm<RoleSearchValues>()
  const [editingRole, setEditingRole] = useState<RoleRecord | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isFilterExpanded, setIsFilterExpanded] = useState(false)
  const [appliedFilters, setAppliedFilters] = useState<RoleSearchValues>(defaultSearchValues)

  const employees = bootstrap?.employees ?? []
  const roles = bootstrap?.roles ?? []

  const memberCountMap = useMemo(() => {
    const counter = new Map<string, number>()
    employees.forEach((employee) => {
      employee.roleIds.forEach((roleId) => {
        counter.set(roleId, (counter.get(roleId) ?? 0) + 1)
      })
    })
    return counter
  }, [employees])

  const tableData = useMemo<RoleTableRow[]>(
    () =>
      roles.map((role) => ({
        ...role,
        memberCount: memberCountMap.get(role.id) ?? 0,
        roleType: role.isBuiltIn ? 'BUILT_IN' : 'CUSTOM',
      })),
    [memberCountMap, roles],
  )

  const filteredRoles = useMemo(() => {
    const keyword = appliedFilters.keyword?.trim().toLowerCase()

    return tableData.filter((role) => {
      const matchesKeyword = keyword
        ? [role.name, role.code, role.description].some((field) => field.toLowerCase().includes(keyword))
        : true
      const matchesName = appliedFilters.name ? role.name.includes(appliedFilters.name.trim()) : true
      const matchesCode = appliedFilters.code ? role.code.includes(appliedFilters.code.trim()) : true
      const matchesRoleType = appliedFilters.roleType ? role.roleType === appliedFilters.roleType : true
      const matchesMemberCount =
        typeof appliedFilters.minMemberCount === 'number' ? role.memberCount >= appliedFilters.minMemberCount : true
      const matchesPermissionCount =
        typeof appliedFilters.minPermissionCount === 'number'
          ? role.permissionKeys.length >= appliedFilters.minPermissionCount
          : true

      return matchesKeyword && matchesName && matchesCode && matchesRoleType && matchesMemberCount && matchesPermissionCount
    })
  }, [appliedFilters, tableData])

  const columns: ConfigurableColumn<RoleTableRow>[] = [
    {
      dataIndex: 'name',
      key: 'name',
      sorter: (left, right) => left.name.localeCompare(right.name),
      title: '角色名称',
      width: 160,
    },
    {
      dataIndex: 'code',
      key: 'code',
      sorter: (left, right) => left.code.localeCompare(right.code),
      title: '角色编码',
      width: 160,
    },
    {
      dataIndex: 'description',
      key: 'description',
      sorter: (left, right) => left.description.localeCompare(right.description),
      title: '角色说明',
      width: 260,
    },
    {
      dataIndex: 'memberCount',
      key: 'memberCount',
      sorter: (left, right) => left.memberCount - right.memberCount,
      title: '绑定员工数',
      width: 120,
    },
    {
      dataIndex: 'permissionKeys',
      key: 'permissionCount',
      render: (_, role) => <Tag color="blue">{role.permissionKeys.length} 项</Tag>,
      sorter: (left, right) => left.permissionKeys.length - right.permissionKeys.length,
      title: '权限点数',
      width: 120,
    },
    {
      dataIndex: 'roleType',
      key: 'roleType',
      render: (_, role) => <Tag>{role.roleType === 'BUILT_IN' ? '内置角色' : '自定义角色'}</Tag>,
      sorter: (left, right) => left.roleType.localeCompare(right.roleType),
      title: '角色类型',
      width: 120,
    },
    {
      hideInSetting: true,
      key: 'actions',
      render: (_, role) => (
        <Space size={12}>
          <Button icon={<EditOutlined />} onClick={() => openEditDrawer(role)} type="link">
            编辑
          </Button>
          <Popconfirm
            disabled={role.isBuiltIn}
            okText="删除"
            okType="danger"
            title={role.isBuiltIn ? '内置角色不能删除' : '确认删除该角色吗？'}
            onConfirm={() => void handleDelete(role)}
          >
            <Button danger disabled={role.isBuiltIn} icon={<DeleteOutlined />} type="link">
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
      title: '操作',
      width: 140,
    },
  ]

  function openCreateDrawer() {
    setEditingRole(null)
    form.setFieldsValue(defaultRoleFormValues)
    setIsDrawerOpen(true)
  }

  function openEditDrawer(role: RoleRecord) {
    setEditingRole(role)
    form.setFieldsValue({
      code: role.code,
      description: role.description,
      name: role.name,
    })
    setIsDrawerOpen(true)
  }

  function closeDrawer() {
    setEditingRole(null)
    setIsDrawerOpen(false)
    form.resetFields()
  }

  async function handleFinish(values: RoleFormValues) {
    try {
      if (editingRole) {
        await updateEnterpriseRole(editingRole.id, { ...values, permissionKeys: editingRole.permissionKeys })
        void message.success('角色信息已更新')
      } else {
        await createEnterpriseRole({ ...values, permissionKeys: [] })
        void message.success('角色已新增')
      }

      closeDrawer()
      await reload()
    } catch (error) {
      void message.error(error instanceof Error ? error.message : '角色保存失败')
    }
  }

  async function handleDelete(role: RoleRecord) {
    try {
      await deleteEnterpriseRole(role.id)
      void message.success('角色已删除')
      await reload()
    } catch (error) {
      void message.error(error instanceof Error ? error.message : '角色删除失败')
    }
  }

  async function handleSearch(values: RoleSearchValues) {
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
                  <Input placeholder="角色名称 / 编码 / 说明" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="角色名称" name="name">
                  <Input placeholder="请输入角色名称" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="角色编码" name="code">
                  <Input placeholder="请输入角色编码" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="角色类型" name="roleType">
                  <Select
                    allowClear
                    options={[
                      { label: '内置角色', value: 'BUILT_IN' },
                      { label: '自定义角色', value: 'CUSTOM' },
                    ]}
                    placeholder="请选择角色类型"
                  />
                </Form.Item>
              </Col>

              {isFilterExpanded ? (
                <>
                  <Col span={6}>
                    <Form.Item label="最少绑定员工数" name="minMemberCount">
                      <InputNumber className="operator-input-number" min={0} precision={0} placeholder="请输入数量" />
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Form.Item label="最少权限点数" name="minPermissionCount">
                      <InputNumber className="operator-input-number" min={0} precision={0} placeholder="请输入数量" />
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

        <ConfigurableProTable<RoleTableRow>
          columns={columns}
          dataSource={filteredRoles}
          headerTitle={false}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          rowKey="id"
          size="middle"
          storageKey="operation-enterprise-roles-table"
          tableClassName="operator-pro-table"
          toolBarRender={() => [
            <Button icon={<PlusOutlined />} key="create-role" onClick={openCreateDrawer} type="primary">
              新增角色
            </Button>,
          ]}
        />
      </Card>

      <Drawer
        className="operator-form-drawer"
        destroyOnHidden
        open={isDrawerOpen}
        title={editingRole ? '编辑角色' : '新增角色'}
        width={520}
        onClose={closeDrawer}
      >
        <Form form={form} initialValues={defaultRoleFormValues} layout="vertical" onFinish={(values) => void handleFinish(values)}>
          <Form.Item label="角色名称" name="name" rules={[{ required: true, message: '请输入角色名称' }]}>
            <Input placeholder="请输入角色名称" />
          </Form.Item>
          <Form.Item label="角色编码" name="code" rules={[{ required: true, message: '请输入角色编码' }]}>
            <Input placeholder="请输入角色编码" />
          </Form.Item>
          <Form.Item label="角色说明" name="description" rules={[{ required: true, message: '请输入角色说明' }]}>
            <Input.TextArea autoSize={{ minRows: 4, maxRows: 6 }} placeholder="请输入角色说明" />
          </Form.Item>

          <Space className="operator-form-drawer__actions">
            <Button onClick={closeDrawer}>取消</Button>
            <Button htmlType="submit" type="primary">
              保存角色
            </Button>
          </Space>
        </Form>
      </Drawer>
    </div>
  )
}
