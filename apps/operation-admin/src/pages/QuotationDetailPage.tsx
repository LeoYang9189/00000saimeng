import { ArrowLeftOutlined, DeleteOutlined, DownloadOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, Card, Form, Input, InputNumber, Modal, Space, Table, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { createQuotation, exportQuotationExcel, updateQuotation } from '../api'
import { useQuotationBootstrap } from '../hooks/useQuotationBootstrap'
import type { CatalogProductRecord, QuotationUpsertPayload } from '../types'

const defaultQuotationValues: QuotationUpsertPayload = {
  quotationTitle: '',
  customerCompany: '',
  customerName: '',
  contactName: '',
  contactPhone: '',
  remark: '',
  items: [],
}

interface QuotationDetailPageProps {
  isCreateMode?: boolean
}

/**
 * 报价单详情页。
 */
export function QuotationDetailPage({ isCreateMode = false }: QuotationDetailPageProps) {
  const navigate = useNavigate()
  const { quotationId } = useParams()
  const [searchParams] = useSearchParams()
  const { bootstrap, isLoading, reload } = useQuotationBootstrap()
  const [form] = Form.useForm<QuotationUpsertPayload>()
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)

  const pageMode = isCreateMode ? 'create' : searchParams.get('mode') === 'view' ? 'view' : 'edit'
  const isViewMode = pageMode === 'view'
  const quotation = useMemo(
    () => (isCreateMode ? null : (bootstrap?.quotations ?? []).find((item) => item.id === quotationId) ?? null),
    [bootstrap?.quotations, isCreateMode, quotationId],
  )

  useEffect(() => {
    if (quotation) {
      form.setFieldsValue({
        quotationTitle: quotation.quotationTitle,
        customerCompany: quotation.customerCompany,
        customerName: quotation.customerName,
        contactName: quotation.contactName,
        contactPhone: quotation.contactPhone,
        remark: quotation.remark,
        items: quotation.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      })
      return
    }
    if (isCreateMode) {
      form.setFieldsValue(defaultQuotationValues)
    }
  }, [form, isCreateMode, quotation])

  const selectedItems = Form.useWatch('items', form) ?? []
  const selectedProducts = useMemo(() => {
    const productMap = new Map((bootstrap?.products ?? []).map((product) => [product.id, product]))
    return selectedItems.map((item) => ({
      product: productMap.get(item.productId),
      productId: item.productId,
      quantity: item.quantity,
    }))
  }, [bootstrap?.products, selectedItems])

  const availableProducts = useMemo(() => {
    const selectedIds = new Set(selectedItems.map((item) => item.productId))
    return (bootstrap?.products ?? []).filter((product) => !selectedIds.has(product.id))
  }, [bootstrap?.products, selectedItems])

  async function handleFinish(values: QuotationUpsertPayload) {
    try {
      if (isCreateMode) {
        await createQuotation(values)
      } else if (quotation) {
        await updateQuotation(quotation.id, values)
      }
      void message.success(isCreateMode ? '报价单已创建' : '报价单已更新')
      await reload()
      navigate('/admin/marketing/quotations')
    } catch (error) {
      void message.error(error instanceof Error ? error.message : '报价单保存失败')
    }
  }

  async function handleExport() {
    if (!quotation) {
      return
    }
    try {
      const blob = await exportQuotationExcel(quotation.id)
      downloadBlob(blob, `${quotation.quotationNo}.xlsx`)
    } catch (error) {
      void message.error(error instanceof Error ? error.message : '报价单导出失败')
    }
  }

  if (!isCreateMode && !isLoading && !quotation) {
    return (
      <div className="operator-page">
        <Card bordered={false} className="operator-page__card">
          未找到对应报价单
        </Card>
      </div>
    )
  }

  return (
    <div className="operator-page">
      <Card bordered={false} className="operator-page__card" loading={isLoading}>
        <Form form={form} initialValues={defaultQuotationValues} layout="vertical" onFinish={(values) => void handleFinish(values)}>
          <Space direction="vertical" size={20} style={{ width: '100%' }}>
            <Space align="center" style={{ justifyContent: 'space-between', width: '100%' }}>
              <Space>
                <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/admin/marketing/quotations')}>
                  返回报价单管理
                </Button>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 600 }}>{isCreateMode ? '新建报价单' : quotation?.quotationTitle ?? '报价单详情'}</div>
                  <div style={{ color: '#6b7280', marginTop: 4 }}>
                    选择商品与数量后保存，导出时按指定 Excel 模板生成报价单。
                  </div>
                </div>
              </Space>
              {!isCreateMode ? (
                <Button icon={<DownloadOutlined />} onClick={() => void handleExport()}>
                  导出 Excel
                </Button>
              ) : null}
            </Space>

            <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
              <Form.Item label="报价单标题" name="quotationTitle" rules={[{ required: true, message: '请输入报价单标题' }]}>
                <Input disabled={isViewMode} />
              </Form.Item>
              <Form.Item label="客户公司" name="customerCompany" rules={[{ required: true, message: '请输入客户公司' }]}>
                <Input disabled={isViewMode} />
              </Form.Item>
              <Form.Item label="客户名称" name="customerName" rules={[{ required: true, message: '请输入客户名称' }]}>
                <Input disabled={isViewMode} />
              </Form.Item>
              <Form.Item label="联系人" name="contactName" rules={[{ required: true, message: '请输入联系人' }]}>
                <Input disabled={isViewMode} />
              </Form.Item>
              <Form.Item label="联系电话" name="contactPhone" rules={[{ required: true, message: '请输入联系电话' }]}>
                <Input disabled={isViewMode} />
              </Form.Item>
              <Form.Item label="备注" name="remark">
                <Input disabled={isViewMode} />
              </Form.Item>
            </div>

            <Table
              columns={buildSelectedColumns(form, isViewMode)}
              dataSource={selectedProducts}
              pagination={false}
              rowKey="productId"
              size="middle"
              title={() => (
                <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                  <span>报价商品</span>
                  {!isViewMode ? (
                    <Button icon={<PlusOutlined />} onClick={() => setIsProductModalOpen(true)} type="primary">
                      选择商品
                    </Button>
                  ) : null}
                </Space>
              )}
            />

            {!isViewMode ? (
              <Space>
                <Button onClick={() => navigate('/admin/marketing/quotations')}>取消</Button>
                <Button htmlType="submit" type="primary">
                  保存报价单
                </Button>
              </Space>
            ) : null}
          </Space>
        </Form>
      </Card>

      <ProductSelectModal
        open={isProductModalOpen}
        products={availableProducts}
        onCancel={() => setIsProductModalOpen(false)}
        onSelect={(product) => {
          form.setFieldValue('items', [...selectedItems, { productId: product.id, quantity: 1 }])
          setIsProductModalOpen(false)
        }}
      />
    </div>
  )
}

function buildSelectedColumns(form: ReturnType<typeof Form.useForm<QuotationUpsertPayload>>[0], isViewMode: boolean): ColumnsType<{ product?: CatalogProductRecord; productId: string; quantity: number }> {
  return [
    { dataIndex: ['product', 'productName'], key: 'productName', title: '商品名称', width: 220 },
    { dataIndex: ['product', 'productCode'], key: 'productCode', title: '商品编码', width: 140 },
    { dataIndex: ['product', 'categoryName'], key: 'categoryName', title: '分类', width: 120 },
    { dataIndex: ['product', 'brandName'], key: 'brandName', title: '品牌', width: 120 },
    {
      dataIndex: 'quantity',
      key: 'quantity',
      render: (_, record) =>
        isViewMode ? (
          record.quantity
        ) : (
          <InputNumber
            min={1}
            value={record.quantity}
            onChange={(value) => {
              const items = [...(form.getFieldValue('items') ?? [])]
              const index = items.findIndex((item) => item.productId === record.productId)
              if (index >= 0) {
                items[index].quantity = Number(value ?? 1)
                form.setFieldValue('items', items)
              }
            }}
          />
        ),
      title: '数量',
      width: 120,
    },
    {
      dataIndex: ['product', 'retailPrice'],
      key: 'retailPrice',
      render: (_, record) => (record.product ? `¥ ${record.product.retailPrice.toFixed(2)}` : '-'),
      title: '零售价',
      width: 120,
    },
    {
      key: 'actions',
      render: (_, record) =>
        isViewMode ? null : (
          <Button
            danger
            icon={<DeleteOutlined />}
            type="link"
            onClick={() => {
              form.setFieldValue(
                'items',
                ((form.getFieldValue('items') ?? []) as QuotationUpsertPayload['items']).filter(
                  (item) => item.productId !== record.productId,
                ),
              )
            }}
          >
            移除
          </Button>
        ),
      title: '操作',
      width: 120,
    },
  ]
}

function ProductSelectModal({
  open,
  products,
  onCancel,
  onSelect,
}: {
  open: boolean
  products: CatalogProductRecord[]
  onCancel: () => void
  onSelect: (product: CatalogProductRecord) => void
}) {
  return (
    <Modal footer={null} onCancel={onCancel} open={open} title="选择加入报价单的商品" width={960}>
      <Table<CatalogProductRecord>
        columns={[
          { dataIndex: 'productName', key: 'productName', title: '商品名称', width: 220 },
          { dataIndex: 'productCode', key: 'productCode', title: '商品编码', width: 140 },
          { dataIndex: 'categoryName', key: 'categoryName', title: '分类', width: 120 },
          { dataIndex: 'brandName', key: 'brandName', title: '品牌', width: 120 },
          { dataIndex: 'originCountry', key: 'originCountry', title: '原产国', width: 120 },
          { dataIndex: 'retailPrice', key: 'retailPrice', render: (value: number) => `¥ ${value.toFixed(2)}`, title: '零售价', width: 120 },
          {
            key: 'actions',
            render: (_, record) => (
              <Button type="link" onClick={() => onSelect(record)}>
                加入报价单
              </Button>
            ),
            title: '操作',
            width: 120,
          },
        ]}
        dataSource={products}
        pagination={{ pageSize: 6 }}
        rowKey="id"
      />
    </Modal>
  )
}

function downloadBlob(blob: Blob, fileName: string) {
  const objectUrl = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = objectUrl
  link.download = fileName
  link.click()
  window.URL.revokeObjectURL(objectUrl)
}
