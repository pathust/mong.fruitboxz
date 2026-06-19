import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { getGlobalSettings, updateGlobalSettings } from "../../../lib/global-settings"
import type { AdminCustomQuery, CustomSettingsBody } from "../../middlewares/validation"
import { resolveSiteService } from "../../../lib/module-services"
import { sendInternalError } from "../../../lib/api-error"

function startOfDay(d: Date) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

export async function GET(req: MedusaRequest<unknown, AdminCustomQuery>, res: MedusaResponse) {
  try {
    const { mode } = req.validatedQuery
    const siteService = resolveSiteService(req.scope)

    if (mode === "settings") {
      const settings = await getGlobalSettings(siteService)
      return res.json({ settings })
    }

    if (mode !== "dashboard") return res.json({ ok: true })

    const orderModuleService = req.scope.resolve(Modules.ORDER)
    const productModuleService = req.scope.resolve(Modules.PRODUCT)
    const customerModuleService = req.scope.resolve(Modules.CUSTOMER)
    const settings = await getGlobalSettings(siteService)

    const defaultCostPercent = Number(settings.default_cost_percent ?? 50) / 100
    const packagingCost = Number(settings.packaging_cost ?? 5000)
    const laborCostPerOrder = Number(settings.labor_cost_per_order ?? 10000)

    const [orders, products, customers] = await Promise.all([
      orderModuleService.listOrders({}, { relations: ["items"], select: ["*", "metadata", "items.*", "items.metadata"], take: 500 }),
      productModuleService.listProducts({}, { take: 500 }),
      customerModuleService.listCustomers({}, { take: 500 }),
    ])

    const now = new Date()
    const day0 = startOfDay(now)
    const day7 = new Date(day0)
    day7.setDate(day7.getDate() - 6)

    let revenueTotal = 0
    let profitTotal = 0
    let unpaidTotal = 0
    let ordersToday = 0
    let billableOrderCount = 0
    const statusMap: Record<string, number> = {}
    const paymentStatusMap: Record<string, number> = {}
    const revenueByDayMap: Record<string, number> = {}
    const profitByDayMap: Record<string, number> = {}
    const ordersByDayMap: Record<string, number> = {}

    for (let i = 0; i < 7; i++) {
      const d = new Date(day7)
      d.setDate(day7.getDate() + i)
      const key = d.toISOString().slice(0, 10)
      revenueByDayMap[key] = 0
      profitByDayMap[key] = 0
      ordersByDayMap[key] = 0
    }

    for (const o of orders) {
      const orderDate = o.created_at ? new Date(String(o.created_at)) : new Date()
      const orderDay = startOfDay(orderDate)
      if (isNaN(orderDay.getTime())) continue;
      const status = (o.status || "unknown").toString()
      statusMap[status] = (statusMap[status] || 0) + 1

      const orderMetadata = o.metadata && typeof o.metadata === "object"
        ? o.metadata as Record<string, unknown>
        : {}
      const paymentStatus = String(orderMetadata.payment_status || "not_paid")

      let orderRevenue = 0
      let orderCost = 0
      const itemCount = (o.items || []).length

      for (const item of (o.items || [])) {
        const qty = Number(item.quantity) || 0
        const price = Number(item.unit_price) || 0
        const itemMetadata = item.metadata && typeof item.metadata === "object"
          ? item.metadata as Record<string, unknown>
          : {}
        const costPrice = Number(itemMetadata.cost_price) || 0

        orderRevenue += price * qty
        // Use explicit cost_price if set, otherwise fall back to default_cost_percent
        const effectiveCost = costPrice > 0 ? costPrice : Math.round(price * defaultCostPercent)
        orderCost += (effectiveCost + packagingCost) * qty
      }
      // Add labor cost per order
      orderCost += laborCostPerOrder

      // Only count revenue for non-canceled orders
      if (status !== "canceled" && status !== "archived") {
        const orderProfit = orderRevenue - orderCost
        paymentStatusMap[paymentStatus] = (paymentStatusMap[paymentStatus] || 0) + 1
        billableOrderCount += 1
        revenueTotal += orderRevenue
        profitTotal += orderProfit

        if (paymentStatus !== "paid" && paymentStatus !== "captured") {
          unpaidTotal += orderRevenue
        }

        if (orderDay.getTime() === day0.getTime()) ordersToday += 1
        const key = orderDay.toISOString().slice(0, 10)
        if (key in revenueByDayMap) {
          revenueByDayMap[key] += orderRevenue
          profitByDayMap[key] += orderProfit
          ordersByDayMap[key] += 1
        }
      }
    }

    const topProductsMap: Record<string, { title: string; qty: number; revenue: number }> = {}
    for (const o of orders) {
      if (o.status === "canceled" || o.status === "archived") continue;

      for (const i of (o.items || [])) {
        const key = (i.title || "Unknown").toString()
        if (!topProductsMap[key]) {
          topProductsMap[key] = { title: key, qty: 0, revenue: 0 }
        }
        topProductsMap[key].qty += Number(i.quantity) || 0
        topProductsMap[key].revenue += (Number(i.unit_price) || 0) * (Number(i.quantity) || 0)
      }
    }
    const topProducts = Object.values(topProductsMap)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5)

    res.json({
      metrics: {
        products: products.length,
        orders: orders.length,
        customers: customers.length,
        revenue_total: revenueTotal,
        profit_total: profitTotal,
        unpaid_total: unpaidTotal,
        orders_today: ordersToday,
        avg_order_value: billableOrderCount ? Math.round(revenueTotal / billableOrderCount) : 0,
      },
      order_status: statusMap,
      payment_status: paymentStatusMap,
      revenue_7d: Object.entries(revenueByDayMap).map(([date, revenue]) => ({
        date,
        revenue,
        profit: profitByDayMap[date] || 0,
        orders: ordersByDayMap[date] || 0,
      })),
      top_products: topProducts,
    })
  } catch (error: unknown) {
    sendInternalError(req, res, error, "Unable to load dashboard data", "DASHBOARD_LOAD_FAILED")
  }
}

export async function POST(req: MedusaRequest<CustomSettingsBody, AdminCustomQuery>, res: MedusaResponse) {
  try {
    const { mode } = req.validatedQuery
    const siteService = resolveSiteService(req.scope)

    if (mode === "settings") {
      const { settings } = req.validatedBody

      const updated = await updateGlobalSettings(siteService, settings)
      return res.json({ settings: updated })
    }

    res.status(400).json({ message: "Invalid mode for POST" })
  } catch (error: unknown) {
    sendInternalError(req, res, error, "Unable to save settings", "SETTINGS_UPDATE_FAILED")
  }
}
