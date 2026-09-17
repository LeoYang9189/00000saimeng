import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, Card, Col, Drawer, Empty, Form, Input, InputNumber, Popconfirm, Row, Select, Space, Table, Tree, message } from 'antd'
import type { DataNode } from 'antd/es/tree'
import { useEffect, useMemo, useState } from 'react'
import { createEnterpriseDepartment, deleteEnterpriseDepartment, updateEnterpriseDepartment } from '../api'
import { useEnterpriseBootstrap } from '../hooks/useEnterpriseBootstrap'
import type { OrganizationRecord } from '../types'

interface OrganizationFormValues {
  code: string
  description: string
  managerEmployeeId: string | null
  name: string
  parentId: string | null
  sortOrder: number
}

const defaultOrganizationFormValues: OrganizationFormValues = {
  code: '',
  description: '',
  managerEmployeeId: null,
  name: '',
  parentId: null,
  sortOrder: 10,
}

/**
 * 企业中心-组织架构页。
 */
export function EnterpriseOrganizationPage() {
  const { bootstrap, isLoading, reload } = useEnterpriseBootstrap()
  const [form] = Form.useForm<OrganizationFormValues>()
  const [editingOrganization, setEditingOrganization] = useState<OrganizationRecord | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string>('')

  const organizations = bootstrap?.organizations ?? []
  const employees = bootstrap?.employees ?? []

  useEffect(() => {
    if (!selectedOrganizationId && organizations[0]) {
      setSelectedOrganizationId(organizations[0].id)
    }
    if (selectedOrganizationId && !organizations.some((organization) => organization.id === selectedOrganizationId)) {
      setSelectedOrganizationId(organizations[0]?.id ?? '')
    }
  }, [organizations, selectedOrganizationId])

  const selectedOrganization = useMemo(
    () => organizations.find((organization) => organization.id === selectedOrganizationId) ?? null,
    [organizations, selectedOrganizationId],
  )
  const organizationTreeData = useMemo<DataNode[]>(() => buildOrganizationTreeData(organizations), [organizations])
  const employeeMap = useMemo(() => new Map(employees.map((employee) => [employee.id, employee.name])), [employees])
  const employeesInSelectedOrganization = useMemo(
    () => employees.filter((employee) => employee.departmentId === selectedOrganizationId),
    [employees, selectedOrganizationId],
  )

  function openCreateDrawer(parentId?: string | null) {
    setEditingOrganization(null)
    form.setFieldsValue({
      ...defaultOrganizationFormValues,
      parentId: parentId ?? null,
    })
    setIsDrawerOpen(true)
  }

  function openEditDrawer(organization: OrganizationRecord) {
    setEditingOrganization(organization)
    form.setFieldsValue({
      code: organization.code,
      description: organization.description,
      managerEmployeeId: organization.managerEmployeeId,
      name: organization.name,
      parentId: organization.parentId,
      sortOrder: organization.sortOrder,
    })
    setIsDrawerOpen(true)
  }

  function closeDrawer() {
    setEditingOrganization(null)
    setIsDrawerOpen(false)
    form.resetFields()
  }

  async function handleFinish(values: OrganizationFormValues) {
    try {
      if (editingOrganization) {
        await updateEnterpriseDepartment(editingOrganization.id, values)
        void message.success('部门信息已更新')
      } else {
        await createEnterpriseDepartment(values)
        void message.success('部门已新增')
      }

      closeDrawer()
      await reload()
    } catch (error) {
      void message.error(error instanceof Error ? error.message : '部门保存失败')
    }
  }

  async function handleDelete(organizationId: string) {
    try {
      await deleteEnterpriseDepartment(organizationId)
      if (selectedOrganizationId === organizationId) {
        setSelectedOrganizationId('')
      }
      void message.success('部门已删除')
      await reload()
    } catch (error) {
      void message.error(error instanceof Error ? error.message : '部门删除失败')
    }
  }

  return (
    <div className="operator-page">
      <Row gutter={[16, 16]}>
        <Col span={8}>
          <Card
            bordered={false}
            className="operator-page__card operator-page__full-height"
            extra={
              <Button icon={<PlusOutlined />} onClick={() => openCreateDrawer(null)} type="primary">
                新增部门
              </Button>
            }
            loading={isLoading}
            title="组织树"
          >
            <Tree
              className="operator-organization-tree"
              defaultExpandAll
              selectedKeys={selectedOrganizationId ? [selectedOrganizationId] : []}
              treeData={organizationTreeData}
              onSelect={(keys) => {
                if (keys[0]) {
                  setSelectedOrganizationId(String(keys[0]))
                }
              }}
            />
          </Card>
        </Col>

        <Col span={16}>
          <Space className="operator-page__stack-space" direction="vertical" size={16}>
            <Card
              bordered={false}
              className="operator-page__card"
              extra={
                selectedOrganization ? (
                  <Space>
                    <Button icon={<PlusOutlined />} onClick={() => openCreateDrawer(selectedOrganization.id)}>
                      新增下级部门
                    </Button>
                    <Button icon={<EditOutlined />} onClick={() => openEditDrawer(selectedOrganization)}>
                      编辑
                    </Button>
                    <Popconfirm
                      okText="删除"
                      okType="danger"
                      title="确认删除该部门吗？"
                      onConfirm={() => void handleDelete(selectedOrganization.id)}
                    >
                      <Button danger icon={<DeleteOutlined />}>
                        删除
                      </Button>
                    </Popconfirm>
                  </Space>
                ) : null
              }
              loading={isLoading}
              title="部门详情"
            >
              {selectedOrganization ? (
                <div className="operator-detail-grid">
                  <div>
                    <span>部门名称</span>
                    <strong>{selectedOrganization.name}</strong>
                  </div>
                  <div>
                    <span>部门编码</span>
                    <strong>{selectedOrganization.code}</strong>
                  </div>
                  <div>
                    <span>负责人</span>
                    <strong>{employeeMap.get(selectedOrganization.managerEmployeeId ?? '') ?? '未设置'}</strong>
                  </div>
                  <div>
                    <span>排序权重</span>
                    <strong>{selectedOrganization.sortOrder}</strong>
                  </div>
                  <div className="operator-detail-grid__full">
                    <span>部门说明</span>
                    <strong>{selectedOrganization.description || '暂无说明'}</strong>
                  </div>
                </div>
              ) : (
                <Empty description="请选择左侧部门节点" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )}
            </Card>

            <Card bordered={false} className="operator-page__card" loading={isLoading} title="部门员工">
              <Table
                columns={[
                  { dataIndex: 'name', key: 'name', title: '员工姓名' },
                  { dataIndex: 'account', key: 'account', title: '登录账号' },
                  { dataIndex: 'position', key: 'position', title: '岗位' },
                  { dataIndex: 'phone', key: 'phone', title: '联系电话' },
                  { dataIndex: 'email', key: 'email', title: '邮箱' },
                ]}
                dataSource={employeesInSelectedOrganization}
                locale={{ emptyText: '当前部门暂无员工' }}
                pagination={false}
                rowKey="id"
              />
            </Card>
          </Space>
        </Col>
      </Row>

      <Drawer
        className="operator-form-drawer"
        destroyOnHidden
        open={isDrawerOpen}
        title={editingOrganization ? '编辑部门' : '新增部门'}
        width={560}
        onClose={closeDrawer}
      >
        <Form form={form} initialValues={defaultOrganizationFormValues} layout="vertical" onFinish={(values) => void handleFinish(values)}>
          <Form.Item label="上级部门" name="parentId">
            <Select allowClear options={organizations.map((organization) => ({ label: organization.name, value: organization.id }))} placeholder="请选择上级部门" />
          </Form.Item>
          <Form.Item label="部门名称" name="name" rules={[{ required: true, message: '请输入部门名称' }]}>
            <Input placeholder="请输入部门名称" />
          </Form.Item>
          <Form.Item label="部门编码" name="code" rules={[{ required: true, message: '请输入部门编码' }]}>
            <Input placeholder="请输入部门编码" />
          </Form.Item>
          <Form.Item label="负责人" name="managerEmployeeId">
            <Select allowClear options={employees.map((employee) => ({ label: employee.name, value: employee.id }))} placeholder="请选择负责人" />
          </Form.Item>
          <Form.Item label="排序权重" name="sortOrder" rules={[{ required: true, message: '请输入排序权重' }]}>
            <InputNumber className="operator-input-number" min={1} precision={0} placeholder="请输入排序权重" />
          </Form.Item>
          <Form.Item label="部门说明" name="description">
            <Input.TextArea autoSize={{ minRows: 4, maxRows: 6 }} placeholder="请输入部门说明" />
          </Form.Item>

          <Space className="operator-form-drawer__actions">
            <Button onClick={closeDrawer}>取消</Button>
            <Button htmlType="submit" type="primary">
              保存部门
            </Button>
          </Space>
        </Form>
      </Drawer>
    </div>
  )
}

function buildOrganizationTreeData(records: OrganizationRecord[], parentId: string | null = null): DataNode[] {
  return records
    .filter((record) => record.parentId === parentId)
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((record) => ({
      key: record.id,
      title: record.name,
      children: buildOrganizationTreeData(records, record.id),
    }))
}
