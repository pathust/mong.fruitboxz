import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getMediaObject } from "../../../lib/media"
import { sendInternalError } from "../../../lib/api-error"

type PipeableBody = { pipe(destination: MedusaResponse): unknown }

function isPipeable(body: unknown): body is PipeableBody {
  return Boolean(body) && typeof body === "object" && "pipe" in body && typeof body.pipe === "function"
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const objectKey = decodeURIComponent((req.params?.object_key || "").toString())
    const media = await getMediaObject(objectKey)

    res.setHeader("Content-Type", media.contentType)
    if (media.size) {
      res.setHeader("Content-Length", String(media.size))
    }
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable")

    const body: unknown = media.body
    if (isPipeable(body)) {
      return body.pipe(res)
    }

    return res.send(body)
  } catch (error: unknown) {
    return sendInternalError(req, res, error, "Media not found", "MEDIA_NOT_FOUND", 404)
  }
}
