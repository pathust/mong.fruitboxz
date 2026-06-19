import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { resolveSiteService } from "../../lib/module-services"

export type CreateContactMessageInput = {
  name: string
  email: string
  phone?: string
  message: string
}

export const createContactMessageStep = createStep(
  "create-contact-message",
  async (input: CreateContactMessageInput, { container }) => {
    const siteService = resolveSiteService(container)
    const contactMessage = await siteService.createContactMessages({
      ...input,
      phone: input.phone || null,
      status: "new",
    })

    return new StepResponse(contactMessage, contactMessage.id)
  },
  async (id: string, { container }) => {
    const siteService = resolveSiteService(container)
    await siteService.deleteContactMessages(id)
  }
)
