import { jsPDF } from 'jspdf'
import * as echarts from 'echarts/core'
import { BarChart, LineChart, RadarChart } from 'echarts/charts'
import { GridComponent, LegendComponent, RadarComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import type { EChartsCoreOption } from 'echarts/core'
import type { AnalysisResult, SelectionResult } from '../workbench'

echarts.use([BarChart, LineChart, RadarChart, GridComponent, LegendComponent, RadarComponent, CanvasRenderer])

export type DecisionPdfRequest =
  | { kind: 'selection'; result: SelectionResult }
  | { kind: 'analysis'; result: AnalysisResult }

const FONT = '"Microsoft YaHei", "PingFang SC", sans-serif'

// Render Chinese with browser fonts, without fetching fonts or sending report data to a service.
class ReportPdf {
  private readonly pdf: jsPDF
  private readonly canvas = document.createElement('canvas')
  private readonly ctx: CanvasRenderingContext2D
  readonly width: number
  readonly height: number
  readonly margin = 40
  private y = 70
  private page = 0
  private readonly title: string
  private readonly date = new Date().toLocaleString('zh-CN', { hour12: false })

  constructor(title: string, landscape: boolean) {
    this.title = title
    this.pdf = new jsPDF({ orientation: landscape ? 'landscape' : 'portrait', unit: 'mm', format: 'a4', compress: true })
    this.width = landscape ? 1120 : 800
    this.height = Math.round(this.width * (landscape ? 210 / 297 : 297 / 210))
    this.canvas.width = this.width * 2
    this.canvas.height = this.height * 2
    const ctx = this.canvas.getContext('2d')
    if (!ctx) throw new Error('浏览器无法创建 PDF 画布，请换用 Chrome 或 Edge 重试。')
    this.ctx = ctx
    ctx.scale(2, 2)
    this.startPage()
  }

  private font(size = 16, bold = false) {
    this.ctx.font = `${bold ? 'bold ' : ''}${size}px ${FONT}`
    this.ctx.textBaseline = 'top'
  }

  private lines(text: string, width: number): string[] {
    const lines: string[] = []
    for (const paragraph of String(text ?? '').split(/\r?\n/)) {
      let line = ''
      for (const char of paragraph) {
        if (line && this.ctx.measureText(line + char).width > width) {
          lines.push(line)
          line = ''
        }
        line += char
      }
      lines.push(line)
    }
    return lines
  }

  private startPage() {
    this.ctx.fillStyle = '#ffffff'
    this.ctx.fillRect(0, 0, this.width, this.height)
    this.font(12)
    this.ctx.fillStyle = '#64748b'
    this.ctx.fillText(`Shelly | ${this.title}`, this.margin, 25, this.width - 2 * this.margin)
    this.ctx.fillStyle = '#dbe3ee'
    this.ctx.fillRect(this.margin, 48, this.width - 2 * this.margin, 1)
    this.y = 70
  }

  private flush() {
    this.font(11)
    this.ctx.fillStyle = '#64748b'
    this.ctx.fillText(`导出：${this.date}`, this.margin, this.height - 29)
    this.ctx.textAlign = 'right'
    this.ctx.fillText(`第 ${++this.page} 页`, this.width - this.margin, this.height - 29)
    this.ctx.textAlign = 'left'
    if (this.page > 1) this.pdf.addPage()
    this.pdf.addImage(this.canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0,
      this.pdf.internal.pageSize.getWidth(), this.pdf.internal.pageSize.getHeight())
  }

  private nextPage() { this.flush(); this.startPage() }
  private ensure(height: number) { if (this.y + height > this.height - 55) this.nextPage() }

  text(text: string, size = 16, bold = false, color = '#334155') {
    this.font(size, bold)
    const lines = this.lines(text, this.width - 2 * this.margin)
    for (const line of lines) {
      this.ensure(size * 1.6)
      this.font(size, bold)
      this.ctx.fillStyle = color
      this.ctx.fillText(line, this.margin, this.y)
      this.y += size * 1.6
    }
    this.y += 10
  }

  heading(text: string, reserve = 100) { this.ensure(reserve); this.text(text, 20, true, '#17386e') }

  table(headers: string[], rows: string[][], weights: number[]) {
    const available = this.width - 2 * this.margin
    const total = weights.reduce((a, b) => a + b, 0)
    const widths = weights.map(w => available * w / total)
    const lineHeight = 23
    const draw = (cells: string[][], count: number, header: boolean) => {
      const height = count * lineHeight + 16
      let x = this.margin
      this.font(14, header)
      cells.forEach((lines, i) => {
        this.ctx.fillStyle = header ? '#eaf0fb' : '#ffffff'
        this.ctx.fillRect(x, this.y, widths[i], height)
        this.ctx.strokeStyle = '#dbe3ee'
        this.ctx.strokeRect(x, this.y, widths[i], height)
        this.ctx.fillStyle = '#334155'
        lines.slice(0, count).forEach((line, j) => this.ctx.fillText(line, x + 8, this.y + 8 + j * lineHeight))
        x += widths[i]
      })
      this.y += height
    }
    this.font(14, true)
    const header = headers.map((h, i) => this.lines(h, widths[i] - 16))
    const headerLines = Math.max(...header.map(h => h.length))
    const headerHeight = headerLines * lineHeight + 16
    this.ensure(headerHeight + lineHeight + 16)
    draw(header, headerLines, true)
    for (const row of rows) {
      this.font(14)
      const cells = row.map((cell, i) => this.lines(cell, widths[i] - 16))
      let remaining = Math.max(...cells.map(c => c.length))
      // Keep normal rows together; split exceptionally long rows by text lines, repeating headers.
      if (this.y + remaining * lineHeight + 16 > this.height - 55 && this.y > 70 + headerHeight) {
        this.nextPage()
        draw(header, headerLines, true)
      }
      while (remaining > 0) {
        const count = Math.min(remaining, Math.floor((this.height - 55 - this.y - 16) / lineHeight))
        if (count <= 0) { this.nextPage(); draw(header, headerLines, true); continue }
        draw(cells, count, false)
        cells.forEach(c => c.splice(0, count))
        remaining -= count
        if (remaining) { this.nextPage(); draw(header, headerLines, true) }
      }
    }
    this.y += 18
  }

  async chart(option: EChartsCoreOption) {
    const width = this.width - this.margin * 2
    const height = 340
    this.ensure(height + 12)
    const host = document.createElement('div')
    host.style.cssText = 'position:fixed;left:-10000px;top:0;pointer-events:none'
    document.body.append(host)
    let chart: echarts.EChartsType | undefined
    try {
      chart = echarts.init(host, undefined, { width, height, devicePixelRatio: 2 })
      chart.setOption({ ...option, animation: false, backgroundColor: '#ffffff', textStyle: { fontFamily: FONT } })
      const image = new Image()
      image.src = chart.getDataURL({ pixelRatio: 2, backgroundColor: '#ffffff' })
      await image.decode()
      this.ctx.drawImage(image, this.margin, this.y, width, height)
      this.y += height + 12
    } finally {
      chart?.dispose()
      host.remove()
    }
  }

  finish() {
    this.flush()
    this.pdf.setProperties({ title: this.title, author: 'Shelly', subject: 'AI 运营建议，使用前请核实数据' })
    const blob = this.pdf.output('blob')
    this.canvas.width = 0
    this.canvas.height = 0
    return { blob, pages: this.page }
  }
}

export async function buildDecisionPdf(request: DecisionPdfRequest) {
  if (request.kind === 'analysis' && !request.result.report) throw new Error('请等待分析报告生成完整后再下载。')
  await document.fonts.ready
  const title = request.kind === 'selection'
    ? `智能选品-${request.result.category}-对标${request.result.benchmark}`
    : `商品分析-${request.result.productName}`
  const pdf = new ReportPdf(title, request.kind === 'selection')
  pdf.text(title, 25, true, '#17386e')
  if (request.kind === 'selection') {
    const r = request.result
    pdf.text(r.notice, 16, true, '#925b12')
    pdf.text(r.summary)
    pdf.table(['品牌', '产品名称 / 规格', '市场价（参考估算）', '当前总代理', '对标理由', '采购核验'],
      r.rows.map(row => [row.brand, row.productName, row.marketPrice, row.distributor, row.reason, row.risk]),
      [12, 18, 17, 16, 19, 20])
    pdf.heading('知识库依据')
    if (!r.sources.length) pdf.text('无匹配知识库资料，模型建议需另行核实。')
    r.sources.forEach((s, i) => {
      pdf.text(`[资料${i + 1}] ${s.fileName}${s.kind === 'MEMORY' ? '（运营记忆）' : ''}`, 14)
      if (s.sourceUrl) pdf.text(s.sourceUrl, 12)
    })
  } else {
    const r = request.result
    const report = r.report!
    const m = r.metrics
    const colors = ['#1f5eff', '#12a89d', '#f4a340']
    const common = { color: colors, grid: { left: 95, right: 45, top: 40, bottom: 45 } }
    const xAxis = { type: 'category', data: m.months.map(v => v.month) }
    pdf.text(`虚拟报告：模拟演示数据，不是真实经营业绩。\n${r.notice}`, 16, true, '#925b12')
    pdf.text(report.summary)
    pdf.heading('半年销量统计 · 模拟', 410)
    await pdf.chart({ ...common, xAxis, yAxis: { type: 'value', name: '件' },
      series: [{ type: 'line', data: m.months.map(v => v.units), smooth: true, areaStyle: { opacity: 0.1 } }] })
    pdf.text(report.salesAnalysis)
    pdf.heading('分销商排名 · 模拟主体', 410)
    await pdf.chart({ ...common, xAxis: { type: 'value', name: '件' },
      yAxis: { type: 'category', inverse: true, data: m.distributors.map(v => v.name) },
      series: [{ type: 'bar', data: m.distributors.map(v => v.units), barMaxWidth: 24 }] })
    pdf.table(['模拟分销商', '半年销量（件）'], m.distributors.map(v => [v.name, String(v.units)]), [1, 1])
    pdf.text(report.distributorAnalysis)
    pdf.heading('价格涨跌历史 · 模拟', 410)
    await pdf.chart({ ...common, xAxis, yAxis: { type: 'value', scale: true, name: '元 / 商品计价单位' },
      series: [{ type: 'line', step: 'end', data: m.months.map(v => v.price) }] })
    pdf.table(['月份', '模拟销量（件）', '模拟价格（元）', '涨跌（元）'], m.months.map((v, i) => {
      const change = i ? v.price - m.months[i - 1].price : 0
      return [v.month, String(v.units), v.price.toFixed(2), `${change > 0 ? '+' : ''}${change.toFixed(2)}`]
    }), [1, 1, 1, 1])
    pdf.text(report.priceAnalysis)
    pdf.heading('同类竞品比较 · 模拟评分', 410)
    const names = [r.productName, ...r.competitorNames]
    // Numbered chart labels avoid truncating long product names; full names appear below.
    await pdf.chart({ color: colors, legend: { bottom: 0, data: names.map((_, i) => `对象${i + 1}`) },
      radar: { radius: '60%', indicator: m.dimensions.map(name => ({ name, max: 100 })) },
      series: [{ type: 'radar', data: m.competitorScores.map((value, i) => ({ name: `对象${i + 1}`, value })) }] })
    names.forEach((name, i) => pdf.text(`对象${i + 1}：${name}`, 14))
    pdf.text('候选竞品由模型建议；评分为固定演示值，不代表真实市场表现或份额。', 14, true, '#925b12')
    pdf.table(['对标对象', ...m.dimensions], names.map((name, i) =>
      [name, ...m.competitorScores[i].map(String)]), [2, ...m.dimensions.map(() => 1)])
    pdf.text(report.competitorAnalysis)
    pdf.heading('商品详情页吸引力 · 资料初审')
    pdf.text(report.detailAnalysis)
    pdf.heading('后续运营策略')
    report.strategies.forEach((text, i) => pdf.text(`${i + 1}. ${text}`))
    pdf.heading('模拟数据口径')
    pdf.text('最近六个完整月份；分销商分配总和等于半年模拟销量。价格以商品当前零售价为演示基准，无有效价格时使用10元，均非真实调价记录。详情页仅基于文字与字段，不是图片视觉或转化审计。')
  }
  const result = pdf.finish()
  const safeTitle = Array.from(title).filter(char => char.charCodeAt(0) >= 32).join('').replace(/[<>:"/\\|?*]/g, '_').slice(0, 100)
  const now = new Date()
  const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  return { ...result, fileName: `${safeTitle}-${date}.pdf` }
}

export async function downloadDecisionPdf(request: DecisionPdfRequest) {
  const { blob, fileName } = await buildDecisionPdf(request)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  try {
    link.href = url
    link.download = fileName
    document.body.append(link)
    link.click()
  } finally {
    link.remove()
    // Allow the browser to consume the object URL before releasing it.
    window.setTimeout(() => URL.revokeObjectURL(url), 60000)
  }
}
