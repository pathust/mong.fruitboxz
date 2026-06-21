import { initialize } from "@medusajs/medusa"
import { INGREDIENTS_MODULE } from "../modules/ingredients"

async function main() {
  const { container } = await initialize()
  const ingredientsService = container.resolve(INGREDIENTS_MODULE)
  const query = container.resolve("query")
  
  const { data } = await query.graph({
    entity: "ingredient",
    fields: ["id", "name", "type"],
  })
  
  let count = 0
  
  for (const ingredient of data) {
    const name = ingredient.name.toLowerCase()
    let newType = "other"
    
    if (name.includes("sốt chấm") || name.includes("muối") || name.includes("mắm") || name.includes("tương")) {
      newType = "dip_sauce"
    } else if (name.includes("sốt trộn") || name.includes("sốt dâu") || name.includes("sốt chanh") || name.includes("sốt phô mai") || name.includes("sốt mè")) {
      newType = "mix_sauce"
    } else if (name.includes("sữa chua")) {
      newType = "yogurt"
    } else if (name.includes("xoài") || name.includes("dâu") || name.includes("dưa") || name.includes("ổi") || name.includes("nho") || name.includes("táo") || name.includes("mận") || name.includes("cam") || name.includes("bưởi") || name.includes("kiwi") || name.includes("cherry") || name.includes("thơm") || name.includes("khế") || name.includes("nhãn") || name.includes("vải") || name.includes("mít") || name.includes("chuối") || name.includes("hồng") || name.includes("lựu") || name.includes("lê") || name.includes("măng cụt") || name.includes("sầu riêng") || name.includes("chôm chôm") || name.includes("đu đủ") || name.includes("dừa") || name.includes("đào") || name.includes("thanh long")) {
      newType = "fruit"
    } else if (name.includes("sốt")) {
      // Fallback for generic "sốt"
      newType = "dip_sauce"
    }
    
    if (ingredient.type !== newType) {
      console.log(`Updating ${ingredient.name} -> ${newType}`)
      await ingredientsService.updateIngredients({
        id: ingredient.id,
        type: newType
      })
      count++
    }
  }
  
  console.log(`Classified ${count} ingredients.`)
  process.exit(0)
}

main().catch(console.error)
