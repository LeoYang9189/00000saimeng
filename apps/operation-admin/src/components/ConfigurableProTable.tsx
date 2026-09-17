import { ArrowDownOutlined, ArrowUpOutlined, EyeInvisibleOutlined, EyeOutlined, SettingOutlined } from '@ant-design/icons'
import { Button, Drawer, InputNumber, Space, Switch, Typography } from 'antd'
import { ProTable, type ProColumns, type ProTableProps } from '@ant-design/pro-components'
import { useEffect, useMemo, useState } from 'react'

interface ColumnSettingItem {
  hidden: boolean
  key: string
  order: number
  title: string
  width?: number
}

export interface ConfigurableColumn<T extends object> extends ProColumns<T> {
  hideInSetting?: boolean
}

interface ConfigurableProTableProps<T extends object, Params extends Record<string, unknown>>
  extends Omit<ProTableProps<T, Params>, 'columns' | 'options' | 'search'> {
  columns: ConfigurableColumn<T>[]
  storageKey: string
}

/**
 * 带列配置能力的 ProTable 封装。
 */
export function ConfigurableProTable<T extends object, Params extends Record<string, unknown> = Record<string, never>>({
  columns,
  storageKey,
  toolBarRender,
  ...restProps
}: ConfigurableProTableProps<T, Params>) {
  const [isSettingDrawerOpen, setIsSettingDrawerOpen] = useState(false)
  const baseColumnSettings = useMemo(() => createDefaultColumnSettings(columns), [columns])
  const [columnSettings, setColumnSettings] = useState<ColumnSettingItem[]>(() =>
    mergeStoredColumnSettings(storageKey, baseColumnSettings),
  )

  useEffect(() => {
    setColumnSettings((currentSettings) => syncColumnSettings(currentSettings, baseColumnSettings))
  }, [baseColumnSettings])

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(columnSettings))
  }, [columnSettings, storageKey])

  const visibleColumns = useMemo(() => {
    const columnMap = new Map(columns.map((column) => [getColumnSettingKey(column), column]))
    const fixedColumns = columns.filter((column) => column.hideInSetting)
    const configurableColumns = [...columnSettings]
      .sort((left, right) => left.order - right.order)
      .filter((setting) => !setting.hidden)
      .map((setting) => {
        const matchedColumn = columnMap.get(setting.key)
        if (!matchedColumn) {
          return null
        }

        return {
          ...matchedColumn,
          width: setting.width ?? matchedColumn.width,
        }
      })
      .filter(Boolean) as ConfigurableColumn<T>[]

    return [...configurableColumns, ...fixedColumns]
  }, [columnSettings, columns])

  function updateColumnSetting(columnKey: string, updater: (setting: ColumnSettingItem) => ColumnSettingItem) {
    setColumnSettings((currentSettings) =>
      currentSettings.map((setting) => (setting.key === columnKey ? updater(setting) : setting)),
    )
  }

  function moveColumn(columnKey: string, direction: 'up' | 'down') {
    setColumnSettings((currentSettings) => {
      const currentIndex = currentSettings.findIndex((setting) => setting.key === columnKey)
      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1

      if (currentIndex < 0 || targetIndex < 0 || targetIndex >= currentSettings.length) {
        return currentSettings
      }

      const nextSettings = [...currentSettings]
      const currentItem = nextSettings[currentIndex]
      const targetItem = nextSettings[targetIndex]
      const currentOrder = currentItem.order

      nextSettings[currentIndex] = { ...targetItem, order: currentOrder }
      nextSettings[targetIndex] = { ...currentItem, order: targetItem.order }

      return nextSettings.sort((left, right) => left.order - right.order)
    })
  }

  return (
    <>
      <ProTable<T, Params>
        cardProps={false}
        columns={visibleColumns}
        ghost
        options={false}
        search={false}
        toolBarRender={(...args) => [
          ...(toolBarRender ? toolBarRender(...args) : []),
          <Button icon={<SettingOutlined />} key="column-setting" onClick={() => setIsSettingDrawerOpen(true)}>
            列配置
          </Button>,
        ]}
        {...restProps}
      />

      <Drawer
        className="operator-form-drawer"
        destroyOnHidden
        open={isSettingDrawerOpen}
        size={420}
        title="列表列配置"
        onClose={() => setIsSettingDrawerOpen(false)}
      >
        <div className="operator-column-setting">
          {columnSettings.map((setting, index) => (
            <div className="operator-column-setting__item" key={setting.key}>
              <div className="operator-column-setting__main">
                <Typography.Text>{setting.title}</Typography.Text>
                <Space size={8}>
                  <Switch
                    checked={!setting.hidden}
                    checkedChildren={<EyeOutlined />}
                    unCheckedChildren={<EyeInvisibleOutlined />}
                    onChange={(checked) =>
                      updateColumnSetting(setting.key, (currentSetting) => ({
                        ...currentSetting,
                        hidden: !checked,
                      }))
                    }
                  />
                  <InputNumber
                    className="operator-column-setting__width"
                    min={80}
                    placeholder="列宽"
                    precision={0}
                    value={setting.width}
                    onChange={(value) =>
                      updateColumnSetting(setting.key, (currentSetting) => ({
                        ...currentSetting,
                        width: typeof value === 'number' ? value : undefined,
                      }))
                    }
                  />
                </Space>
              </div>

              <Space size={8}>
                <Button disabled={index === 0} icon={<ArrowUpOutlined />} onClick={() => moveColumn(setting.key, 'up')} />
                <Button
                  disabled={index === columnSettings.length - 1}
                  icon={<ArrowDownOutlined />}
                  onClick={() => moveColumn(setting.key, 'down')}
                />
              </Space>
            </div>
          ))}
        </div>
      </Drawer>
    </>
  )
}

function getColumnSettingKey<T extends object>(column: ConfigurableColumn<T>) {
  if (typeof column.key === 'string') {
    return column.key
  }

  if (typeof column.dataIndex === 'string') {
    return column.dataIndex
  }

  if (Array.isArray(column.dataIndex)) {
    return column.dataIndex.join('.')
  }

  return String(column.title)
}

function createDefaultColumnSettings<T extends object>(columns: ConfigurableColumn<T>[]): ColumnSettingItem[] {
  return columns
    .filter((column) => !column.hideInSetting)
    .map((column, index) => ({
      hidden: Boolean(column.hideInTable),
      key: getColumnSettingKey(column),
      order: index,
      title: typeof column.title === 'string' ? column.title : getColumnSettingKey(column),
      width: typeof column.width === 'number' ? column.width : undefined,
    }))
}

function mergeStoredColumnSettings(storageKey: string, defaultSettings: ColumnSettingItem[]) {
  try {
    const rawValue = window.localStorage.getItem(storageKey)
    if (!rawValue) {
      return defaultSettings
    }

    const storedSettings = JSON.parse(rawValue) as ColumnSettingItem[]
    return syncColumnSettings(storedSettings, defaultSettings)
  } catch {
    return defaultSettings
  }
}

function syncColumnSettings(currentSettings: ColumnSettingItem[], defaultSettings: ColumnSettingItem[]) {
  const currentSettingMap = new Map(currentSettings.map((setting) => [setting.key, setting]))

  return defaultSettings.map((defaultSetting, index) => {
    const matchedSetting = currentSettingMap.get(defaultSetting.key)

    return matchedSetting
      ? {
          ...defaultSetting,
          ...matchedSetting,
          order: matchedSetting.order ?? index,
        }
      : {
          ...defaultSetting,
          order: index,
        }
  })
}
