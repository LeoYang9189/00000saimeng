import { DeleteOutlined, EyeOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons'
import { Button, Card, Form, Image, Input, Popconfirm, Select, Space, Table, Tag, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { deleteCatalogProduct } from '../api'
import { useCatalogBootstrap } from '../hooks/useCatalogBootstrap'
import type { CatalogProductRecord } from '../types'

interface SearchValues {
  enabled?: 'enabled' | 'disabled'
  categoryId?: string
  keyword?: string
}

/**
 * 商品中心页。
 */
export function ProductCenterPage() {
  const navigate = useNavigate()
  const { bootstrap, isLoading, reload } = useCatalogBootstrap()
  const [searchForm] = Form.useForm<SearchValues>()
  const [appliedFilters, setAppliedFilters] = useState<SearchValues>({})

  const products = bootstrap?.products ?? []
  const categories = bootstrap?.categories ?? []

  const filteredProducts = useMemo(() => {
    const keyword = appliedFilters.keyword?.trim().toLowerCase()
    return products.filter((product) => {
      const matchesKeyword = keyword
        ? [
            product.productName,
            product.productCode,
            product.brandName,
            product.categoryName,
            product.originCountry,
          ].some((field) => field.toLowerCase().includes(keyword))
        : true
      const matchesCategory = appliedFilters.categoryId ? product.categoryId === appliedFilters.categoryId : true
      const matchesEnabled = appliedFilters.enabled ? product.enabled === (appliedFilters.enabled === 'enabled') : true
      return matchesKeyword && matchesCategory && matchesEnabled
    })
  }, [appliedFilters, products])

  const categoryOptions = useMemo(
    () =>
      categories
        .filter((category) => category.leaf)
        .map((category) => ({ label: category.pathNames.join(' / '), value: category.id })),
    [categories],
  )

  const columns = useMemo<ColumnsType<CatalogProductRecord>>(
    () => [
      {
        dataIndex: 'mainImage',
        key: 'mainImage',
        render: (_, record) => (record.mainImage ? <Image height={48} preview={false} src={record.mainImage} width={48} /> : <div style={{ width: 48, height: 48, background: '#f3f4f6' }} />),
        title: '主图',
        width: 88,
      },
      { dataIndex: 'productName', key: 'productName', title: '商品名称', width: 220 },
      { dataIndex: 'productCode', key: 'productCode', title: '商品编码', width: 140 },
      { dataIndex: 'categoryName', key: 'categoryName', title: '分类', width: 140 },
      { dataIndex: 'brandName', key: 'brandName', title: '品牌', width: 140 },
      { dataIndex: 'originCountry', key: 'originCountry', title: '原产国', width: 120 },
      {
        dataIndex: 'stockQuantity',
        key: 'stockQuantity',
        title: '库存',
        width: 100,
      },
      {
        dataIndex: 'retailPrice',
        key: 'retailPrice',
        render: (_, record) => `¥ ${record.retailPrice.toFixed(2)}`,
        title: '零售价',
        width: 120,
      },
      {
        dataIndex: 'enabled',
        key: 'enabled',
        render: (_, record) => <Tag color={record.enabled ? 'green' : 'default'}>{record.enabled ? '已启用' : '已停用'}</Tag>,
        title: '状态',
        width: 120,
      },
      { dataIndex: 'updatedAt', key: 'updatedAt', title: '最近更新', width: 180 },
      {
        key: 'actions',
        render: (_, record) => (
          <Space size={12}>
            <Button icon={<EyeOutlined />} type="link" onClick={() => navigate(`/admin/products/${record.id}?mode=view`)}>
              查看
            </Button>
            <Button type="link" onClick={() => navigate(`/admin/products/${record.id}?mode=edit`)}>
              编辑
            </Button>
            <Popconfirm
              okText="删除"
              cancelText="取消"
              title="确定删除该商品吗？"
              onConfirm={() => void handleDelete(record.id)}
            >
              <Button danger icon={<DeleteOutlined />} type="link">
                删除
              </Button>
            </Popconfirm>
          </Space>
        ),
        title: '操作',
        width: 200,
      },
    ],
    [navigate],
  )

  async function handleDelete(productId: string) {
    try {
      await deleteCatalogProduct(productId)
      void message.success('商品已删除')
      await reload()
    } catch (error) {
      void message.error(error instanceof Error ? error.message : '商品删除失败')
    }
  }

  return (
    <div className="operator-page">
      <Card bordered={false} className="operator-page__card operator-list-shell" loading={isLoading}>
        <Form form={searchForm} layout="vertical" onFinish={setAppliedFilters}>
          <div className="operator-list-shell__filters">
            <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '2fr 1fr 1fr' }}>
              <Form.Item label="关键词" name="keyword">
                <Input placeholder="商品名称 / 编码 / 品牌" />
              </Form.Item>
              <Form.Item label="分类" name="categoryId">
                <Select allowClear options={categoryOptions} placeholder="请选择分类" showSearch optionFilterProp="label" />
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

        <Table<CatalogProductRecord>
          columns={columns}
          dataSource={filteredProducts}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          rowKey="id"
          size="middle"
          title={() => (
            <Space style={{ justifyContent: 'space-between', width: '100%' }}>
              <span>商品列表</span>
              <Button icon={<PlusOutlined />} onClick={() => navigate('/admin/products/new')} type="primary">
                新增商品
              </Button>
            </Space>
          )}
        />
      </Card>
    </div>
  )
}
