import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { z } from "zod"
import { resolveShippingQuote } from "../../../lib/geocoding"
import { getGlobalSettings } from "../../../lib/global-settings"
import { getPromotionMetadata } from "../../../lib/promotion-metadata"

const CheckoutSchema = z.object({
  items: z.array(z.object({
    variant_id: z.string().min(1, "Thiếu variant_id"),
    quantity: z.number().min(1, "Số lượng phải lớn hơn 0").default(1),
    product_id: z.string().optional(),
    title: z.string().optional(),
    variantLabel: z.string().optional(),
    image: z.string().optional(),
    frontend_item_id: z.string().optional(),
    id: z.string().optional(),
  })).min(1, "Giỏ hàng trống"),
  shipping: z.object({
    name: z.string().min(1, "Thiếu tên người nhận"),
    phone: z.string()
      .min(9, "Số điện thoại quá ngắn")
      .max(13, "Số điện thoại quá dài")
      .regex(
        /^(\+84|84|0)(3[2-9]|5[25689]|7[06-9]|8[0-9]|9[0-9])[0-9]{7}$|^(\+84|84|0)[0-9]{9,10}$/,
        "Số điện thoại không hợp lệ (vd: 0912345678)"
      ),
    address: z.string().min(5, "Địa chỉ quá ngắn"),
    city: z.string().optional(),
    district: z.string().optional(),
    email: z.string().email("Email không hợp lệ").optional(),
    note: z.string().optional(),
    lat: z.number().optional(),
    lng: z.number().optional(),
  }),
  idempotency_key: z.string().optional(),
  promotion_code: z.string().optional(),
})

function getCustomerId(req: MedusaRequest): string | undefined {
  const authHeader = req.headers.authorization || req.headers["authorization"] || ""
  if (authHeader.startsWith("Bearer ")) {
    try {
      const token = authHeader.slice(7)
      const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64").toString())
      if (payload.actor_type === "customer") {
        return payload.actor_id
      }
    } catch {}
  }
  return undefined
}

function generateOrderCode(order: { id?: string; created_at?: string | Date }) {
  const date = order.created_at ? new Date(order.created_at) : new Date()
  const datePart = Number.isNaN(date.getTime())
    ? "LOCAL"
    : date.toISOString().slice(0, 10).replace(/-/g, "")
  const suffix = String(order.id || "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(-6)
    .toUpperCase()
    .padStart(6, "0")

  return `MONG-${datePart}-${suffix}`
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  // 1. Zod Validation
  const parsed = CheckoutSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({
      message: "Dữ liệu đầu vào không hợp lệ",
      errors: parsed.error.format()
    })
  }

  const { items, shipping, idempotency_key, promotion_code } = parsed.data

  const orderModuleService = req.scope.resolve(Modules.ORDER)
  const storeModuleService = req.scope.resolve(Modules.STORE)
  const regionModuleService = req.scope.resolve(Modules.REGION)
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const siteService = req.scope.resolve("site") as any
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

  const normalizedItems: any[] = []

  for (const item of items) {
    // 2. Strict Pricing Strategy
    let unitPrice = 0
    let variantTitle = item.variantLabel || null
    let productTitle = item.title || "Sản phẩm"
    let costPrice: number | null = null

    try {
      const { data } = await query.graph({
        entity: "product_variant",
        fields: ["id", "title", "prices.*", "product.title", "metadata", "manage_inventory", "inventory_quantity"],
        filters: { id: item.variant_id }
      })
      const variant = data?.[0] as any
      if (!variant) {
        return res.status(400).json({ message: `Không tìm thấy sản phẩm hoặc biến thể bị xóa (ID: ${item.variant_id})` })
      }

      // Check prices array
      const vndPrice = (variant.prices || []).find((p: any) =>
        p.currency_code?.toLowerCase() === "vnd" ||
        p.currency_code?.toLowerCase() === "eur"
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
    } catch (err: any) {
      return res.status(500).json({ message: `Lỗi hệ thống khi truy vấn giá sản phẩm: ${err.message}` })
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

  const shippingQuote = resolveShippingQuote({
    address: shipping.address,
    city: shipping.city,
    district: shipping.district,
    lat: shipping.lat,
    lng: shipping.lng,
  }, settings)
  const shippingFee = shippingQuote.shipping

  // Promotion logic
  let discountAmount = 0
  let appliedPromotionCode = null
  let originalSubtotal = normalizedItems.reduce((sum, item) => sum + item.unit_price * item.quantity, 0)

  if (promotion_code) {
    try {
      const promotionModuleService = req.scope.resolve(Modules.PROMOTION)
      const promotions = await promotionModuleService.listPromotions({
        code: promotion_code.toUpperCase()
      }, { relations: ["application_method", "campaign", "campaign.budget"], take: 1 })

      if (promotions && promotions.length > 0) {
        const promo = promotions[0] as any
        const promotionMetadata = await getPromotionMetadata(siteService, promo.id)
        const startsAt = promotionMetadata.starts_at || promo.campaign?.starts_at
        const endsAt = promotionMetadata.ends_at || promo.campaign?.ends_at
        const usageLimit = Number(promotionMetadata.usage_limit || promo.campaign?.budget?.limit || 0)

        let isValid = true
        const now = new Date()
        if (startsAt && new Date(startsAt) > now) {
          isValid = false
        }
        if (endsAt && new Date(endsAt) < now) {
          isValid = false
        }
        if (usageLimit > 0) {
          try {
            const query = req.scope.resolve("query")
            const { data } = await query.graph({
              entity: "order",
              fields: ["id", "metadata"],
            })
            const usedCount = (data as Array<{ metadata?: Record<string, unknown> | null }>)
              .filter((order) => order.metadata?.promotion_code === promo.code)
              .length
            if (usedCount >= usageLimit) {
              isValid = false
            }
          } catch (e) {
            console.error(e)
          }
        }

        const minOrderValue = Number(promotionMetadata.min_order_value || 0)
        if (minOrderValue > 0 && originalSubtotal < minOrderValue) {
          return res.status(400).json({
            message: `Mã giảm giá yêu cầu đơn hàng tối thiểu ${new Intl.NumberFormat('vi-VN').format(minOrderValue)}đ`
          })
        }

        if (!isValid) {
          return res.status(400).json({ message: "Mã giảm giá đã hết hạn hoặc hết lượt sử dụng" })
        }

        const appMethod = promo.application_method
        if (appMethod) {
          const maxDiscount = Number(promotionMetadata.max_discount || 0)
          if (appMethod.type === "fixed") {
            discountAmount = Math.min(Number(appMethod.value), originalSubtotal)
          } else if (appMethod.type === "percentage") {
            discountAmount = Math.round(originalSubtotal * (Number(appMethod.value) / 100))
            if (maxDiscount > 0 && discountAmount > maxDiscount) {
              discountAmount = maxDiscount
            }
          }
          appliedPromotionCode = promo.code
        }
      }
    } catch (e) {
      console.error("Lỗi khi áp dụng mã giảm giá", e)
    }
  }

  // Proportional discount allocation
  if (discountAmount > 0 && originalSubtotal > 0) {
    const discountRatio = discountAmount / originalSubtotal
    let totalDiscountAllocated = 0

    for (let i = 0; i < normalizedItems.length; i++) {
      const item = normalizedItems[i]
      if (i === normalizedItems.length - 1) {
        // Last item takes the remainder to ensure exact discount amount
        const remainingDiscount = discountAmount - totalDiscountAllocated
        // Distribute remaining discount evenly across quantity
        const discountPerUnit = Math.round(remainingDiscount / item.quantity)
        item.unit_price = Math.max(0, item.unit_price - discountPerUnit)
      } else {
        const itemTotalDiscount = Math.round((item.unit_price * item.quantity) * discountRatio)
        const discountPerUnit = Math.round(itemTotalDiscount / item.quantity)
        item.unit_price = Math.max(0, item.unit_price - discountPerUnit)
        totalDiscountAllocated += (discountPerUnit * item.quantity)
      }
    }
  }

  const order = await orderModuleService.createOrders({
    email: shipping.email || first_name.toLowerCase() + "@example.com",
    currency_code: "vnd",
    region_id: region?.id || undefined,
    sales_channel_id: store?.default_sales_channel_id || undefined,
    customer_id: getCustomerId(req),
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
      source: "storefront",
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
  })
  const orderCode = generateOrderCode(order as any)
  let responseOrder = order

  try {
    const updated = await (orderModuleService as any).updateOrders([{
      id: order.id,
      metadata: {
        ...(order.metadata || {}),
        order_code: orderCode,
      },
    }])
    responseOrder = Array.isArray(updated) ? updated[0] : updated
  } catch (err) {
    console.error("Failed to persist order code", err)
    ;(responseOrder as any).metadata = {
      ...((responseOrder as any).metadata || {}),
      order_code: orderCode,
    }
  }

  const subtotal = normalizedItems.reduce((sum, item) => sum + item.unit_price * item.quantity, 0)
  const total = subtotal + shippingFee

  res.json({ order: responseOrder, summary: { original_subtotal: originalSubtotal, subtotal, discount: discountAmount, shipping: shippingFee, total } })
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const orderModuleService = req.scope.resolve(Modules.ORDER)

  const customer_id = getCustomerId(req)
  const filters: Record<string, any> = {}
  if (customer_id) {
    filters.customer_id = customer_id
  }

  const orders = await orderModuleService.listOrders(filters, {
    relations: ["items", "shipping_address"],
    order: { created_at: "DESC" },
    take: 50,
  })

  res.json({ orders })
}
