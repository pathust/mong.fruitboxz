import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getMediaObject } from "../../../lib/media"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const objectKey = decodeURIComponent((req.params?.object_key || "").toString())
    const media = await getMediaObject(objectKey)

    res.setHeader("Content-Type", media.contentType)
    if (media.size) {
      res.setHeader("Content-Length", String(media.size))
    }
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable")

    const body = media.body as any
    if (body?.pipe) {
      return body.pipe(res)
    }

    return res.send(body)
  } catch (err: any) {
    res.status(404).json({ message: err?.message || "Media not found" })
  }
}
