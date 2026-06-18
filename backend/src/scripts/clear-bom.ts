import { MedusaContainer } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export default async function run({ container }: { container: MedusaContainer }) {
  const remoteLink = container.resolve("remoteLink")
  const query = container.resolve("query")
  
  const { data: variants } = await query.graph({
    entity: "variant",
    fields: ["id", "inventory_items.inventory_item_id"]
  })

  let deleted = 0
  for (const variant of variants) {
    if (variant.inventory_items && variant.inventory_items.length > 0) {
      for (const item of variant.inventory_items) {
        try {
          await remoteLink.dismiss({
            [Modules.PRODUCT]: { variant_id: variant.id },
            [Modules.INVENTORY]: { inventory_item_id: item.inventory_item_id }
          })
          deleted++
        } catch(e) {
          console.error(e.message)
        }
      }
    }
  }
  console.log(`Deleted ${deleted} links.`)
}
