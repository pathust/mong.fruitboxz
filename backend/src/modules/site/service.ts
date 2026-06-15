import { MedusaService } from "@medusajs/framework/utils"
import { Banner, SiteSetting, Review, ChatbotQuestionLog, ContactMessage } from "./models"

class SiteModuleService extends MedusaService({
  Banner,
  SiteSetting,
  Review,
  ChatbotQuestionLog,
  ContactMessage,
}) {}

export default SiteModuleService
