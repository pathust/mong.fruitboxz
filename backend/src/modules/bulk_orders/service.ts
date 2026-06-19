import { MedusaService } from "@medusajs/framework/utils"
import { BulkOrder } from "./models/bulk-order"

class BulkOrdersService extends MedusaService({
  BulkOrder,
}) {}

export default BulkOrdersService
