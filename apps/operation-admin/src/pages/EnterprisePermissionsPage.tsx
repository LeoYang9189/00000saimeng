import { ReloadOutlined, SaveOutlined, SearchOutlined } from '@ant-design/icons'
import { Button, Card, Col, Form, Input, Row, Space, Tag, Tree, Typography, message } from 'antd'
import type { DataNode } from 'antd/es/tree'
import { useEffect, useMemo, useState } from 'react'
import { updateEnterpriseRolePermissions } from '../api'
import { useEnterpriseBootstrap } from '../hooks/useEnterpriseBootstrap'
import type { PermissionRecord, RoleRecord } from '../types'

interface PermissionSearchValues {
  keyword?: string
  roleCode?: string
  roleName?: string
}

const defaultSearchValues: PermissionSearchValues = {}
const emptyRoles: RoleRecord[] = []

/**
 * 企业中心-权限管理页。
 */
export function EnterprisePermissionsPage() {
  const { bootstrap, isLoading, reload } = useEnterpriseBootstrap()
  const [searchForm] = Form.useForm<PermissionSearchValues>()
  const [appliedFilters, setAppliedFilters] = useState<PermissionSearchValues>(defaultSearchValues)
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null)
  const [checkedKeys, setCheckedKeys] = useState<string[]>([])

  const employees = bootstrap?.employees ?? []
  const permissions = bootstrap?.permissions ?? []
  const roles = bootstrap?.roles ?? emptyRoles

  useEffect(() => {
    const matchedRole = roles.find((role) => role.id === selectedRoleId) ?? roles[0] ?? null
    const nextRoleId = matchedRole?.id ?? null
    const nextCheckedKeys = matchedRole?.permissionKeys ?? []

    setSelectedRoleId((currentRoleId) => (currentRoleId === nextRoleId ? currentRoleId : nextRoleId))
    setCheckedKeys((currentKeys) =>
      currentKeys.length === nextCheckedKeys.length && currentKeys.every((key, index) => key === nextCheckedKeys[index])
        ? currentKeys
        : nextCheckedKeys,
    )
  }, [roles, selectedRoleId])

  const currentRole = useMemo(() => roles.find((role) => role.id === selectedRoleId) ?? null, [roles, selectedRoleId])

  const roleMemberCountMap = useMemo(() => {
    const counter = new Map<string, number>()
    employees.forEach((employee) => {
      employee.roleIds.forEach((roleId) => {
        counter.set(roleId, (counter.get(roleId) ?? 0) + 1)
      })
    })
    return counter
  }, [employees])

  const filteredRoles = useMemo(() => {
    const keyword = appliedFilters.keyword?.trim().toLowerCase()

    return roles.filter((role) => {
      const matchesKeyword = keyword
        ? [role.name, role.code, role.description].some((field) => field.toLowerCase().includes(keyword))
        : true
      const matchesRoleName = appliedFilters.roleName ? role.name.includes(appliedFilters.roleName.trim()) : true
      const matchesRoleCode = appliedFilters.roleCode ? role.code.includes(appliedFilters.roleCode.trim()) : true
      return matchesKeyword && matchesRoleName && matchesRoleCode
    })
  }, [appliedFilters, roles])

  const treeData = useMemo<DataNode[]>(() => buildPermissionTreeData(permissions, appliedFilters.keyword), [appliedFilters.keyword, permissions])

  async function handleSave() {
    if (!currentRole) {
      return
    }

    try {
      await updateEnterpriseRolePermissions(currentRole.id, checkedKeys)
      void message.success('角色权限已保存')
      await reload()
    } catch (error) {
      void message.error(error instanceof Error ? error.message : '角色权限保存失败')
    }
  }

  async function handleSearch(values: PermissionSearchValues) {
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
              <Col span={8}>
                <Form.Item label="综合搜索" name="keyword">
                  <Input placeholder="角色名称 / 编码 / 权限名称" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="角色名称" name="roleName">
                  <Input placeholder="请输入角色名称" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="角色编码" name="roleCode">
                  <Input placeholder="请输入角色编码" />
                </Form.Item>
              </Col>
            </Row>

            <div className="operator-list-shell__filter-actions">
              <Space size={12}>
                <Button htmlType="submit" icon={<SearchOutlined />} type="primary">
                  查询
                </Button>
                <Button icon={<ReloadOutlined />} onClick={handleReset}>
                  重置
                </Button>
              </Space>
            </div>
          </div>
        </Form>

        <div className="operator-permission-shell">
          <div className="operator-permission-shell__body">
            <div className="operator-permission-shell__sidebar">
              {filteredRoles.map((role) => (
                <button
                  className={
                    role.id === selectedRoleId
                      ? 'operator-permission-shell__role operator-permission-shell__role--active'
                      : 'operator-permission-shell__role'
                  }
                  key={role.id}
                  type="button"
                  onClick={() => {
                    setSelectedRoleId(role.id)
                    setCheckedKeys(role.permissionKeys)
                  }}
                >
                  <div className="operator-permission-shell__role-main">
                    <strong>{role.name}</strong>
                    <span>{role.description}</span>
                  </div>
                  <Space size={[4, 4]} wrap>
                    <Tag>{role.code}</Tag>
                    <Tag color="blue">{roleMemberCountMap.get(role.id) ?? 0} 人</Tag>
                  </Space>
                </button>
              ))}
            </div>

            <div className="operator-permission-shell__content">
              {currentRole ? (
                <Space className="operator-page__stack-space" direction="vertical" size={16}>
                  <div className="operator-permission-shell__content-header">
                    <div className="operator-page__section-title">
                      <Typography.Title level={5}>{currentRole.name}</Typography.Title>
                      <Typography.Text type="secondary">
                        当前权限树来自真实数据库，角色保存后员工登录将按最新权限生效。
                      </Typography.Text>
                    </div>
                    <Button icon={<SaveOutlined />} onClick={() => void handleSave()} type="primary">
                      保存权限配置
                    </Button>
                  </div>

                  <Tree
                    checkable
                    checkedKeys={checkedKeys}
                    className="operator-permission-tree"
                    defaultExpandAll
                    treeData={treeData}
                    onCheck={(keys) => setCheckedKeys(keys as string[])}
                  />
                </Space>
              ) : (
                <div className="operator-permission-shell__empty">暂无可配置角色</div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

function buildPermissionTreeData(records: PermissionRecord[], keyword?: string): DataNode[] {
  const normalizedKeyword = keyword?.trim().toLowerCase()

  return records
    .map((record) => {
      const childNodes = record.children ? buildPermissionTreeData(record.children, keyword) : undefined
      const matchesSelf = normalizedKeyword ? record.title.toLowerCase().includes(normalizedKeyword) : true
      const hasMatchedChildren = Boolean(childNodes && childNodes.length > 0)

      if (!matchesSelf && !hasMatchedChildren) {
        return null
      }

      return {
        key: record.key,
        title: record.title,
        children: childNodes,
      }
    })
    .filter(Boolean) as DataNode[]
}
