import { DeleteOutlined, DownloadOutlined, EyeOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons'
import { Button, Card, Form, Input, Popconfirm, Space, Table, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { deleteQuotation, exportQuotationExcel } from '../api'
import { useQuotationBootstrap } from '../hooks/useQuotationBootstrap'
import type { QuotationRecord } from '../types'

interface SearchValues {
  keyword?: string
}

/**
 * 报价单管理页。
 */
export function QuotationManagementPage() {
  const navigate = useNavigate()
  const { bootstrap, isLoading, reload } = useQuotationBootstrap()
  const [searchForm] = Form.useForm<SearchValues>()
  const [appliedFilters, setAppliedFilters] = useState<SearchValues>({})

  const quotations = bootstrap?.quotations ?? []

  const filteredQuotations = useMemo(() => {
    const keyword = appliedFilters.keyword?.trim().toLowerCase()
    return quotations.filter((quotation) =>
      keyword
        ? [
            quotation.quotationNo,
            quotation.quotationTitle,
            quotation.customerCompany,
            quotation.customerName,
            quotation.contactName,
          ].some((field) => field.toLowerCase().includes(keyword))
        : true,
    )
  }, [appliedFilters.keyword, quotations])

  const columns = useMemo<ColumnsType<QuotationRecord>>(
    () => [
      { dataIndex: 'quotationNo', key: 'quotationNo', title: '报价单编号', width: 180 },
      { dataIndex: 'quotationTitle', key: 'quotationTitle', title: '报价单标题', width: 220 },
      { dataIndex: 'customerCompany', key: 'customerCompany', title: '客户公司', width: 220 },
      { dataIndex: 'customerName', key: 'customerName', title: '客户名称', width: 140 },
      { dataIndex: 'contactName', key: 'contactName', title: '联系人', width: 140 },
      { dataIndex: 'totalProductCount', key: 'totalProductCount', title: '商品数', width: 100 },
      { dataIndex: 'totalQuantity', key: 'totalQuantity', title: '总数量', width: 100 },
      { dataIndex: 'lastExportedAt', key: 'lastExportedAt', render: (value: string | null) => value || '-', title: '最近导出', width: 180 },
      { dataIndex: 'updatedAt', key: 'updatedAt', title: '最近更新', width: 180 },
      {
        key: 'actions',
        render: (_, record) => (
          <Space size={12}>
            <Button icon={<EyeOutlined />} type="link" onClick={() => navigate(`/admin/marketing/quotations/${record.id}?mode=view`)}>
              查看
            </Button>
            <Button type="link" onClick={() => navigate(`/admin/marketing/quotations/${record.id}?mode=edit`)}>
              编辑
            </Button>
            <Button icon={<DownloadOutlined />} type="link" onClick={() => void handleExport(record)}>
              导出
            </Button>
            <Popconfirm
              okText="删除"
              cancelText="取消"
              title="确定删除该报价单吗？"
              onConfirm={() => void handleDelete(record.id)}
            >
              <Button danger icon={<DeleteOutlined />} type="link">
                删除
              </Button>
            </Popconfirm>
          </Space>
        ),
        title: '操作',
        width: 260,
      },
    ],
    [navigate],
  )

  async function handleDelete(quotationId: string) {
    try {
      await deleteQuotation(quotationId)
      void message.success('报价单已删除')
      await reload()
    } catch (error) {
      void message.error(error instanceof Error ? error.message : '报价单删除失败')
    }
  }

  async function handleExport(record: QuotationRecord) {
    try {
      const blob = await exportQuotationExcel(record.id)
      downloadBlob(blob, `${record.quotationNo}.xlsx`)
    } catch (error) {
      void message.error(error instanceof Error ? error.message : '报价单导出失败')
    }
  }

  return (
    <div className="operator-page">
      <Card bordered={false} className="operator-page__card operator-list-shell" loading={isLoading}>
        <Form form={searchForm} layout="vertical" onFinish={setAppliedFilters}>
          <div className="operator-list-shell__filters">
            <Form.Item label="关键词" name="keyword">
              <Input placeholder="报价单编号 / 标题 / 客户公司 / 联系人" />
            </Form.Item>
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

        <Table<QuotationRecord>
          columns={columns}
          dataSource={filteredQuotations}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          rowKey="id"
          size="middle"
          title={() => (
            <Space style={{ justifyContent: 'space-between', width: '100%' }}>
              <span>历史报价单</span>
              <Button icon={<PlusOutlined />} onClick={() => navigate('/admin/marketing/quotations/new')} type="primary">
                新建报价单
              </Button>
            </Space>
          )}
        />
      </Card>
    </div>
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
