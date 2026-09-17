import { SaveOutlined } from '@ant-design/icons'
import { Alert, Button, Card, Col, Descriptions, Form, Row, Space, Tag, Typography, message } from 'antd'
import { useEffect } from 'react'
import { updateCurrentEmployeeProfile } from '../api'
import { EmployeeProfileFormFields } from '../components/EmployeeProfileFormFields'
import { useEnterpriseBootstrap } from '../hooks/useEnterpriseBootstrap'
import type { EmployeeProfileFormValues } from '../types'

/**
 * 系统设置-个人中心页。
 */
export function OperatorProfilePage() {
  const { bootstrap, isLoading, reload } = useEnterpriseBootstrap()
  const [form] = Form.useForm<EmployeeProfileFormValues>()

  const currentEmployee = bootstrap?.currentEmployee ?? null
  const organizations = bootstrap?.organizations ?? []
  const roles = bootstrap?.roles ?? []

  useEffect(() => {
    if (!currentEmployee) {
      return
    }

    form.setFieldsValue({
      address: currentEmployee.address,
      bio: currentEmployee.bio,
      email: currentEmployee.email,
      emergencyContact: currentEmployee.emergencyContact,
      emergencyPhone: currentEmployee.emergencyPhone,
      name: currentEmployee.name,
      phone: currentEmployee.phone,
      position: currentEmployee.position,
    })
  }, [currentEmployee, form])

  if (!currentEmployee && !isLoading) {
    return <Alert message="当前登录员工未匹配到个人档案，无法维护个人信息。" type="warning" />
  }

  const departmentName = organizations.find((organization) => organization.id === currentEmployee?.departmentId)?.name ?? '-'
  const currentRoles = roles.filter((role) => currentEmployee?.roleIds.includes(role.id))

  async function handleFinish(values: EmployeeProfileFormValues) {
    try {
      await updateCurrentEmployeeProfile(values)
      void message.success('个人信息已保存')
      await reload()
    } catch (error) {
      void message.error(error instanceof Error ? error.message : '个人信息保存失败')
    }
  }

  return (
    <div className="operator-page operator-page--stack">
      <Card bordered={false} className="operator-page__card" loading={isLoading}>
        <Row gutter={[24, 24]}>
          <Col span={16}>
            <Space className="operator-page__stack-space" direction="vertical" size={16}>
              <div className="operator-page__section-title">
                <Typography.Title level={5}>个人信息维护</Typography.Title>
                <Typography.Text type="secondary">
                  这里修改的是员工本人档案，超级管理员在员工管理页看到的是同一份个人信息。
                </Typography.Text>
              </div>

              <Form<EmployeeProfileFormValues> form={form} layout="vertical" onFinish={(values) => void handleFinish(values)}>
                <EmployeeProfileFormFields />

                <Button htmlType="submit" icon={<SaveOutlined />} type="primary">
                  保存个人信息
                </Button>
              </Form>
            </Space>
          </Col>

          <Col span={8}>
            <Card bordered={false} className="operator-page__sub-card">
              <Descriptions className="operator-page__descriptions" column={1} title="账号信息">
                <Descriptions.Item label="登录账号">{currentEmployee?.account ?? '-'}</Descriptions.Item>
                <Descriptions.Item label="员工工号">{currentEmployee?.employeeNo ?? '-'}</Descriptions.Item>
                <Descriptions.Item label="所属部门">{departmentName}</Descriptions.Item>
                <Descriptions.Item label="入职日期">{currentEmployee?.joinDate ?? '-'}</Descriptions.Item>
                <Descriptions.Item label="当前状态">
                  {currentEmployee?.status === 'ACTIVE' ? '在职' : currentEmployee?.status === 'INVITED' ? '待激活' : '已停用'}
                </Descriptions.Item>
                <Descriptions.Item label="绑定角色">
                  <Space size={[4, 4]} wrap>
                    {currentRoles.map((role) => (
                      <Tag key={role.id}>{role.name}</Tag>
                    ))}
                  </Space>
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  )
}
