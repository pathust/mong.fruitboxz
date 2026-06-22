/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const { t, i18n } = useTranslation()

  // The lang state is managed by i18n instance. 
  // We sync it with document.documentElement.lang
  useEffect(() => {
    document.documentElement.lang = i18n.language
  }, [i18n.language])

  const setLang = (langCode) => {
    i18n.changeLanguage(langCode)
  }

  // To maintain backward compatibility with previous useLanguage() signature:
  // t returns the key if translation is missing because we configured i18next to do so
  // or we can fallback if needed. i18next does it natively (with fallbackLng).
  const value = useMemo(() => ({
    lang: i18n.language,
    setLang,
    t: (key) => {
      // i18next returns the key if it doesn't find translation and no fallback matches
      // but to strictly match our previous behaviour of returning the key exactly:
      const res = t(key)
      return res || key
    },
  }), [i18n.language, t])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}