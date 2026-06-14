/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, useState } from 'react'
import { CheckCircle2, CircleAlert, Info, X } from 'lucide-react'

const ToastContext = createContext(null)

function toneStyles(tone) {
  if (tone === 'error') {
    return {
      icon: CircleAlert,
      panel: 'border-[#f6c6b8] bg-[#fff8f5] text-[#8a3a1c]',
      iconColor: 'text-[#ea5a2a]',
    }
  }

  if (tone === 'success') {
    return {
      icon: CheckCircle2,
      panel: 'border-[#dbe8cf] bg-[#f7fbf2] text-[#365223]',
      iconColor: 'text-[#6b9a36]',
    }
  }

  return {
    icon: Info,
    panel: 'border-[#eadfcd] bg-white text-[#5f5548]',
    iconColor: 'text-primary',
  }
}

export function ToastProvider({ children }) {
  const [items, setItems] = useState([])

  const pushToast = (message, tone = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`
    setItems((prev) => [...prev, { id, message, tone }])
    window.setTimeout(() => {
      setItems((prev) => prev.filter((item) => item.id !== id))
    }, 3200)
  }

  const removeToast = (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  const value = useMemo(() => ({ pushToast }), [])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[min(380px,calc(100vw-2rem))] flex-col gap-2">
        {items.map((item) => {
          const styles = toneStyles(item.tone)
          const Icon = styles.icon
          return (
            <div
              key={item.id}
              className={`pointer-events-auto flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-[0_18px_42px_-24px_rgba(60,38,19,0.35)] backdrop-blur ${styles.panel} animate-toast-in`}
            >
              <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${styles.iconColor}`} />
              <p className="flex-1 text-sm font-medium leading-6">{item.message}</p>
              <button type="button" onClick={() => removeToast(item.id)} className="rounded-full p-1 text-[#8a7d6c] hover:bg-black/5">
                <X className="h-4 w-4" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within ToastProvider')
  return context
}
