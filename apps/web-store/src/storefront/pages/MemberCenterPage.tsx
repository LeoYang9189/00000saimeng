import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBolt,
  faBoxesStacked,
  faCrown,
  faGift,
  faHeadset,
  faPlaneDeparture,
  faTicket,
  faTruckFast,
  faWallet,
} from '@fortawesome/free-solid-svg-icons'
import { Button, Progress } from 'antd'
import type { CSSProperties } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { getMemberProfile, getMerchantApplication, getPublicMemberCenterConfig } from '../api'
import { useI18nText } from '../i18n'
import { buildDistributorLoginUrl, DISTRIBUTOR_ADMIN_DASHBOARD_URL } from '../navigation'
import { useStorefrontSession } from '../session'
import type { MemberCenterLevelConfigRecord, MemberProfileResponse, MerchantApplicationRecord } from '../types'

type MemberLevelKey = string
type BenefitGroupKey = 'shopping' | 'service' | 'travel'
type BenefitKey =
  | 'credit'
  | 'sample'
  | 'trial'
  | 'support'
  | 'flash'
  | 'selection'
  | 'marketing'
  | 'storage'
  | 'salon'
  | 'travel'
  | 'banquet'
type BenefitIconKey = 'coupon' | 'shipping' | 'gift' | 'service' | 'flash' | 'selection' | 'warehouse' | 'travel' | 'wallet'
type HighlightKey = 'credit' | 'sample' | 'trial' | 'salon' | 'support' | 'strategy'

interface BenefitDefinition {
  key: BenefitKey
  group: BenefitGroupKey
  icon: BenefitIconKey
}

interface MemberLevelDefinition {
  key: MemberLevelKey
  levelName: string
  levelTitle: string
  levelDescription: string
  summaryText: string
  progressText: string
  missionText: string
  missionAction: string
  highlightTitle: string
  rank: number
  visualSrc: string
  heroStart: string
  heroMid: string
  heroEnd: string
  accent: string
  softAccent: string
  cardSurface: string
  placeholderTone: string
  glowColor: string
  sparkColor: string
  progressPercent: number
  highlightKeys: HighlightKey[]
  benefitKeys: BenefitKey[]
}

const BENEFITS: BenefitDefinition[] = [
  { key: 'credit', group: 'shopping', icon: 'coupon' },
  { key: 'sample', group: 'shopping', icon: 'shipping' },
  { key: 'trial', group: 'shopping', icon: 'gift' },
  { key: 'flash', group: 'service', icon: 'flash' },
  { key: 'selection', group: 'service', icon: 'selection' },
  { key: 'marketing', group: 'service', icon: 'gift' },
  { key: 'support', group: 'service', icon: 'service' },
  { key: 'storage', group: 'travel', icon: 'warehouse' },
  { key: 'salon', group: 'travel', icon: 'travel' },
  { key: 'travel', group: 'travel', icon: 'travel' },
  { key: 'banquet', group: 'travel', icon: 'wallet' },
]

const LEVEL_VISUALS = [
  {
    key: 'bronze',
    rank: 0,
    visualSrc: encodeURI('/home/member/图片 4.png'),
    heroStart: '#7d6658',
    heroMid: '#ad8b74',
    heroEnd: '#ede3da',
    accent: '#8e6547',
    softAccent: 'rgba(142, 101, 71, 0.16)',
    cardSurface: 'rgba(255, 247, 240, 0.74)',
    placeholderTone: 'rgba(142, 101, 71, 0.18)',
    glowColor: 'rgba(233, 190, 149, 0.42)',
    sparkColor: 'rgba(255, 248, 232, 0.96)',
    progressPercent: 22,
    highlightKeys: ['credit', 'sample', 'strategy'] as HighlightKey[],
    benefitKeys: ['credit', 'flash'] as BenefitKey[],
  },
  {
    key: 'silver',
    rank: 1,
    visualSrc: encodeURI('/home/member/图片 5.png'),
    heroStart: '#7e8b99',
    heroMid: '#aab7c7',
    heroEnd: '#edf2f7',
    accent: '#6f8095',
    softAccent: 'rgba(111, 128, 149, 0.16)',
    cardSurface: 'rgba(250, 252, 255, 0.78)',
    placeholderTone: 'rgba(111, 128, 149, 0.18)',
    glowColor: 'rgba(226, 237, 246, 0.42)',
    sparkColor: 'rgba(255, 255, 255, 0.96)',
    progressPercent: 38,
    highlightKeys: ['sample', 'credit', 'strategy'] as HighlightKey[],
    benefitKeys: ['credit', 'sample', 'flash', 'travel'] as BenefitKey[],
  },
  {
    key: 'gold',
    rank: 2,
    visualSrc: encodeURI('/home/member/图片 6.png'),
    heroStart: '#886222',
    heroMid: '#c89a42',
    heroEnd: '#f2e2bf',
    accent: '#a8771f',
    softAccent: 'rgba(168, 119, 31, 0.14)',
    cardSurface: 'rgba(255, 249, 235, 0.8)',
    placeholderTone: 'rgba(168, 119, 31, 0.18)',
    glowColor: 'rgba(255, 218, 128, 0.46)',
    sparkColor: 'rgba(255, 250, 225, 0.98)',
    progressPercent: 56,
    highlightKeys: ['trial', 'sample', 'strategy'] as HighlightKey[],
    benefitKeys: ['credit', 'sample', 'trial', 'flash', 'selection', 'travel'] as BenefitKey[],
  },
  {
    key: 'platinum',
    rank: 3,
    visualSrc: encodeURI('/home/member/图片 7.png'),
    heroStart: '#4f545f',
    heroMid: '#9098a4',
    heroEnd: '#ebedf2',
    accent: '#686f7a',
    softAccent: 'rgba(104, 111, 122, 0.14)',
    cardSurface: 'rgba(252, 253, 255, 0.76)',
    placeholderTone: 'rgba(104, 111, 122, 0.18)',
    glowColor: 'rgba(223, 227, 233, 0.44)',
    sparkColor: 'rgba(255, 255, 255, 0.9)',
    progressPercent: 72,
    highlightKeys: ['salon', 'trial', 'strategy'] as HighlightKey[],
    benefitKeys: ['credit', 'sample', 'trial', 'flash', 'selection', 'marketing', 'storage', 'salon', 'travel'] as BenefitKey[],
  },
  {
    key: 'diamond',
    rank: 4,
    visualSrc: encodeURI('/home/member/图片 8.png'),
    heroStart: '#2b3c73',
    heroMid: '#586fbe',
    heroEnd: '#e8edff',
    accent: '#4a61b2',
    softAccent: 'rgba(74, 97, 178, 0.16)',
    cardSurface: 'rgba(246, 249, 255, 0.82)',
    placeholderTone: 'rgba(74, 97, 178, 0.18)',
    glowColor: 'rgba(154, 177, 255, 0.42)',
    sparkColor: 'rgba(246, 249, 255, 0.98)',
    progressPercent: 84,
    highlightKeys: ['support', 'salon', 'strategy'] as HighlightKey[],
    benefitKeys: ['credit', 'sample', 'trial', 'flash', 'selection', 'marketing', 'support', 'storage', 'salon', 'travel'] as BenefitKey[],
  },
  {
    key: 'blackDiamond',
    rank: 5,
    visualSrc: encodeURI('/home/member/图片 9.png'),
    heroStart: '#161c28',
    heroMid: '#3c4b69',
    heroEnd: '#dde4f2',
    accent: '#27334d',
    softAccent: 'rgba(39, 51, 77, 0.14)',
    cardSurface: 'rgba(250, 251, 255, 0.84)',
    placeholderTone: 'rgba(39, 51, 77, 0.16)',
    glowColor: 'rgba(138, 160, 214, 0.36)',
    sparkColor: 'rgba(239, 244, 255, 0.92)',
    progressPercent: 100,
    highlightKeys: ['support', 'salon', 'strategy'] as HighlightKey[],
    benefitKeys: ['credit', 'sample', 'trial', 'flash', 'selection', 'marketing', 'support', 'storage', 'salon', 'travel', 'banquet'] as BenefitKey[],
  },
]

const MEMBER_GUIDE_VISUALS = {
  hero: encodeURI('/home/member/guide/member-guide-hero-enterprise-auth.png'),
  seal: encodeURI('/home/member/guide/member-guide-badge-authentic-guarantee.png'),
  product: encodeURI('/home/member/guide/member-guide-product-sourcing-scene.png'),
}

function renderBenefitIcon(icon: BenefitIconKey) {
  switch (icon) {
    case 'coupon':
      return <FontAwesomeIcon icon={faTicket} />
    case 'shipping':
      return <FontAwesomeIcon icon={faTruckFast} />
    case 'gift':
      return <FontAwesomeIcon icon={faGift} />
    case 'service':
      return <FontAwesomeIcon icon={faHeadset} />
    case 'flash':
      return <FontAwesomeIcon icon={faBolt} />
    case 'selection':
      return <FontAwesomeIcon icon={faCrown} />
    case 'warehouse':
      return <FontAwesomeIcon icon={faBoxesStacked} />
    case 'travel':
      return <FontAwesomeIcon icon={faPlaneDeparture} />
    case 'wallet':
      return <FontAwesomeIcon icon={faWallet} />
    default:
      return <FontAwesomeIcon icon={faGift} />
  }
}

function mapConfigToLevel(record: MemberCenterLevelConfigRecord): MemberLevelDefinition {
  return {
    key: record.levelKey,
    levelName: record.levelName,
    levelTitle: record.levelTitle,
    levelDescription: record.levelDescription,
    summaryText: record.summaryText,
    progressText: record.progressText,
    missionText: record.missionText,
    missionAction: record.missionAction,
    highlightTitle: record.highlightTitle,
    rank: record.levelRank,
    visualSrc: encodeURI(record.visualSrc),
    heroStart: record.heroStart,
    heroMid: record.heroMid,
    heroEnd: record.heroEnd,
    accent: record.accent,
    softAccent: record.softAccent,
    cardSurface: record.cardSurface,
    placeholderTone: record.placeholderTone,
    glowColor: record.glowColor,
    sparkColor: record.sparkColor,
    progressPercent: record.progressPercent,
    highlightKeys: record.highlightKeys as HighlightKey[],
    benefitKeys: record.benefitKeys as BenefitKey[],
  }
}

/**
 * 商城会员中心页。
 */
export function MemberCenterPage() {
  const { session, setSession } = useStorefrontSession()
  const { t } = useI18nText()
  const [activeLevelKey, setActiveLevelKey] = useState<MemberLevelKey>('bronze')
  const [configuredLevels, setConfiguredLevels] = useState<MemberLevelDefinition[] | null>(null)
  const [memberProfile, setMemberProfile] = useState<MemberProfileResponse | null>(null)
  const [merchantApplication, setMerchantApplication] = useState<MerchantApplicationRecord | null>(null)
  const [isEligibilityLoading, setIsEligibilityLoading] = useState(true)

  useEffect(() => {
    if (session) {
      return
    }

    window.location.replace(buildDistributorLoginUrl('member'))
  }, [session])

  useEffect(() => {
    let isMounted = true

    async function loadMemberCenterConfig() {
      try {
        const payload = await getPublicMemberCenterConfig()
        if (!isMounted || !payload.levels.length) {
          return
        }

        setConfiguredLevels(payload.levels.map(mapConfigToLevel))
      } catch {
        // 后台配置未就绪时使用页面内置默认等级，避免会员中心不可访问。
      }
    }

    void loadMemberCenterConfig()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    async function loadEligibility() {
      if (!session) {
        return
      }

      try {
        setIsEligibilityLoading(true)
        const [profilePayload, merchantApplicationPayload] = await Promise.all([
          getMemberProfile(session.token),
          getMerchantApplication(session.token),
        ])
        if (!isMounted) {
          return
        }
        setMemberProfile(profilePayload)
        setMerchantApplication(merchantApplicationPayload)
      } finally {
        if (isMounted) {
          setIsEligibilityLoading(false)
        }
      }
    }

    void loadEligibility()

    return () => {
      isMounted = false
    }
  }, [session])

  const defaultLevels = useMemo<MemberLevelDefinition[]>(
    () =>
      LEVEL_VISUALS.map((level) => ({
        ...level,
        levelName: t(`memberCenter.levels.${level.key}.tab`),
        levelTitle: t(`memberCenter.levels.${level.key}.title`),
        levelDescription: t(`memberCenter.levels.${level.key}.description`),
        summaryText: t(`memberCenter.levels.${level.key}.summary`),
        progressText: t(`memberCenter.levels.${level.key}.progressText`),
        missionText: t(`memberCenter.levels.${level.key}.missionText`),
        missionAction: t(`memberCenter.levels.${level.key}.missionAction`),
        highlightTitle: t(`memberCenter.levels.${level.key}.highlightTitle`),
      })),
    [t],
  )

  const memberLevels = useMemo(
    () => (configuredLevels && configuredLevels.length ? configuredLevels : defaultLevels),
    [configuredLevels, defaultLevels],
  )

  useEffect(() => {
    if (!memberLevels.length) {
      return
    }

    const hasActiveLevel = memberLevels.some((item) => item.key === activeLevelKey)
    if (!hasActiveLevel) {
      setActiveLevelKey(memberLevels[0].key)
    }
  }, [activeLevelKey, memberLevels])

  const activeLevel = useMemo(
    () => memberLevels.find((item) => item.key === activeLevelKey) ?? memberLevels[0],
    [activeLevelKey, memberLevels],
  )

  const benefitUnlockLevelMap = useMemo(() => {
    const unlockMap = new Map<BenefitKey, MemberLevelDefinition>()

    memberLevels
      .slice()
      .sort((left, right) => left.rank - right.rank)
      .forEach((level) => {
        level.benefitKeys.forEach((benefitKey) => {
          if (!unlockMap.has(benefitKey)) {
            unlockMap.set(benefitKey, level)
          }
        })
      })

    return unlockMap
  }, [memberLevels])

  const themeStyle = useMemo(
    () =>
      ({
        '--member-hero-start': activeLevel?.heroStart ?? '#7d6658',
        '--member-hero-mid': activeLevel?.heroMid ?? '#ad8b74',
        '--member-hero-end': activeLevel?.heroEnd ?? '#ede3da',
        '--member-accent': activeLevel?.accent ?? '#8e6547',
        '--member-soft-accent': activeLevel?.softAccent ?? 'rgba(142, 101, 71, 0.16)',
        '--member-card-surface': activeLevel?.cardSurface ?? 'rgba(255, 247, 240, 0.74)',
        '--member-placeholder-tone': activeLevel?.placeholderTone ?? 'rgba(142, 101, 71, 0.18)',
        '--member-glow-color': activeLevel?.glowColor ?? 'rgba(233, 190, 149, 0.42)',
        '--member-spark-color': activeLevel?.sparkColor ?? 'rgba(255, 248, 232, 0.96)',
      }) as CSSProperties,
    [activeLevel],
  )

  const highlightCards = useMemo(
    () =>
      (activeLevel?.highlightKeys ?? []).map((key) => ({
        key,
        title: t(`memberCenter.highlights.${key}.title`),
        description: t(`memberCenter.highlights.${key}.description`),
        action: t(`memberCenter.highlights.${key}.action`),
      })),
    [activeLevel?.highlightKeys, t],
  )

  if (!session) {
    return (
      <main className="member-center-redirect">
        <p>{t('memberCenter.redirecting')}</p>
      </main>
    )
  }

  if (!activeLevel) {
    return null
  }

  const hasEnterpriseMembershipAccess =
    session.profile.roles.includes('DISTRIBUTOR') || merchantApplication?.status === 'APPROVED'

  const realNameStatus = memberProfile?.realNameAuthRecord?.status ?? 'UNSUBMITTED'
  const enterpriseStatus = merchantApplication?.status ?? 'NONE'

  if (isEligibilityLoading) {
    return (
      <main className="member-center-redirect">
        <p>{t('common.loading')}</p>
      </main>
    )
  }

  if (!hasEnterpriseMembershipAccess) {
    return (
      <main className="member-center-page member-center-page--guide" data-level="bronze">
        <div className="member-center-shell">
          <section className="member-center-guide">
            <div className="member-center-guide__layout">
              <div className="member-center-guide__content">
                <div className="member-center-guide__header">
                  <span className="section-kicker">{t('memberCenter.guide.kicker')}</span>
                  <h1>{t('memberCenter.guide.title')}</h1>
                  <p>{t('memberCenter.guide.body')}</p>
                </div>

                <div className="member-center-guide__status-grid">
                  <article className="member-center-guide__status-card">
                    <span>{t('memberCenter.guide.realNameTitle')}</span>
                    <strong>{getStatusLabel(t, realNameStatus)}</strong>
                    <p>{realNameStatus === 'APPROVED' ? session.profile.displayName : t('memberCenter.guide.realNamePending')}</p>
                  </article>
                  <article className="member-center-guide__status-card">
                    <span>{t('memberCenter.guide.enterpriseTitle')}</span>
                    <strong>{getStatusLabel(t, enterpriseStatus)}</strong>
                    <p>{getEnterpriseGuideTip(t, enterpriseStatus)}</p>
                  </article>
                </div>

                <div className="member-center-guide__benefits">
                  <h2>{t('memberCenter.guide.tipsTitle')}</h2>
                  <div className="member-center-guide__benefit-list">
                    <div>{t('memberCenter.guide.benefit1')}</div>
                    <div>{t('memberCenter.guide.benefit2')}</div>
                    <div>{t('memberCenter.guide.benefit3')}</div>
                  </div>
                </div>

                <div className="member-center-guide__actions">
                  <Button href={DISTRIBUTOR_ADMIN_DASHBOARD_URL} type="primary">
                    {t('memberCenter.guide.primaryAction')}
                  </Button>
                  <Button href="/">{t('memberCenter.guide.secondaryAction')}</Button>
                </div>
              </div>

              <aside className="member-center-guide__visual-stage" aria-label={t('memberCenter.guide.visualTitle')}>
                <div className="member-center-guide__visual-orbit member-center-guide__visual-orbit--top" />
                <div className="member-center-guide__visual-orbit member-center-guide__visual-orbit--bottom" />
                <img
                  alt={t('memberCenter.guide.visualHeroTitle')}
                  className="member-center-guide__visual-image member-center-guide__visual-image--hero"
                  src={MEMBER_GUIDE_VISUALS.hero}
                />
                <img
                  alt={t('memberCenter.guide.visualSealTitle')}
                  className="member-center-guide__visual-image member-center-guide__visual-image--seal"
                  src={MEMBER_GUIDE_VISUALS.seal}
                />
                <img
                  alt={t('memberCenter.guide.visualProductTitle')}
                  className="member-center-guide__visual-image member-center-guide__visual-image--product"
                  src={MEMBER_GUIDE_VISUALS.product}
                />
              </aside>
            </div>
          </section>
        </div>
      </main>
    )
  }

  return (
    <main className="member-center-page" data-level={activeLevel.key} style={themeStyle}>
      <div className="member-center-shell">
        <section className="member-center-hero">
          <div className="member-center-hero__backdrop" />
          <div className="member-center-hero__header">
            <div>
              <span className="section-kicker">{t('memberCenter.kicker')}</span>
              <h1>{t('memberCenter.pageTitle')}</h1>
              <p className="member-center-hero__lead">{t('memberCenter.pageLead')}</p>
            </div>
            <div className="member-center-hero__header-actions">
              <Button href={DISTRIBUTOR_ADMIN_DASHBOARD_URL}>{t('memberCenter.actions.goDistributor')}</Button>
              <Button
                onClick={() => {
                  setSession(null)
                }}
                type="primary"
              >
                {t('memberCenter.actions.logout')}
              </Button>
            </div>
          </div>

          <div className="member-level-tabs" role="tablist">
            {memberLevels.map((level) => (
              <button
                key={level.key}
                aria-selected={activeLevel.key === level.key}
                className={`member-level-tabs__item${activeLevel.key === level.key ? ' member-level-tabs__item--active' : ''}`}
                onClick={() => setActiveLevelKey(level.key)}
                type="button"
              >
                {level.levelName}
              </button>
            ))}
          </div>

          <div className="member-level-showcase">
            <article className="member-level-card">
              <div className="member-level-card__content">
                <div className="member-level-card__eyebrow">
                  {t('memberCenter.currentAccount')} {session.profile.displayName}
                </div>
                <h2>{activeLevel.levelTitle}</h2>
                <div className="member-level-card__stars">★★★★★</div>
                <p>{activeLevel.levelDescription}</p>
                <div className="member-level-card__meta">
                  <span>{t('memberCenter.currentPhone')}</span>
                  <strong>{session.profile.phone}</strong>
                </div>
                <div className="member-level-card__progress">
                  <span>{activeLevel.progressText}</span>
                  <Progress percent={activeLevel.progressPercent} showInfo={false} strokeColor="var(--member-accent)" trailColor="rgba(22,32,51,0.08)" />
                </div>
              </div>

              <div className="member-level-card__visual">
                <div className="member-level-card__visual-frame">
                  <img alt="" className="member-level-card__visual-image" src={activeLevel.visualSrc} />
                </div>
              </div>
            </article>

            <aside className="member-level-task">
              <div>
                <span className="member-level-task__label">{t('memberCenter.taskLabel')}</span>
                <strong>{activeLevel.missionText}</strong>
              </div>
              <Button type="primary">{activeLevel.missionAction}</Button>
            </aside>
          </div>
        </section>

        <section className="member-benefits">
          <div className="member-benefits__header">
            <div>
              <span className="section-kicker">{t('memberCenter.benefits.kicker')}</span>
              <h2>{t('memberCenter.benefits.title')}</h2>
            </div>
            <span className="member-benefits__summary">{activeLevel.summaryText}</span>
          </div>

          {(['shopping', 'service', 'travel'] as BenefitGroupKey[]).map((groupKey) => (
            <article className="member-benefit-group" key={groupKey}>
              <header className="member-benefit-group__header">
                <h3>{t(`memberCenter.groups.${groupKey}`)}</h3>
              </header>

              <div className="member-benefit-group__grid">
                {BENEFITS.filter((item) => item.group === groupKey).map((item) => {
                  const isUnlocked = activeLevel.benefitKeys.includes(item.key)
                  const unlockLevel = benefitUnlockLevelMap.get(item.key)

                  return (
                    <div className={`member-benefit-card${isUnlocked ? '' : ' member-benefit-card--locked'}`} key={`${groupKey}-${item.key}`}>
                      <div className="member-benefit-card__icon">{renderBenefitIcon(item.icon)}</div>
                      <strong>{t(`memberCenter.benefits.items.${item.key}.title`)}</strong>
                      <span>{t(`memberCenter.benefits.items.${item.key}.description`)}</span>
                      {isUnlocked ? (
                        <em>{t('memberCenter.benefits.unlocked')}</em>
                      ) : (
                        <em>
                          {t('memberCenter.benefits.unlockAt', {
                            level: unlockLevel?.levelName ?? t('memberCenter.pageTitle'),
                          })}
                        </em>
                      )}
                    </div>
                  )
                })}
              </div>
            </article>
          ))}
        </section>

        <section className="member-highlights">
          <div className="member-highlights__header">
            <div>
              <span className="section-kicker">{t('memberCenter.highlights.kicker')}</span>
              <h2>{activeLevel.highlightTitle}</h2>
            </div>
          </div>

          <div className="member-highlights__grid">
            {highlightCards.map((card) => (
              <article className="member-highlight-card" key={card.key}>
                <div className="member-highlight-card__badge">{activeLevel.levelName}</div>
                <h3>{card.title}</h3>
                <p>{card.description}</p>
                <Button>{card.action}</Button>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}

function getStatusLabel(
  t: (key: string, options?: Record<string, unknown>) => string,
  status: string,
) {
  switch (status) {
    case 'APPROVED':
      return t('memberCenter.guide.approved')
    case 'PENDING':
      return t('memberCenter.guide.pending')
    case 'REJECTED':
      return t('memberCenter.guide.rejected')
    default:
      return t('memberCenter.guide.unsubmitted')
  }
}

function getEnterpriseGuideTip(
  t: (key: string, options?: Record<string, unknown>) => string,
  status: string,
) {
  switch (status) {
    case 'PENDING':
      return t('memberCenter.guide.enterprisePending')
    case 'REJECTED':
      return t('memberCenter.guide.enterpriseRejected')
    default:
      return t('memberCenter.guide.enterpriseNone')
  }
}
