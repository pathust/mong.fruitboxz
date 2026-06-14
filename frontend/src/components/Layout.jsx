import Header from './Header'
import Footer from './Footer'
import MobileBottomNav from './MobileBottomNav'
import ChatbotWidget from './ChatbotWidget'

export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 pb-24 md:pb-8">{children}</main>
      <Footer />
      <MobileBottomNav />
      <ChatbotWidget />
    </div>
  )
}
