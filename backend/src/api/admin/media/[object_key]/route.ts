import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { deleteMediaObject } from "../../../../lib/media"
import { sendInternalError } from "../../../../lib/api-error"

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  try {
    const objectKey = decodeURIComponent(req.params.object_key)
    await deleteMediaObject(objectKey)
    res.json({ ok: true })
  } catch (error: unknown) {
    sendInternalError(req, res, error, "Unable to delete media", "MEDIA_DELETE_FAILED")
  }
}
