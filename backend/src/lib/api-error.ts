import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export function sendInternalError(
  req: MedusaRequest,
  res: MedusaResponse,
  error: unknown,
  message: string,
  code = "INTERNAL_ERROR",
  status = 500
) {
  const logger = req.scope.resolve<{ error(message: string, error?: unknown): void }>("logger")
  logger.error(message, error)
  return res.status(status).json({ code, message })
}
