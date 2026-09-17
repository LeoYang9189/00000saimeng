export interface MaterialChannel { key: string; label: string; description: string; width: number; height: number }
export interface MaterialStyle { key: string; label: string; description: string }
export interface AiCapabilities { model: string; textReady: boolean; imageReady: boolean; channels: MaterialChannel[]; styles: MaterialStyle[] }
export interface MaterialRequest { productId: string; channel: string; style: string; notes: string }
export interface MaterialResult {
  id: string
  status: 'WAITING_FOR_KEY' | 'COPY_READY' | 'COMPLETED'
  message: string
  brief: {
    product: { id: string; productName: string; brandName: string; sellingPoint: string; referenceImages: string[] }
    channel: MaterialChannel
    style: MaterialStyle
    notes: string
    prompt: string
  }
  copy: { title: string; subtitle: string; body: string; callToAction: string; tags: string[]; imagePrompt: string } | null
  image: {
    status: string
    message: string
    imageUrls: string[]
    request: { productId: string; productName: string; referenceImages: string[]; width: number; height: number; prompt: string }
  }
}
export interface AiTurn { role: 'user' | 'assistant'; content: string }
export interface KnowledgeSource { id: string; fileName: string; kind: 'MANUAL' | 'MEMORY'; sourceUrl: string }
export interface KnowledgeDocument extends KnowledgeSource { keywords: string; content: string; uploader: string; createdAt: string }
export interface SelectionResult {
  category: string; benchmark: string; summary: string; notice: string; sources: KnowledgeSource[]
  rows: { brand: string; productName: string; marketPrice: string; distributor: string; reason: string; risk: string }[]
}
export interface AnalysisResult {
  productId: string; productName: string; mainImage: string; simulated: boolean; notice: string
  competitorNames: string[]
  metrics: {
    months: { month: string; units: number; price: number }[]
    distributors: { name: string; units: number }[]
    dimensions: string[]; competitorScores: number[][]
  }
  report: null | {
    summary: string; salesAnalysis: string; distributorAnalysis: string; priceAnalysis: string
    detailAnalysis: string; competitorAnalysis: string; strategies: string[]
  }
}
export const WORKBENCH_SKILLS = [
  { key: 'materials', title: 'AI 素材优化', description: '商品变成推广内容', placeholder: '例如：突出原产地与口感，画面不放价格，文案自然一些。' },
  { key: 'copy', title: '商品文案', description: '写清卖点，打动顾客', placeholder: '发来商品名称和真实卖点，再告诉我文案准备发在哪里。' },
  { key: 'selection', title: '智能选品', description: '按品类与品牌对标选品', placeholder: '补充渠道、预算或目标客群，例如：餐饮渠道，优先玻璃瓶，小批量试销。' },
  { key: 'analysis', title: '商品分析', description: '模拟经营图表与运营建议', placeholder: '选填：重点分析价格、分销渠道或详情页改善方向。经营数据为模拟演示。' },
  { key: 'followup', title: '客户跟进', description: '准备下一句沟通', placeholder: '例如：客户看过红酒报价后还没回复，帮我写一段自然、不催促的跟进话术。' },
  { key: 'knowledge', title: '业务问答', description: '先查知识库，再组织答案', placeholder: '例如：魔嘞可乐来自哪里？乐可嗨有哪些口味？圣碧涛的品牌背景是什么？' },
] as const
export type WorkbenchSkillKey = typeof WORKBENCH_SKILLS[number]['key']
export function materialCopyText(result: MaterialResult) {
  if (!result.copy) return ''
  const { title, subtitle, body, callToAction, tags } = result.copy
  return [title, subtitle, body, callToAction, tags.map(tag => tag.startsWith('#') ? tag : `#${tag}`).join(' ')].filter(Boolean).join('\n\n')
}
export function materialBriefText(result: MaterialResult) {
  const { product, channel, style, notes } = result.brief
  return `商品：${product.productName}\n发布渠道：${channel.label}\n目标尺寸：${channel.width} × ${channel.height} px\n风格：${style.label}\n补充要求：${notes || '无'}\n\n创作指令：\n${result.image.request.prompt}`
}
