import { BoldOutlined, ItalicOutlined, LinkOutlined, OrderedListOutlined, UnorderedListOutlined } from '@ant-design/icons'
import { Button, Space } from 'antd'
import { useEffect, useRef } from 'react'

interface SimpleRichTextEditorProps {
  value?: string
  onChange?: (value: string) => void
}

function exec(command: string, value?: string) {
  document.execCommand(command, false, value)
}

/**
 * 轻量富文本编辑器。
 */
export function SimpleRichTextEditor({ value, onChange }: SimpleRichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!editorRef.current) {
      return
    }

    if (editorRef.current.innerHTML !== (value ?? '')) {
      editorRef.current.innerHTML = value ?? ''
    }
  }, [value])

  function handleInput() {
    onChange?.(editorRef.current?.innerHTML ?? '')
  }

  function handleInsertLink() {
    const url = window.prompt('请输入链接地址')
    if (!url) {
      return
    }
    exec('createLink', url)
    handleInput()
  }

  return (
    <div style={{ border: '1px solid #d9d9d9', padding: 12 }}>
      <Space size={8} style={{ marginBottom: 12 }} wrap>
        <Button icon={<BoldOutlined />} onClick={() => exec('bold')} type="default" />
        <Button icon={<ItalicOutlined />} onClick={() => exec('italic')} type="default" />
        <Button icon={<OrderedListOutlined />} onClick={() => exec('insertOrderedList')} type="default" />
        <Button icon={<UnorderedListOutlined />} onClick={() => exec('insertUnorderedList')} type="default" />
        <Button icon={<LinkOutlined />} onClick={handleInsertLink} type="default" />
      </Space>

      <div
        contentEditable
        onInput={handleInput}
        ref={editorRef}
        style={{ minHeight: 240, outline: 'none', whiteSpace: 'pre-wrap' }}
        suppressContentEditableWarning
      />
    </div>
  )
}
