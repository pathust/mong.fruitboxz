import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export type ResolvePricesInput = {
  items: Array<{ variant_id?: string | null; price?: number; quantity: number; title?: string; variantLabel?: string; image?: string; frontend_item_id?: string; product_id?: string | null }>
  default_cost_percent: number
}

export const resolvePricesStepId = "resolve-prices-step"

export const resolvePricesStep = createStep(
  resolvePricesStepId,
  async (input: ResolvePricesInput, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const variantIds = input.items.map((item) => item.variant_id).filter(Boolean)

    let variantsMap: Record<string, any> = {}
    if (variantIds.length > 0) {
      const { data } = await query.graph({
        entity: "product_variant",
        fields: ["id", "title", "prices.*", "product.title", "metadata", "manage_inventory", "inventory_quantity"],
        filters: { id: variantIds }
      })
      
      for (const v of (data as any[] || [])) {
        variantsMap[v.id] = v
      }
    }

    const normalizedItems = []
    
    for (const item of input.items) {
      if (!item.variant_id) {
        // Custom item or bundle without a specific variant
        const unitPrice = item.price || 0
        const costPrice = Math.round(unitPrice * (input.default_cost_percent / 100))
        normalizedItems.push({
          title: item.title || "Sản phẩm tùy chọn",
          quantity: item.quantity,
          unit_price: unitPrice,
          product_title: item.title || "Sản phẩm tùy chọn",
          variant_id: null,
          metadata: {
            image: item.image || null,
            variant_label: item.variantLabel || null,
            frontend_item_id: item.frontend_item_id || null,
            variant_id: null,
            product_id: item.product_id || null,
            cost_price: costPrice,
          },
        })
        continue;
      }

      const variant = variantsMap[item.variant_id]
      if (!variant) {
        throw new Error(`Không tìm thấy sản phẩm hoặc biến thể bị xóa (ID: ${item.variant_id})`)
      }

      const vndPrice = (variant.prices || []).find((price: any) =>
        price.currency_code?.toLowerCase() === "vnd"
      )
      const amount = vndPrice?.amount;

      if (amount == null) {
        throw new Error(`Sản phẩm ${variant.title || item.title || "Sản phẩm"} chưa được cấu hình giá`)
      }

      const unitPrice = Number(amount)
      const variantTitle = variant.title || item.variantLabel || null
      const productTitle = variant.product?.title || item.title || "Sản phẩm"
      let costPrice = variant.metadata?.cost_price ? Number(variant.metadata.cost_price) : Math.round(unitPrice * (input.default_cost_percent / 100))

      normalizedItems.push({
        title: productTitle,
        quantity: item.quantity,
        unit_price: unitPrice,
        product_title: productTitle,
        variant_id: item.variant_id,
        metadata: {
          image: item.image || null,
          variant_label: variantTitle,
          frontend_item_id: item.frontend_item_id || item.variant_id || null,
          variant_id: item.variant_id,
          product_id: item.product_id || null,
          cost_price: costPrice,
        },
      })
    }

    return new StepResponse({ normalizedItems })
  }
)
