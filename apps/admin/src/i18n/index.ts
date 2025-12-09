import { createI18n } from 'vue-i18n'

const messages = {
  'zh-TW': {},
}

const i18n = createI18n({
  legacy: false,
  locale: 'zh-TW',
  fallbackLocale: 'zh-TW',
  messages,
})

export default i18n
