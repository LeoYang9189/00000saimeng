export interface BrandStoryMetric {
  title: string
  description: string
}

export interface BrandStoryTimelineItem {
  period: string
  title: string
  description: string
}

export interface BrandStoryRecord {
  slug: string
  name: string
  category: string
  country: string
  cardSummary: string
  heroEyebrow: string
  heroTitle: string
  heroSummary: string
  heroImagePath: string
  heroImageFileName: string
  heroImageSize: string
  originParagraphs: string[]
  metrics: BrandStoryMetric[]
  timeline: BrandStoryTimelineItem[]
  assortmentTitle: string
  assortmentPoints: string[]
  disclaimer?: string
}

export const BRAND_STORIES: BrandStoryRecord[] = [
  {
    slug: 'san-benedetto',
    name: '圣碧涛',
    category: '天然矿泉水 / 饮料矩阵',
    country: '意大利',
    cardSummary: '从威尼托古老水源出发，把“意式饮品”做成全球化表达。',
    heroEyebrow: 'Brand Story',
    heroTitle: '圣碧涛',
    heroSummary:
      '页面以“古老水源、意式品质、持续创新”作为主线，适合讲品牌历史、进口背书和家庭消费场景。',
    heroImagePath: '/home/brands/brand-san-benedetto-main.jpg',
    heroImageFileName: 'brand-san-benedetto-main.jpg',
    heroImageSize: '1600 x 1200',
    originParagraphs: [
      '公开资料显示，San Benedetto 的品牌叙事起点来自威尼斯北部平原的一处古老水源，品牌以“健康之水”的源头记忆切入，再逐步延伸为更完整的饮品集团故事。',
      '1956 年，Acqua Minerale San Benedetto S.p.A. 在意大利威尼斯斯科尔泽创立。后续品牌一边保持意大利本土识别，一边通过包装、产线和国际合作，把矿泉水扩展成多品类饮品品牌。',
    ],
    metrics: [
      {
        title: '古老水源叙事',
        description: '强调天然过滤、矿物质与健康联想，适合进口水与高品质饮品的首屏表达。',
      },
      {
        title: '意式生活方式',
        description: '从“喝水”延伸到家庭饮品、外出即饮、聚餐场景，气质更克制、更高级。',
      },
      {
        title: '持续创新',
        description: 'PET 包装、无菌灌装、可重复封口等技术节点，能增强品牌的现代感和可信度。',
      },
    ],
    timeline: [
      {
        period: '1956',
        title: '品牌创立',
        description: 'San Benedetto 在意大利威尼斯斯科尔泽成立，品牌名取自 300 米深的古老水源。',
      },
      {
        period: '1971',
        title: '经营跃迁',
        description: '品牌进入更清晰的企业化运营阶段，逐步形成意大利本土资本主导的增长路径。',
      },
      {
        period: '1984',
        title: '包装与国际视野',
        description: '率先推进 PET 包装，并开始签署国际饮料合作协议，打开更大的市场半径。',
      },
      {
        period: '1998',
        title: '即饮创新',
        description: '推出 Push & Pull 可重复封口设计，更贴近日常随身饮用场景。',
      },
      {
        period: '2001 以后',
        title: '海外布局扩展',
        description: '持续向欧洲等市场延展，把品牌从意大利水源故事升级为国际化饮品网络。',
      },
    ],
    assortmentTitle: '适合赛盟商城的讲法',
    assortmentPoints: [
      '首屏主打“意大利天然矿泉水与饮品集团”双重身份。',
      '详情页中段可放经典系列、即饮场景和渠道陈列图。',
      '适合与进口餐饮、家庭囤货、商务接待场景一起呈现。',
    ],
  },
  {
    slug: 'molecola',
    name: '魔嘞可乐',
    category: '意式可乐 / 即饮汽水',
    country: '意大利',
    cardSummary: '从都灵出发，把“意大利自己的可乐替代方案”做成鲜明品牌态度。',
    heroEyebrow: 'Brand Story',
    heroTitle: '魔嘞可乐',
    heroSummary:
      '页面主线围绕“都灵、意大利替代、无塑包装、年轻表达”展开，更适合做个性化进口汽水品牌故事。',
    heroImagePath: '/home/brands/brand-molecola-main.jpg',
    heroImageFileName: 'brand-molecola-main.jpg',
    heroImageSize: '1600 x 1200',
    originParagraphs: [
      '公开资料显示，MoleCola 的创意在 2012 年前后于都灵形成，灵感来自一本 1854 年的皮埃蒙特食谱。品牌从一开始就不是在复制传统可乐，而是在强调“完全意大利”的另一种选择。',
      '它的品牌气质很清楚：更本土、更有主张，也更愿意把包装、环保和设计语言一起做成记忆点。这种表达很适合进口零售页面里的“年轻化单品牌故事”。',
    ],
    metrics: [
      {
        title: '都灵起源',
        description: '品牌故事与城市识别绑定，天然带出意大利制造与地方文化感。',
      },
      {
        title: '意大利替代方案',
        description: '“另一种可乐选择”是最清晰的购买理由，利于电商页快速建立差异。',
      },
      {
        title: '无塑包装主张',
        description: '品牌官网明确强调 without plastic，适合延展环保与现代消费观表达。',
      },
    ],
    timeline: [
      {
        period: '2012',
        title: '灵感在都灵形成',
        description: '品牌创意取材于 1854 年皮埃蒙特食谱，确立“完全意大利可乐”的方向。',
      },
      {
        period: '品牌早期',
        title: '建立差异化定位',
        description: '用意大利原产、设计识别和本土风味，形成与传统国际可乐不同的品牌认知。',
      },
      {
        period: '包装升级期',
        title: '强化无塑表达',
        description: '围绕 glass / aluminium 等可回收材质表达环保立场，增强品牌价值感。',
      },
      {
        period: '产品扩展期',
        title: '形成多口味家族',
        description: '从经典款延展到无糖、无咖啡因及更多细分版本，覆盖更广的即饮人群。',
      },
    ],
    assortmentTitle: '适合赛盟商城的讲法',
    assortmentPoints: [
      '首页与详情页都应该突出“意大利可乐，不走大众模板”的差异点。',
      '适合搭配餐酒、零食、轻餐等进口场景一起陈列，形成年轻化气氛。',
      '后续可补品牌包装特写和餐桌场景图，强化视觉识别。',
    ],
  },
  {
    slug: 'lekohi-soymilk',
    name: '乐可嗨豆奶',
    category: '豆奶 / 植物蛋白饮品',
    country: '待补充',
    cardSummary: '当前先按正式详情页结构预留，后续可直接替换官方品牌资料与视觉素材。',
    heroEyebrow: 'Brand Story',
    heroTitle: '乐可嗨豆奶',
    heroSummary:
      '这个页面先做成可直接交付的品牌故事结构页：先承接品牌名与品类气质，再为后续补充官方资料预留完整内容位。',
    heroImagePath: '/home/brands/brand-lekohi-soymilk-main.jpg',
    heroImageFileName: 'brand-lekohi-soymilk-main.jpg',
    heroImageSize: '1600 x 1200',
    originParagraphs: [
      '主人指定了“乐可嗨豆奶”作为第三个品牌，但当前公开可稳定检索到的官方资料非常有限，暂时无法像前两个品牌一样给出可核验的创立年份、公司沿革和正式里程碑。',
      '所以这个详情页先按“可替换的正式结构”搭建：保留品牌主视觉、品牌主张、品类卖点、时间线和陈列建议。后续只要补齐官方资料和图片，就能直接替换成完整品牌页。',
    ],
    metrics: [
      {
        title: '植物蛋白感知',
        description: '突出豆奶的轻负担、日常补给和早餐搭配属性，让用户先理解品类价值。',
      },
      {
        title: '即饮消费场景',
        description: '适合围绕早餐、通勤、轻餐、家庭囤货等高频场景去组织页面内容。',
      },
      {
        title: '可快速替换资料',
        description: '当前所有模块都已预留成品结构，拿到品牌官方素材后可以直接落版替换。',
      },
    ],
    timeline: [
      {
        period: '待补充',
        title: '品牌起点资料待确认',
        description: '建议后续补充品牌创立年份、原产地、所属公司或代理信息。',
      },
      {
        period: '待补充',
        title: '产品线资料待确认',
        description: '建议补充原味、低糖、高钙或其他主推口味，形成更完整的产品故事。',
      },
      {
        period: '待补充',
        title: '渠道与市场资料待确认',
        description: '建议补充分销渠道、核心消费人群和销售区域，用于强化招商与零售表达。',
      },
    ],
    assortmentTitle: '适合赛盟商城的讲法',
    assortmentPoints: [
      '先用“豆奶 / 植物蛋白 / 早餐即饮”建立基础认知。',
      '等主人补齐资料后，再替换为正式的品牌起源、工艺、产地与系列矩阵。',
      '当前图片位和文案位已经留好，不需要再改页面结构。',
    ],
    disclaimer: '当前公开资料不足，本页为正式结构占位版，后续可替换为品牌官方故事。',
  },
]

export const BRAND_STORY_MAP = Object.fromEntries(BRAND_STORIES.map((item) => [item.slug, item])) as Record<
  string,
  BrandStoryRecord
>
