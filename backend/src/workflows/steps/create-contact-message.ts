import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

export type CreateContactMessageInput = {
  name: string
  email: string
  phone?: string
  message: string
}

export const createContactMessageStep = createStep(
  "create-contact-message",
  async (input: CreateContactMessageInput, { container }) => {
    const siteService = container.resolve("site") as any
    const contactMessage = await siteService.createContactMessages({
      ...input,
      phone: input.phone || null,
      status: "new",
    })

    return new StepResponse(contactMessage, contactMessage.id)
  },
  async (id: string, { container }) => {
    const siteService = container.resolve("site") as any
    await siteService.deleteContactMessages(id)
  }
)
