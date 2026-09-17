// Run with PLAYWRIGHT_MODULE pointing to a locally installed playwright package.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright')
const assert = require('node:assert/strict')
const path = require('node:path')

;(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true })
  try {
    const page = await browser.newPage({ acceptDownloads: true, viewport: { width: 1440, height: 960 } })
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    await page.route('**/pdf-export-test', route => route.fulfill({
      contentType: 'text/html', body: '<html><body><div id="test"></div></body></html>',
    }))
    await page.goto('http://localhost:5174/pdf-export-test')
    await page.evaluate(async () => {
      const { default: RefreshRuntime } = await import('/@react-refresh')
      RefreshRuntime.injectIntoGlobalHook(window)
      window.$RefreshReg$ = () => {}
      window.$RefreshSig$ = () => type => type
      window.__vite_plugin_react_preamble_installed__ = true
      const { default: React } = await import('/node_modules/.vite/deps/react.js')
      const { default: { createRoot } } = await import('/node_modules/.vite/deps/react-dom_client.js')
      const { SelectionResultView, AnalysisResultView } = await import('/src/components/DecisionResults.tsx')
      const chinese = '\u4e2d\u6587\u6d4b\u8bd5\uff1a\u4ef7\u683c\u4ec5\u4f9b\u53c2\u8003\uff0c\u603b\u4ee3\u7406\u5f85\u6838\u5b9e\u3002'
      const selection = {
        category: '\u6c34\u996e', benchmark: '\u5df4\u9ece\u6c34', summary: chinese.repeat(8),
        notice: chinese, sources: [{ id: 'test', fileName: chinese, kind: 'MANUAL', sourceUrl: 'https://example.com/source' }],
        rows: Array.from({ length: 6 }, (_, i) => ({
          brand: `Brand ${i + 1}`, productName: chinese.repeat(3), marketPrice: '10-20 RMB / 750ml',
          distributor: chinese, reason: chinese.repeat(8), risk: chinese.repeat(6),
        })),
      }
      const analysis = {
        productId: 'test', productName: '\u5723\u78a7\u6d9b\u5145\u6c14\u5929\u7136\u77ff\u6cc9\u6c34',
        mainImage: '', simulated: true, notice: chinese, competitorNames: ['Competitor A', 'Competitor B'],
        metrics: {
          months: Array.from({ length: 6 }, (_, i) => ({ month: `2026-0${i + 3}`, units: 820 + i * 100, price: [10, 10, 10.5, 10.3, 9.8, 10][i] })),
          distributors: [{ name: 'A', units: 2000 }, { name: 'B', units: 1800 }, { name: 'C', units: 1400 }, { name: 'D', units: 1220 }],
          dimensions: ['Price', 'Channel', 'Content', 'Difference', 'Supply'],
          competitorScores: [[72, 80, 65, 78, 70], [80, 72, 85, 66, 76], [68, 75, 78, 82, 73]],
        },
        report: {
          summary: chinese.repeat(6), salesAnalysis: chinese.repeat(12), distributorAnalysis: chinese.repeat(10),
          priceAnalysis: chinese.repeat(10), detailAnalysis: chinese.repeat(20), competitorAnalysis: chinese.repeat(12),
          strategies: Array.from({ length: 5 }, () => chinese.repeat(8)),
        },
      }
      const root = createRoot(document.getElementById('test'))
      window.renderTest = kind => root.render(React.createElement(kind === 'selection' ? SelectionResultView : AnalysisResultView,
        { result: kind === 'selection' ? selection : { ...analysis, report: kind === 'partial' ? null : analysis.report } }))
      window.pdfFixtures = { selection, analysis }
      window.renderTest('partial')
    })
    const button = page.getByRole('button', { name: '\u4e0b\u8f7d PDF' })
    await button.waitFor()
    assert.equal(await button.isDisabled(), true, 'Partial report must not download')
    for (const kind of ['selection', 'analysis']) {
      await page.evaluate(kind => window.renderTest(kind), kind)
      await button.waitFor({ state: 'visible' })
      await page.waitForFunction(() => !document.querySelector('#test button')?.disabled)
      const [download] = await Promise.all([page.waitForEvent('download'), button.click()])
      assert.ok(download.suggestedFilename().endsWith('.pdf'))
      const destination = path.join(__dirname, `verify-${kind}.pdf`)
      await download.saveAs(destination)
      console.log(`${kind}: downloaded ${download.suggestedFilename()} to ${destination}`)
      await page.getByRole('button', { name: '\u4e0b\u8f7d PDF' }).waitFor()
    }
    const stress = await page.evaluate(async () => {
      const { buildDecisionPdf } = await import('/src/components/decisionPdf.ts')
      const result = structuredClone(window.pdfFixtures.selection)
      result.rows = [{ ...result.rows[0], risk: result.rows[0].risk.repeat(20) }]
      const pdf = await buildDecisionPdf({ kind: 'selection', result })
      let rejected = false
      try { await buildDecisionPdf({ kind: 'analysis', result: { ...window.pdfFixtures.analysis, report: null } }) }
      catch { rejected = true }
      return { pages: pdf.pages, bytes: pdf.blob.size, rejected, leakedHosts: document.querySelectorAll('[style*="-10000px"]').length }
    })
    assert.ok(stress.pages > 2)
    assert.ok(stress.bytes > 10000)
    assert.equal(stress.rejected, true)
    assert.equal(stress.leakedHosts, 0)
    assert.deepEqual(errors, [])
    console.log('PASS: two downloads, incomplete guard, long-row pagination, chart cleanup, no page errors', stress)
  } finally { await browser.close() }
})().catch(error => { console.error(error); process.exitCode = 1 })
