import {
  HistoryOutlined,
  PictureOutlined,
  ProfileOutlined,
  SendOutlined,
} from '@ant-design/icons'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import {
  faBagShopping,
  faBookOpen,
  faBoxesStacked,
  faClipboardList,
  faCoins,
  faFolderOpen,
  faLightbulb,
  faPalette,
  faPlus,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { message } from 'antd'
import { useMemo, useState } from 'react'

type SkillTypeFilter = 'all' | 'official' | 'workflow' | 'skill'

interface WorkbenchSkillItem {
  categoryKey: string
  description: string
  guideDescription: string
  guideTitle: string
  icon: IconDefinition
  key: string
  placeholder: string
  sceneLabel: string
  skillType: Exclude<SkillTypeFilter, 'all'>
  toneClassName: string
  title: string
}

interface QuickSkillItem {
  icon: IconDefinition
  key: string
  label: string
  toneClassName: string
}

interface SkillFilterItem<TValue extends string> {
  key: TValue
  label: string
}

const DEFAULT_PLACEHOLDER = '试试这么问我：“输入1688商品链接+优化图片”，AI 帮您完成修改'

const skillTypeFilters: SkillFilterItem<SkillTypeFilter>[] = [
  { key: 'all', label: '全部' },
  { key: 'official', label: '官方应用' },
  { key: 'workflow', label: '工作流' },
  { key: 'skill', label: '技能' },
]

const sceneFilters: SkillFilterItem<string>[] = [
  { key: 'all', label: '全部' },
  { key: 'selection', label: '智能选品' },
  { key: 'materials', label: '爆款素材' },
  { key: 'knowledge', label: '知识库' },
  { key: 'distribution', label: '分销铺货' },
  { key: 'creative', label: '创意设计' },
  { key: 'business', label: '经营参谋' },
  { key: 'orders', label: '订单管家' },
]

const workbenchSkillItems: WorkbenchSkillItem[] = [
  {
    key: 'combo',
    title: 'AI组货打爆',
    categoryKey: 'materials',
    sceneLabel: '爆款素材',
    skillType: 'workflow',
    description: 'AI 组合商品、测算利润并输出更适合分销的组货方案。',
    guideTitle: '帮我把一批商品组合成更容易出单的分销爆款：',
    guideDescription: '输入 2-6 个商品链接或商品关键词，我会自动优化组合、定价和卖点结构。',
    placeholder: '输入要组合的商品链接、关键词或你想主推的方向',
    icon: faBoxesStacked,
    toneClassName: 'ai-workbench__icon-tone--blue',
  },
  {
    key: 'creation',
    title: 'AI创作爆品',
    categoryKey: 'materials',
    sceneLabel: '爆款素材',
    skillType: 'official',
    description: 'AI 精修 1688 商品链接，自动优化标题、卖点与 sku 组合。',
    guideTitle: '帮我把1688商品打造成爆款链接：',
    guideDescription: '输入 1-4 个 1688 商品链接，自动优化标题、主图表达和商品组合逻辑。',
    placeholder: '输入 1688 商品链接、卖点方向或你想优化的重点',
    icon: faFolderOpen,
    toneClassName: 'ai-workbench__icon-tone--blue',
  },
  {
    key: 'selection',
    title: 'AI选品',
    categoryKey: 'selection',
    sceneLabel: '智能选品',
    skillType: 'official',
    description: '结合渠道、利润和市场热度，筛出适合当前阶段的主推商品。',
    guideTitle: '告诉我你的渠道和目标，我来帮你筛选更适合的商品：',
    guideDescription: '输入渠道类型、利润目标和主推方向，我会优先挑出更值得上架的商品。',
    placeholder: '例如：我要做东南亚分销，想找高复购、轻物流的饮品类商品',
    icon: faBagShopping,
    toneClassName: 'ai-workbench__icon-tone--orange',
  },
  {
    key: 'knowledge',
    title: 'AI知识库',
    categoryKey: 'knowledge',
    sceneLabel: '知识库',
    skillType: 'skill',
    description: '沉淀品牌、商品和流程知识，方便团队随时检索和调用。',
    guideTitle: '把你的问题交给知识库，我来帮你快速定位答案：',
    guideDescription: '输入商品资料、业务流程或品牌知识问题，我会结合沉淀内容直接给出答案。',
    placeholder: '例如：赛盟商城的品牌故事页有哪些核心卖点可以复用到招商物料？',
    icon: faBookOpen,
    toneClassName: 'ai-workbench__icon-tone--purple',
  },
  {
    key: 'image',
    title: 'AI素材优化',
    categoryKey: 'creative',
    sceneLabel: '创意设计',
    skillType: 'official',
    description: '针对图片、卖点图和详情图做统一优化，提升点击与转化。',
    guideTitle: '把现有素材交给我，我来帮你优化成更能转化的版本：',
    guideDescription: '输入素材目标、适用渠道和品牌语气，我会重组表达、强化卖点层级。',
    placeholder: '例如：把这套产品图改成适合平台招商的蓝色冷调风格',
    icon: faPalette,
    toneClassName: 'ai-workbench__icon-tone--gold',
  },
  {
    key: 'order',
    title: 'AI批量询单',
    categoryKey: 'orders',
    sceneLabel: '订单管家',
    skillType: 'workflow',
    description: '批量生成询单和跟进提醒，减少重复沟通成本。',
    guideTitle: '把待跟进订单和询盘交给我，我来批量整理：',
    guideDescription: '输入订单状态、客户要求或跟进节点，我会自动生成更适合的询单和提醒内容。',
    placeholder: '例如：帮我整理本周待跟进询盘，并输出一版统一催付话术',
    icon: faClipboardList,
    toneClassName: 'ai-workbench__icon-tone--mint',
  },
  {
    key: 'report',
    title: 'AI商机报告',
    categoryKey: 'business',
    sceneLabel: '经营参谋',
    skillType: 'official',
    description: '自动分析重点商机、询盘质量和转化走势，输出跟进建议。',
    guideTitle: '我来帮你分析近期商机，把重点机会挑出来：',
    guideDescription: '输入阶段数据或关注品类，我会整理关键商机、异常点和优先动作建议。',
    placeholder: '例如：帮我分析本周饮料类询盘，找出最值得追的客户',
    icon: faLightbulb,
    toneClassName: 'ai-workbench__icon-tone--green',
  },
  {
    key: 'analysis',
    title: 'AI商品分析',
    categoryKey: 'business',
    sceneLabel: '经营参谋',
    skillType: 'skill',
    description: '从价格、利润、卖点和竞争格局分析商品竞争力。',
    guideTitle: '把商品发给我，我帮你拆解竞争力和利润空间：',
    guideDescription: '输入商品链接、价格区间或对标对象，我会快速给出商品分析和策略建议。',
    placeholder: '例如：分析这款豆奶在平台招商场景里的利润和竞争力',
    icon: faCoins,
    toneClassName: 'ai-workbench__icon-tone--purple',
  },
]

const quickSkills: QuickSkillItem[] = [
  { key: 'selection', label: 'AI选品', icon: faBagShopping, toneClassName: 'ai-workbench__icon-tone--orange' },
  { key: 'creation', label: 'AI创作爆品', icon: faFolderOpen, toneClassName: 'ai-workbench__icon-tone--blue' },
  { key: 'image', label: 'AI素材优化', icon: faPalette, toneClassName: 'ai-workbench__icon-tone--gold' },
  { key: 'report', label: 'AI商机报告', icon: faLightbulb, toneClassName: 'ai-workbench__icon-tone--green' },
  { key: 'analysis', label: 'AI商品分析', icon: faCoins, toneClassName: 'ai-workbench__icon-tone--purple' },
  { key: 'order', label: 'AI批量询单', icon: faClipboardList, toneClassName: 'ai-workbench__icon-tone--mint' },
  { key: 'knowledge', label: 'AI知识库', icon: faBookOpen, toneClassName: 'ai-workbench__icon-tone--purple' },
  { key: 'all', label: '全部技能', icon: faPlus, toneClassName: 'ai-workbench__icon-tone--neutral' },
]

/**
 * AI 工作台首页。
 */
export function AiWorkbenchPage() {
  const [draft, setDraft] = useState('')
  const [isSkillCenterOpen, setIsSkillCenterOpen] = useState(false)
  const [selectedSkillKey, setSelectedSkillKey] = useState<string | null>(null)
  const [activeSkillType, setActiveSkillType] = useState<SkillTypeFilter>('all')
  const [activeSceneKey, setActiveSceneKey] = useState('all')
  const [searchInput, setSearchInput] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')

  const selectedSkill = useMemo(
    () => workbenchSkillItems.find((item) => item.key === selectedSkillKey) ?? null,
    [selectedSkillKey],
  )

  const filteredSkillItems = useMemo(() => {
    return workbenchSkillItems.filter((item) => {
      const matchesSkillType = activeSkillType === 'all' || item.skillType === activeSkillType
      const matchesScene = activeSceneKey === 'all' || item.categoryKey === activeSceneKey
      const matchesKeyword =
        !searchKeyword.trim() ||
        `${item.title}${item.description}${item.sceneLabel}`.toLowerCase().includes(searchKeyword.trim().toLowerCase())

      return matchesSkillType && matchesScene && matchesKeyword
    })
  }, [activeSceneKey, activeSkillType, searchKeyword])

  function handleSubmit() {
    if (!draft.trim()) {
      void message.info('请输入想交给 Shelly 的任务')
      return
    }

    void message.info('AI工作流待接入，当前先完成页面交互效果')
  }

  function activateSkill(skill: WorkbenchSkillItem) {
    setSelectedSkillKey(skill.key)
    setDraft('')
    setIsSkillCenterOpen(false)
  }

  function handleQuickSkillClick(skillKey: string) {
    if (skillKey === 'all') {
      setIsSkillCenterOpen(true)
      return
    }

    const targetSkill = workbenchSkillItems.find((item) => item.key === skillKey)
    if (!targetSkill) {
      return
    }

    activateSkill(targetSkill)
  }

  function handleSearch() {
    setSearchKeyword(searchInput)
  }

  function clearSelectedSkill() {
    setSelectedSkillKey(null)
    setDraft('')
  }

  return (
    <div className="ai-workbench">
      <section className="ai-workbench__hero">
        <div className="ai-workbench__headline">
          <img alt="Shelly AI助手" className="ai-workbench__avatar" src="/AI.png" />
          <h2>
            <span>我是Shelly，</span>
            <span className="ai-workbench__headline-highlight">
              <strong>你的AI生意助手</strong>
              <span aria-hidden="true" className="ai-workbench__headline-rays">
                <i />
                <i />
                <i />
              </span>
              <span aria-hidden="true" className="ai-workbench__headline-curve" />
            </span>
          </h2>
        </div>

        <div className="ai-workbench__composer">
          <div className={`ai-workbench__input-shell${selectedSkill ? ' ai-workbench__input-shell--selected' : ''}`}>
            {selectedSkill ? (
              <div className="ai-workbench__guide">
                <strong>{selectedSkill.guideTitle}</strong>
                <p>{selectedSkill.guideDescription}</p>
              </div>
            ) : null}

            <textarea
              className={`ai-workbench__textarea${selectedSkill ? ' ai-workbench__textarea--selected' : ''}`}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={selectedSkill?.placeholder ?? DEFAULT_PLACEHOLDER}
              value={draft}
            />

            <div className="ai-workbench__toolbar">
              <div className="ai-workbench__toolbar-left">
                {selectedSkill ? (
                  <button className="ai-workbench__selected-skill" onClick={() => setIsSkillCenterOpen(true)} type="button">
                    <span className={`ai-workbench__selected-skill-icon ${selectedSkill.toneClassName}`}>
                      <FontAwesomeIcon icon={selectedSkill.icon} />
                    </span>
                    <span>{selectedSkill.title}</span>
                    <span
                      className="ai-workbench__selected-skill-close"
                      onClick={(event) => {
                        event.stopPropagation()
                        clearSelectedSkill()
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      ×
                    </span>
                  </button>
                ) : (
                  <button
                    className={`ai-workbench__plus-trigger${isSkillCenterOpen ? ' ai-workbench__plus-trigger--active' : ''}`}
                    onClick={() => setIsSkillCenterOpen((current) => !current)}
                    type="button"
                  >
                    <FontAwesomeIcon icon={faPlus} />
                  </button>
                )}
              </div>

              <div className="ai-workbench__actions">
                <button className="ai-workbench__tool-button" onClick={() => void message.info('会话能力待接入')} type="button">
                  <ProfileOutlined />
                </button>
                <button className="ai-workbench__tool-button" onClick={() => void message.info('图片能力待接入')} type="button">
                  <PictureOutlined />
                </button>
                <button className="ai-workbench__tool-button" onClick={() => void message.info('历史能力待接入')} type="button">
                  <HistoryOutlined />
                </button>
                <button className="ai-workbench__send" onClick={handleSubmit} type="button">
                  <SendOutlined />
                </button>
              </div>
            </div>
          </div>

          <div className="ai-workbench__tip-bar">
            <span>{selectedSkill ? `${selectedSkill.title} 已就绪，继续补充你的任务目标、商品链接或渠道要求。` : '“+风险监测”，AI监测履约风险，批量催发提醒'}</span>
          </div>
        </div>
      </section>

      {isSkillCenterOpen ? (
        <section className="ai-skill-center">
          <aside className="ai-skill-center__sidebar">
            <button className="ai-skill-center__nav-item ai-skill-center__nav-item--active" type="button">
              <FontAwesomeIcon icon={faPlus} />
              <span>全部技能</span>
            </button>
          </aside>

          <div className="ai-skill-center__content">
            <div className="ai-skill-center__header">
              <div>
                <h3>技能中心</h3>
                <p>发现和管理你的 AI 技能，开启后即可在首页直接使用</p>
              </div>

              <div className="ai-skill-center__search">
                <input
                  onChange={(event) => setSearchInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      handleSearch()
                    }
                  }}
                  placeholder="搜索您想要的智能体"
                  value={searchInput}
                />
                <button onClick={handleSearch} type="button">
                  搜索
                </button>
              </div>
            </div>

            <div className="ai-skill-center__section-title">
              <strong>全部技能</strong>
            </div>

            <div className="ai-skill-center__filters">
              <div className="ai-skill-center__filter-row">
                <span className="ai-skill-center__filter-label">技能类型</span>
                <div className="ai-skill-center__chips">
                  {skillTypeFilters.map((filter) => (
                    <button
                      className={`ai-skill-center__chip${filter.key === activeSkillType ? ' ai-skill-center__chip--active' : ''}`}
                      key={filter.key}
                      onClick={() => setActiveSkillType(filter.key)}
                      type="button"
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="ai-skill-center__filter-row">
                <span className="ai-skill-center__filter-label">场景分类</span>
                <div className="ai-skill-center__chips">
                  {sceneFilters.map((filter) => (
                    <button
                      className={`ai-skill-center__chip${filter.key === activeSceneKey ? ' ai-skill-center__chip--active' : ''}`}
                      key={filter.key}
                      onClick={() => setActiveSceneKey(filter.key)}
                      type="button"
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="ai-skill-center__cards">
              {filteredSkillItems.map((item) => (
                <article className="ai-skill-card" key={item.key}>
                  <div className="ai-skill-card__top">
                    <span className="ai-skill-card__badge">官方应用</span>
                  </div>

                  <div className="ai-skill-card__main">
                    <span className={`ai-skill-card__icon ${item.toneClassName}`}>
                      <FontAwesomeIcon icon={item.icon} />
                    </span>
                    <div className="ai-skill-card__title-group">
                      <strong>{item.title}</strong>
                      <span>蓝色工作台出品 | {item.sceneLabel}</span>
                    </div>
                  </div>

                  <div className="ai-skill-card__meta">{item.sceneLabel}</div>
                  <p>{item.description}</p>

                  <button className="ai-skill-card__action" onClick={() => activateSkill(item)} type="button">
                    立即启动
                  </button>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : (
        <section className="ai-workbench__quick-skills">
          {quickSkills.map((skill) => (
            <button
              className={`ai-workbench__quick-skill${skill.key === 'all' ? ' ai-workbench__quick-skill--all' : ''}`}
              key={skill.key}
              onClick={() => handleQuickSkillClick(skill.key)}
              type="button"
            >
              <span className={`ai-workbench__quick-skill-icon ${skill.toneClassName}`}>
                <FontAwesomeIcon icon={skill.icon} />
              </span>
              <strong>{skill.label}</strong>
            </button>
          ))}
        </section>
      )}
    </div>
  )
}
