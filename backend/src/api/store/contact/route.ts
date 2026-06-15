import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import createContactMessageWorkflow from "../../../workflows/create-contact-message"
import { CreateContactMessageSchema } from "./middlewares"

export async function POST(
  req: MedusaRequest<CreateContactMessageSchema>,
  res: MedusaResponse
) {
  const { result } = await createContactMessageWorkflow(req.scope).run({
    input: req.validatedBody,
  })

  res.status(201).json({
    contact_message: result.contactMessage,
  })
}
