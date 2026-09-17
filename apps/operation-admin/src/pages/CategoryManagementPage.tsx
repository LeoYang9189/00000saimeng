import { DeleteOutlined, EditOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons'
import { Button, Card, Drawer, Form, Input, Popconfirm, Select, Space, Switch, Table, Tag, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useMemo, useState } from 'react'
import { createProductCategory, deleteProductCategory, updateProductCategory } from '../api'
import { useCatalogBootstrap } from '../hooks/useCatalogBootstrap'
import type { CategoryUpsertPayload, ProductCategoryRecord } from '../types'

const defaultFormValues: CategoryUpsertPayload = {
  parentId: '',
  categoryCode: '',
  categoryName: '',
  enabled: true,
  sortOrder: 10,
}

interface SearchValues {
  enabled?: 'enabled' | 'disabled'
  keyword?: string
}

/**
 * 分类管理页。
 */
export function CategoryManagementPage() {
  const { bootstrap, isLoading, reload } = useCatalogBootstrap()
  const [searchForm] = Form.useForm<SearchValues>()
  const [categoryForm] = Form.useForm<CategoryUpsertPayload>()
  const [appliedFilters, setAppliedFilters] = useState<SearchValues>({})
  const [editingCategory, setEditingCategory] = useState<ProductCategoryRecord | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const categories = bootstrap?.categories ?? []

  const filteredCategories = useMemo(() => {
    const keyword = appliedFilters.keyword?.trim().toLowerCase()
    return categories.filter((category) => {
      const matchesKeyword = keyword
        ? [category.categoryName, category.categoryCode, category.pathNames.join('/')].some((field) =>
            field.toLowerCase().includes(keyword),
          )
        : true
      const matchesEnabled = appliedFilters.enabled
        ? category.enabled === (appliedFilters.enabled === 'enabled')
        : true
      return matchesKeyword && matchesEnabled
    })
  }, [appliedFilters, categories])

  const categoryOptions = useMemo(
    () =>
      categories.map((category) => ({
        label: category.pathNames.join(' / '),
        value: category.id,
      })),
    [categories],
  )

  const tableData = useMemo(() => buildCategoryTree(filteredCategories), [filteredCategories])

  const columns = useMemo<ColumnsType<ProductCategoryRecord>>(
    () => [
      {
        dataIndex: 'categoryName',
        key: 'categoryName',
        render: (_, record) => (
          <Space size={8}>
            <span>{record.categoryName}</span>
            {record.leaf ? <Tag color="green">末级</Tag> : null}
          </Space>
        ),
        title: '分类名称',
        width: 220,
      },
      { dataIndex: 'categoryCode', key: 'categoryCode', title: '分类编码', width: 140 },
      {
        dataIndex: 'pathNames',
        key: 'pathNames',
        render: (_, record) => record.pathNames.join(' / '),
        title: '分类路径',
      },
      { dataIndex: 'categoryLevel', key: 'categoryLevel', title: '层级', width: 100 },
      { dataIndex: 'sortOrder', key: 'sortOrder', title: '排序', width: 100 },
      {
        dataIndex: 'enabled',
        key: 'enabled',
        render: (_, record) => <Tag color={record.enabled ? 'green' : 'default'}>{record.enabled ? '已启用' : '已停用'}</Tag>,
        title: '状态',
        width: 120,
      },
      {
        key: 'actions',
        render: (_, record) => (
          <Space size={12}>
            <Button icon={<EditOutlined />} type="link" onClick={() => openDrawer(record)}>
              编辑
            </Button>
            <Popconfirm
              okText="删除"
              cancelText="取消"
              title="确定删除该分类吗？"
              onConfirm={() => void handleDelete(record.id)}
            >
              <Button danger icon={<DeleteOutlined />} type="link">
                删除
              </Button>
            </Popconfirm>
          </Space>
        ),
        title: '操作',
        width: 160,
      },
    ],
    [],
  )

  function openDrawer(category?: ProductCategoryRecord) {
    setEditingCategory(category ?? null)
    categoryForm.setFieldsValue(
      category
        ? {
            parentId: category.parentId ?? '',
            categoryCode: category.categoryCode,
            categoryName: category.categoryName,
            enabled: category.enabled,
            sortOrder: category.sortOrder,
          }
        : defaultFormValues,
    )
    setIsDrawerOpen(true)
  }

  async function handleDelete(categoryId: string) {
    try {
      await deleteProductCategory(categoryId)
      void message.success('分类已删除')
      await reload()
    } catch (error) {
      void message.error(error instanceof Error ? error.message : '分类删除失败')
    }
  }

  async function handleFinish(values: CategoryUpsertPayload) {
    try {
      if (editingCategory) {
        await updateProductCategory(editingCategory.id, values)
      } else {
        await createProductCategory(values)
      }
      void message.success(editingCategory ? '分类已更新' : '分类已创建')
      setIsDrawerOpen(false)
      categoryForm.resetFields()
      await reload()
    } catch (error) {
      void message.error(error instanceof Error ? error.message : '分类保存失败')
    }
  }

  return (
    <div className="operator-page">
      <Card bordered={false} className="operator-page__card operator-list-shell" loading={isLoading}>
        <Form form={searchForm} layout="vertical" onFinish={setAppliedFilters}>
          <div className="operator-list-shell__filters">
            <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '2fr 1fr' }}>
              <Form.Item label="关键词" name="keyword">
                <Input placeholder="分类名称 / 编码 / 路径" />
              </Form.Item>
              <Form.Item label="状态" name="enabled">
                <Select
                  allowClear
                  options={[
                    { label: '已启用', value: 'enabled' },
                    { label: '已停用', value: 'disabled' },
                  ]}
                  placeholder="请选择状态"
                />
              </Form.Item>
            </div>
            <div className="operator-list-shell__filter-actions">
              <Space size={12}>
                <Button htmlType="submit" icon={<SearchOutlined />} type="primary">
                  查询
                </Button>
                <Button
                  onClick={() => {
                    searchForm.resetFields()
                    setAppliedFilters({})
                  }}
                >
                  重置
                </Button>
              </Space>
            </div>
          </div>
        </Form>

        <Table<ProductCategoryRecord>
          columns={columns}
          dataSource={tableData}
          pagination={false}
          rowKey="id"
          size="middle"
          expandable={{ defaultExpandAllRows: true }}
          title={() => (
            <Space style={{ justifyContent: 'space-between', width: '100%' }}>
              <span>分类列表</span>
              <Button icon={<PlusOutlined />} onClick={() => openDrawer()} type="primary">
                新增分类
              </Button>
            </Space>
          )}
        />
      </Card>

      <Drawer
        destroyOnHidden
        onClose={() => setIsDrawerOpen(false)}
        open={isDrawerOpen}
        title={editingCategory ? '编辑分类' : '新增分类'}
        width={480}
      >
        <Form form={categoryForm} initialValues={defaultFormValues} layout="vertical" onFinish={(values) => void handleFinish(values)}>
          <Form.Item label="上级分类" name="parentId">
            <Select allowClear options={categoryOptions.filter((item) => item.value !== editingCategory?.id)} placeholder="不选则为一级分类" />
          </Form.Item>
          <Form.Item label="分类名称" name="categoryName" rules={[{ required: true, message: '请输入分类名称' }]}>
            <Input placeholder="请输入分类名称" />
          </Form.Item>
          <Form.Item label="分类编码" name="categoryCode" rules={[{ required: true, message: '请输入分类编码' }]}>
            <Input placeholder="请输入分类编码" />
          </Form.Item>
          <Form.Item label="排序值" name="sortOrder" rules={[{ required: true, message: '请输入排序值' }]}>
            <Input type="number" />
          </Form.Item>
          <Form.Item label="启用状态" name="enabled" valuePropName="checked">
            <Switch checkedChildren="启用" unCheckedChildren="停用" />
          </Form.Item>
          <Space>
            <Button onClick={() => setIsDrawerOpen(false)}>取消</Button>
            <Button htmlType="submit" type="primary">
              保存分类
            </Button>
          </Space>
        </Form>
      </Drawer>
    </div>
  )
}

function buildCategoryTree(categories: ProductCategoryRecord[]) {
  const nodeMap = new Map<string, ProductCategoryRecord & { children?: ProductCategoryRecord[] }>()
  categories.forEach((category) => nodeMap.set(category.id, { ...category }))

  const tree: (ProductCategoryRecord & { children?: ProductCategoryRecord[] })[] = []
  nodeMap.forEach((category) => {
    if (category.parentId && nodeMap.has(category.parentId)) {
      const parent = nodeMap.get(category.parentId)
      parent?.children?.push(category) ?? (parent!.children = [category])
      return
    }
    tree.push(category)
  })

  return tree.sort((left, right) => left.sortOrder - right.sortOrder)
}
