import { ArrowUpOutlined, CheckOutlined, CloseOutlined, LoadingOutlined, PlusOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons'
import { Input, Modal, Popover } from 'antd'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { createAiMaterial, getAiWorkbench, getCatalogBootstrap, sendAiMessage } from '../api'
import { MaterialResultView, ProductImage } from '../components/MaterialResultView'
import { getStoredOperatorSession } from '../session'
import type { CatalogProductRecord } from '../types'
import { materialCopyText, WORKBENCH_SKILLS } from '../workbench'
import type { AiCapabilities, AiTurn, MaterialResult, WorkbenchSkillKey } from '../workbench'
import './AiWorkbenchPage.css'

interface ConversationEntry {
  id: string
  userText: string
  assistantText?: string
  material?: MaterialResult
  error?: string
}

function readConversation(key: string): ConversationEntry[] {
  try {
    const value: unknown = JSON.parse(sessionStorage.getItem(key) || '[]')
    return Array.isArray(value) ? value.filter(item => item && typeof item.id === 'string' && typeof item.userText === 'string').slice(-12) : []
  } catch { return [] }
}

export function AiWorkbenchPage() {
  const storageKey = `saimeng-ai-conversation-v1-${getStoredOperatorSession()?.profile.userId ?? 'anonymous'}`
  const [entries, setEntries] = useState<ConversationEntry[]>(() => readConversation(storageKey))
  const [selectedSkill, setSelectedSkill] = useState<WorkbenchSkillKey | null>(null)
  const [draft, setDraft] = useState('')
  const [capabilities, setCapabilities] = useState<AiCapabilities | null>(null)
  const [products, setProducts] = useState<CatalogProductRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [skillsOpen, setSkillsOpen] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [productId, setProductId] = useState('')
  const [channelKey, setChannelKey] = useState('')
  const [styleKey, setStyleKey] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const composerRef = useRef<HTMLFormElement>(null)
  const latestEntryRef = useRef<HTMLElement>(null)
  const inFlight = useRef(false)
  const mounted = useRef(true)
  const requestController = useRef<AbortController | null>(null)

  const loadData = useCallback(() => {
    return Promise.all([getAiWorkbench(), getCatalogBootstrap()]).then(([status, catalog]) => {
      if (!mounted.current) return
      setCapabilities(status)
      setProducts(catalog.products.filter(product => product.enabled && product.auditStatus === 'APPROVED'))
    }).catch((error: unknown) => {
      if (mounted.current) setLoadError(error instanceof Error ? error.message : '工作台加载失败，请重试。')
    }).finally(() => { if (mounted.current) setLoading(false) })
  }, [])

  useEffect(() => {
    mounted.current = true
    void loadData()
    return () => { mounted.current = false; requestController.current?.abort() }
  }, [loadData])
  useEffect(() => {
    try { sessionStorage.setItem(storageKey, JSON.stringify(entries.slice(-12))) } catch { /* Storage limits must not block work. */ }
  }, [entries, storageKey])
  useEffect(() => {
    latestEntryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [entries.length])

  const skill = WORKBENCH_SKILLS.find(item => item.key === selectedSkill)
  const isMaterial = selectedSkill === 'materials'
  const product = products.find(item => item.id === productId)
  const channel = capabilities?.channels.find(item => item.key === channelKey)
  const style = capabilities?.styles.find(item => item.key === styleKey)
  const filteredProducts = useMemo(() => {
    const search = query.trim().toLowerCase()
    return products.filter(item => `${item.productName} ${item.brandName} ${item.productCode} ${item.categoryName}`.toLowerCase().includes(search))
  }, [products, query])
  const canSubmit = !submitting && !loading && !loadError && (isMaterial ? Boolean(product && channel && style) : Boolean(draft.trim()))

  function activateSkill(key: WorkbenchSkillKey | null) {
    if (submitting) return
    setSelectedSkill(key)
    setSkillsOpen(false)
    setFormError('')
    if (key === 'materials') composerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    else textareaRef.current?.focus()
  }
  function reuseMaterial(result: MaterialResult) {
    if (submitting) return
    setSelectedSkill('materials')
    setProductId(result.brief.product.id)
    setChannelKey(result.brief.channel.key)
    setStyleKey(result.brief.style.key)
    setDraft(result.brief.notes)
    setFormError('')
    composerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  async function handleSubmit(event?: FormEvent) {
    event?.preventDefault()
    if (inFlight.current) return
    if (!canSubmit) {
      setFormError(isMaterial ? '请依次选择商品、发布渠道和视觉风格。' : '请先描述你想完成的任务。')
      return
    }
    setFormError('')
    inFlight.current = true
    setSubmitting(true)
    const controller = new AbortController()
    requestController.current = controller
    const id = crypto.randomUUID()
    const notes = draft.trim()
    const userText = isMaterial && product && channel && style
      ? `为「${product.productName}」制作${channel.label}，采用${style.label}风格。${notes ? `\n${notes}` : ''}` : notes
    const history: AiTurn[] = entries.filter(entry => !entry.error && (entry.assistantText || entry.material?.copy)).slice(-6).flatMap(entry => [
      { role: 'user' as const, content: entry.userText.slice(0, 12000) },
      { role: 'assistant' as const, content: (entry.assistantText || (entry.material ? materialCopyText(entry.material) : '')).slice(0, 12000) },
    ])
    setEntries(current => [...current, { id, userText }].slice(-12))
    try {
      if (isMaterial) {
        const material = await createAiMaterial({ productId, channel: channelKey, style: styleKey, notes }, controller.signal)
        if (mounted.current) setEntries(current => current.map(entry => entry.id === id ? { ...entry, material } : entry))
      } else {
        const reply = await sendAiMessage(selectedSkill || 'general', notes, history, controller.signal)
        if (mounted.current) setEntries(current => current.map(entry => entry.id === id ? { ...entry, assistantText: reply.content } : entry))
      }
      if (mounted.current) setDraft('')
    } catch (error) {
      if (mounted.current) setEntries(current => current.map(entry => entry.id === id ? { ...entry, error: error instanceof Error ? error.message : '请求失败，请重试。' } : entry))
    } finally {
      inFlight.current = false
      if (mounted.current) setSubmitting(false)
    }
  }

  return <div className={`shelly-workspace${entries.length ? ' shelly-workspace--conversation' : ''}${isMaterial ? ' shelly-workspace--material' : ''}`}>
    <div className="shelly-workspace__topline"><span>Shelly · 运营助手</span><button type="button" className="shelly-text-button" disabled={submitting || !entries.length} onClick={() => { setEntries([]); setDraft(''); setFormError('') }}><PlusOutlined />新建对话</button></div>
    <header className="shelly-intro">
      <img src="/AI.png" alt="Shelly" className="shelly-intro__avatar" />
      <div><h2>{entries.length ? '把想法，继续往前一步。' : '今天，想为生意做点什么？'}</h2><p>选一件商品，把灵感变成下一份推广内容。</p></div>
    </header>
    {entries.length > 0 && <section className="shelly-conversation" aria-label="对话记录" aria-live="polite">
      {entries.map((entry, index) => <article className="shelly-exchange" key={entry.id} ref={index === entries.length - 1 ? latestEntryRef : undefined}>
        <p className="shelly-user-message">{entry.userText}</p>
        <div className="shelly-assistant-heading"><img alt="" src="/AI.png" /><strong>Shelly</strong><span>{entry.material ? '素材创作' : '运营助手'}</span></div>
        {entry.material ? <MaterialResultView result={entry.material} onReuse={reuseMaterial} />
          : entry.error ? <div className="shelly-error" role="alert">{entry.error}<span>输入内容仍保留在下方，可以修改后重新发送。</span></div>
            : entry.assistantText ? <div className="shelly-assistant-message shelly-preserve-text">{entry.assistantText}</div>
              : <div className="shelly-thinking"><LoadingOutlined />{submitting ? '正在整理内容，请稍候…' : '上次生成已中断，请重新提交。'}</div>}
      </article>)}
    </section>}
    <form className={`shelly-composer${isMaterial ? ' shelly-composer--material' : ''}`} onSubmit={event => void handleSubmit(event)} ref={composerRef}>
      {skill && <div className="shelly-active-skill"><img src={`/ai-skills/${skill.key}.png`} alt="" /><strong>{skill.title}</strong><span>{isMaterial ? '选好商品和发布方式，剩下的交给我。' : skill.description}</span><button type="button" aria-label="取消当前技能" disabled={submitting} onClick={() => activateSkill(null)}><CloseOutlined /></button></div>}
      {isMaterial && <div className="shelly-material-form">
        <fieldset disabled={submitting || loading || Boolean(loadError)}>
          <legend><span>01</span>选择商品</legend>
          <button className={`shelly-product-trigger${product ? ' is-selected' : ''}`} type="button" onClick={() => { setQuery(''); setPickerOpen(true) }}>
            {product ? <><ProductImage src={product.thumbnailImage || product.mainImage} name={product.productName} /><span><strong>{product.productName}</strong><small>{product.brandName || product.categoryName} · {product.productCode || '商品库'}</small></span><em>更换商品</em></>
              : <><SearchOutlined /><span><strong>从商品库中选择</strong><small>自动带入商品图片、品牌与卖点</small></span><PlusOutlined /></>}
          </button>
        </fieldset>
        <fieldset disabled={submitting || !product}>
          <legend><span>02</span>发布渠道<small>这份内容准备发在哪里？</small></legend>
          <div className="shelly-channel-options" role="group" aria-label="发布渠道">{capabilities?.channels.map(item => <button aria-pressed={channelKey === item.key} className={channelKey === item.key ? 'is-selected' : ''} key={item.key} onClick={() => { setChannelKey(item.key); setFormError('') }} type="button"><span aria-hidden="true" className={`shelly-format shelly-format--${item.key.toLowerCase()}`} /><strong>{item.label}</strong><small>{item.description}</small>{channelKey === item.key && <CheckOutlined className="shelly-option-check" />}</button>)}</div>
        </fieldset>
        <fieldset disabled={submitting || !channel}>
          <legend><span>03</span>视觉风格<small>为商品选一种合适的表达</small></legend>
          <div className="shelly-style-options" role="group" aria-label="视觉风格">{capabilities?.styles.map(item => <button key={item.key} aria-pressed={styleKey === item.key} className={styleKey === item.key ? 'is-selected' : ''} onClick={() => { setStyleKey(item.key); setFormError('') }} title={item.description} type="button"><span aria-hidden="true" className={`shelly-swatch shelly-swatch--${item.key.toLowerCase()}`} />{item.label}{styleKey === item.key && <CheckOutlined />}</button>)}</div>
          {style && <p className="shelly-style-description">{style.description}{channel && ` · ${channel.width} × ${channel.height} px`}</p>}
        </fieldset>
      </div>}
      <label className="shelly-draft-label" htmlFor="shelly-draft">{isMaterial ? '补充要求（选填）' : '描述你的任务'}</label>
      <textarea id="shelly-draft" ref={textareaRef} className="shelly-draft" value={draft} disabled={submitting} maxLength={isMaterial ? 2000 : 4000} rows={isMaterial ? 2 : 3} onChange={event => setDraft(event.target.value)} placeholder={skill?.placeholder || '说说你的任务，或从下方选择一个技能开始。'} onKeyDown={event => { if (event.key === 'Enter' && (event.ctrlKey || event.metaKey) && !event.nativeEvent.isComposing) { event.preventDefault(); void handleSubmit() } }} />
      {formError && <p className="shelly-form-error" role="alert">{formError}</p>}
      {loadError && <div className="shelly-load-error" role="alert"><span>工作台暂时无法加载，请重试。</span><button className="shelly-text-button" onClick={() => { setLoading(true); setLoadError(''); void loadData() }} type="button"><ReloadOutlined />重新加载</button></div>}
      <div className="shelly-composer__toolbar">
        <Popover trigger="click" placement="bottomLeft" open={skillsOpen} onOpenChange={setSkillsOpen} content={<div className="shelly-skill-menu">{WORKBENCH_SKILLS.map(item => <button key={item.key} type="button" disabled={submitting} onClick={() => activateSkill(item.key)}><img src={`/ai-skills/${item.key}.png`} alt="" /><span><strong>{item.title}</strong><small>{item.description}</small></span>{selectedSkill === item.key && <CheckOutlined />}</button>)}</div>}>
          <button className="shelly-add-skill" type="button" disabled={submitting} aria-expanded={skillsOpen}><PlusOutlined />{skill ? '切换技能' : '添加技能'}</button>
        </Popover>
        <div className="shelly-composer__send-area"><span>{submitting ? '正在生成' : 'Ctrl / ⌘ + Enter'}</span><button className="shelly-send" type="submit" disabled={!canSubmit} aria-label={isMaterial ? '提交素材创作需求' : '发送消息'} title={isMaterial ? '提交素材创作需求' : '发送消息'}>{submitting ? <LoadingOutlined /> : <ArrowUpOutlined />}</button></div>
      </div>
    </form>
    <div className="shelly-composer-note">{loading ? '正在连接商品库…' : !capabilities?.textReady && !loadError ? 'AI 服务待开通，可以先整理素材创作需求。' : isMaterial ? '参考商品资料生成内容，发布前请核对。' : '给出具体目标和资料，回答会更贴近你的业务。'}</div>
    <section className="shelly-skills" aria-label="快捷技能">{WORKBENCH_SKILLS.map(item => <button key={item.key} className={selectedSkill === item.key ? 'is-selected' : ''} disabled={submitting} onClick={() => activateSkill(item.key)} aria-pressed={selectedSkill === item.key} type="button"><img src={`/ai-skills/${item.key}.png`} alt="" /><strong>{item.title}</strong><span>{item.description}</span></button>)}</section>
    <Modal title="选择商品" open={pickerOpen} footer={null} width={760} onCancel={() => setPickerOpen(false)} destroyOnHidden>
      <div className="shelly-product-picker"><p>选择一件已启用且审核通过的商品，图片与卖点会自动带入创作需求。</p><Input aria-label="搜索商品" prefix={<SearchOutlined />} placeholder="搜索商品名称、品牌或编码" allowClear value={query} onChange={event => setQuery(event.target.value)} />
        <div className="shelly-product-grid">{filteredProducts.map(item => <button className={productId === item.id ? 'is-selected' : ''} key={item.id} type="button" aria-label={`选择商品 ${item.productName}`} onClick={() => { setProductId(item.id); setPickerOpen(false); setFormError('') }}><ProductImage src={item.thumbnailImage || item.mainImage} name={item.productName} /><span><strong>{item.productName}</strong><small>{item.brandName || '未填写品牌'} · {item.categoryName}</small><em>{item.productCode || '商品库'}</em></span>{productId === item.id && <CheckOutlined />}</button>)}</div>
        {filteredProducts.length === 0 && <div className="shelly-empty"><strong>{products.length ? '没有找到匹配的商品' : '暂时没有可用商品'}</strong><p>{products.length ? '试试其他名称、品牌或商品编码。' : '请先在商品中心添加并启用商品。'}</p></div>}
        <small className="shelly-product-count">{filteredProducts.length} 件商品</small>
      </div>
    </Modal>
  </div>
}
