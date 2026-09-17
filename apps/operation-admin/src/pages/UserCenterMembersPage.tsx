import { DeleteOutlined, EditOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons'
import { Button, Card, Col, Divider, Drawer, Form, Input, InputNumber, Popconfirm, Row, Select, Space, Switch, Tag, Typography, message } from 'antd'
import { useMemo, useState } from 'react'
import {
  createUserCenterMemberLevel,
  deleteUserCenterMemberLevel,
  updateUserCenterMemberLevel,
} from '../api'
import { ConfigurableProTable, type ConfigurableColumn } from '../components/ConfigurableProTable'
import { useUserCenterBootstrap } from '../hooks/useUserCenterBootstrap'
import type { MemberLevelConfigRecord, MemberLevelUpsertPayload } from '../types'

interface MemberSearchValues {
  enabled?: 'enabled' | 'disabled'
  keyword?: string
}

const defaultSearchValues: MemberSearchValues = {}

const defaultMemberLevelFormValues: MemberLevelUpsertPayload = {
  levelKey: '',
  levelName: '',
  levelRank: 0,
  levelTitle: '',
  levelDescription: '',
  summaryText: '',
  progressText: '',
  missionText: '',
  missionAction: '',
  highlightTitle: '',
  visualSrc: '',
  heroStart: '',
  heroMid: '',
  heroEnd: '',
  accent: '',
  softAccent: '',
  cardSurface: '',
  placeholderTone: '',
  glowColor: '',
  sparkColor: '',
  progressPercent: 0,
  highlightKeys: [],
  benefitKeys: [],
  enabled: true,
}

/**
 * 用户中心-会员管理页。
 */
export function UserCenterMembersPage() {
  const { bootstrap, isLoading, reload } = useUserCenterBootstrap()
  const [form] = Form.useForm<MemberLevelUpsertPayload>()
  const [searchForm] = Form.useForm<MemberSearchValues>()
  const [editingRecord, setEditingRecord] = useState<MemberLevelConfigRecord | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [appliedFilters, setAppliedFilters] = useState<MemberSearchValues>(defaultSearchValues)

  const memberLevels = bootstrap?.memberLevels ?? []
  const benefitOptions = bootstrap?.benefitOptions ?? []
  const highlightOptions = bootstrap?.highlightOptions ?? []

  const benefitTitleMap = useMemo(
    () => new Map(benefitOptions.map((option) => [option.key, option.title])),
    [benefitOptions],
  )
  const highlightTitleMap = useMemo(
    () => new Map(highlightOptions.map((option) => [option.key, option.title])),
    [highlightOptions],
  )

  const groupedBenefitOptions = useMemo(() => {
    const groupedMap = new Map<string, { label: string; options: { label: string; value: string }[] }>()

    benefitOptions.forEach((option) => {
      const groupLabel = option.group === 'shopping' ? '采购权益' : option.group === 'service' ? '服务权益' : '增值权益'
      const existingGroup = groupedMap.get(groupLabel) ?? { label: groupLabel, options: [] }
      existingGroup.options.push({ label: option.title, value: option.key })
      groupedMap.set(groupLabel, existingGroup)
    })

    return [...groupedMap.values()]
  }, [benefitOptions])

  const filteredLevels = useMemo(() => {
    const keyword = appliedFilters.keyword?.trim().toLowerCase()

    return memberLevels.filter((level) => {
      const matchesKeyword = keyword
        ? [
            level.levelKey,
            level.levelName,
            level.levelTitle,
            level.levelDescription,
            level.summaryText,
            level.missionText,
          ].some((field) => field.toLowerCase().includes(keyword))
        : true
      const matchesEnabled = appliedFilters.enabled ? level.enabled === (appliedFilters.enabled === 'enabled') : true

      return matchesKeyword && matchesEnabled
    })
  }, [appliedFilters, memberLevels])

  const columns = useMemo<ConfigurableColumn<MemberLevelConfigRecord>[]>(
    () => [
      { dataIndex: 'levelRank', key: 'levelRank', title: '等级序号', width: 100 },
      { dataIndex: 'levelName', key: 'levelName', title: '等级名称', width: 140 },
      { dataIndex: 'levelKey', key: 'levelKey', title: '等级标识', width: 140 },
      { dataIndex: 'levelTitle', key: 'levelTitle', title: '头图区标题', width: 180 },
      {
        dataIndex: 'benefitKeys',
        key: 'benefitKeys',
        render: (_, record) => (
          <Space size={[4, 4]} wrap>
            {record.benefitKeys.map((key) => (
              <Tag key={key}>{benefitTitleMap.get(key) ?? key}</Tag>
            ))}
          </Space>
        ),
        title: '权益配置',
        width: 280,
      },
      {
        dataIndex: 'highlightKeys',
        key: 'highlightKeys',
        render: (_, record) => (
          <Space size={[4, 4]} wrap>
            {record.highlightKeys.map((key) => (
              <Tag color="blue" key={key}>
                {highlightTitleMap.get(key) ?? key}
              </Tag>
            ))}
          </Space>
        ),
        title: '亮点配置',
        width: 220,
      },
      {
        dataIndex: 'progressPercent',
        key: 'progressPercent',
        render: (_, record) => `${record.progressPercent}%`,
        title: '成长进度',
        width: 100,
      },
      {
        dataIndex: 'enabled',
        key: 'enabled',
        render: (_, record) => <Tag color={record.enabled ? 'green' : 'default'}>{record.enabled ? '启用中' : '已停用'}</Tag>,
        title: '状态',
        width: 100,
      },
      { dataIndex: 'updatedAt', key: 'updatedAt', title: '最近更新', width: 180 },
      {
        hideInSetting: true,
        key: 'actions',
        render: (_, record) => (
          <Space size={12}>
            <Button icon={<EditOutlined />} type="link" onClick={() => openEditDrawer(record)}>
              编辑
            </Button>
            <Popconfirm
              okText="删除"
              okType="danger"
              title="确认删除该会员等级吗？"
              onConfirm={() => void handleDelete(record.id)}
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
    [benefitTitleMap, highlightTitleMap],
  )

  function openCreateDrawer() {
    setEditingRecord(null)
    form.setFieldsValue(defaultMemberLevelFormValues)
    setIsDrawerOpen(true)
  }

  function openEditDrawer(record: MemberLevelConfigRecord) {
    setEditingRecord(record)
    form.setFieldsValue({
      levelKey: record.levelKey,
      levelName: record.levelName,
      levelRank: record.levelRank,
      levelTitle: record.levelTitle,
      levelDescription: record.levelDescription,
      summaryText: record.summaryText,
      progressText: record.progressText,
      missionText: record.missionText,
      missionAction: record.missionAction,
      highlightTitle: record.highlightTitle,
      visualSrc: record.visualSrc,
      heroStart: record.heroStart,
      heroMid: record.heroMid,
      heroEnd: record.heroEnd,
      accent: record.accent,
      softAccent: record.softAccent,
      cardSurface: record.cardSurface,
      placeholderTone: record.placeholderTone,
      glowColor: record.glowColor,
      sparkColor: record.sparkColor,
      progressPercent: record.progressPercent,
      highlightKeys: record.highlightKeys,
      benefitKeys: record.benefitKeys,
      enabled: record.enabled,
    })
    setIsDrawerOpen(true)
  }

  function closeDrawer() {
    setIsDrawerOpen(false)
    setEditingRecord(null)
    form.resetFields()
  }

  function handleReset() {
    searchForm.resetFields()
    setAppliedFilters(defaultSearchValues)
  }

  async function handleFinish(values: MemberLevelUpsertPayload) {
    try {
      if (editingRecord) {
        await updateUserCenterMemberLevel(editingRecord.id, values)
        void message.success('会员等级已更新')
      } else {
        await createUserCenterMemberLevel(values)
        void message.success('会员等级已新增')
      }

      closeDrawer()
      await reload()
    } catch (error) {
      void message.error(error instanceof Error ? error.message : '会员等级保存失败')
    }
  }

  async function handleDelete(levelId: string) {
    try {
      await deleteUserCenterMemberLevel(levelId)
      void message.success('会员等级已删除')
      await reload()
    } catch (error) {
      void message.error(error instanceof Error ? error.message : '会员等级删除失败')
    }
  }

  return (
    <div className="operator-page">
      <Card bordered={false} className="operator-page__card operator-list-shell" loading={isLoading}>
        <Form form={searchForm} initialValues={defaultSearchValues} layout="vertical" onFinish={setAppliedFilters}>
          <div className="operator-list-shell__filters">
            <Row gutter={16}>
              <Col span={16}>
                <Form.Item label="综合搜索" name="keyword">
                  <Input placeholder="等级名称 / 标识 / 标题 / 描述 / 文案" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="等级状态" name="enabled">
                  <Select
                    allowClear
                    options={[
                      { label: '启用中', value: 'enabled' },
                      { label: '已停用', value: 'disabled' },
                    ]}
                    placeholder="请选择等级状态"
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

        <ConfigurableProTable<MemberLevelConfigRecord>
          columns={columns}
          dataSource={filteredLevels}
          headerTitle={false}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          rowKey="id"
          size="middle"
          storageKey="operation-user-center-members-table"
          tableClassName="operator-pro-table"
          toolBarRender={() => [
            <Button icon={<PlusOutlined />} key="create-member-level" onClick={openCreateDrawer} type="primary">
              新增会员等级
            </Button>,
          ]}
        />
      </Card>

      <Drawer
        className="operator-form-drawer"
        destroyOnHidden
        open={isDrawerOpen}
        title={editingRecord ? '编辑会员等级' : '新增会员等级'}
        width={920}
        onClose={closeDrawer}
      >
        <Form form={form} initialValues={defaultMemberLevelFormValues} layout="vertical" onFinish={(values) => void handleFinish(values)}>
          <Typography.Title level={5}>基础信息</Typography.Title>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="等级标识" name="levelKey" rules={[{ required: true, message: '请输入等级标识' }]}>
                <Input placeholder="例如 blackDiamond" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="等级名称" name="levelName" rules={[{ required: true, message: '请输入等级名称' }]}>
                <Input placeholder="例如 黑钻会员" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="等级序号" name="levelRank" rules={[{ required: true, message: '请输入等级序号' }]}>
                <InputNumber min={0} precision={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="头图区标题" name="levelTitle" rules={[{ required: true, message: '请输入头图区标题' }]}>
                <Input placeholder="请输入头图区标题" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="亮点标题" name="highlightTitle" rules={[{ required: true, message: '请输入亮点标题' }]}>
                <Input placeholder="请输入亮点标题" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="等级说明" name="levelDescription" rules={[{ required: true, message: '请输入等级说明' }]}>
                <Input.TextArea placeholder="请输入等级说明" rows={3} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="摘要文案" name="summaryText" rules={[{ required: true, message: '请输入摘要文案' }]}>
                <Input placeholder="请输入摘要文案" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="成长进度文案" name="progressText" rules={[{ required: true, message: '请输入成长进度文案' }]}>
                <Input placeholder="请输入成长进度文案" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="成长进度值" name="progressPercent" rules={[{ required: true, message: '请输入成长进度值' }]}>
                <InputNumber max={100} min={0} precision={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="任务文案" name="missionText" rules={[{ required: true, message: '请输入任务文案' }]}>
                <Input placeholder="请输入任务文案" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="任务按钮文案" name="missionAction" rules={[{ required: true, message: '请输入任务按钮文案' }]}>
                <Input placeholder="请输入任务按钮文案" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="主视觉图片地址" name="visualSrc" rules={[{ required: true, message: '请输入主视觉图片地址' }]}>
                <Input placeholder="例如 /home/member/图片 9.png" />
              </Form.Item>
            </Col>
          </Row>

          <Typography.Title level={5}>视觉配置</Typography.Title>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="起始渐变色" name="heroStart" rules={[{ required: true, message: '请输入起始渐变色' }]}>
                <Input placeholder="例如 #1f1f1f" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="中间渐变色" name="heroMid" rules={[{ required: true, message: '请输入中间渐变色' }]}>
                <Input placeholder="例如 #3a3a3a" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="结束渐变色" name="heroEnd" rules={[{ required: true, message: '请输入结束渐变色' }]}>
                <Input placeholder="例如 #666666" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="主强调色" name="accent" rules={[{ required: true, message: '请输入主强调色' }]}>
                <Input placeholder="例如 #f5c15d" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="柔和强调色" name="softAccent" rules={[{ required: true, message: '请输入柔和强调色' }]}>
                <Input placeholder="例如 rgba(245, 193, 93, 0.24)" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="卡片底色" name="cardSurface" rules={[{ required: true, message: '请输入卡片底色' }]}>
                <Input placeholder="请输入卡片底色" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="占位色" name="placeholderTone" rules={[{ required: true, message: '请输入占位色' }]}>
                <Input placeholder="请输入占位色" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="发光色" name="glowColor" rules={[{ required: true, message: '请输入发光色' }]}>
                <Input placeholder="请输入发光色" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="星点色" name="sparkColor" rules={[{ required: true, message: '请输入星点色' }]}>
                <Input placeholder="请输入星点色" />
              </Form.Item>
            </Col>
          </Row>

          <Typography.Title level={5}>权益配置</Typography.Title>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item label="权益项" name="benefitKeys" rules={[{ required: true, message: '请至少选择一个权益项' }]}>
                <Select
                  mode="multiple"
                  options={groupedBenefitOptions}
                  placeholder="请选择等级对应的权益"
                />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="亮点项" name="highlightKeys" rules={[{ required: true, message: '请至少选择一个亮点项' }]}>
                <Select
                  mode="multiple"
                  options={highlightOptions.map((option) => ({ label: option.title, value: option.key }))}
                  placeholder="请选择会员中心亮点模块"
                />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="启用状态" name="enabled" valuePropName="checked">
                <Switch checkedChildren="启用" unCheckedChildren="停用" />
              </Form.Item>
            </Col>
          </Row>

          <Space className="operator-form-drawer__actions">
            <Button onClick={closeDrawer}>取消</Button>
            <Button htmlType="submit" type="primary">
              保存会员等级
            </Button>
          </Space>
        </Form>
      </Drawer>
    </div>
  )
}
