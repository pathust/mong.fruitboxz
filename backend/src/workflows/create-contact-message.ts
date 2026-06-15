import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import {
  createContactMessageStep,
  CreateContactMessageInput,
} from "./steps/create-contact-message"

const createContactMessageWorkflow = createWorkflow(
  "create-contact-message",
  function (input: CreateContactMessageInput) {
    const contactMessage = createContactMessageStep(input)
    return new WorkflowResponse({ contactMessage })
  }
)

export default createContactMessageWorkflow
