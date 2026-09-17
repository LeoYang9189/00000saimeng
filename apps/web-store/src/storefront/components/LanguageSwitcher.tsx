import { Select } from 'antd'
import { useI18nSettings } from '../i18n'

export function LanguageSwitcher() {
  const { language, options, setLanguage } = useI18nSettings()

  return (
    <div className="language-switcher">
      <Select
        className="language-switcher__select"
        onChange={(value) => {
          setLanguage(value)
        }}
        options={options}
        size="middle"
        value={language}
      />
    </div>
  )
}
