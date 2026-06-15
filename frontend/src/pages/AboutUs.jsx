import { Award, Gift, LoaderCircle, Truck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useSiteSettings } from '../hooks/useSiteSettings'

const reasonIcons = { quality: Award, gift: Gift, delivery: Truck }

function parseReasons(value) {
  try {
    return value ? JSON.parse(value) : []
  } catch {
    return []
  }
}

export default function AboutUs() {
  const { settings, loading, error } = useSiteSettings()

  if (loading) return <div className="min-h-[420px] flex items-center justify-center text-primary"><LoaderCircle className="h-8 w-8 animate-spin" /></div>
  if (error) return <div className="max-w-3xl mx-auto px-4 py-20 text-center text-red-600">{error}</div>

  const reasons = parseReasons(settings?.about_reasons_json)

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
        <Link to="/" className="hover:text-primary">Trang chủ</Link>
        <span>/</span>
        <span className="text-secondary">Về chúng tôi</span>
      </nav>

      <section className="mb-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-secondary mb-4">{settings?.about_title}</h1>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">{settings?.about_intro}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="overflow-hidden rounded-xl bg-accent aspect-[4/3]">
            {settings?.about_image && <img src={settings.about_image} alt={settings.about_title} className="w-full h-full object-cover" />}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-secondary mb-4">{settings?.about_story_title}</h2>
            <div className="space-y-4 text-gray-600 leading-relaxed">
              {settings?.about_story && <p>{settings.about_story}</p>}
              {settings?.about_story_secondary && <p>{settings.about_story_secondary}</p>}
            </div>
          </div>
        </div>
      </section>

      {reasons.length > 0 && (
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-secondary text-center mb-8">{settings?.about_reasons_title}</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {reasons.map((item) => {
              const Icon = reasonIcons[item.icon] || Award
              return (
                <div key={item.title} className="text-center p-8 bg-white rounded-xl shadow-sm">
                  <Icon className="h-9 w-9 mx-auto mb-4 text-primary" />
                  <h3 className="font-semibold text-secondary text-lg mb-2">{item.title}</h3>
                  <p className="text-gray-500 text-sm">{item.description}</p>
                </div>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
