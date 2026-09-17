import { CopyOutlined, DownloadOutlined } from '@ant-design/icons'
import { message } from 'antd'
import { useState } from 'react'
import type { MaterialResult } from '../workbench'
import { materialBriefText, materialCopyText } from '../workbench'

export function ProductImage({ src, name, className = '' }: { src?: string; name: string; className?: string }) {
  const [failedSrc, setFailedSrc] = useState<string>()
  return src && src !== failedSrc ? <img alt={name} className={className} src={src} onError={() => setFailedSrc(src)} />
    : <span className={`shelly-product-empty ${className}`} aria-label={`${name}暂无图片`}>暂无图片</span>
}
function downloadBrief(result: MaterialResult) {
  const contents = [materialBriefText(result), result.copy ? `\n\n宣发文案：\n${materialCopyText(result)}` : '\n\n状态：等待 AI 服务开通，尚未生成文案和图片。'].join('')
  const url = URL.createObjectURL(new Blob([contents], { type: 'text/plain;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `创作需求-${result.brief.product.productName.replace(/[\\/:*?"<>|]/g, '-')}.txt`
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
export function MaterialResultView({ result, onReuse }: { result: MaterialResult; onReuse: (result: MaterialResult) => void }) {
  const [messageApi, contextHolder] = message.useMessage()
  const { product, channel, style, notes } = result.brief
  async function copyText(text: string) {
    try { await navigator.clipboard.writeText(text); void messageApi.success('已复制') }
    catch { void messageApi.error('复制失败，请使用下载按钮保存。') }
  }
  return <div className="shelly-result">
    {contextHolder}
    <div className="shelly-result__summary">
      <ProductImage src={product.referenceImages[0]} name={product.productName} />
      <div><strong>{product.productName}</strong><span>{channel.label} · {style.label}</span><small>{channel.width} × {channel.height} px</small></div>
      <button className="shelly-text-button" onClick={() => onReuse(result)} type="button">调整需求</button>
    </div>
    {notes && <p className="shelly-result__notes">补充要求：{notes}</p>}
    <div className="shelly-result__status shelly-preserve-text" role="status"><span className={result.status === 'COMPLETED' ? 'is-ready' : ''} />{result.message}</div>
    {result.copy && <section className="shelly-result__copy">
      <div className="shelly-result__section-title"><h4>宣发文案</h4><button className="shelly-text-button" type="button" onClick={() => void copyText(materialCopyText(result))}><CopyOutlined />复制文案</button></div>
      <h3>{result.copy.title}</h3>
      {result.copy.subtitle && <p className="shelly-result__subtitle">{result.copy.subtitle}</p>}
      <p className="shelly-preserve-text">{result.copy.body}</p><p>{result.copy.callToAction}</p>
      {result.copy.tags.length > 0 && <p className="shelly-result__tags">{result.copy.tags.map(tag => tag.startsWith('#') ? tag : `#${tag}`).join(' ')}</p>}
    </section>}
    {result.image.imageUrls.length > 0 && <div className="shelly-result__images">{result.image.imageUrls.map(url => <a key={url} href={url} target="_blank" rel="noreferrer"><ProductImage name={`${product.productName}推广素材`} src={url} /><span>打开原图</span></a>)}</div>}
    {!result.copy && <p className="shelly-result__waiting">商品、渠道和风格已整理好。你可以继续调整需求，或下载这份创作说明。</p>}
    <details className="shelly-result__prompt"><summary>查看图片创作指令</summary><p className="shelly-preserve-text">{result.image.request.prompt}</p></details>
    <div className="shelly-result__footer">
      <button className="shelly-text-button" onClick={() => void copyText(materialBriefText(result))} type="button"><CopyOutlined />复制创作需求</button>
      <button className="shelly-text-button" onClick={() => downloadBrief(result)} type="button"><DownloadOutlined />下载需求</button>
    </div>
  </div>
}
