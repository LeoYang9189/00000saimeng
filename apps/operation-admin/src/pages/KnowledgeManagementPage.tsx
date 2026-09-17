import { PlusOutlined, SearchOutlined } from '@ant-design/icons'
import { Alert, Button, Card, Col, Divider, Drawer, Form, Input, Popconfirm, Row, Space, Tabs, Tag, message } from 'antd'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createKnowledge, deleteKnowledge, getKnowledge, listKnowledge } from '../api'
import { ConfigurableProTable, type ConfigurableColumn } from '../components/ConfigurableProTable'
import type { KnowledgeDocument } from '../workbench'

type Values = Pick<KnowledgeDocument, 'fileName' | 'keywords' | 'content' | 'sourceUrl'>
export function KnowledgeManagementPage() {
  const [kind, setKind] = useState<'MANUAL' | 'MEMORY'>('MANUAL')
  const [rows, setRows] = useState<KnowledgeDocument[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({ keyword: '', uploader: '' })
  const [searchForm] = Form.useForm()
  const [form] = Form.useForm<Values>()
  const [viewing, setViewing] = useState<KnowledgeDocument | null>(null)
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)
  const requestRef = useRef({ id: 0 })
  const reload = useCallback(async () => {
    const requests = requestRef.current
    const id = ++requests.id
    setLoading(true); setError('')
    try {
      const data = await listKnowledge(kind, filters.keyword, filters.uploader)
      if (id === requests.id) setRows(data)
    } catch (e) { if (id === requests.id) setError(e instanceof Error ? e.message : '加载失败') }
    finally { if (id === requests.id) setLoading(false) }
  }, [kind, filters])
  useEffect(() => {
    const requests = requestRef.current
    let active = true
    void Promise.resolve().then(() => { if (active) return reload() })
    return () => { active = false; requests.id++ }
  }, [reload])

  async function view(id: string) {
    try { setViewing(await getKnowledge(id)) } catch (e) { void message.error(e instanceof Error ? e.message : '读取失败') }
  }
  async function remove(id: string) {
    try { await deleteKnowledge(id); void message.success('知识已删除，后续检索不再使用'); await reload() }
    catch (e) { void message.error(e instanceof Error ? e.message : '删除失败') }
  }
  async function save(values: Values) {
    setSaving(true)
    try {
      await createKnowledge({ ...values, kind, keywords: values.keywords || '', sourceUrl: values.sourceUrl || '' })
      setCreating(false); form.resetFields(); await reload(); void message.success('知识已保存到数据库')
    } catch (e) { void message.error(e instanceof Error ? e.message : '保存失败') }
    finally { setSaving(false) }
  }
  const columns: ConfigurableColumn<KnowledgeDocument>[] = [
    { title: '文件名', dataIndex: 'fileName', width: 380, render: (_, d) => <Button type="link" onClick={() => void view(d.id)}>{d.fileName}</Button> },
    { title: '上传人', dataIndex: 'uploader', width: 180 },
    { title: '上传时间', dataIndex: 'createdAt', width: 210, renderText: (value: string) => value.replace('T', ' ').slice(0, 19) },
    { title: '操作', key: 'actions', hideInSetting: true, width: 180, render: (_, d) => <Space>
      <Button type="link" onClick={() => void view(d.id)}>查看</Button>
      <Popconfirm title="确认删除这条知识？" description="删除后将不再用于业务问答检索。" onConfirm={() => remove(d.id)}>
        <Button type="link" danger>删除</Button>
      </Popconfirm>
    </Space> },
  ]
  return <div className="operator-page">
    <Card variant="borderless" className="operator-page__card operator-list-shell">
      <Tabs activeKey={kind} onChange={key => setKind(key as typeof kind)} items={[{ key: 'MANUAL', label: '手工知识库' }, { key: 'MEMORY', label: '日常记忆库' }]} />
      <Form form={searchForm} layout="vertical" onFinish={values => setFilters({ keyword: values.keyword || '', uploader: values.uploader || '' })}>
        <div className="operator-list-shell__filters"><Row gutter={16}>
          <Col xs={24} md={8}><Form.Item label="文件名 / 关键词" name="keyword"><Input placeholder="品牌、文件名或关键词" allowClear /></Form.Item></Col>
          <Col xs={24} md={8}><Form.Item label="上传人" name="uploader"><Input placeholder="请输入上传人" allowClear /></Form.Item></Col>
        </Row><Space><Button type="primary" icon={<SearchOutlined />} htmlType="submit">查询</Button>
          <Button onClick={() => { searchForm.resetFields(); setFilters({ keyword: '', uploader: '' }) }}>重置</Button></Space></div>
      </Form>
      <Divider className="operator-list-shell__divider" />
      {error && <Alert type="error" showIcon title={error} action={<Button onClick={() => void reload()}>重试</Button>} />}
      <ConfigurableProTable<KnowledgeDocument> columns={columns} dataSource={rows} loading={loading} rowKey="id"
        storageKey={`operation-knowledge-${kind}`} tableClassName="operator-pro-table" size="middle"
        headerTitle={kind === 'MANUAL' ? '品牌与业务知识' : '运营日常记忆'} pagination={{ defaultPageSize: 10, showSizeChanger: true }}
        toolBarRender={() => [<Button key="create" type="primary" icon={<PlusOutlined />} onClick={() => setCreating(true)}>新增{kind === 'MANUAL' ? '知识' : '记忆'}</Button>]} />
    </Card>
    <Drawer title="知识内容" open={Boolean(viewing)} onClose={() => setViewing(null)} size={720}>
      {viewing && <><h2>{viewing.fileName}</h2><p><Tag>{viewing.kind === 'MANUAL' ? '手工知识' : '日常记忆 · 非核实事实'}</Tag>{viewing.uploader} · {viewing.createdAt.replace('T', ' ').slice(0, 19)}</p>
        {/^https?:\/\//.test(viewing.sourceUrl) && <p><a href={viewing.sourceUrl} target="_blank" rel="noreferrer">查看资料来源</a></p>}
        <p>检索关键词：{viewing.keywords || '未设置'}</p>
        <div style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', lineHeight: 1.9 }}>{viewing.content}</div></>}
    </Drawer>
    <Drawer title={kind === 'MANUAL' ? '新增手工知识' : '新增日常记忆'} open={creating} onClose={() => !saving && setCreating(false)} size={640}>
      <Alert type="info" title="填写或导入 UTF-8 TXT / Markdown 文本。日常记忆不自动作为已核实品牌事实。" />
      <input type="file" accept=".txt,.md" aria-label="导入知识文本" style={{ margin: '16px 0' }} onChange={async event => {
        const file = event.target.files?.[0]
        if (!file) return
        if (!/\.(txt|md)$/i.test(file.name) || file.size > 90000) { void message.error('仅支持90KB以内的TXT或Markdown'); return }
        try { const content = await file.text(); if (content.length > 30000) throw new Error('内容不能超过30000字'); form.setFieldsValue({ fileName: file.name, content }) }
        catch (e) { void message.error(e instanceof Error ? e.message : '读取失败') }
      }} />
      <Form form={form} layout="vertical" onFinish={values => void save(values)}>
        <Form.Item name="fileName" label="文件名" rules={[{ required: true, whitespace: true }]}><Input maxLength={200} /></Form.Item>
        <Form.Item name="keywords" label="检索关键词（逗号分隔，支持品牌别名）" rules={[{ required: true, whitespace: true }]}><Input maxLength={1000} placeholder="圣碧涛,san benedetto,气泡水" /></Form.Item>
        <Form.Item name="sourceUrl" label="来源链接"><Input maxLength={2000} placeholder="https://..." /></Form.Item>
        <Form.Item name="content" label="知识内容" rules={[{ required: true, whitespace: true }]}><Input.TextArea rows={12} maxLength={30000} showCount /></Form.Item>
        <Button htmlType="submit" type="primary" loading={saving}>保存到知识库</Button>
      </Form>
    </Drawer>
  </div>
}
