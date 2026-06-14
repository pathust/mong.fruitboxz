import Medusa from "@medusajs/medusa-js"

const MEDUSA_URL = import.meta.env.VITE_MEDUSA_URL || "http://localhost:9000"

export const medusa = new Medusa({
  baseUrl: MEDUSA_URL,
  maxRetries: 3,
})

export const getPublishableApiKey = () => {
  return import.meta.env.VITE_MEDUSA_PUBLISHABLE_KEY || "temp"
}
