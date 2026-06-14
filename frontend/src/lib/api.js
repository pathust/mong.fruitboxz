async function parseJsonSafe(res) {
  try {
    return await res.json()
  } catch {
    return null
  }
}

export async function apiFetch(path, { token, headers, timeoutMs = 15000, ...options } = {}) {
  const finalHeaders = {
    'Content-Type': 'application/json',
    ...(headers || {}),
  }

  if (token) {
    finalHeaders.Authorization = `Bearer ${token}`
  }

  // Add publishable API key for store endpoints
  if (path.startsWith('/store') && import.meta.env.VITE_MEDUSA_PUBLISHABLE_KEY) {
    finalHeaders['x-publishable-api-key'] = import.meta.env.VITE_MEDUSA_PUBLISHABLE_KEY
  }

  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs)

  let res
  try {
    res = await fetch(path, {
      credentials: 'omit',
      ...options,
      headers: finalHeaders,
      signal: options.signal || controller.signal,
    })
  } catch (error) {
    if (error?.name === 'AbortError') {
      // If the external signal was aborted (not our timeout), re-throw as-is
      if (options.signal?.aborted) {
        throw error
      }
      // Otherwise it's our internal timeout
      const err = new Error('Request timeout. Vui lòng kiểm tra backend/service liên quan.')
      err.status = 408
      throw err
    }
    throw error
  } finally {
    window.clearTimeout(timeout)
  }

  const data = await parseJsonSafe(res)

  if (!res.ok) {
    let message = data?.message || data?.error || 'Request failed'
    if (typeof message === "object") {
      message = JSON.stringify(message, null, 2)
    }
    const err = new Error(message)
    err.status = res.status
    err.data = data
    throw err
  }

  return data
}
