import { ArrowUpOutlined, CheckOutlined, CloseOutlined, LoadingOutlined, PlusOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons'
import { Input, Modal, Popover } from 'antd'
import { Bubble, Sender } from '@ant-design/x'
import type { SenderRef } from '@ant-design/x/es/sender/interface'
import XMarkdown from '@ant-design/x-markdown'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { getAiWorkbench, getCatalogBootstrap, streamAi } from '../api'
import { MaterialResultView, ProductImage } from '../components/MaterialResultView'
import { AnalysisResultView, SelectionResultView, KnowledgeSources } from '../components/DecisionResults'
import { getStoredOperatorSession } from '../session'
import type { CatalogProductRecord } from '../types'
import { materialCopyText, WORKBENCH_SKILLS } from '../workbench'
import type { AiCapabilities, AiTurn, MaterialResult, WorkbenchSkillKey, AnalysisResult, SelectionResult, KnowledgeSource } from '../workbench'
import './AiWorkbenchPage.css'

interface ConversationEntry {
  id: string
  userText: string
  assistantText?: string
  material?: MaterialResult
  selection?: SelectionResult
  analysis?: AnalysisResult
  sources?: KnowledgeSource[]
  error?: string
  prompt?: string
  stage?: string
  finished?: boolean
  request?: { skill: WorkbenchSkillKey | null; draft: string; productId: string; channelKey: string; styleKey: string; category?: string; benchmark?: string }
}

function readConversation(key: string): ConversationEntry[] {
  try {
    const value: unknown = JSON.parse(sessionStorage.getItem(key) || '[]')
    return Array.isArray(value) ? value.filter(item => item && typeof item.id === 'string' && typeof item.userText === 'string').slice(-12)
      .map((item: ConversationEntry) => item.stage && !item.finished ? {
        ...item, stage: undefined, finished: true,
        error: item.request?.skill === 'materials'
          ? '上次等待已中断，已生成内容已保留。远程生图任务可能仍在执行，请先查看 Lovart 项目再重试。'
          : '上次等待已中断，已生成内容已保留，可重新编辑需求后生成。',
        material: item.material?.image.status === 'GENERATING' ? {
          ...item.material, message: '文案已保留，图片等待已中断。',
          image: { ...item.material.image, status: 'INTERRUPTED', message: '图片等待已中断。' },
        } : item.material,
      } : item) : []
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
  const [composerOpen, setComposerOpen] = useState(() => readConversation(storageKey).length === 0)
  const [skillsOpen, setSkillsOpen] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [productId, setProductId] = useState('')
  const [channelKey, setChannelKey] = useState('')
  const [styleKey, setStyleKey] = useState('')
  const [category, setCategory] = useState('')
  const [benchmark, setBenchmark] = useState('')
  const textareaRef = useRef<SenderRef>(null)
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
  const isAnalysis = selectedSkill === 'analysis'
  const isSelection = selectedSkill === 'selection'
  const usesProduct = isMaterial || isAnalysis
  const product = products.find(item => item.id === productId)
  const channel = capabilities?.channels.find(item => item.key === channelKey)
  const style = capabilities?.styles.find(item => item.key === styleKey)
  const filteredProducts = useMemo(() => {
    const search = query.trim().toLowerCase()
    return products.filter(item => `${item.productName} ${item.brandName} ${item.productCode} ${item.categoryName}`.toLowerCase().includes(search))
  }, [products, query])
  const canSubmit = !submitting && !loading && !loadError && (isMaterial ? Boolean(product && channel && style)
    : isAnalysis ? Boolean(product) : isSelection ? Boolean(category.trim() && benchmark.trim()) : Boolean(draft.trim()))

  function activateSkill(key: WorkbenchSkillKey | null) {
    if (submitting) return
    setComposerOpen(true)
    setSelectedSkill(key)
    setSkillsOpen(false)
    setFormError('')
    if (key === 'materials') composerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    else textareaRef.current?.focus()
  }
  function reuseMaterial(result: MaterialResult) {
    if (submitting) return
    setComposerOpen(true)
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
      setFormError(isMaterial ? '请依次选择商品、发布渠道和视觉风格。' : isAnalysis ? '请选择要分析的商品。'
        : isSelection ? '请输入大品类和对标品牌。' : '请先描述你想完成的任务。')
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
      ? `为「${product.productName}」制作${channel.label}，采用${style.label}风格。${notes ? `\n${notes}` : ''}`
      : isSelection ? `智能选品：${category.trim()}，对标品牌：${benchmark.trim()}。${notes ? `\n${notes}` : ''}`
      : isAnalysis && product ? `分析「${product.productName}」，经营数据使用模拟演示。${notes ? `\n${notes}` : ''}` : notes
    const history: AiTurn[] = entries.filter(entry => !entry.error && (entry.assistantText || entry.material?.copy || entry.selection || entry.analysis?.report)).slice(-6).flatMap(entry => [
      { role: 'user' as const, content: entry.userText.slice(0, 12000) },
      { role: 'assistant' as const, content: (entry.assistantText || (entry.material ? materialCopyText(entry.material)
        : JSON.stringify(entry.selection || entry.analysis))).slice(0, 12000) },
    ])
    setComposerOpen(false)
    setEntries(current => [...current, {
      id, userText, stage: '正在连接 AI 服务',
      request: { skill: selectedSkill, draft, productId, channelKey, styleKey, category, benchmark },
    }].slice(-12))
    try {
      await streamAi(isMaterial ? 'materials' : isSelection ? 'selection' : isAnalysis ? 'analysis' : 'chat',
        isMaterial ? { productId, channel: channelKey, style: styleKey, notes }
          : isSelection ? { category: category.trim(), benchmark: benchmark.trim(), notes }
          : isAnalysis ? { productId, notes }
          : { skill: selectedSkill || 'general', message: notes, history }, controller.signal, event => {
          if (!mounted.current) return
          setEntries(current => current.map(entry => {
            if (entry.id !== id) return entry
            switch (event.event) {
              case 'stage': return { ...entry, stage: event.data }
              case 'prompt_delta': return { ...entry, prompt: (entry.prompt || '') + event.data }
              case 'text_delta': return { ...entry, assistantText: (entry.assistantText || '') + event.data }
              case 'material': return { ...entry, material: event.data }
              case 'selection': return { ...entry, selection: event.data }
              case 'analysis': return { ...entry, analysis: event.data }
              case 'sources': return { ...entry, sources: event.data }
              case 'done': return { ...entry, finished: true, stage: undefined }
              default: return entry
            }
          }))
        })
      if (mounted.current) setDraft('')
    } catch (error) {
      if (mounted.current) setEntries(current => current.map(entry => entry.id === id ? {
        ...entry, finished: true, stage: undefined,
        error: controller.signal.aborted ? (isMaterial
          ? '已停止等待，已生成内容已保留。生图任务可能仍在服务端执行，请勿立即重复提交。'
          : '已停止等待，已生成内容已保留。')
          : error instanceof Error ? error.message : '请求失败，请重试。',
      } : entry))
    } finally {
      inFlight.current = false
      if (mounted.current) setSubmitting(false)
    }
  }

  return <div className={`shelly-workspace${entries.length ? ' shelly-workspace--conversation' : ''}${isMaterial ? ' shelly-workspace--material' : ''}`}>
    <div className="shelly-workspace__topline"><span>Shelly · 运营助手</span><button type="button" className="shelly-text-button" disabled={submitting || !entries.length} onClick={() => { setEntries([]); setDraft(''); setFormError(''); setComposerOpen(true) }}><PlusOutlined />新建对话</button></div>
    <header className="shelly-intro">
      <img src="/AI.png" alt="Shelly" className="shelly-intro__avatar" />
      <div><h2>{entries.length ? '把想法，继续往前一步。' : '今天，想为生意做点什么？'}</h2><p>选品、分析、创作与业务问答，从一个具体任务开始。</p></div>
    </header>
    {entries.length > 0 && <section className="shelly-conversation" aria-label="对话记录" aria-live="polite">
      {entries.map((entry, index) => <article className="shelly-exchange" key={entry.id} ref={index === entries.length - 1 ? latestEntryRef : undefined}>
        <Bubble placement="end" shape="corner" content={entry.userText} className="shelly-user-bubble" />
        <Bubble placement="start" variant="borderless" content={entry.prompt || entry.assistantText || ''}
          header={<strong>{entry.prompt ? entry.request?.skill === 'materials' ? 'Shelly · 创作提示语' : 'Shelly · 任务提示语' : 'Shelly'}</strong>}
          avatar={<img className="shelly-bubble-avatar" src="/AI.png" alt="Shelly" />}
          streaming={submitting && index === entries.length - 1}
          contentRender={content => <XMarkdown content={content} escapeRawHtml streaming={{
            hasNextChunk: submitting && index === entries.length - 1 && !entry.material,
            enableAnimation: true,
            tail: submitting && index === entries.length - 1 && !entry.material,
          }} />}
          footer={<>
            {entry.material && <MaterialResultView result={entry.material} onReuse={reuseMaterial} />}
            {entry.selection && <SelectionResultView result={entry.selection} />}
            {entry.analysis && <AnalysisResultView result={entry.analysis} />}
            {entry.sources && <KnowledgeSources sources={entry.sources} />}
            {submitting && index === entries.length - 1 && <div className="shelly-thinking" role="status"><LoadingOutlined spin />{entry.stage || '正在生成'}
              <button type="button" className="shelly-text-button" onClick={() => requestController.current?.abort()}>停止等待</button>
            </div>}
            {entry.error && <div className="shelly-error" role="alert">{entry.error}</div>}
            {!submitting && !entry.finished && !entry.material && !entry.assistantText && <div className="shelly-error">上次生成已中断，请重新编辑需求。</div>}
            {!submitting && entry.request && <button type="button" className="shelly-text-button" onClick={() => {
              const saved = entry.request!
              setSelectedSkill(saved.skill); setDraft(saved.draft); setProductId(saved.productId)
              setChannelKey(saved.channelKey); setStyleKey(saved.styleKey); setFormError(''); setComposerOpen(true)
              setCategory(saved.category || ''); setBenchmark(saved.benchmark || '')
            }}>{entry.error ? '重新编辑需求' : '编辑这条需求'}</button>}
          </>} />
      </article>)}
    </section>}
    {!composerOpen && !submitting && <div className="shelly-conversation-actions"><button type="button" className="shelly-text-button" onClick={() => { setSelectedSkill(entries.at(-1)?.request?.skill === 'knowledge' ? 'knowledge' : null); setDraft(''); setComposerOpen(true) }}><PlusOutlined />继续对话</button></div>}
    {composerOpen && <><form className={`shelly-composer${isMaterial ? ' shelly-composer--material' : ''}`} onSubmit={event => void handleSubmit(event)} ref={composerRef}>
      {skill && <div className="shelly-active-skill"><img src={`/ai-skills/${skill.key}.png`} alt="" /><strong>{skill.title}</strong><span>{isMaterial ? '选好商品和发布方式，剩下的交给我。' : skill.description}</span><button type="button" aria-label="取消当前技能" disabled={submitting} onClick={() => activateSkill(null)}><CloseOutlined /></button></div>}
      {isSelection && <><div className="decision-inputs">
        <label>大品类<Input aria-label="大品类" placeholder="例如：水饮、红酒、玩具" maxLength={80} value={category} onChange={e => setCategory(e.target.value)} /></label>
        <label>对标品牌<Input aria-label="对标品牌" placeholder="例如：巴黎水、奔富、乐高" maxLength={120} value={benchmark} onChange={e => setBenchmark(e.target.value)} /></label>
      </div><p className="decision-form-note">Kimi 生成市场候选建议。价格为参考估算，总代理待授权核实；不是实时市场行情。</p></>}
      {usesProduct && <div className="shelly-material-form">
        <fieldset disabled={submitting || loading || Boolean(loadError)}>
          <legend><span>01</span>选择商品</legend>
          <button className={`shelly-product-trigger${product ? ' is-selected' : ''}`} type="button" onClick={() => { setQuery(''); setPickerOpen(true) }}>
            {product ? <><ProductImage src={product.mainImage} name={product.productName} /><span><strong>{product.productName}</strong><small>{product.brandName || product.categoryName} · {product.productCode || '商品库'}</small><small>{isMaterial ? '此商品主图将作为唯一参考图传给 Lovart' : '读取商品资料，生成模拟图表与运营分析'}</small></span><em>更换商品</em></>
              : <><SearchOutlined /><span><strong>从商品库中选择</strong><small>自动带入商品图片、品牌与卖点</small></span><PlusOutlined /></>}
          </button>
        </fieldset>
        {isMaterial && <><fieldset disabled={submitting || !product}>
          <legend><span>02</span>发布渠道<small>这份内容准备发在哪里？</small></legend>
          <div className="shelly-channel-options" role="group" aria-label="发布渠道">{capabilities?.channels.map(item => <button aria-pressed={channelKey === item.key} className={channelKey === item.key ? 'is-selected' : ''} key={item.key} onClick={() => { setChannelKey(item.key); setFormError('') }} type="button"><span aria-hidden="true" className={`shelly-format shelly-format--${item.key.toLowerCase()}`} /><strong>{item.label}</strong><small>{item.description}</small>{channelKey === item.key && <CheckOutlined className="shelly-option-check" />}</button>)}</div>
        </fieldset>
        <fieldset disabled={submitting || !channel}>
          <legend><span>03</span>视觉风格<small>为商品选一种合适的表达</small></legend>
          <div className="shelly-style-options" role="group" aria-label="视觉风格">{capabilities?.styles.map(item => <button key={item.key} aria-pressed={styleKey === item.key} className={styleKey === item.key ? 'is-selected' : ''} onClick={() => { setStyleKey(item.key); setFormError('') }} title={item.description} type="button"><span aria-hidden="true" className={`shelly-swatch shelly-swatch--${item.key.toLowerCase()}`} />{item.label}{styleKey === item.key && <CheckOutlined />}</button>)}</div>
          {style && <p className="shelly-style-description">{style.description}{channel && ` · ${channel.width} × ${channel.height} px`}</p>}
        </fieldset></>}
      </div>}
      {isAnalysis && <p className="decision-form-note">半年销量、分销商、调价及竞品评分均为虚拟演示。详情页分析仅基于当前商品文字与字段，不代表真实视觉或转化审计。</p>}
      <div className="shelly-draft-label">{isMaterial || isSelection || isAnalysis ? '补充要求（选填）' : '描述你的任务'}</div>
      <Sender ref={textareaRef} className="shelly-x-sender" value={draft} disabled={submitting}
        autoSize={{ minRows: isMaterial ? 2 : 3, maxRows: 8 }} suffix={false}
        onChange={value => setDraft(value.slice(0, isMaterial || isSelection || isAnalysis ? 2000 : 4000))}
        onSubmit={() => void handleSubmit()} submitType="shiftEnter"
        placeholder={skill?.placeholder || '说说你的任务，或从下方选择一个技能开始。'}
        onKeyDown={event => { if (event.key === 'Enter' && (event.ctrlKey || event.metaKey) && !event.nativeEvent.isComposing) { event.preventDefault(); void handleSubmit() } }} />
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
    <section className="shelly-skills" aria-label="快捷技能">{WORKBENCH_SKILLS.map(item => <button key={item.key} className={selectedSkill === item.key ? 'is-selected' : ''} disabled={submitting} onClick={() => activateSkill(item.key)} aria-pressed={selectedSkill === item.key} type="button"><img src={`/ai-skills/${item.key}.png`} alt="" /><strong>{item.title}</strong><span>{item.description}</span></button>)}</section></>}
    <Modal title="选择商品" open={pickerOpen} footer={null} width={760} onCancel={() => setPickerOpen(false)} destroyOnHidden>
      <div className="shelly-product-picker"><p>选择一件已启用且审核通过的商品，图片与卖点会自动带入创作需求。</p><Input aria-label="搜索商品" prefix={<SearchOutlined />} placeholder="搜索商品名称、品牌或编码" allowClear value={query} onChange={event => setQuery(event.target.value)} />
        <div className="shelly-product-grid">{filteredProducts.map(item => <button className={productId === item.id ? 'is-selected' : ''} key={item.id} type="button" aria-label={`选择商品 ${item.productName}`} onClick={() => { setProductId(item.id); setPickerOpen(false); setFormError('') }}><ProductImage src={item.mainImage} name={item.productName} /><span><strong>{item.productName}</strong><small>{item.brandName || '未填写品牌'} · {item.categoryName}</small><em>{item.productCode || '商品库'}</em></span>{productId === item.id && <CheckOutlined />}</button>)}</div>
        {filteredProducts.length === 0 && <div className="shelly-empty"><strong>{products.length ? '没有找到匹配的商品' : '暂时没有可用商品'}</strong><p>{products.length ? '试试其他名称、品牌或商品编码。' : '请先在商品中心添加并启用商品。'}</p></div>}
        <small className="shelly-product-count">{filteredProducts.length} 件商品</small>
      </div>
    </Modal>
  </div>
}
