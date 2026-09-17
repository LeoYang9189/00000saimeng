import { Alert, Button, Card, Drawer, Table, Tag, message } from 'antd'
import { DownloadOutlined } from '@ant-design/icons'
import { useEffect, useRef, useState } from 'react'
import * as echarts from 'echarts/core'
import { LineChart, BarChart, RadarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent, RadarComponent, AriaComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import type { EChartsCoreOption } from 'echarts/core'
import { getKnowledge } from '../api'
import type { AnalysisResult, SelectionResult, KnowledgeSource, KnowledgeDocument } from '../workbench'
import type { DecisionPdfRequest } from './decisionPdf'
import './DecisionResults.css'

echarts.use([LineChart, BarChart, RadarChart, GridComponent, TooltipComponent, LegendComponent, RadarComponent, AriaComponent, CanvasRenderer])

function DownloadPdfButton({ request, disabled = false }: { request: DecisionPdfRequest; disabled?: boolean }) {
  const [exporting, setExporting] = useState(false)
  const locked = useRef(false)
  return <Button icon={<DownloadOutlined />} loading={exporting} disabled={disabled}
    title={disabled ? '报告生成完整后可下载' : '下载包含完整表格和图表的 PDF'}
    onClick={async () => {
      if (locked.current) return
      locked.current = true
      setExporting(true)
      try {
        const { downloadDecisionPdf } = await import('./decisionPdf')
        await downloadDecisionPdf(request)
      } catch (error) {
        void message.error(error instanceof Error ? error.message : 'PDF 导出失败，请重试。')
      } finally {
        locked.current = false
        setExporting(false)
      }
    }}>{exporting ? '正在导出' : '下载 PDF'}</Button>
}

function Chart({ title, option }: { title: string; option: EChartsCoreOption }) {
  const ref = useRef<HTMLDivElement>(null)
  const instance = useRef<echarts.EChartsType | null>(null)
  useEffect(() => {
    if (!ref.current) return
    const chart = echarts.init(ref.current)
    instance.current = chart
    const observer = new ResizeObserver(() => chart.resize())
    observer.observe(ref.current)
    return () => { observer.disconnect(); chart.dispose(); instance.current = null }
  }, [])
  useEffect(() => {
    instance.current?.setOption({ ...option, aria: { enabled: true, label: { description: `${title}，模拟演示数据，不代表真实经营业绩。` } } }, true)
  }, [option, title])
  return <div ref={ref} className="decision-chart" role="img" aria-label={`${title}，模拟数据`} />
}

export function KnowledgeSources({ sources }: { sources: KnowledgeSource[] }) {
  const [viewing, setViewing] = useState<KnowledgeDocument | null>(null)
  return <div className="decision-sources"><strong>知识库依据 · {sources.length} 条</strong>
    {sources.length === 0 && <p>未找到匹配知识，回答不能视为已核实的品牌资料。</p>}
    {sources.map((s, i) => <Button key={s.id} type="link" onClick={async () => {
      try { setViewing(await getKnowledge(s.id)) } catch (e) { void message.error(e instanceof Error ? e.message : '资料读取失败') }
    }}>[资料{i + 1}] {s.fileName}{s.kind === 'MEMORY' ? '（运营记忆）' : ''}</Button>)}
    <Drawer title={viewing?.fileName} open={Boolean(viewing)} size={640} onClose={() => setViewing(null)}>
      <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8, overflowWrap: 'anywhere' }}>{viewing?.content}</div>
      {viewing && /^https?:\/\//.test(viewing.sourceUrl) && <a href={viewing.sourceUrl} target="_blank" rel="noreferrer">原始来源</a>}
    </Drawer>
  </div>
}

export function SelectionResultView({ result }: { result: SelectionResult }) {
  return <section className="decision-result">
    <div className="decision-result__heading"><h3>{result.category} · 对标 {result.benchmark}</h3>
      <DownloadPdfButton request={{ kind: 'selection', result }} /></div>
    <Alert type="warning" showIcon title={result.notice} />
    <p>{result.summary}</p>
    <Table rowKey={(_, i) => String(i)} size="small" pagination={false} scroll={{ x: 1000 }} dataSource={result.rows}
      columns={[
        { title: '品牌', dataIndex: 'brand', width: 120 }, { title: '产品名称 / 规格', dataIndex: 'productName', width: 180 },
        { title: '市场价（参考估算）', dataIndex: 'marketPrice', width: 180 }, { title: '当前总代理', dataIndex: 'distributor', width: 180 },
        { title: '对标理由', dataIndex: 'reason', width: 200 }, { title: '采购核验', dataIndex: 'risk', width: 220 },
      ]} />
    <KnowledgeSources sources={result.sources} />
  </section>
}

export function AnalysisResultView({ result }: { result: AnalysisResult }) {
  const { metrics: m, report: r } = result
  const common = { color: ['#1f5eff', '#12a89d', '#f4a340'], tooltip: { trigger: 'axis', renderMode: 'richText' }, grid: { top: 32, left: 65, right: 25, bottom: 35 } }
  const months = m.months.map(v => v.month)
  const names = [result.productName, ...result.competitorNames]
  return <section className="decision-result">
    <div className="decision-result__heading"><h3>{result.productName} · 运营分析 <Tag color="orange">虚拟报告</Tag></h3>
      <DownloadPdfButton request={{ kind: 'analysis', result }} disabled={!r} /></div>
    <Alert showIcon type="warning" title="模拟演示数据，不是真实经营业绩" description={result.notice} />
    {r ? <p>{r.summary}</p> : <p>模拟图表已就绪，报告解读尚未完成。若生成已停止，可重新编辑需求后重试。</p>}
    <div className="decision-grid">
      <Card title="半年销量统计 · 模拟" size="small">
        <Chart title="半年销量统计" option={{ ...common, xAxis: { type: 'category', data: months }, yAxis: { type: 'value', name: '件' },
          series: [{ type: 'line', data: m.months.map(v => v.units), smooth: true, areaStyle: { opacity: .1 } }] }} />
        <p>{r?.salesAnalysis}</p>
      </Card>
      <Card title="分销商排名 · 模拟主体" size="small">
        <Chart title="分销商排名" option={{ ...common, grid: { ...common.grid, left: 108 }, xAxis: { type: 'value', name: '件' },
          yAxis: { type: 'category', inverse: true, data: m.distributors.map(v => v.name) }, series: [{ type: 'bar', data: m.distributors.map(v => v.units), barMaxWidth: 24 }] }} />
        <p>{r?.distributorAnalysis}</p>
      </Card>
      <Card title="价格涨跌历史 · 模拟" size="small">
        <Chart title="价格变动历史" option={{ ...common, xAxis: { type: 'category', data: months }, yAxis: { type: 'value', name: '元 / 商品计价单位', scale: true },
          series: [{ type: 'line', step: 'end', data: m.months.map(v => v.price) }] }} />
        <Table size="small" pagination={false} rowKey="month" dataSource={m.months.map((v, i) => ({ ...v, change: i ? +(v.price - m.months[i - 1].price).toFixed(2) : 0 }))}
          columns={[{ title: '月份', dataIndex: 'month' }, { title: '模拟价格', dataIndex: 'price', render: (v: number) => `¥${v.toFixed(2)}` },
            { title: '涨跌', dataIndex: 'change', render: (v: number) => <Tag color={v > 0 ? 'red' : v < 0 ? 'green' : 'default'}>{v > 0 ? '+' : ''}{v.toFixed(2)}</Tag> }]} />
        <p>{r?.priceAnalysis}</p>
      </Card>
      <Card title="同类竞品比较 · 模拟评分" size="small">
        <Chart title="同类竞品模拟评分" option={{ color: common.color, tooltip: { renderMode: 'richText' },
          legend: { bottom: 0, type: 'scroll', data: names }, radar: { radius: '60%', indicator: m.dimensions.map(name => ({ name, max: 100 })) },
          series: [{ type: 'radar', data: m.competitorScores.map((value, i) => ({ name: names[i], value })) }] }} />
        <p>候选竞品由模型建议，需核实同规格可比性；分数为固定演示值，不代表真实市场表现或份额。</p>
        <p>{r?.competitorAnalysis}</p>
      </Card>
    </div>
    <Card title="商品详情页吸引力 · 资料初审" size="small"><p>{r?.detailAnalysis || '文字与字段诊断尚未生成。'}</p>
      <a href={`/admin/products/${encodeURIComponent(result.productId)}`} target="_blank" rel="noreferrer">查看商品资料</a></Card>
    <Card title="后续运营策略" size="small"><ol>{r?.strategies.map((text, i) => <li key={i}>{text}</li>)}</ol></Card>
    <details><summary>查看模拟数据明细与口径</summary>
      <p>最近六个完整月份；分销商分配总和等于半年模拟销量。价格以商品当前零售价为演示基准，无有效价格时使用10元，均非真实调价记录。</p>
      <pre>{JSON.stringify(m, null, 2)}</pre></details>
  </section>
}
