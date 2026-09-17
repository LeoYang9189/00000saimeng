import { Link, Navigate, useParams } from 'react-router-dom'
import { BRAND_STORY_MAP } from '../brandStories'
import { BrandStoryImage } from '../components/BrandStoryImage'

export function BrandStoryDetailPage() {
  const { slug } = useParams()

  if (!slug || !BRAND_STORY_MAP[slug]) {
    return <Navigate replace to="/brand-stories" />
  }

  const brand = BRAND_STORY_MAP[slug]
  const detailFacts = [
    { label: '国家', value: brand.country },
    { label: '品类', value: brand.category },
    { label: '品牌节点', value: `${brand.timeline.length} 个` },
    { label: '零售建议', value: `${brand.assortmentPoints.length} 条` },
  ]

  return (
    <main className="brand-story-detail-page home-page">
      <header className="brand-story-detail__masthead">
        <Link className="brand-story-detail__back" to="/brand-stories">
          返回品牌故事列表
        </Link>
        <div className="brand-story-detail__title-block">
          <span className="section-kicker">{brand.heroEyebrow}</span>
          <h1>{brand.heroTitle}</h1>
        </div>
        <div className="brand-story-detail__lead-block">
          <p className="brand-story-detail__lead">{brand.heroSummary}</p>
          <div className="brand-story-detail__summary">
            <span>{brand.country}</span>
            <span>{brand.category}</span>
            <span>{brand.heroImageFileName}</span>
          </div>
        </div>
      </header>

      <section className="brand-story-detail__hero-panel">
        <div className="brand-story-detail__hero-media">
          <BrandStoryImage
            alt={`${brand.name} 主视觉`}
            fileName={brand.heroImageFileName}
            size={brand.heroImageSize}
            src={brand.heroImagePath}
          />
        </div>

        <aside className="brand-story-detail__hero-note">
          <span className="brand-story-detail__note-label">Brand Focus</span>
          <strong>{brand.metrics[0]?.title ?? brand.name}</strong>
          <p>{brand.metrics[0]?.description ?? brand.heroSummary}</p>
          <div className="brand-story-detail__fact-rail">
            {detailFacts.map((fact) => (
              <article className="brand-story-detail__fact" key={fact.label}>
                <span>{fact.label}</span>
                <strong>{fact.value}</strong>
              </article>
            ))}
          </div>
        </aside>
      </section>

      {brand.disclaimer ? <p className="brand-story-detail__notice">{brand.disclaimer}</p> : null}

      <section className="brand-story-detail__section">
        <div className="brand-story-detail__section-head">
          <span className="brand-story-detail__section-index">01</span>
          <h2>品牌起源</h2>
        </div>
        <div className="brand-story-detail__origin-layout">
          <div className="brand-story-detail__body">
            {brand.originParagraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <div className="brand-story-detail__origin-quote">
            <span className="section-kicker">Brand Positioning</span>
            <p>{brand.cardSummary}</p>
          </div>
        </div>
      </section>

      <section className="brand-story-detail__section">
        <div className="brand-story-detail__section-head">
          <span className="brand-story-detail__section-index">02</span>
          <h2>品牌核心表达</h2>
        </div>
        <div className="brand-story-metric-grid">
          {brand.metrics.map((metric, index) => (
            <article className="brand-story-metric" key={metric.title}>
              <span className="brand-story-detail__item-index">{String(index + 1).padStart(2, '0')}</span>
              <strong>{metric.title}</strong>
              <p>{metric.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="brand-story-detail__section">
        <div className="brand-story-detail__section-head">
          <span className="brand-story-detail__section-index">03</span>
          <h2>品牌时间线</h2>
        </div>
        <div className="brand-story-timeline">
          {brand.timeline.map((item, index) => (
            <article className="brand-story-timeline__item" key={`${item.period}-${item.title}`}>
              <span className="brand-story-detail__item-index">{String(index + 1).padStart(2, '0')}</span>
              <span className="brand-story-timeline__period">{item.period}</span>
              <div className="brand-story-timeline__content">
                <strong>{item.title}</strong>
                <p>{item.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="brand-story-detail__section">
        <div className="brand-story-detail__section-head">
          <span className="brand-story-detail__section-index">04</span>
          <h2>{brand.assortmentTitle}</h2>
        </div>
        <div className="brand-story-detail__closing">
          <div className="brand-story-direction-grid">
            {brand.assortmentPoints.map((point, index) => (
              <article className="brand-story-direction" key={point}>
                <span className="brand-story-detail__item-index">{String(index + 1).padStart(2, '0')}</span>
                <p>{point}</p>
              </article>
            ))}
          </div>
          <div className="brand-story-detail__closing-note">
            <span className="section-kicker">Sea Mind Import & Export</span>
            <p>把品牌故事、商品结构与渠道场景放在一起表达，页面才会更像一个真正能转化的进口品牌页。</p>
          </div>
        </div>
      </section>
    </main>
  )
}
