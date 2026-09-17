import { Col, Form, Input, Row } from 'antd'

interface EmployeeProfileFormFieldsProps {
  readonly?: boolean
}

/**
 * 员工个人信息公共表单字段。
 */
export function EmployeeProfileFormFields({ readonly = false }: EmployeeProfileFormFieldsProps) {
  return (
    <Row gutter={16}>
      <Col span={12}>
        <Form.Item label="员工姓名" name="name" rules={[{ required: true, message: '请输入员工姓名' }]}>
          <Input disabled={readonly} placeholder="请输入员工姓名" />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label="联系电话" name="phone" rules={[{ required: true, message: '请输入联系电话' }]}>
          <Input disabled={readonly} placeholder="请输入联系电话" />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label="邮箱地址" name="email" rules={[{ required: true, message: '请输入邮箱地址' }]}>
          <Input disabled={readonly} placeholder="请输入邮箱地址" />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label="岗位名称" name="position" rules={[{ required: true, message: '请输入岗位名称' }]}>
          <Input disabled={readonly} placeholder="请输入岗位名称" />
        </Form.Item>
      </Col>
      <Col span={24}>
        <Form.Item label="联系地址" name="address" rules={[{ required: true, message: '请输入联系地址' }]}>
          <Input disabled={readonly} placeholder="请输入联系地址" />
        </Form.Item>
      </Col>
      <Col span={24}>
        <Form.Item label="个人简介" name="bio">
          <Input.TextArea autoSize={{ minRows: 3, maxRows: 5 }} disabled={readonly} placeholder="请输入个人简介" />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label="紧急联系人" name="emergencyContact">
          <Input disabled={readonly} placeholder="请输入紧急联系人" />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label="紧急联系电话" name="emergencyPhone">
          <Input disabled={readonly} placeholder="请输入紧急联系电话" />
        </Form.Item>
      </Col>
    </Row>
  )
}
