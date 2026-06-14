import { MedusaService } from "@medusajs/framework/utils"
import { Banner, SiteSetting, Review, ChatbotQuestionLog } from "./models"

class SiteModuleService extends MedusaService({
  Banner,
  SiteSetting,
  Review,
  ChatbotQuestionLog,
}) {}

export default SiteModuleService
