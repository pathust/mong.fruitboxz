import { model } from "@medusajs/framework/utils"

const ChatbotQuestionLog = model.define("site_chatbot_question_log", {
  id: model.id().primaryKey(),
  message: model.text(),
  normalized_message: model.text(),
  response_mode: model.text().nullable(),
  resolved: model.boolean().default(false),
  metadata: model.json().nullable(),
})

export default ChatbotQuestionLog
