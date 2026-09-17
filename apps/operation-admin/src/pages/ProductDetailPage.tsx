import { ArrowLeftOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, Card, Empty, Form, Input, InputNumber, Select, Space, Switch, Tabs, Upload, message } from 'antd'
import type { UploadFile, UploadProps } from 'antd'
import { useEffect, useMemo } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { createCatalogProduct, updateCatalogProduct } from '../api'
import { SimpleRichTextEditor } from '../components/SimpleRichTextEditor'
import { useCatalogBootstrap } from '../hooks/useCatalogBootstrap'
import type { CatalogProductRecord, ProductUpsertPayload } from '../types'

const defaultProductValues: ProductUpsertPayload = {
  productName: '',
  productCode: '',
  categoryId: '',
  brandName: '',
  originCountry: '',
  sellingPoint: '',
  mainImage: '',
  thumbnailImage: '',
  boxImage: '',
  galleryImages: [],
  barcode: '',
  netContent: '',
  caseSpec: '',
  palletsPerContainer: 0,
  casesPerPallet: 0,
  casesPerContainer: 0,
  shelfLifeMonths: 0,
  sizeCm: '',
  grossWeightKg: '',
  ingredients: '',
  stockQuantity: 0,
  memberPriceBronze: 0,
  memberPriceSilver: 0,
  memberPriceGold: 0,
  memberPricePlatinum: 0,
  memberPriceDiamond: 0,
  memberPriceBlackDiamond: 0,
  retailPrice: 0,
  detailHtml: '',
  enabled: true,
}

interface ProductDetailPageProps {
  isCreateMode?: boolean
}

/**
 * 商品维护详情页。
 */
export function ProductDetailPage({ isCreateMode = false }: ProductDetailPageProps) {
  const navigate = useNavigate()
  const { productId } = useParams()
  const [searchParams] = useSearchParams()
  const { bootstrap, isLoading, reload } = useCatalogBootstrap()
  const [form] = Form.useForm<ProductUpsertPayload>()

  const pageMode = isCreateMode ? 'create' : searchParams.get('mode') === 'view' ? 'view' : 'edit'
  const isViewMode = pageMode === 'view'
  const product = useMemo(
    () => (isCreateMode ? null : (bootstrap?.products ?? []).find((item) => item.id === productId) ?? null),
    [bootstrap?.products, isCreateMode, productId],
  )
  const categoryOptions = useMemo(
    () =>
      (bootstrap?.categories ?? [])
        .filter((category) => category.leaf)
        .map((category) => ({
          label: category.pathNames.join(' / '),
          value: category.id,
        })),
    [bootstrap?.categories],
  )

  useEffect(() => {
    if (product) {
      form.setFieldsValue(toProductPayload(product))
      return
    }
    if (isCreateMode) {
      form.setFieldsValue(defaultProductValues)
    }
  }, [form, isCreateMode, product])

  async function handleFinish(values: ProductUpsertPayload) {
    try {
      if (isCreateMode) {
        await createCatalogProduct(values)
      } else if (product) {
        await updateCatalogProduct(product.id, values)
      }
      void message.success(isCreateMode ? '商品已创建' : '商品已更新')
      await reload()
      navigate('/admin/products')
    } catch (error) {
      void message.error(error instanceof Error ? error.message : '商品保存失败')
    }
  }

  if (!isCreateMode && !isLoading && !product) {
    return (
      <div className="operator-page">
        <Card bordered={false} className="operator-page__card">
          <Empty description="未找到对应商品" />
        </Card>
      </div>
    )
  }

  return (
    <div className="operator-page">
      <Card bordered={false} className="operator-page__card" loading={isLoading}>
        <Form form={form} initialValues={defaultProductValues} layout="vertical" onFinish={(values) => void handleFinish(values)}>
          <Space direction="vertical" size={20} style={{ width: '100%' }}>
            <Space align="center" style={{ justifyContent: 'space-between', width: '100%' }}>
              <Space>
                <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/admin/products')}>
                  返回商品中心
                </Button>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 600 }}>{isCreateMode ? '新增商品' : product?.productName ?? '商品详情'}</div>
                  <div style={{ color: '#6b7280', marginTop: 4 }}>
                    参考电商后台商品维护方式，集中维护类目、图片、价格、规格和详情描述。
                  </div>
                </div>
              </Space>
            </Space>

            <Tabs
              items={[
                {
                  key: 'basic',
                  label: '基本信息',
                  children: (
                    <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
                      <Form.Item label="商品名称" name="productName" rules={[{ required: true, message: '请输入商品名称' }]}>
                        <Input disabled={isViewMode} />
                      </Form.Item>
                      <Form.Item label="商品编码" name="productCode" rules={[{ required: true, message: '请输入商品编码' }]}>
                        <Input disabled={isViewMode} />
                      </Form.Item>
                      <Form.Item label="所属分类" name="categoryId" rules={[{ required: true, message: '请选择末级分类' }]}>
                        <Select disabled={isViewMode} options={categoryOptions} placeholder="请选择末级分类" showSearch optionFilterProp="label" />
                      </Form.Item>
                      <Form.Item label="品牌名称" name="brandName" rules={[{ required: true, message: '请输入品牌名称' }]}>
                        <Input disabled={isViewMode} />
                      </Form.Item>
                      <Form.Item label="原产国" name="originCountry" rules={[{ required: true, message: '请输入原产国' }]}>
                        <Input disabled={isViewMode} />
                      </Form.Item>
                      <Form.Item label="商品卖点" name="sellingPoint" rules={[{ required: true, message: '请输入商品卖点' }]}>
                        <Input disabled={isViewMode} />
                      </Form.Item>
                      <Form.Item label="启用状态" name="enabled" valuePropName="checked">
                        <Switch checkedChildren="启用" disabled={isViewMode} unCheckedChildren="停用" />
                      </Form.Item>
                    </div>
                  ),
                },
                {
                  key: 'media',
                  label: '图文素材',
                  children: (
                    <Space direction="vertical" size={16} style={{ width: '100%' }}>
                      <ImageUploadField disabled={isViewMode} form={form} label="主图" name="mainImage" />
                      <ImageUploadField disabled={isViewMode} form={form} label="缩略图" name="thumbnailImage" />
                      <ImageUploadField disabled={isViewMode} form={form} label="箱装图" name="boxImage" />
                      <GalleryUploadField disabled={isViewMode} form={form} label="多图说明" name="galleryImages" />
                    </Space>
                  ),
                },
                {
                  key: 'pricing',
                  label: '价格库存',
                  children: (
                    <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
                      <Form.Item label="库存" name="stockQuantity" rules={[{ required: true, message: '请输入库存' }]}>
                        <InputNumber disabled={isViewMode} min={0} style={{ width: '100%' }} />
                      </Form.Item>
                      <Form.Item label="零售价" name="retailPrice" rules={[{ required: true, message: '请输入零售价' }]}>
                        <InputNumber disabled={isViewMode} min={0} precision={2} style={{ width: '100%' }} />
                      </Form.Item>
                      <Form.Item label="会员价-青铜" name="memberPriceBronze" rules={[{ required: true, message: '请输入青铜价' }]}>
                        <InputNumber disabled={isViewMode} min={0} precision={2} style={{ width: '100%' }} />
                      </Form.Item>
                      <Form.Item label="会员价-白银" name="memberPriceSilver" rules={[{ required: true, message: '请输入白银价' }]}>
                        <InputNumber disabled={isViewMode} min={0} precision={2} style={{ width: '100%' }} />
                      </Form.Item>
                      <Form.Item label="会员价-黄金" name="memberPriceGold" rules={[{ required: true, message: '请输入黄金价' }]}>
                        <InputNumber disabled={isViewMode} min={0} precision={2} style={{ width: '100%' }} />
                      </Form.Item>
                      <Form.Item label="会员价-铂金" name="memberPricePlatinum" rules={[{ required: true, message: '请输入铂金价' }]}>
                        <InputNumber disabled={isViewMode} min={0} precision={2} style={{ width: '100%' }} />
                      </Form.Item>
                      <Form.Item label="会员价-钻石" name="memberPriceDiamond" rules={[{ required: true, message: '请输入钻石价' }]}>
                        <InputNumber disabled={isViewMode} min={0} precision={2} style={{ width: '100%' }} />
                      </Form.Item>
                      <Form.Item label="会员价-黑钻" name="memberPriceBlackDiamond" rules={[{ required: true, message: '请输入黑钻价' }]}>
                        <InputNumber disabled={isViewMode} min={0} precision={2} style={{ width: '100%' }} />
                      </Form.Item>
                    </div>
                  ),
                },
                {
                  key: 'spec',
                  label: '规格参数',
                  children: (
                    <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
                      <Form.Item label="条形码" name="barcode" rules={[{ required: true, message: '请输入条形码' }]}>
                        <Input disabled={isViewMode} />
                      </Form.Item>
                      <Form.Item label="净含量" name="netContent" rules={[{ required: true, message: '请输入净含量' }]}>
                        <Input disabled={isViewMode} />
                      </Form.Item>
                      <Form.Item label="箱规" name="caseSpec" rules={[{ required: true, message: '请输入箱规' }]}>
                        <Input disabled={isViewMode} />
                      </Form.Item>
                      <Form.Item label="每柜托数" name="palletsPerContainer" rules={[{ required: true, message: '请输入每柜托数' }]}>
                        <InputNumber disabled={isViewMode} min={0} style={{ width: '100%' }} />
                      </Form.Item>
                      <Form.Item label="每托箱数" name="casesPerPallet" rules={[{ required: true, message: '请输入每托箱数' }]}>
                        <InputNumber disabled={isViewMode} min={0} style={{ width: '100%' }} />
                      </Form.Item>
                      <Form.Item label="每柜箱数" name="casesPerContainer" rules={[{ required: true, message: '请输入每柜箱数' }]}>
                        <InputNumber disabled={isViewMode} min={0} style={{ width: '100%' }} />
                      </Form.Item>
                      <Form.Item label="保质期(月)" name="shelfLifeMonths" rules={[{ required: true, message: '请输入保质期' }]}>
                        <InputNumber disabled={isViewMode} min={0} style={{ width: '100%' }} />
                      </Form.Item>
                      <Form.Item label="尺寸(cm)" name="sizeCm" rules={[{ required: true, message: '请输入尺寸' }]}>
                        <Input disabled={isViewMode} />
                      </Form.Item>
                      <Form.Item label="毛重(kg)" name="grossWeightKg" rules={[{ required: true, message: '请输入毛重' }]}>
                        <Input disabled={isViewMode} />
                      </Form.Item>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <Form.Item label="配料" name="ingredients" rules={[{ required: true, message: '请输入配料' }]}>
                          <Input.TextArea disabled={isViewMode} rows={4} />
                        </Form.Item>
                      </div>
                    </div>
                  ),
                },
                {
                  key: 'detail',
                  label: '详情描述',
                  children: (
                    <Form.Item label="富文本详情" name="detailHtml">
                      <SimpleRichTextEditor />
                    </Form.Item>
                  ),
                },
              ]}
            />

            {!isViewMode ? (
              <Space>
                <Button onClick={() => navigate('/admin/products')}>取消</Button>
                <Button htmlType="submit" type="primary">
                  保存商品
                </Button>
              </Space>
            ) : null}
          </Space>
        </Form>
      </Card>
    </div>
  )
}

function toProductPayload(product: CatalogProductRecord): ProductUpsertPayload {
  return {
    productName: product.productName,
    productCode: product.productCode,
    categoryId: product.categoryId ?? '',
    brandName: product.brandName,
    originCountry: product.originCountry,
    sellingPoint: product.sellingPoint,
    mainImage: product.mainImage,
    thumbnailImage: product.thumbnailImage,
    boxImage: product.boxImage,
    galleryImages: product.galleryImages,
    barcode: product.barcode,
    netContent: product.netContent,
    caseSpec: product.caseSpec,
    palletsPerContainer: product.palletsPerContainer ?? 0,
    casesPerPallet: product.casesPerPallet ?? 0,
    casesPerContainer: product.casesPerContainer ?? 0,
    shelfLifeMonths: product.shelfLifeMonths ?? 0,
    sizeCm: product.sizeCm,
    grossWeightKg: product.grossWeightKg,
    ingredients: product.ingredients,
    stockQuantity: product.stockQuantity,
    memberPriceBronze: product.memberPriceBronze,
    memberPriceSilver: product.memberPriceSilver,
    memberPriceGold: product.memberPriceGold,
    memberPricePlatinum: product.memberPricePlatinum,
    memberPriceDiamond: product.memberPriceDiamond,
    memberPriceBlackDiamond: product.memberPriceBlackDiamond,
    retailPrice: product.retailPrice,
    detailHtml: product.detailHtml,
    enabled: product.enabled,
  }
}

function ImageUploadField({
  form,
  label,
  name,
  disabled,
}: {
  form: ReturnType<typeof Form.useForm<ProductUpsertPayload>>[0]
  label: string
  name: keyof ProductUpsertPayload
  disabled: boolean
}) {
  const currentValue = Form.useWatch(name, form) as string | undefined
  const fileList: UploadFile[] = currentValue
    ? [
        {
          uid: String(name),
          name: `${label}.png`,
          status: 'done',
          url: currentValue,
        },
      ]
    : []

  const uploadProps: UploadProps = {
    accept: 'image/*',
    customRequest: async ({ file, onSuccess, onError }) => {
      try {
        const dataUrl = await readFileAsDataUrl(file as File)
        form.setFieldValue(name, dataUrl)
        onSuccess?.({}, new XMLHttpRequest())
      } catch (error) {
        onError?.(error as Error)
      }
    },
    fileList,
    listType: 'picture-card',
    onRemove: () => {
      form.setFieldValue(name, '')
      return true
    },
  }

  return (
    <Form.Item label={label} name={name}>
      <Upload disabled={disabled} {...uploadProps}>
        {fileList.length ? null : (
          <button style={{ border: 0, background: 'none' }} type="button">
            <PlusOutlined />
            <div style={{ marginTop: 8 }}>上传</div>
          </button>
        )}
      </Upload>
    </Form.Item>
  )
}

function GalleryUploadField({
  form,
  label,
  name,
  disabled,
}: {
  form: ReturnType<typeof Form.useForm<ProductUpsertPayload>>[0]
  label: string
  name: keyof ProductUpsertPayload
  disabled: boolean
}) {
  const currentValue = (Form.useWatch(name, form) as string[] | undefined) ?? []
  const fileList: UploadFile[] = currentValue.map((url, index) => ({
    uid: `${String(name)}-${index}`,
    name: `${label}-${index + 1}.png`,
    status: 'done',
    url,
  }))

  const uploadProps: UploadProps = {
    accept: 'image/*',
    customRequest: async ({ file, onSuccess, onError }) => {
      try {
        const dataUrl = await readFileAsDataUrl(file as File)
        form.setFieldValue(name, [...currentValue, dataUrl])
        onSuccess?.({}, new XMLHttpRequest())
      } catch (error) {
        onError?.(error as Error)
      }
    },
    fileList,
    listType: 'picture-card',
    onRemove: (file) => {
      form.setFieldValue(
        name,
        currentValue.filter((url) => url !== file.url),
      )
      return true
    },
  }

  return (
    <Form.Item label={label} name={name}>
      <Upload disabled={disabled} {...uploadProps}>
        <button style={{ border: 0, background: 'none' }} type="button">
          <PlusOutlined />
          <div style={{ marginTop: 8 }}>上传</div>
        </button>
      </Upload>
    </Form.Item>
  )
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('图片读取失败'))
    reader.readAsDataURL(file)
  })
}
