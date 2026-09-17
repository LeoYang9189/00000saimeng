import { MinusOutlined, PlusOutlined } from '@ant-design/icons'
import { Alert, Spin } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getPublicProductDetail } from '../api'
import { useI18nText } from '../i18n'
import { buildDistributorLoginUrl } from '../navigation'
import type { ProductDetailRecord } from '../types'

const FALLBACK_GALLERY_IMAGES = [
  '/home/item/featured-weekly-01.jpg.png',
  '/home/item/featured-weekly-02.jpg.png',
  '/home/item/featured-weekly-03.jpg.png',
]

const MEMBER_PRICE_LEVELS = [
  { key: 'bronze', labelKey: 'productDetail.memberBronze' },
  { key: 'silver', labelKey: 'productDetail.memberSilver' },
  { key: 'gold', labelKey: 'productDetail.memberGold' },
  { key: 'platinum', labelKey: 'productDetail.memberPlatinum' },
  { key: 'diamond', labelKey: 'productDetail.memberDiamond' },
  { key: 'blackDiamond', labelKey: 'productDetail.memberBlackDiamond' },
] as const

/**
 * 商城商品详情页。
 */
export function ProductDetailPage() {
  const { productId } = useParams()
  const { t, i18n } = useI18nText()
  const [product, setProduct] = useState<ProductDetailRecord | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [activeImage, setActiveImage] = useState('')
  const [quantity, setQuantity] = useState(1)

  useEffect(() => {
    let disposed = false

    async function loadProductDetail() {
      if (!productId) {
        setErrorMessage(t('productDetail.loadFailed'))
        setIsLoading(false)
        return
      }

      try {
        const detail = await getPublicProductDetail(Number(productId))
        if (disposed) {
          return
        }

        setProduct(detail)
        setErrorMessage('')
      } catch (error) {
        if (disposed) {
          return
        }

        setErrorMessage(error instanceof Error ? error.message : t('productDetail.loadFailed'))
      } finally {
        if (!disposed) {
          setIsLoading(false)
        }
      }
    }

    void loadProductDetail()

    return () => {
      disposed = true
    }
  }, [productId, t])

  const galleryImages = useMemo(() => {
    if (!product) {
      return FALLBACK_GALLERY_IMAGES
    }

    const images = [product.mainImage, product.thumbnailImage, product.boxImage, ...product.galleryImages]
      .map((value) => value.trim())
      .filter(Boolean)

    return images.length > 0 ? Array.from(new Set(images)) : FALLBACK_GALLERY_IMAGES
  }, [product])

  useEffect(() => {
    setActiveImage(galleryImages[0] ?? '')
  }, [galleryImages])

  const parameterItems = useMemo(
    () =>
      product
        ? [
            { label: t('productDetail.paramsProductCode'), value: product.productCode || '-' },
            { label: t('productDetail.paramsBrand'), value: product.brandName || '-' },
            { label: t('productDetail.paramsOrigin'), value: product.originCountry || '-' },
            { label: t('productDetail.paramsBarcode'), value: product.barcode || '-' },
            { label: t('productDetail.paramsNetContent'), value: product.netContent || '-' },
            { label: t('productDetail.paramsCaseSpec'), value: product.caseSpec || '-' },
            { label: t('productDetail.paramsShelfLife'), value: product.shelfLifeMonths ? `${product.shelfLifeMonths}${t('productDetail.monthUnit')}` : '-' },
            { label: t('productDetail.paramsSize'), value: product.sizeCm || '-' },
            { label: t('productDetail.paramsWeight'), value: product.grossWeightKg || '-' },
            {
              label: t('productDetail.paramsPalletsPerContainer'),
              value: product.palletsPerContainer == null ? '-' : String(product.palletsPerContainer),
            },
            {
              label: t('productDetail.paramsCasesPerPallet'),
              value: product.casesPerPallet == null ? '-' : String(product.casesPerPallet),
            },
            {
              label: t('productDetail.paramsCasesPerContainer'),
              value: product.casesPerContainer == null ? '-' : String(product.casesPerContainer),
            },
            { label: t('productDetail.paramsIngredients'), value: product.ingredients || '-' },
          ]
        : [],
    [product, t],
  )

  const memberPriceItems = useMemo(
    () =>
      product
        ? [
            { label: t('productDetail.memberBronze'), value: product.memberPriceBronze },
            { label: t('productDetail.memberSilver'), value: product.memberPriceSilver },
            { label: t('productDetail.memberGold'), value: product.memberPriceGold },
            { label: t('productDetail.memberPlatinum'), value: product.memberPricePlatinum },
            { label: t('productDetail.memberDiamond'), value: product.memberPriceDiamond },
            { label: t('productDetail.memberBlackDiamond'), value: product.memberPriceBlackDiamond },
          ]
        : [],
    [product, t],
  )

  function formatPrice(value: number) {
    return new Intl.NumberFormat(i18n.language, {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  function handleDecreaseQuantity() {
    setQuantity((current) => Math.max(1, current - 1))
  }

  function handleIncreaseQuantity() {
    setQuantity((current) => Math.min(999, current + 1))
  }

  if (isLoading) {
    return (
      <main className="product-detail-page">
        <div className="loading-block">
          <Spin />
        </div>
      </main>
    )
  }

  if (!product) {
    return (
      <main className="product-detail-page">
        <div className="product-detail-page__shell">
          <Alert showIcon title={errorMessage || t('productDetail.loadFailed')} type="error" />
        </div>
      </main>
    )
  }

  return (
    <main className="product-detail-page">
      <div className="product-detail-page__shell">
        <div className="product-detail-breadcrumb">
          <Link to="/">{t('productDetail.breadcrumbHome')}</Link>
          <span>/</span>
          <span>{product.productName}</span>
        </div>

        {errorMessage ? <Alert showIcon title={errorMessage} type="warning" /> : null}

        <section className="product-detail-hero">
          <div className="product-gallery">
            <div className="product-gallery__thumbs" role="tablist" aria-label={t('productDetail.galleryLabel')}>
              {galleryImages.map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  className={`product-gallery__thumb${image === activeImage ? ' product-gallery__thumb--active' : ''}`}
                  onClick={() => setActiveImage(image)}
                  type="button"
                >
                  <img alt={`${product.productName}-${index + 1}`} src={image} />
                </button>
              ))}
            </div>

            <div className="product-gallery__stage">
              <img alt={product.productName} className="product-gallery__main-image" src={activeImage || galleryImages[0]} />
            </div>
          </div>

          <div className="product-summary">
            <div className="product-summary__header">
              <span className="product-summary__tag">{t('productDetail.selfOperated')}</span>
              <h1>{product.productName}</h1>
              <p>{product.sellingPoint || t('productDetail.sellingPointFallback')}</p>
            </div>

            <div className="product-summary__price-panel">
              <div>
                <span className="product-summary__price-label">{t('productDetail.retailPrice')}</span>
                <strong className="product-summary__price-value">{formatPrice(product.retailPrice)}</strong>
              </div>
              <div className="product-summary__price-note">
                <span>{t('productDetail.memberPriceFrom')}</span>
                <strong>{formatPrice(product.memberPriceBlackDiamond)}</strong>
              </div>
            </div>

            <div className="product-summary__service">
              <span>{t('productDetail.officialDirect')}</span>
              <span>{t('productDetail.authenticity')}</span>
              <span>{product.stockQuantity > 0 ? t('productDetail.inStock') : t('productDetail.outOfStock')}</span>
            </div>

            <div className="product-summary__meta">
              <div className="product-summary__meta-row">
                <span>{t('productDetail.paramsBrand')}</span>
                <strong>{product.brandName || '-'}</strong>
              </div>
              <div className="product-summary__meta-row">
                <span>{t('productDetail.paramsOrigin')}</span>
                <strong>{product.originCountry || '-'}</strong>
              </div>
              <div className="product-summary__meta-row">
                <span>{t('productDetail.paramsNetContent')}</span>
                <strong>{product.netContent || '-'}</strong>
              </div>
              <div className="product-summary__meta-row">
                <span>{t('productDetail.paramsCaseSpec')}</span>
                <strong>{product.caseSpec || '-'}</strong>
              </div>
            </div>

            <div className="product-summary__quantity">
              <span>{t('productDetail.quantity')}</span>
              <div className="product-summary__quantity-stepper">
                <button onClick={handleDecreaseQuantity} type="button">
                  <MinusOutlined />
                </button>
                <strong>{quantity}</strong>
                <button onClick={handleIncreaseQuantity} type="button">
                  <PlusOutlined />
                </button>
              </div>
            </div>

            <div className="product-summary__actions">
              <a className="hero-button hero-button--primary" href={buildDistributorLoginUrl()}>
                {t('productDetail.primaryAction')}
              </a>
              <Link className="hero-button hero-button--ghost" to="/member-center">
                {t('productDetail.secondaryAction')}
              </Link>
            </div>

            <div className="product-summary__member-grid">
              {memberPriceItems.map((item, index) => (
                <div
                  key={MEMBER_PRICE_LEVELS[index].key}
                  className={`product-summary__member-item${index === memberPriceItems.length - 1 ? ' product-summary__member-item--highlight' : ''}`}
                >
                  <span>{item.label}</span>
                  <strong>{formatPrice(item.value)}</strong>
                </div>
              ))}
            </div>
          </div>
        </section>

        <nav className="product-detail-tabs">
          <a href="#product-overview">{t('productDetail.tabOverview')}</a>
          <a href="#product-params">{t('productDetail.tabParams')}</a>
          <a href="#product-richtext">{t('productDetail.tabRichText')}</a>
        </nav>

        <section className="product-detail-section" id="product-overview">
          <div className="product-detail-section__header">
            <span className="section-kicker">{t('productDetail.sectionOverview')}</span>
            <h2>{product.productName}</h2>
          </div>
          <div className="product-detail-overview">
            <div className="product-detail-overview__copy">
              <p>{product.sellingPoint || t('productDetail.sellingPointFallback')}</p>
              <ul>
                <li>{t('productDetail.officialDirect')}</li>
                <li>{t('productDetail.authenticity')}</li>
                <li>{t('productDetail.deliveryHint')}</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="product-detail-section" id="product-params">
          <div className="product-detail-section__header">
            <span className="section-kicker">{t('productDetail.sectionParams')}</span>
            <h2>{t('productDetail.paramsTitle')}</h2>
          </div>
          <div className="product-parameter-grid">
            {parameterItems.map((item) => (
              <div key={item.label} className="product-parameter-grid__item">
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="product-detail-section" id="product-richtext">
          <div className="product-detail-section__header">
            <span className="section-kicker">{t('productDetail.sectionRichText')}</span>
            <h2>{t('productDetail.richTextTitle')}</h2>
          </div>
          {product.detailHtml ? (
            <div className="product-richtext" dangerouslySetInnerHTML={{ __html: product.detailHtml }} />
          ) : (
            <div className="product-richtext product-richtext--empty">{t('productDetail.richTextEmpty')}</div>
          )}
        </section>
      </div>
    </main>
  )
}
