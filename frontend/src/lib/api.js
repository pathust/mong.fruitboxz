import { medusa } from "../medusa"

function normalizeBody(body) {
  if (typeof body !== "string") return body

  try {
    return JSON.parse(body)
  } catch {
    return body
  }
}

function unwrapEnvelope(payload) {
  if (!payload || typeof payload !== "object") return payload
  if (!("data" in payload && "error" in payload && "meta" in payload)) return payload

  if (payload.error) {
    const error = new Error(payload.error.message || "Request failed")
    error.code = payload.error.code
    error.details = payload.error.details
    throw error
  }

  return payload.data
}

export async function apiFetch(path, { token, headers, timeoutMs = 15000, ...options } = {}) {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs)
  const signal = options.signal || controller.signal
  const finalHeaders = { ...(headers || {}) }

  if (token) {
    finalHeaders.Authorization = `Bearer ${token}`
  }

  try {
    const payload = await medusa.client.fetch(path, {
      ...options,
      body: normalizeBody(options.body),
      headers: finalHeaders,
      signal,
    })

    return unwrapEnvelope(payload)
  } catch (error) {
    if (error?.name === "AbortError") {
      if (options.signal?.aborted) throw error

      const timeoutError = new Error("Request timeout. Vui lòng kiểm tra backend/service liên quan.")
      timeoutError.status = 408
      throw timeoutError
    }

    throw error
  } finally {
    window.clearTimeout(timeout)
  }
}
