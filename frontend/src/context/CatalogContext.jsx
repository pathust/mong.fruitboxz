/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from "react"
import { useLocation } from "react-router-dom"
import { apiFetch } from "../lib/api"

const CatalogContext = createContext(null)

function mapVariant(v) {
  const amount = Number(
    v?.calculated_price?.calculated_amount ??
    v?.prices?.[0]?.amount ??
    v?.prices?.[0]?.calculated_amount ??
    0
  )
  return {
    id: v?.id || "",
    title: v?.title || "Default",
    label: v?.title || "Default",
    price: amount > 0 ? amount : null,
    prices: amount > 0 ? [{ amount }] : [],
  }
}

export function mapProduct(p) {
  const mappedVariants = (p?.variants || []).map(mapVariant)
  const firstCategory = p?.categories?.[0]
  const allCategories = p?.categories || []
  const categorySlugs = allCategories.map(c => c.handle).filter(Boolean)
  const categoryNames = allCategories.map(c => c.name).filter(Boolean)
  const handle = p?.handle || p?.id
  const images = (p?.images || []).map((img) => img?.url).filter(Boolean)
  const rawThumb = p?.thumbnail || ""
  const isPlaceholder = !rawThumb || rawThumb.includes("placeholder")
  const thumbnail = isPlaceholder ? (images[0] || rawThumb) : rawThumb
  const fallbackPrice = mappedVariants[0]?.price ?? null
  return {
    id: handle,
    medusa_id: p?.id || null,
    handle,
    title: p?.title || "Sản phẩm",
    category: firstCategory?.handle || "",
    categoryDisplay: firstCategory?.name || "",
    categorySlugs,
    categoryNames,
    variants: mappedVariants,
    price: fallbackPrice,
    images,
    thumbnail,
    inStock: true,
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
        const categoriesRes = await apiFetch("/store/product-categories?limit=100")
        if (!mounted) return

        const cats = categoriesRes?.product_categories || []

        // Enhance categories with fallback images from their first product
        const enrichedCats = await Promise.all(cats.map(async (c) => {
          let image = c.metadata?.image || ""

          if (!image) {
            try {
              const pRes = await apiFetch(`/store/products?limit=1&category_id[]=${c.id}&fields=id,thumbnail,*images`)
              const product = pRes.products?.[0]
              if (product) {
                image = product.thumbnail || product.images?.[0]?.url || ""
              }
            } catch (e) {
              console.error("Failed to fetch fallback image for category:", c.name)
            }
          }

          const slug = c.handle || c.id
          return {
            id: c.id,
            name: c.name,
            slug,
            displayName: c.name,
            image,
          }
        }))

        if (mounted) {
          setCategories(enrichedCats)
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