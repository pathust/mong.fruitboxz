import { MedusaService } from "@medusajs/framework/utils"
import { Vote } from "./models/vote"

class VotingService extends MedusaService({
  Vote,
}) {}

export default VotingService
