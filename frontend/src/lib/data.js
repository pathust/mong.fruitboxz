import rawProducts from '../data/products.json'
import scrapedData from '../data/scraped-data.json'

const scrapedMap = {}
if (scrapedData.products) {
  for (const key of Object.keys(scrapedData.products)) {
    const p = scrapedData.products[key]
    scrapedMap[p.slug || p.handle] = p
  }
}

const productMap = {}
for (const p of rawProducts) {
  productMap[p.slug || p.handle || p.id] = p
}

const allSlugs = [...new Set([...Object.keys(productMap), ...Object.keys(scrapedMap)])]

function cleanTitle(raw) {
  if (!raw) return 'Sản phẩm'
  const cleaned = raw.replace(/^(Box\s+\S+)\s+\1/i, '$1')
  const match = cleaned.match(/^(Box\s+[^(]+?)(?:\s*[-–—]?\s*size|\s*\d|\s*₫|\s*\/Hộp|\s*$)/i)
  if (match) return match[1].trim()
  return cleaned.replace(/\s{2,}/g, ' ').trim().slice(0, 60)
}

function formatPrice(n) {
  return new Intl.NumberFormat('vi-VN').format(n) + '₫'
}

function parsePrice(str) {
  if (!str) return null
  if (typeof str === 'number') return str
  const cleaned = str.replace(/[^\d]/g, '')
  return parseInt(cleaned, 10) || null
}

function humanizeCategory(raw) {
  if (!raw) return ''
  return raw
    .replace(/hop/gi, 'Hộp')
    .replace(/trai cay/gi, 'Trái Cây')
    .replace(/cat san/gi, 'Cắt Sẵn')
    .replace(/hoa qua/gi, 'Hoa Quả')
    .replace(/sua chua/gi, 'Sữa Chua')
    .replace(/nuoc ep/gi, 'Nước Ép')
    .replace(/hy lap/gi, 'Hy Lạp')
    .replace(/nguyen qua/gi, 'Nguyên Quả')
    .replace(/goi y/gi, 'Gợi Ý')
    .replace(/2 tang/gi, '2 Tầng')
    .replace(/4 ngan/gi, '4 Ngăn')
    .replace(/6 ngan/gi, '6 Ngăn')
    .replace(/9 ngan/gi, '9 Ngăn')
}

function dedupeVariants(rawVariants = []) {
  const seen = new Set()
  const result = []

  for (const v of rawVariants) {
    const normalized = {
      label: (v.label || '').trim(),
      size: (v.size || '').trim(),
      weight: (v.weight || '').trim(),
      price: typeof v.price === 'number' ? v.price : parsePrice(v.price),
    }
    const dedupeKey = [
      normalized.label.toLowerCase(),
      normalized.size.toLowerCase(),
      normalized.weight.toLowerCase(),
      normalized.price ?? 'null',
    ].join('|')

    if (seen.has(dedupeKey)) continue
    seen.add(dedupeKey)
    result.push(normalized)
  }

  return result
}

export const products = allSlugs.map(slug => {
  const fromProducts = productMap[slug]
  const fromScraped = scrapedMap[slug]

  const variants = dedupeVariants(fromProducts?.variants || fromScraped?.variants || [])

  const images = fromScraped?.images || fromProducts?.images || []
  const thumbnail = images[0] || fromProducts?.thumbnail || ''
  const categoryRaw = fromProducts?.category || fromScraped?.category || ''

  return {
    id: slug,
    slug,
    title: cleanTitle(fromProducts?.title || fromScraped?.title || ''),
    category: categoryRaw,
    categoryDisplay: humanizeCategory(categoryRaw),
    variants,
    price: variants[0]?.price ?? null,
    images,
    thumbnail,
    inStock: fromProducts?.inStock !== false,
    isHot: fromProducts?.isHot || false,
  }
})

export const categories = (scrapedData.categories || []).map(cat => ({
  ...cat,
  displayName: humanizeCategory(cat.name),
}))

export function getProduct(id) {
  return products.find(p => p.id === id || p.slug === id)
}

export function getCategory(slug) {
  return categories.find(c => c.slug === slug)
}

export function getProductsByCategory(slug) {
  const cat = getCategory(slug)
  if (!cat) return []
  return products.filter(p => p.category === cat.name || p.category === slug)
}

export function searchProducts(query) {
  const q = (query || '').trim().toLowerCase()
  if (!q) return []
  return products.filter(p =>
    p.title.toLowerCase().includes(q) ||
    p.slug.toLowerCase().includes(q) ||
    (p.categoryDisplay || '').toLowerCase().includes(q)
  )
}

export function formatPriceDisplay(price) {
  if (!price) return 'Hết hàng'
  return formatPrice(price)
}

export { formatPrice, parsePrice }
