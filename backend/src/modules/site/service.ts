import { MedusaService } from "@medusajs/framework/utils"
import { Banner, SiteSetting, ChatbotQuestionLog, ContactMessage, BlogPost, BlogCategory } from "./models"

class SiteModuleService extends MedusaService({
  Banner,
  SiteSetting,
  ChatbotQuestionLog,
  ContactMessage,
  BlogPost,
  BlogCategory,
}) {}

export default SiteModuleService
