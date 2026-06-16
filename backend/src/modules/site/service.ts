import { MedusaService } from "@medusajs/framework/utils"
import { Banner, SiteSetting, Review, ChatbotQuestionLog, ContactMessage, BlogPost } from "./models"

class SiteModuleService extends MedusaService({
  Banner,
  SiteSetting,
  Review,
  ChatbotQuestionLog,
  ContactMessage,
  BlogPost,
}) {}

export default SiteModuleService
