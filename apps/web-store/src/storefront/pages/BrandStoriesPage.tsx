import { Link } from 'react-router-dom'
import { BRAND_STORIES } from '../brandStories'
import { BrandStoryImage } from '../components/BrandStoryImage'

export function BrandStoriesPage() {
  return (
    <section className="brand-stories-page home-page">
      <header className="brand-stories-page__header">
        <span className="section-kicker">Brand Story</span>
        <h1>品牌故事</h1>
        <p>下面先放 3 个品牌入口。图片已预留占位，主人后续把图片放到指定目录即可自动替换。</p>
      </header>

      <div className="brand-story-card-grid">
        {BRAND_STORIES.map((brand) => (
          <Link className="brand-story-card" key={brand.slug} to={`/brand-stories/${brand.slug}`}>
            <BrandStoryImage
              alt={`${brand.name} 主视觉`}
              fileName={brand.heroImageFileName}
              size={brand.heroImageSize}
              src={brand.heroImagePath}
            />
            <div className="brand-story-card__meta">
              <span className="brand-story-card__eyebrow">
                {brand.country} / {brand.category}
              </span>
              <strong>{brand.name}</strong>
              <p>{brand.cardSummary}</p>
              <span className="brand-story-card__filename">{brand.heroImageFileName}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
