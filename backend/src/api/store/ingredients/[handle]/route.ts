import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const handle = (req.params.handle || "").toString()
  if (!handle) return res.status(400).json({ message: "Missing product handle" })

  const query = req.scope.resolve("query")
  const { data: products } = await query.graph({
    entity: "product",
    fields: [
      "variants.inventory_items.inventory.title",
      "variants.inventory_items.inventory.sku"
    ],
    filters: {
      handle: handle
    }
  })

  let ingredientsSet = new Set<string>()

  if (products && products.length > 0) {
    const product = products[0]
    for (const variant of product.variants || []) {
      for (const inv of variant.inventory_items || []) {
        if (inv.inventory?.sku?.startsWith("ing-") && inv.inventory?.title) {
          ingredientsSet.add(inv.inventory.title)
        }
      }
    }
  }

  // Fallback to defaults if no custom ingredients exist
  let ingredients = Array.from(ingredientsSet)
  if (ingredients.length === 0) {
    ingredients = ["Trái cây tươi theo mùa", "Muối hồng", "Sốt chanh dây nhẹ"]
  }

  res.json({ handle, ingredients })
}
