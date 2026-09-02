import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { CACHE_KEYS, TTL, cached, resolveCache } from "../../../lib/cache"
import { sendInternalError } from "../../../lib/api-error"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const query = req.scope.resolve("query")
    const cache = resolveCache(req.scope)

    const result = await cached(cache, CACHE_KEYS.ingredients, TTL.ingredients, async () => {
      const [{ data: ingredients }, { data: recipeItems }] = await Promise.all([
        query.graph({
          entity: "ingredient",
          fields: ["*"],
        }),
        query.graph({
          entity: "recipe_item",
          fields: ["*", "ingredient.*"],
          pagination: { skip: 0, take: 5000 }
        }),
      ])
      return { ingredients, recipeItems }
    })

    res.json(result)
  } catch (error: unknown) {
    sendInternalError(req, res, error, "Unable to fetch ingredients", "INGREDIENTS_LIST_FAILED")
  }
}
