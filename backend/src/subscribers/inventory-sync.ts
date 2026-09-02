import { type SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import { INGREDIENTS_MODULE } from "../modules/ingredients"

export default async function inventorySyncHandler({
  event: { data, name },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger")
  
  if (name === "order.placed") {
    logger.info(`[Queue] Tiến trình nền: Bắt đầu đồng bộ tồn kho do có đơn hàng mới ${data.id}`)
    
    try {
      const query = container.resolve("query")
      const { data: orders } = await query.graph({
        entity: "order",
        fields: ["id", "items.*"],
        filters: { id: data.id }
      })

      if (orders && orders.length > 0) {
        const order = orders[0] as any
        const ingredientsService = container.resolve(INGREDIENTS_MODULE)
        
        const variantsToDeduct = order.items?.map((item: any) => {
          const variantId = item.variant_id || item.variant?.id || item.metadata?.variant_id
          return {
            variant_id: variantId,
            quantity: item.quantity
          }
        }).filter((v: any) => v.variant_id) || []

        if (variantsToDeduct.length > 0) {
          const deductions = await ingredientsService.deductIngredientsForVariants(variantsToDeduct)
          
          if (Object.keys(deductions).length > 0) {
            const inventoryService = container.resolve(Modules.INVENTORY)
            
            const ingredientIds = Object.keys(deductions)
            logger.info(`[Queue] Deductions: ${JSON.stringify(deductions)}`)
            
            const { data: ingData } = await query.graph({
              entity: "ingredient",
              fields: ["id", "inventory_item.id", "inventory_item.location_levels.*"],
              filters: { id: ingredientIds }
            })
            
            logger.info(`[Queue] Fetched ingData: ${JSON.stringify(ingData)}`)
            
            const levelUpdates: any[] = []
            
            for (const ing of ingData as any[]) {
              let remaining = deductions[ing.id] || 0
              const locationLevels = ing.inventory_item?.location_levels || []

              if (locationLevels.length > 0 && remaining) {
                // Stock validation (validate-inventory-step.ts) checks
                // availability against the SUM across every location level,
                // so deduction has to draw from all of them too — pulling
                // the whole amount from locationLevels[0] alone silently
                // overstates remaining total stock whenever an ingredient's
                // stock is split across more than one location.
                for (const level of locationLevels) {
                  if (remaining <= 0) break
                  const currentStock = level.stocked_quantity || 0
                  const take = Math.min(currentStock, remaining)
                  if (take <= 0) continue
                  remaining -= take
                  const newStock = currentStock - take

                  logger.info(`[Queue] Updating level for ing ${ing.id} @ ${level.location_id}: current ${currentStock}, deducting ${take}, new ${newStock}`)

                  levelUpdates.push({
                    inventory_item_id: level.inventory_item_id,
                    location_id: level.location_id,
                    stocked_quantity: newStock
                  })
                }
                if (remaining > 0) {
                  logger.info(`[Queue] Ing ${ing.id}: ${remaining} still undeducted after exhausting all location levels (stock already ran out)`)
                }
              } else {
                logger.info(`[Queue] No location levels found for ing ${ing.id} or amountToDeduct is falsy`)
              }
            }
            
            logger.info(`[Queue] Level updates payload: ${JSON.stringify(levelUpdates)}`)
            
            if (levelUpdates.length > 0) {
              await inventoryService.updateInventoryLevels(levelUpdates)
            }
          }
          
          logger.info(`[Queue] Hoàn tất trừ kho nguyên liệu cho đơn hàng ${data.id}`)
        }
      }
    } catch (error) {
      logger.error(`[Queue] Lỗi trừ kho nguyên liệu cho đơn hàng ${data.id}:`, error)
    }
  } else {
    logger.info(`[Queue] Tiến trình nền: Cập nhật tồn kho sản phẩm ${data.id}`)
  }
}

export const config: SubscriberConfig = {
  event: ["order.placed", "product.updated"],
}
