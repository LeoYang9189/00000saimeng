import { MailOutlined, PhoneOutlined, StarFilled } from '@ant-design/icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCartShopping, faChevronUp, faEnvelope, faHeadset, faPenToSquare, faPhone } from '@fortawesome/free-solid-svg-icons'
import { useEffect, useMemo, useState } from 'react'
import { Button, Cascader, Popover } from 'antd'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { LanguageSwitcher } from '../components/LanguageSwitcher'
import { useI18nText } from '../i18n'
import { buildDistributorAiWorkbenchUrl, buildDistributorLoginUrl, DISTRIBUTOR_ADMIN_DASHBOARD_URL } from '../navigation'
import { useStorefrontSession } from '../session'

export function StoreLayout() {
  const { t } = useI18nText()
  const { session, setSession } = useStorefrontSession()
  const location = useLocation()
  const navigate = useNavigate()
  const [selectedSearchPath, setSelectedSearchPath] = useState<string[]>([])
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [activeNavKey, setActiveNavKey] = useState<'home' | 'member' | 'about' | 'story'>('home')
  const currentYear = new Date().getFullYear()

  const serviceTags = [t('public.trust1'), t('public.trust2'), t('public.trust3'), t('public.trust4')]
  const searchOptions = useMemo(
    () => [
      {
        value: 'beverages',
        label: t('search.beverages'),
        children: [
          {
            value: 'wine-spirits',
            label: t('search.wineSpirits'),
            children: [
              { value: 'whisky', label: t('search.whisky') },
              { value: 'wine', label: t('search.wine') },
            ],
          },
          {
            value: 'tea-drinks',
            label: t('search.teaDrinks'),
            children: [
              { value: 'sparkling-water', label: t('search.sparklingWater') },
              { value: 'tea', label: t('search.tea') },
            ],
          },
        ],
      },
      {
        value: 'nutrition',
        label: t('search.nutrition'),
        children: [
          {
            value: 'supplements',
            label: t('search.supplements'),
            children: [
              { value: 'vitamins', label: t('search.vitamins') },
              { value: 'fish-oil', label: t('search.fishOil') },
            ],
          },
          {
            value: 'beauty',
            label: t('search.beauty'),
            children: [
              { value: 'skincare', label: t('search.skincare') },
              { value: 'personal-care', label: t('search.personalCare') },
            ],
          },
        ],
      },
      {
        value: 'family',
        label: t('search.family'),
        children: [
          {
            value: 'baby-care',
            label: t('search.babyCare'),
            children: [
              { value: 'formula', label: t('search.formula') },
              { value: 'diapers', label: t('search.diapers') },
            ],
          },
          {
            value: 'snacks-gifts',
            label: t('search.snacksGifts'),
            children: [
              { value: 'snacks', label: t('search.snacks') },
              { value: 'gift-boxes', label: t('search.giftBoxes') },
            ],
          },
        ],
      },
    ],
    [t],
  )

  useEffect(() => {
    if (location.pathname.startsWith('/member-center') || location.pathname === '/login' || location.pathname === '/register') {
      setActiveNavKey('member')
      return
    }

    if (location.pathname.startsWith('/brand-stories')) {
      setActiveNavKey('story')
      return
    }

    if (location.pathname.startsWith('/about-us')) {
      setActiveNavKey('about')
      return
    }

    if (location.pathname !== '/' && activeNavKey !== 'about' && activeNavKey !== 'story') {
      setActiveNavKey('home')
    }
  }, [activeNavKey, location.pathname])

  function handleHomeClick() {
    setActiveNavKey('home')
    void navigate('/')
  }

  function handleMemberClick() {
    setActiveNavKey('member')
  }

  function handleAboutClick() {
    setActiveNavKey('about')
    void navigate('/about-us')
  }

  function handleBrandStoryClick() {
    setActiveNavKey('story')
    void navigate('/brand-stories')
  }

  function handleLogout() {
    setSession(null)
    setActiveNavKey('home')
    void navigate('/')
  }

  function handleGoTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const miniProgramPopover = (
    <div className="mini-program-popover">
      <div className="mini-program-popover__qr">
        <div className="mini-program-popover__pattern" />
        <div className="mini-program-popover__badge">{t('common.brand')}</div>
      </div>
      <div className="mini-program-popover__text">
        <strong>{t('common.miniProgramCardTitle')}</strong>
        <span>{t('common.miniProgramCardSubtitle')}</span>
      </div>
    </div>
  )

  const servicePopover = (
    <div className="floating-service-popover">
      <strong>{t('floating.serviceTitle')}</strong>
      <a href="tel:4008886666">
        <FontAwesomeIcon icon={faPhone} />
        <span>{t('floating.servicePhone', { phone: '400-888-6666' })}</span>
      </a>
      <a href="mailto:bluefish@sea-win.com.cn">
        <FontAwesomeIcon icon={faEnvelope} />
        <span>{t('floating.serviceEmail', { email: 'bluefish@sea-win.com.cn' })}</span>
      </a>
    </div>
  )

  return (
    <div className="storefront-shell">
      <header className="public-header">
        <div className="public-header__utility">
          <div className="public-header__utility-left">
            {session ? (
              <div className="public-header__welcome public-header__welcome--logged-in">
                <span>嗨，</span>
                <a className="public-header__welcome-user" href={buildDistributorAiWorkbenchUrl(session)}>
                  {session.profile.displayName}
                </a>
                <span>{t('common.welcomeBack').replace('嗨，', '')}</span>
                <button className="public-header__welcome-logout" onClick={handleLogout} type="button">
                  {t('common.logout')}
                </button>
              </div>
            ) : (
              <a className="public-header__welcome" href={buildDistributorLoginUrl()}>
                <span>{t('common.welcomeLoginPrefix')}</span>
                <span className="public-header__welcome-action">{t('common.welcomeLoginAction')}</span>
              </a>
            )}
          </div>
          <div className="public-header__utility-right">
            <Popover content={miniProgramPopover} overlayClassName="mini-program-popover__overlay" trigger={['hover', 'click']}>
              <button className="public-header__mini-program" type="button">
                {t('common.miniProgramButton')}
              </button>
            </Popover>
            <div className="public-header__contact">
              <a aria-label={t('footer.phoneLabel')} href="tel:4008886666" title={t('footer.phoneLabel')}>
                <PhoneOutlined />
                400-888-6666
              </a>
              <a aria-label={t('footer.emailLabel')} href="mailto:bluefish@sea-win.com.cn" title={t('footer.emailLabel')}>
                <MailOutlined />
                bluefish@sea-win.com.cn
              </a>
            </div>
            <LanguageSwitcher />
            {session ? (
              <a href={DISTRIBUTOR_ADMIN_DASHBOARD_URL}>{t('common.goDashboard')}</a>
            ) : null}
          </div>
        </div>

        <div className="public-header__main">
          <Link className="brand-wordmark" to="/">
            <img
              alt={t('common.brand')}
              className="brand-wordmark__logo"
              src={encodeURI('/home/brands/logo.png')}
            />
          </Link>

          <nav className="public-nav">
            <button
              className={`public-nav__link${activeNavKey === 'home' ? ' public-nav__link--active' : ''}`}
              onClick={handleHomeClick}
              type="button"
            >
              {t('common.home')}
            </button>
            {session ? (
              <Link
                className={`public-nav__link${activeNavKey === 'member' ? ' public-nav__link--active' : ''}`}
                onClick={handleMemberClick}
                to="/member-center"
              >
                {t('common.memberCenter')}
              </Link>
            ) : (
              <a
                className={`public-nav__link${activeNavKey === 'member' ? ' public-nav__link--active' : ''}`}
                href={buildDistributorLoginUrl('member')}
                onClick={handleMemberClick}
              >
                {t('common.memberCenter')}
              </a>
            )}
            <button
              className={`public-nav__link${activeNavKey === 'about' ? ' public-nav__link--active' : ''}`}
              onClick={handleAboutClick}
              type="button"
            >
              {t('common.aboutUs')}
            </button>
            <button
              className={`public-nav__link${activeNavKey === 'story' ? ' public-nav__link--active' : ''}`}
              onClick={handleBrandStoryClick}
              type="button"
            >
              {t('common.brandStory')}
            </button>
          </nav>

          <div className={`public-search${isSearchOpen ? ' public-search--active' : ''}`}>
            <Cascader
              allowClear
              className="public-search__cascader"
              displayRender={(labels) => labels.join(' / ')}
              onChange={(value) => setSelectedSearchPath(value as string[])}
              onOpenChange={setIsSearchOpen}
              open={isSearchOpen}
              options={searchOptions}
              placeholder={t('common.searchPlaceholder')}
              value={selectedSearchPath}
            />
            <Button className="public-search__button" onClick={() => setIsSearchOpen(true)} type="primary">
              {t('common.search')}
            </Button>
          </div>
        </div>

        <div className="public-header__service-strip">
          <div className="service-marquee">
            <div className="service-marquee__content">
              {[0, 1, 2, 3].map((groupIndex) => (
                <div className="service-marquee__track" key={groupIndex}>
                  {serviceTags.map((tag) => (
                    <span className="service-marquee__item" key={`${groupIndex}-${tag}`}>
                      <span>{tag}</span>
                      <StarFilled className="service-marquee__star" />
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      <Outlet />

      <div className="floating-entry-cluster">
        <a
          aria-label={t('floating.aiAssistant')}
          className="floating-ai-entry"
          href={buildDistributorAiWorkbenchUrl(session)}
          title={t('floating.aiAssistant')}
        >
          <img alt={t('floating.aiAssistant')} className="floating-ai-entry__image" src={encodeURI('/home/brands/AI.png')} />
        </a>

        <aside className="floating-entry-bar" aria-label={t('floating.ariaLabel')}>
          <Link className="floating-entry-bar__item" to="/#home-shopping">
            <FontAwesomeIcon icon={faCartShopping} />
            <span>{t('floating.cart')}</span>
          </Link>
          <Link className="floating-entry-bar__item" to="/feedback">
            <FontAwesomeIcon icon={faPenToSquare} />
            <span>{t('floating.feedback')}</span>
          </Link>
          <Popover content={servicePopover} overlayClassName="floating-service-popover__overlay" placement="left" trigger={['hover', 'click']}>
            <button className="floating-entry-bar__item" type="button">
              <FontAwesomeIcon icon={faHeadset} />
              <span>{t('floating.service')}</span>
            </button>
          </Popover>
          <button className="floating-entry-bar__item" onClick={handleGoTop} type="button">
            <FontAwesomeIcon icon={faChevronUp} />
            <span>{t('floating.top')}</span>
          </button>
        </aside>
      </div>

      <section className="footer-cta">
        <div className="footer-cta__content">
          <span className="section-kicker">{t('footer.ctaEyebrow')}</span>
          <h2>{t('footer.ctaTitle')}</h2>
          <p>{t('footer.ctaBody')}</p>
        </div>
        <div className="footer-cta__actions">
          {session ? (
            <a className="hero-button hero-button--primary" href={DISTRIBUTOR_ADMIN_DASHBOARD_URL}>
              {t('footer.ctaPrimary')}
            </a>
          ) : (
            <Link className="hero-button hero-button--primary" to="/register">
              {t('footer.ctaPrimary')}
            </Link>
          )}
          {session ? (
            <Link className="hero-button hero-button--ghost footer-cta__ghost" to="/member-center">
              {t('footer.ctaSecondary')}
            </Link>
          ) : (
            <a className="hero-button hero-button--ghost footer-cta__ghost" href={buildDistributorLoginUrl('member')}>
              {t('footer.ctaSecondary')}
            </a>
          )}
        </div>
      </section>

      <footer className="public-footer" id="site-footer">
        <div className="public-footer__topline" />
        <div className="public-footer__grid">
          <div className="public-footer__brand">
            <span className="brand-wordmark__latin">{t('common.brandEn')}</span>
            <strong>{t('common.brand')}</strong>
            <span>{t('common.tagline')}</span>
          </div>

          <div className="public-footer__contact">
            <h3>{t('footer.contactTitle')}</h3>
            <p>
              {t('footer.phoneLabel')}<span>400-888-6666</span>
            </p>
            <p>
              {t('footer.emailLabel')}<span>bluefish@sea-win.com.cn</span>
            </p>
          </div>

          <div className="public-footer__qrs">
            <div className="footer-qr">
              <div className="footer-qr__box">{t('footer.qrPlaceholder')}</div>
              <span>{t('footer.miniProgramQr')}</span>
            </div>
            <div className="footer-qr">
              <div className="footer-qr__box">{t('footer.qrPlaceholder')}</div>
              <span>{t('footer.officialQr')}</span>
            </div>
          </div>

          <div className="public-footer__compliance">
            <h3>{t('footer.complianceTitle')}</h3>
            <p>{t('footer.icpPlaceholder')}</p>
            <p>{t('footer.publicSecurityPlaceholder')}</p>
            <p>{t('footer.copyright', { year: currentYear })}</p>
            <a className="public-footer__employee-link" href="http://localhost:5174/login">
              {t('footer.employeeLogin')}
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
