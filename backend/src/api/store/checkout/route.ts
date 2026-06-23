import { AuthenticatedMedusaRequest, MedusaResponse, MedusaStoreRequest } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { resolveShippingQuote } from "../../../lib/geocoding"
import { getGlobalSettings } from "../../../lib/global-settings"
import { getPromotionMetadata } from "../../../lib/promotion-metadata"
import { processCheckoutPromotions } from "../../../lib/checkout"
import type { CheckoutBody } from "../../middlewares/validation"
import { resolveSiteService } from "../../../lib/module-services"
import { sendInternalError } from "../../../lib/api-error"
import { checkoutOrderWorkflow } from "../../../workflows/checkout-order"

type ProductVariantRecord = {
  id: string
  title?: string | null
  prices?: Array<{ amount?: number | null; currency_code?: string | null }>
  product?: { title?: string | null }
  metadata?: Record<string, unknown> | null
}

type NormalizedOrderItem = {
  title: string
  quantity: number
  unit_price: number
  product_title: string
  metadata: Record<string, unknown>
}

type PromotionRecord = {
  id: string
  code?: string | null
  application_method?: { type?: string | null; value?: number | string | null } | null
  campaign?: {
    starts_at?: string | Date | null
    ends_at?: string | Date | null
    budget?: { limit?: number | string | null } | null
  } | null
}



export async function POST(req: MedusaStoreRequest<CheckoutBody>, res: MedusaResponse) {
  const { items, shipping, idempotency_key, promotion_code } = req.validatedBody

  const orderModuleService = req.scope.resolve(Modules.ORDER)
  const storeModuleService = req.scope.resolve(Modules.STORE)
  const regionModuleService = req.scope.resolve(Modules.REGION)
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const siteService = resolveSiteService(req.scope)
  const settings = await getGlobalSettings(siteService)

  // Idempotency Check (Basic check via Medusa metadata to prevent double-clicks if key provided)
  if (idempotency_key) {
    const existingOrders = await orderModuleService.listOrders({
      // @ts-ignore
      "metadata.idempotency_key": idempotency_key
    }, { take: 1 })

    if (existingOrders && existingOrders.length > 0) {
      // Return existing order to avoid duplicate processing
      return res.json({
        order: existingOrders[0],
        message: "Order already processed (idempotent request)",
        summary: null // Real summary could be reconstructed if needed
      })
    }
  }

  const [store] = await storeModuleService.listStores()
  const regions = await regionModuleService.listRegions({ currency_code: "vnd" }, { take: 1 })
  const region = regions[0]

  const names = shipping.name.trim().split(/\s+/)
  const first_name = names[0] || ""
  const last_name = names.slice(1).join(" ") || first_name

  const normalizedItems: NormalizedOrderItem[] = []

  // 2. Strict Pricing Strategy (Optimized: Batch Query Variants)
  const variantIds = items.map((item) => item.variant_id)
  const variantsMap: Record<string, ProductVariantRecord> = {}

  try {
    const { data } = await query.graph({
      entity: "product_variant",
      fields: ["id", "title", "prices.*", "product.title", "metadata", "manage_inventory", "inventory_quantity"],
      filters: { id: variantIds }
    })
    
    for (const v of (data as ProductVariantRecord[] || [])) {
      variantsMap[v.id] = v
    }
  } catch (error: unknown) {
    return sendInternalError(req, res, error, "Không thể xác minh danh sách sản phẩm", "PRODUCT_BATCH_LOOKUP_FAILED")
  }

  // 3. Inventory Validation using BOM
  try {
    const ingredientsModuleService = req.scope.resolve("ingredients") as any
    await ingredientsModuleService.validateOrderIngredients(items)
  } catch (error: any) {
    if (error.message && error.message.includes("vượt quá số lượng")) {
      return res.status(400).json({ message: error.message })
    }
    return sendInternalError(req, res, error, "Không thể kiểm tra tồn kho nguyên liệu", "INVENTORY_CHECK_FAILED")
  }

  for (const item of items) {
    let unitPrice = 0
    let variantTitle = item.variantLabel || null
    let productTitle = item.title || "Sản phẩm"
    let costPrice: number | null = null

    const variant = variantsMap[item.variant_id]
    if (!variant) {
      return res.status(400).json({ message: `Không tìm thấy sản phẩm hoặc biến thể bị xóa (ID: ${item.variant_id})` })
    }

    // Check prices array
    const vndPrice = (variant.prices || []).find((price) =>
      price.currency_code?.toLowerCase() === "vnd"
    )
    const amount = vndPrice?.amount;

    if (amount == null) {
      return res.status(400).json({ message: `Sản phẩm ${variant.title || productTitle} chưa được cấu hình giá` })
    }

    unitPrice = Number(amount)
    variantTitle = variant.title || variantTitle
    productTitle = variant.product?.title || productTitle

    // --- Inventory check đã bị loại bỏ vì hiện tại sử dụng cơ chế BOM ---
    if (variant.metadata?.cost_price) {
      costPrice = Number(variant.metadata.cost_price)
    }

    normalizedItems.push({
      title: productTitle,
      quantity: item.quantity,
      unit_price: unitPrice,
      product_title: productTitle,
      metadata: {
        image: item.image || null,
        variant_label: variantTitle,
        frontend_item_id: item.frontend_item_id || item.id || null,
        variant_id: item.variant_id,
        product_id: item.product_id || null,
        cost_price: costPrice || Math.round(unitPrice * (Number(settings.default_cost_percent ?? 50) / 100)),
      },
    })
  }

  const shippingQuote = await resolveShippingQuote({
    address: shipping.address,
    city: shipping.city,
    district: shipping.district,
    lat: shipping.lat,
    lng: shipping.lng,
  }, settings)
  const shippingFee = shippingQuote.shipping

  let discountAmount = 0
  let appliedPromotionCode = null
  let originalSubtotal = normalizedItems.reduce((sum, item) => sum + item.unit_price * item.quantity, 0)

  try {
    const promotionResult = await processCheckoutPromotions({
      scope: req.scope,
      siteService,
      promotion_code,
      normalizedItems,
      originalSubtotal
    })
    discountAmount = promotionResult.discountAmount
    appliedPromotionCode = promotionResult.appliedPromotionCode
  } catch (error: any) {
    return res.status(400).json({ message: error.message || "Không thể áp dụng mã giảm giá" })
  }

  const customerModuleService = req.scope.resolve(Modules.CUSTOMER)

  let customerId = req.auth_context?.actor_id
  const customerEmail = shipping.email?.toLowerCase().trim() || first_name.toLowerCase() + "@example.com"

  if (!customerId) {
    // SECURITY FIX: We no longer auto-bind guest checkouts to existing customers by email.
    // If you are not authenticated, you are checked out purely as a guest (customer_id will be undefined).
    // The email is still recorded on the order directly.
  }

  const orderData = {
    email: customerEmail,
    currency_code: "vnd",
    region_id: region?.id || undefined,
    sales_channel_id: store?.default_sales_channel_id || undefined,
    customer_id: customerId,
    shipping_address: {
      first_name,
      last_name,
      address_1: shipping.address,
      city: shipping.city,
      province: shipping.district || "",
      phone: shipping.phone,
    },
    items: normalizedItems,
    status: "pending",
    metadata: {
      note: shipping.note || "",
      source: "frontend",
      shipping_fee: shippingFee,
      shipping_quote_mode: shippingQuote.mode,
      shipping_distance_km: shippingQuote.distance_km || null,
      shipping_matched_location: shippingQuote.matched_location || null,
      payment_status: "not_paid",
      fulfillment_status: "not_fulfilled",
      idempotency_key: idempotency_key || null,
      promotion_code: appliedPromotionCode,
      discount_total: discountAmount,
      original_subtotal: originalSubtotal
    },
  };

  let responseOrder;
  try {
    const { result } = await checkoutOrderWorkflow(req.scope).run({
      input: orderData
    });
    responseOrder = result;
  } catch (error: unknown) {
    const logger = req.scope.resolve<{ error(message: string, error?: unknown): void }>("logger")
    logger.error("Failed to checkout order", error)
    return sendInternalError(req, res, error, "Không thể tạo đơn hàng", "ORDER_CREATE_FAILED")
  }

  const subtotal = normalizedItems.reduce((sum, item) => sum + item.unit_price * item.quantity, 0)
  const total = subtotal + shippingFee

  res.json({ order: responseOrder, summary: { original_subtotal: originalSubtotal, subtotal, discount: discountAmount, shipping: shippingFee, total } })
}

export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const orderModuleService = req.scope.resolve(Modules.ORDER)

  const filters = { customer_id: req.auth_context.actor_id }

  const orders = await orderModuleService.listOrders(filters, {
    relations: ["items", "shipping_address"],
    order: { created_at: "DESC" },
    take: 50,
  })

  res.json({ orders })
}
