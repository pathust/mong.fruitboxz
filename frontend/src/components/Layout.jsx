import { lazy, Suspense, useEffect, useState } from 'react'
import Header from './Header'
import Footer from './Footer'
import MobileBottomNav from './MobileBottomNav'

const ChatbotWidget = lazy(() => import('./ChatbotWidget'))

function DeferredChatbotWidget() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (typeof window.requestIdleCallback === 'function') {
      const handle = window.requestIdleCallback(() => setReady(true), { timeout: 2500 })
      return () => window.cancelIdleCallback(handle)
    }

    const handle = window.setTimeout(() => setReady(true), 1500)
    return () => window.clearTimeout(handle)
  }, [])

  if (!ready) return null

  return (
    <Suspense fallback={null}>
      <ChatbotWidget />
    </Suspense>
  )
}

export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 pb-24 md:pb-8">{children}</main>
      <Footer />
      <MobileBottomNav />
      <DeferredChatbotWidget />
    </div>
  )
}
