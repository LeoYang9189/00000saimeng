import { LeftOutlined, RightOutlined } from '@ant-design/icons'
import { useEffect, useMemo, useState } from 'react'
import { Alert, Spin } from 'antd'
import { Link } from 'react-router-dom'
import { getPublicPoolProducts } from '../api'
import { useI18nText } from '../i18n'
import type { ProductRecord } from '../types'

type CategoryKey = 'wine' | 'supplements' | 'baby' | 'beauty' | 'gift' | 'snack'

const DISTRIBUTOR_LOGIN_URL = 'http://localhost:5175/login'

export function HomePage() {
  const { t, i18n } = useI18nText()
  const [products, setProducts] = useState<ProductRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [activeCategoryKey, setActiveCategoryKey] = useState<CategoryKey>('wine')
  const [activeProductIndex, setActiveProductIndex] = useState(0)
  const [activeBannerIndex, setActiveBannerIndex] = useState(0)
  const [activeFeaturedPage, setActiveFeaturedPage] = useState(0)

  useEffect(() => {
    let disposed = false

    async function loadProducts() {
      try {
        const data = await getPublicPoolProducts()
        if (!disposed) {
          setProducts(data.slice(0, 12))
        }
      } catch (error) {
        if (!disposed) {
          const message = error instanceof Error ? error.message : ''
          const isNetworkError =
            message === 'Failed to fetch' ||
            message === 'NetworkError when attempting to fetch resource.' ||
            message.includes('fetch')

          setErrorMessage(isNetworkError ? t('public.productLoadFailed') : message || t('public.productLoadFallback'))
        }
      } finally {
        if (!disposed) {
          setIsLoading(false)
        }
      }
    }

    void loadProducts()

    return () => {
      disposed = true
    }
  }, [t])

  const procurementImageMap = useMemo(
    () => ({
      wine: {
        main: '/home/item/procurement-main-wine.jpg.png',
        thumbs: [
          '/home/item/procurement-thumb-wine-01.jpg.png',
          '/home/item/procurement-thumb-wine-02.jpg.png',
          '/home/item/procurement-thumb-wine-03.jpg.png',
          '/home/item/procurement-thumb-wine-04.jpg.png',
          '/home/item/procurement-thumb-wine-05.jpg.png',
        ],
      },
      supplements: {
        main: '/home/item/procurement-main-supplements.jpg.png',
        thumbs: [
          '/home/item/procurement-thumb-supplements-01.jpg.png',
          '/home/item/procurement-thumb-supplements-02.jpg.webp',
          '/home/item/procurement-thumb-supplements-03.jpg.png',
          '/home/item/procurement-thumb-supplements-04.jpg.png',
          '/home/item/procurement-thumb-supplements-05.jpg.png',
        ],
      },
      baby: {
        main: '/home/item/procurement-main-baby.jpg.png',
        thumbs: [
          '/home/item/procurement-thumb-baby-01.jpg.png',
          '/home/item/procurement-thumb-baby-02.jpg.png',
          '/home/item/procurement-thumb-baby-03.jpg.png',
          '/home/item/procurement-thumb-baby-04.jpg.png',
          '/home/item/procurement-thumb-baby-05.jpg.png',
        ],
      },
      beauty: {
        main: '/home/item/procurement-main-beauty.jpg.png',
        thumbs: [
          '/home/item/procurement-thumb-beauty-01.jpg.webp',
          '/home/item/procurement-thumb-beauty-02.jpg.png',
          '/home/item/procurement-thumb-beauty-03.jpg.webp',
          '/home/item/procurement-thumb-beauty-04.jpg.png',
          '/home/item/procurement-thumb-beauty-05.jpg.png',
        ],
      },
      gift: {
        main: '/home/item/procurement-main-gift.jpg.png',
        thumbs: [
          '/home/item/procurement-thumb-gift-01.jpg.png',
          '/home/item/procurement-thumb-gift-02.jpg.png',
          '/home/item/procurement-thumb-gift-03.jpg.png',
          '/home/item/procurement-thumb-gift-04.jpg.png',
          '/home/item/procurement-thumb-gift-05.jpg.png',
        ],
      },
      snack: {
        main: '/home/item/procurement-main-snack.jpg.png',
        thumbs: [
          '/home/item/procurement-thumb-snack-01.jpg.png',
          '/home/item/procurement-thumb-snack-02.jpg.png',
          '/home/item/procurement-thumb-snack-03.jpg.webp',
          '/home/item/procurement-thumb-snack-04.jpg.png',
          '/home/item/procurement-thumb-snack-05.jpg.png',
        ],
      },
    }),
    [],
  )

  const featuredImagePaths = useMemo(
    () => [
      '/home/item/featured-weekly-01.jpg.png',
      '/home/item/featured-weekly-02.jpg.png',
      '/home/item/featured-weekly-03.jpg.png',
      '/home/item/featured-weekly-04.jpg.png',
      '/home/item/featured-weekly-05.jpg.png',
      '/home/item/featured-weekly-06.jpg.webp',
      '/home/item/featured-weekly-07.jpg.png',
      '/home/item/featured-weekly-08.jpg.png',
    ],
    [],
  )

  const fallbackProducts = useMemo<ProductRecord[]>(
    () =>
      Array.from({ length: 8 }, (_, index) => ({
        productId: index + 1,
        productName: `${t('public.sampleProductPrefix')} ${String(index + 1).padStart(2, '0')}`,
        originCountry: t('public.sampleOrigin'),
        sellingPoint: t('public.sampleSellingPoint'),
        sourceType: index % 2 === 0 ? 'PLATFORM' : 'MERCHANT',
        sourceMerchantUserId: null,
        auditStatus: 'APPROVED',
        inPublicPool: true,
        createdByUserId: 0,
        createdAt: '',
        reviewedByUserId: null,
        reviewedAt: null,
      })),
    [t],
  )

  const hasRealProductData = products.length > 0
  const productPool = products.length > 0 ? products : fallbackProducts
  const featuredProducts = useMemo(
    () =>
      Array.from({ length: 8 }, (_, index) => ({
        ...productPool[index % productPool.length],
        featuredKey: `${productPool[index % productPool.length].productId}-${index}`,
        featuredImagePath: featuredImagePaths[index],
      })),
    [featuredImagePaths, productPool],
  )
  const bannerItems = useMemo(
    () => [
      {
        id: 'brand',
        image: '/home/banner1.png',
        label: t('public.bannerLabel1'),
        title: t('public.bannerTitle1'),
        description: t('public.bannerDescription1'),
      },
      {
        id: 'campaign',
        image: '/home/banner2.png',
        label: t('public.bannerLabel2'),
        title: t('public.bannerTitle2'),
        description: t('public.bannerDescription2'),
      },
      {
        id: 'channel',
        image: '/home/banner3.png',
        label: t('public.bannerLabel3'),
        title: t('public.bannerTitle3'),
        description: t('public.bannerDescription3'),
      },
    ],
    [t],
  )
  const categoryConfigs = useMemo(
    () => [
      {
        key: 'wine' as const,
        label: t('public.categoryWine'),
        summary: t('public.categoryWineSummary'),
      },
      {
        key: 'supplements' as const,
        label: t('public.categorySupplements'),
        summary: t('public.categorySupplementsSummary'),
      },
      {
        key: 'baby' as const,
        label: t('public.categoryBaby'),
        summary: t('public.categoryBabySummary'),
      },
      {
        key: 'beauty' as const,
        label: t('public.categoryBeauty'),
        summary: t('public.categoryBeautySummary'),
      },
      {
        key: 'gift' as const,
        label: t('public.categoryGift'),
        summary: t('public.categoryGiftSummary'),
      },
      {
        key: 'snack' as const,
        label: t('public.categorySnack'),
        summary: t('public.categorySnackSummary'),
      },
    ],
    [t],
  )

  const categoryProducts = useMemo(
    () =>
      categoryConfigs.map((category, categoryIndex) => ({
        ...category,
        mainImagePath: procurementImageMap[category.key].main,
        products: Array.from({ length: procurementImageMap[category.key].thumbs.slice(0, 3).length }, (_, itemIndex) => {
          const product = productPool[(categoryIndex + itemIndex) % productPool.length]

          return {
            id: `${category.key}-${product.productId}-${itemIndex}`,
            productId: product.productId,
            title: product.productName,
            origin: product.originCountry || t('public.sampleOrigin'),
            caption: product.sellingPoint || category.summary,
            thumbImagePath: procurementImageMap[category.key].thumbs.slice(0, 3)[itemIndex],
          }
        }),
      })),
    [categoryConfigs, procurementImageMap, productPool, t],
  )

  const activeCategory =
    categoryProducts.find((category) => category.key === activeCategoryKey) ?? categoryProducts[0]
  const activeProducts = activeCategory.products
  const activeProduct = activeProducts[activeProductIndex] ?? activeProducts[0]
  const visibleFeaturedProducts = featuredProducts.slice(activeFeaturedPage * 4, activeFeaturedPage * 4 + 4)
  const isChineseLanguage = i18n.language === 'zh-CN'
  const banner = bannerItems[activeBannerIndex] ?? bannerItems[0]

  useEffect(() => {
    setActiveProductIndex(0)
  }, [activeCategoryKey])

  useEffect(() => {
    if (activeProducts.length <= 1) {
      return
    }

    const timer = window.setInterval(() => {
      setActiveProductIndex((currentIndex) => (currentIndex + 1) % activeProducts.length)
    }, 4000)

    return () => {
      window.clearInterval(timer)
    }
  }, [activeProducts])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveBannerIndex((currentIndex) => (currentIndex + 1) % bannerItems.length)
    }, 4500)

    return () => {
      window.clearInterval(timer)
    }
  }, [bannerItems])

  useEffect(() => {
    const totalPages = Math.ceil(featuredProducts.length / 4)

    if (totalPages <= 1) {
      return
    }

    const timer = window.setInterval(() => {
      setActiveFeaturedPage((currentPage) => (currentPage + 1) % totalPages)
    }, 3500)

    return () => {
      window.clearInterval(timer)
    }
  }, [featuredProducts])

  function handleCategoryChange(categoryKey: CategoryKey) {
    setActiveCategoryKey(categoryKey)
  }

  function handlePreviousProduct() {
    setActiveProductIndex((currentIndex) => (currentIndex - 1 + activeProducts.length) % activeProducts.length)
  }

  function handleNextProduct() {
    setActiveProductIndex((currentIndex) => (currentIndex + 1) % activeProducts.length)
  }

  function formatProductPrice(productId: number, index: number) {
    const amount = 99 + ((productId + index * 7) % 11) * 20
    return new Intl.NumberFormat(i18n.language, {
      style: 'currency',
      currency: isChineseLanguage ? 'CNY' : 'USD',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <main className="home-page">
      <section className="home-hero">
        <div className="home-hero__copy">
          <span className="hero-kicker">{t('public.topLabel')}</span>
          <h1>{t('public.heroTitle')}</h1>
          <p>{t('public.heroDescription')}</p>
          <div className="hero-actions">
            <Link className="hero-button hero-button--primary" to="/register">
              {t('public.heroPrimary')}
            </Link>
            <a className="hero-button hero-button--ghost" href={DISTRIBUTOR_LOGIN_URL}>
              {t('common.login')}
            </a>
          </div>
        </div>

        <div className="home-hero__visual">
          <div className="hero-composition">
            <img alt={t('public.heroImageAlt')} className="hero-composition__image" src="/home/home-hero-main.png" />
          </div>
        </div>
      </section>

      <section className="home-editorial" id="home-shopping">
        <div className="home-editorial__stage">
          <div className="home-editorial__header">
            <span className="section-kicker">{t('public.categoriesTitle')}</span>
          </div>

          <div className="editorial-banner">
            <img alt={banner.title} className="editorial-banner__image" src={banner.image} />
            <div className="editorial-banner__actions">
              {bannerItems.map((item, index) => (
                <button
                  key={item.id}
                  className={`editorial-banner__dot${index === activeBannerIndex ? ' editorial-banner__dot--active' : ''}`}
                  onClick={() => setActiveBannerIndex(index)}
                  type="button"
                />
              ))}
            </div>
          </div>

          <div className="editorial-showcase">
            <article className="editorial-main-card">
              <div className="editorial-main-card__image-wrap">
                {hasRealProductData ? (
                  <Link className="editorial-main-card__image-link" to={`/products/${activeProduct.productId}`}>
                    <img alt={activeCategory.label} className="editorial-main-card__image" src={activeCategory.mainImagePath} />
                  </Link>
                ) : (
                  <img alt={activeCategory.label} className="editorial-main-card__image" src={activeCategory.mainImagePath} />
                )}
              </div>

              <div className="editorial-main-card__meta">
                <div className="editorial-main-card__headline">
                  <span className="editorial-visual__label">{activeCategory.label}</span>
                  {hasRealProductData ? (
                    <Link className="editorial-main-card__link" to={`/products/${activeProduct.productId}`}>
                      <strong>{activeProduct.title}</strong>
                    </Link>
                  ) : (
                    <strong>{activeProduct.title}</strong>
                  )}
                </div>
                <p>{activeProduct.caption}</p>
                <div className="editorial-main-card__actions">
                  <button className="editorial-nav" onClick={handlePreviousProduct} type="button">
                    <LeftOutlined />
                  </button>
                  <button className="editorial-nav" onClick={handleNextProduct} type="button">
                    <RightOutlined />
                  </button>
                </div>
              </div>
            </article>

            <div className="editorial-showcase__rail">
              {activeProducts.map((product, index) => (
                <button
                  key={product.id}
                  className={`editorial-thumb${index === activeProductIndex ? ' editorial-thumb--active' : ''}`}
                  onClick={() => setActiveProductIndex(index)}
                  type="button"
                >
                  <img alt={product.title} className="editorial-thumb__image" src={product.thumbImagePath} />
                  <div className="editorial-thumb__meta">
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    <strong>{product.title}</strong>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="home-editorial__categories">
          {categoryProducts.map((category, index) => (
            <button
              key={category.key}
              className={`category-switcher${category.key === activeCategoryKey ? ' category-switcher--active' : ''}`}
              onClick={() => handleCategoryChange(category.key)}
              type="button"
            >
              <span>{String(index + 1).padStart(2, '0')}</span>
              <strong>{category.label}</strong>
              <small>{category.summary}</small>
            </button>
          ))}
          <a className="hero-button hero-button--primary home-editorial__more" href={DISTRIBUTOR_LOGIN_URL}>
            {t('common.viewMore')}
          </a>
        </div>
      </section>

      <section className="home-campaign" id="brand-story">
        <div className="campaign-panel">
          <span className="section-kicker">{t('public.heroAsideTitle1')}</span>
          <h2>{t('public.heroAsideBody1')}</h2>
        </div>
        <div className="campaign-panel">
          <span className="section-kicker">{t('public.heroAsideTitle2')}</span>
          <h2>{t('public.heroAsideBody2')}</h2>
        </div>
        <div className="campaign-panel">
          <span className="section-kicker">{t('public.heroAsideTitle3')}</span>
          <h2>{t('public.heroAsideBody3')}</h2>
        </div>
      </section>

      <section className="home-products">
        <div className="section-headline">
          <span className="section-kicker">{t('public.sectionFeatured')}</span>
        </div>

        {isLoading ? (
          <div className="loading-block">
            <Spin />
          </div>
        ) : (
          <>
            {errorMessage ? <Alert showIcon title={errorMessage} type="error" /> : null}
            <div className="product-strip">
              {visibleFeaturedProducts.map((product, index) => (
                <article key={product.featuredKey} className="product-strip__item">
                  {hasRealProductData ? (
                    <Link className="product-strip__link" to={`/products/${product.productId}`}>
                      <img alt={product.productName} className="product-strip__image" src={product.featuredImagePath} />
                      <h3>{product.productName}</h3>
                      <strong className="product-strip__price">{formatProductPrice(product.productId, index)}</strong>
                      <p>{product.sellingPoint}</p>
                    </Link>
                  ) : (
                    <>
                      <img alt={product.productName} className="product-strip__image" src={product.featuredImagePath} />
                      <h3>{product.productName}</h3>
                      <strong className="product-strip__price">{formatProductPrice(product.productId, index)}</strong>
                      <p>{product.sellingPoint}</p>
                    </>
                  )}
                </article>
              ))}
            </div>
            <div className="product-strip__footer">
              <a className="product-strip__more" href={DISTRIBUTOR_LOGIN_URL}>
                {t('common.viewMore')}
              </a>
            </div>
          </>
        )}
      </section>
    </main>
  )
}
