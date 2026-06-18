import { MedusaContainer } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import * as fs from "fs"
import * as path from "path"

const CUSTOM_MAPPING = {
  "Sâm đất": ["Sâm"],
  "Cam canh": ["Cam"],
  "Cam Vàng": ["Cam Vàng"],
  "Bơ Hồng": ["Bơ", "Vú sữa"],
  "Dưa mật": ["Dưa lưới"],
  "Dưa hấu": ["Dưa hấu"],
  "Hồng giòn": ["Hồng"],
  "Hồng mật": ["Hồng"],
  "Hồng táo": ["Hồng táo"],
  "Ổi dâu": ["Ổi dâu"],
  "Sữa chua Hy Lạp": ["Sữa chua Hy Lạp"],
  "Xoài Bưởi Sago": ["Xoài", "Bưởi"],
  "Sữa chua dẻo dầm": ["Sữa chua Hy Lạp"],
  "Set 4 hộp quà": ["Hộp giấy Craft"],
  "Ume Fruits": ["Me"], // Ume is plum/apricot/tamarind, but we'll use Me based on previous error
}

export default async function run({ container }: { container: MedusaContainer }) {
  const query = container.resolve("query")
  const inventoryService = container.resolve("inventory")
  const remoteLink = container.resolve("remoteLink")

  let explicitMap: Record<string, string[]> = {}
  try {
    const mapPath = path.resolve(__dirname, "product-map.json")
    const mapContent = fs.readFileSync(mapPath, "utf-8")
    explicitMap = JSON.parse(mapContent)
    console.log(`Loaded explicit product map with ${Object.keys(explicitMap).length} entries.`)
  } catch (e) {
    console.log("Could not load product-map.json, relying on regex matching.")
  }

  const inventoryItems = await inventoryService.listInventoryItems({}, { take: 1000 })
  const inventoryMap = new Map()
  for (const item of inventoryItems) {
    inventoryMap.set(item.title.toLowerCase(), item.id)
  }
  
  const ingredientNames = Array.from(inventoryMap.keys()).sort((a, b) => b.length - a.length)

  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "title", "description", "variants.id", "variants.title"]
  })

  let linksCreated = 0

  for (const product of products) {
    let titleStr = (product.title || "").toLowerCase()
    let ingredientsFound = new Set<string>()

    // Use explicit mapping first if available
    const explicitIngredients = explicitMap[product.title]
    if (explicitIngredients) {
      explicitIngredients.forEach(i => ingredientsFound.add(i.toLowerCase()))
    } else {
      // Fallback to regex/substring
      for (const [key, ingredients] of Object.entries(CUSTOM_MAPPING)) {
        if (titleStr.includes(key.toLowerCase())) {
          ingredients.forEach(i => ingredientsFound.add(i.toLowerCase()))
          titleStr = titleStr.replace(key.toLowerCase(), "")
        }
      }

      for (const name of ingredientNames) {
        if (titleStr.includes(name)) {
          ingredientsFound.add(name)
          titleStr = titleStr.replace(name, "")
        }
      }
    }

    if (ingredientsFound.size > 0 && product.variants) {
      for (const variant of product.variants) {
        for (const ingName of ingredientsFound) {
          const invId = inventoryMap.get(ingName)
          if (invId) {
            try {
              await remoteLink.create({
                [Modules.PRODUCT]: { variant_id: variant.id },
                [Modules.INVENTORY]: { inventory_item_id: invId },
                data: { required_quantity: 1 }
              })
              linksCreated++
              console.log(`Linked ${product.title} -> ${ingName}`)
            } catch (e) {
              console.error(`Error linking ${product.title} to ${ingName}: ${e.message}`)
            }
          }
        }
      }
    }
  }

  console.log(`\nSuccessfully created ${linksCreated} new BOM links.`)
}
