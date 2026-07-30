import { createWorkflow, WorkflowResponse, transform } from "@medusajs/framework/workflows-sdk"
import { createOrderStep } from "./steps/create-order-step"
import { updateOrderCodeStep } from "./steps/update-order-code-step"
import { emitOrderPlacedEventStep } from "./steps/emit-order-placed-event-step"
import { resolvePricesStep } from "./steps/resolve-prices-step"
import { validateInventoryStep } from "./steps/validate-inventory-step"
import { resolveShippingStep } from "./steps/resolve-shipping-step"
import { resolvePromotionsStep } from "./steps/resolve-promotions-step"

export type CheckoutOrderWorkflowInput = {
  items: Array<{
    variant_id?: string | null
    price?: number
    quantity: number
    title?: string
    variantLabel?: string
    image?: string
    frontend_item_id?: string
    product_id?: string | null
  }>
  shipping: {
    name: string
    address: string
    city: string
    district: string
    phone: string
    email?: string
    note?: string
    lat?: number
    lng?: number
  }
  idempotency_key?: string
  promotion_code?: string
  region_id?: string
  sales_channel_id?: string
  customer_id?: string
  default_cost_percent: number
}

export const checkoutOrderWorkflow = createWorkflow(
  "checkout-order",
  function (input: CheckoutOrderWorkflowInput) {
    // 1. Resolve Prices & Normalize Items
    const pricesResult = resolvePricesStep({
      items: input.items,
      default_cost_percent: input.default_cost_percent
    })

    // 2. Validate Inventory
    validateInventoryStep({
      items: input.items
    })

    // 3. Resolve Shipping
    const shippingResult = resolveShippingStep({
      shipping: input.shipping
    })

    // 4. Transform for promotions
    const subtotal = transform({ pricesResult }, (data) => {
      return data.pricesResult.normalizedItems.reduce((sum, item) => sum + item.unit_price * item.quantity, 0)
    })

    // 5. Resolve Promotions
    const promotionsResult = resolvePromotionsStep({
      promotion_code: input.promotion_code,
      normalizedItems: pricesResult.normalizedItems,
      originalSubtotal: subtotal
    })

    // 6. Build Order Data
    const orderData = transform(
      { input, pricesResult, shippingResult, promotionsResult, subtotal },
      (data) => {
        const first_name = data.input.shipping.name.trim().split(/\s+/)[0] || ""
        const last_name = data.input.shipping.name.trim().split(/\s+/).slice(1).join(" ") || first_name
        const customerEmail = data.input.shipping.email?.toLowerCase().trim() || first_name.toLowerCase() + "@example.com"

        return {
          email: customerEmail,
          currency_code: "vnd",
          region_id: data.input.region_id,
          sales_channel_id: data.input.sales_channel_id,
          customer_id: data.input.customer_id,
          shipping_address: {
            first_name,
            last_name,
            address_1: data.input.shipping.address,
            city: data.input.shipping.city,
            province: data.input.shipping.district || "",
            phone: data.input.shipping.phone,
          },
          items: data.pricesResult.normalizedItems,
          status: "pending",
          metadata: {
            note: data.input.shipping.note || "",
            source: "frontend",
            shipping_fee: data.shippingResult.quote.shipping,
            shipping_quote_mode: data.shippingResult.quote.mode,
            shipping_distance_km: data.shippingResult.quote.distance_km || null,
            shipping_matched_location: data.shippingResult.quote.matched_location || null,
            payment_status: "not_paid",
            fulfillment_status: "not_fulfilled",
            idempotency_key: data.input.idempotency_key || null,
            promotion_code: data.promotionsResult.appliedPromotionCode,
            discount_total: data.promotionsResult.discountAmount,
            original_subtotal: data.subtotal
          }
        }
      }
    )

    // 7. Create Order
    const order = createOrderStep(orderData)
    const updatedOrder = updateOrderCodeStep(order)
    emitOrderPlacedEventStep(order.id)

    // 8. Output Summary and Order
    const result = transform(
      { updatedOrder, subtotal, shippingResult, promotionsResult },
      (data) => {
        return {
          order: data.updatedOrder,
          summary: {
            original_subtotal: data.subtotal,
            subtotal: data.subtotal,
            discount: data.promotionsResult.discountAmount,
            shipping: data.shippingResult.quote.shipping,
            total: data.subtotal + data.shippingResult.quote.shipping - data.promotionsResult.discountAmount
          }
        }
      }
    )

    return new WorkflowResponse(result)
  }
)
