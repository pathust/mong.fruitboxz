import Medusa from "@medusajs/js-sdk"

const MEDUSA_URL = import.meta.env.VITE_MEDUSA_URL || "http://localhost:9000"

export const medusa = new Medusa({
  baseUrl: MEDUSA_URL,
  debug: import.meta.env.DEV,
  publishableKey: import.meta.env.VITE_MEDUSA_PUBLISHABLE_KEY,
  auth: {
    type: "jwt",
    jwtTokenStorageMethod: "local",
    jwtTokenStorageKey: "medusa_auth_token",
    fetchCredentials: "omit",
  },
})

export const getPublishableApiKey = () => import.meta.env.VITE_MEDUSA_PUBLISHABLE_KEY || ""
