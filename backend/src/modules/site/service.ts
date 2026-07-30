import { MedusaService } from "@medusajs/framework/utils"
import { Banner, SiteSetting, ChatbotQuestionLog, ContactMessage, BlogPost, BlogCategory, Review } from "./models"

class SiteModuleService extends MedusaService({
  Banner,
  SiteSetting,
  ChatbotQuestionLog,
  ContactMessage,
  BlogPost,
  BlogCategory,
  Review,
}) {}

export default SiteModuleService
