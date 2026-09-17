import { useI18nText } from '../i18n'
import { BrandStoryImage } from '../components/BrandStoryImage'

export function AboutPage() {
  const { t } = useI18nText()

  const stats = [
    { label: t('about.statFoundedLabel'), value: t('about.statFoundedValue') },
    { label: t('about.statModelLabel'), value: t('about.statModelValue') },
    { label: t('about.statCategoriesLabel'), value: t('about.statCategoriesValue') },
    { label: t('about.statLogisticsLabel'), value: t('about.statLogisticsValue') },
  ]

  const capabilities = [
    { title: t('about.capability1Title'), body: t('about.capability1Body') },
    { title: t('about.capability2Title'), body: t('about.capability2Body') },
    { title: t('about.capability3Title'), body: t('about.capability3Body') },
    { title: t('about.capability4Title'), body: t('about.capability4Body') },
  ]

  const principles = [
    { title: t('about.principle1Title'), body: t('about.principle1Body') },
    { title: t('about.principle2Title'), body: t('about.principle2Body') },
    { title: t('about.principle3Title'), body: t('about.principle3Body') },
    { title: t('about.principle4Title'), body: t('about.principle4Body') },
  ]

  const aboutImages = {
    hero: {
      alt: '关于我们主视觉',
      fileName: 'about-hero-main.jpg',
      size: '1600 x 1200',
      src: '/home/brands/about-hero-main.jpg',
    },
    import: {
      alt: '进口业务配图',
      fileName: 'about-import-track.jpg',
      size: '1600 x 1200',
      src: '/home/brands/about-import-track.jpg',
    },
    export: {
      alt: '出口业务配图',
      fileName: 'about-export-track.jpg',
      size: '1600 x 1200',
      src: '/home/brands/about-export-track.jpg',
    },
    supply: {
      alt: '供应链能力配图',
      fileName: 'about-supply-chain.jpg',
      size: '1600 x 900',
      src: '/home/brands/about-supply-chain.jpg',
    },
  }

  return (
    <main className="about-page home-page">
      <header className="about-page__masthead">
        <div className="about-page__hero-block">
          <span className="section-kicker">{t('about.eyebrow')}</span>
          <h1>{t('about.title')}</h1>
        </div>

        <div className="about-page__hero-side">
          <p className="about-page__lead">{t('about.lead')}</p>
          <p>{t('about.intro1')}</p>
          <div className="about-page__hero-visual">
            <BrandStoryImage
              alt={aboutImages.hero.alt}
              fileName={aboutImages.hero.fileName}
              size={aboutImages.hero.size}
              src={aboutImages.hero.src}
            />
          </div>
        </div>
      </header>

      <div className="about-page__stat-rail">
        {stats.map((stat) => (
          <article className="about-page__stat" key={stat.label}>
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
          </article>
        ))}
      </div>

      <section className="about-page__section about-page__section--editorial">
        <div className="about-page__section-head">
          <span className="about-page__section-index">01</span>
          <h2>{t('about.overviewTitle')}</h2>
        </div>

        <div className="about-page__section-copy">
          <p>{t('about.intro2')}</p>
          <p>{t('about.overviewBody')}</p>
          <div className="about-page__statement">
            <span className="section-kicker">{t('about.statsTitle')}</span>
            <p>{t('about.lead')}</p>
          </div>
        </div>
      </section>

      <section className="about-page__section">
        <div className="about-page__section-head">
          <span className="about-page__section-index">02</span>
          <h2>
            {t('about.importTitle')} / {t('about.exportTitle')}
          </h2>
        </div>

        <div className="about-page__business-grid">
          <article className="about-page__track">
            <span className="section-kicker">{t('about.importEyebrow')}</span>
            <h2>{t('about.importTitle')}</h2>
            <BrandStoryImage
              alt={aboutImages.import.alt}
              fileName={aboutImages.import.fileName}
              size={aboutImages.import.size}
              src={aboutImages.import.src}
            />
            <p>{t('about.importBody')}</p>
          </article>

          <article className="about-page__track">
            <span className="section-kicker">{t('about.exportEyebrow')}</span>
            <h2>{t('about.exportTitle')}</h2>
            <BrandStoryImage
              alt={aboutImages.export.alt}
              fileName={aboutImages.export.fileName}
              size={aboutImages.export.size}
              src={aboutImages.export.src}
            />
            <p>{t('about.exportBody')}</p>
          </article>
        </div>
      </section>

      <section className="about-page__section">
        <div className="about-page__section-head">
          <span className="about-page__section-index">03</span>
          <h2>{t('about.capabilitiesTitle')}</h2>
        </div>
        <div className="about-page__capability-stack">
          <div className="about-page__supply-visual">
            <BrandStoryImage
              alt={aboutImages.supply.alt}
              fileName={aboutImages.supply.fileName}
              size={aboutImages.supply.size}
              src={aboutImages.supply.src}
            />
          </div>
          <div className="about-page__capability-grid">
            {capabilities.map((item, index) => (
              <article className="about-page__list-item" key={item.title}>
                <span className="about-page__item-index">{String(index + 1).padStart(2, '0')}</span>
                <strong>{item.title}</strong>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="about-page__section">
        <div className="about-page__section-head">
          <span className="about-page__section-index">04</span>
          <h2>{t('about.principlesTitle')}</h2>
        </div>
        <div className="about-page__principle-grid">
          {principles.map((item, index) => (
            <article className="about-page__list-item" key={item.title}>
              <span className="about-page__item-index">{String(index + 1).padStart(2, '0')}</span>
              <strong>{item.title}</strong>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
