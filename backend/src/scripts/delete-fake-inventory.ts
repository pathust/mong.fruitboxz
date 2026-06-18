import { MedusaContainer } from "@medusajs/framework/types"

export default async function run({ container }: { container: MedusaContainer }) {
  const inventoryService = container.resolve("inventory")
  const items = await inventoryService.listInventoryItems({}, { take: 1000 })
  
  const fakeKeywords = ["Standard", "Size", "Mặc định"]
  
  const toDelete = items.filter(item => 
    fakeKeywords.some(kw => item.title?.includes(kw))
  )
  
  console.log(`Found ${toDelete.length} fake inventory items to delete.`)
  for (const item of toDelete) {
    console.log(`Deleting: ${item.title} (${item.id})`)
    await inventoryService.deleteInventoryItems([item.id])
  }
}
