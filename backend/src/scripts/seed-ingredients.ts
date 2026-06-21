import { Modules } from "@medusajs/framework/utils"
import { ExecArgs } from "@medusajs/framework/types"
import { INGREDIENTS_MODULE } from "../modules/ingredients"
import fs from "fs"

export default async function seedIngredients({ container }: ExecArgs) {
  const ingredientsData = JSON.parse(fs.readFileSync('/tmp/ingredients.json', 'utf8'))
  const recipesData = JSON.parse(fs.readFileSync('/tmp/recipes.json', 'utf8'))

  const ingredientsService = container.resolve(INGREDIENTS_MODULE)
  
  console.log(`Inserting ${ingredientsData.length} ingredients...`)
  const ingredientMap = {}
  
  for (const item of ingredientsData) {
    const created = await ingredientsService.createIngredients({
      name: item.name,
      unit: item.unit,
      cost_price: item.cost_price,
      stock_quantity: item.stock_quantity,
      sku: "ing-" + Buffer.from(item.name).toString('base64').substring(0, 10).replace(/[^a-zA-Z0-9]/g, '')
    })
    ingredientMap[item.name] = created.id
  }

  console.log("Ingredients inserted. Now inserting recipes...")
  const recipeItemsToCreate = []
  
  for (const p of recipesData) {
    if (!p.recipes || p.recipes.length === 0) continue;
    
    for (const r of p.recipes) {
      const ingredientId = ingredientMap[r.name]
      if (!ingredientId) {
        console.warn(`WARNING: Ingredient not found for ${r.name}`)
        continue
      }
      
      recipeItemsToCreate.push({
        variant_id: p.variant_id,
        ingredient_id: ingredientId,
        quantity: r.qty
      })
    }
  }

  console.log(`Creating ${recipeItemsToCreate.length} recipe items...`)
  // Chunking to avoid large inserts
  const chunkSize = 50
  for (let i = 0; i < recipeItemsToCreate.length; i += chunkSize) {
    const chunk = recipeItemsToCreate.slice(i, i + chunkSize)
    await ingredientsService.createRecipeItems(chunk)
  }

  console.log("Seeding complete!")
  process.exit(0)
}
