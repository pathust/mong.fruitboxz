import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import Backend from 'i18next-http-backend'

i18n
  // Load translations via http from /public/locales
  .use(Backend)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // init i18next
  .init({
    lng: 'vi', // Force Vietnamese
    fallbackLng: 'vi',
    debug: false,
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    }
  })

export default i18n
