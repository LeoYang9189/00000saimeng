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
export const WORKBENCH_SKILLS = [
  { key: 'materials', title: 'AI 素材优化', description: '商品变成推广内容', placeholder: '例如：突出原产地与口感，画面不放价格，文案自然一些。' },
  { key: 'copy', title: '商品文案', description: '写清卖点，打动顾客', placeholder: '发来商品名称和真实卖点，再告诉我文案准备发在哪里。' },
  { key: 'selection', title: '智能选品', description: '找到适合渠道的商品', placeholder: '例如：面向社区团购，预算每件 100 元以内。请根据我提供的商品清单给出建议。' },
  { key: 'analysis', title: '商品分析', description: '梳理优势与机会', placeholder: '提供商品资料、售价和目标客群，我会梳理优势、信息缺口与推广方向。' },
  { key: 'followup', title: '客户跟进', description: '准备下一句沟通', placeholder: '例如：客户看过红酒报价后还没回复，帮我写一段自然、不催促的跟进话术。' },
  { key: 'knowledge', title: '业务问答', description: '把复杂问题讲清楚', placeholder: '粘贴商品资料或业务说明，再告诉我你想了解什么。' },
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
