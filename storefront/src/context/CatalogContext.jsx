/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from "react"
import { useLocation } from "react-router-dom"
import { apiFetch } from "../lib/api"

const CatalogContext = createContext(null)

function mapVariant(v) {
  const amount = Number(
    v?.price ??
    v?.calculated_price?.calculated_amount ??
    v?.prices?.[0]?.amount ??
    v?.prices?.[0]?.calculated_amount ??
    0
  )
  
  let inStock = true;
  if (typeof v?.in_stock === "boolean") {
    inStock = v.in_stock
  } else if (v?.manage_inventory && !v?.allow_backorder) {
    inStock = (v?.inventory_quantity ?? 0) > 0;
  }

  return {
    id: v?.id || "",
    title: v?.title || "Default",
    label: v?.title || "Default",
    price: amount > 0 ? amount : null,
    prices: amount > 0 ? [{ amount }] : [],
    inStock,
  }
}

export function mapProduct(p) {
  const mappedVariants = (p?.variants || []).map(mapVariant)
  const firstCategory = p?.categories?.[0]
  const allCategories = p?.categories || []
  const categorySlugs = allCategories.map(c => c.slug || c.handle).filter(Boolean)
  const categoryNames = allCategories.map(c => c.name).filter(Boolean)
  const categoryIds = allCategories.map(c => c.id).filter(Boolean)
  const slug = p?.slug || p?.handle || p?.id
  const images = (p?.images || []).map((img) => img?.url).filter(Boolean)
  const rawThumb = p?.thumbnail || ""
  const isPlaceholder = !rawThumb || rawThumb.includes("placeholder")
  const thumbnail = isPlaceholder ? (images[0] || rawThumb) : rawThumb
  const fallbackPrice = mappedVariants[0]?.price ?? null
  // A product is in stock if at least one variant has stock or doesn't manage inventory
  const inStock = (p?.variants || []).length === 0
    ? true
    : (p?.variants || []).some(v => {
        if (!v.manage_inventory) return true          // no inventory tracking → always in stock
        if (v.allow_backorder) return true             // backorder allowed → always available
        return (v.inventory_quantity ?? 0) > 0        // has physical stock
      })
  return {
    id: slug,
    medusa_id: p?.id || null,
    slug,
    handle: slug,
    title: p?.title || 'Sản phẩm',
    category: firstCategory?.slug || firstCategory?.handle || '',
    categoryDisplay: firstCategory?.name || '',
    categorySlugs,
    categoryNames,
    categoryIds,
    variants: mappedVariants,
    price: fallbackPrice,
    images,
    thumbnail,
    inStock,
    isHot: false,
  }
}

export function CatalogProvider({ children }) {
  const location = useLocation()
  const isAdminRoute = location.pathname.startsWith("/admin")
  const [loading, setLoading] = useState(!isAdminRoute)
  const [categories, setCategories] = useState([])

  useEffect(() => {
    if (isAdminRoute) return undefined
    let mounted = true

    async function load() {
      try {
        const categoriesRes = await apiFetch("/store/catalog/categories")
        if (!mounted) return

        if (mounted) {
          setCategories((categoriesRes?.categories || []).map((category) => ({
            ...category,
            displayName: category.name,
          })))
        }
      } catch {
        // API failed — keep empty arrays
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()
    return () => { mounted = false }
  }, [isAdminRoute])

  const value = useMemo(() => {
    const getCategory = (slug) => categories.find((c) => c.slug === slug)
    return { loading, categories, getCategory }
  }, [loading, categories])

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
}

export function useCatalog() {
  const ctx = useContext(CatalogContext)
  if (!ctx) throw new Error("useCatalog must be used within CatalogProvider")
  return ctx
}
