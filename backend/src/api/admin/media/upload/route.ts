import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { isObjectStorageEnabled, uploadMediaObject } from "../../../../lib/media"
import type { MediaUploadBody } from "../../../middlewares/validation"
import { sendInternalError } from "../../../../lib/api-error"

export async function POST(req: MedusaRequest<MediaUploadBody>, res: MedusaResponse) {
  try {
    const { data, filename } = req.validatedBody

    const media = await uploadMediaObject({ data, filename })
    res.status(201).json({
      ...media,
      object_storage: isObjectStorageEnabled(),
    })
  } catch (error: unknown) {
    sendInternalError(req, res, error, "Unable to upload media", "MEDIA_UPLOAD_FAILED")
  }
}
