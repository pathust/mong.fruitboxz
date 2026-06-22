import { useEffect, useState } from 'react'
import { apiFetch } from '../lib/api'

export function useSiteSettings() {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    apiFetch('/store/custom?mode=site')
      .then((data) => {
        if (mounted) setSettings(data?.settings || {})
      })
      .catch((err) => {
        if (mounted) setError(err?.message || 'Không tải được nội dung từ backend.')
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => { mounted = false }
  }, [])

  return { settings, loading, error }
}
