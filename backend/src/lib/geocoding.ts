type DistrictRecord = {
  district: string
  city: string
  lat: number
  lng: number
  aliases: string[]
  fastLane?: boolean
}

const HANOI_DISTRICTS: DistrictRecord[] = [
  { district: "Hoan Kiem", city: "Ha Noi", lat: 21.0288, lng: 105.8522, aliases: ["hoan kiem", "hoàn kiếm", "quan hoan kiem", "quận hoàn kiếm"], fastLane: true },
  { district: "Ba Dinh", city: "Ha Noi", lat: 21.0359, lng: 105.8142, aliases: ["ba dinh", "ba đình", "quan ba dinh", "quận ba đình"], fastLane: true },
  { district: "Dong Da", city: "Ha Noi", lat: 21.0181, lng: 105.8292, aliases: ["dong da", "đống đa", "quan dong da", "quận đống đa"], fastLane: true },
  { district: "Hai Ba Trung", city: "Ha Noi", lat: 21.0059, lng: 105.8575, aliases: ["hai ba trung", "hai bà trưng", "quan hai ba trung", "quận hai bà trưng"], fastLane: true },
  { district: "Cau Giay", city: "Ha Noi", lat: 21.0301, lng: 105.7829, aliases: ["cau giay", "cầu giấy", "quan cau giay", "quận cầu giấy"], fastLane: true },
  { district: "Thanh Xuan", city: "Ha Noi", lat: 20.9931, lng: 105.8048, aliases: ["thanh xuan", "thanh xuân", "quan thanh xuan", "quận thanh xuân"], fastLane: true },
  { district: "Tay Ho", city: "Ha Noi", lat: 21.0702, lng: 105.8187, aliases: ["tay ho", "tây hồ", "quan tay ho", "quận tây hồ"], fastLane: true },
  { district: "Hoang Mai", city: "Ha Noi", lat: 20.9744, lng: 105.8632, aliases: ["hoang mai", "hoàng mai", "quan hoang mai", "quận hoàng mai"] },
  { district: "Long Bien", city: "Ha Noi", lat: 21.0481, lng: 105.8882, aliases: ["long bien", "long biên", "quan long bien", "quận long biên"] },
  { district: "Nam Tu Liem", city: "Ha Noi", lat: 21.0126, lng: 105.7653, aliases: ["nam tu liem", "nam từ liêm", "quan nam tu liem", "quận nam từ liêm"] },
  { district: "Bac Tu Liem", city: "Ha Noi", lat: 21.0711, lng: 105.7707, aliases: ["bac tu liem", "bắc từ liêm", "quan bac tu liem", "quận bắc từ liêm"] },
  { district: "Ha Dong", city: "Ha Noi", lat: 20.9541, lng: 105.7688, aliases: ["ha dong", "hà đông", "quan ha dong", "quận hà đông"] },
]

const memoryCache = new Map<string, any>()

export function normalizeAddress(raw?: string) {
  return (raw || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function compactDistrictQuery(raw?: string) {
  return normalizeAddress(raw)
    .replace(/\b(q|quan|huyen|thi xa|tx|tp|thanh pho)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number) {
  const toRad = (value: number) => value * Math.PI / 180
  const earthRadiusKm = 6371
  const dLat = toRad(bLat - aLat)
  const dLng = toRad(bLng - aLng)
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2
  return 2 * earthRadiusKm * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}

function getShippingConfig(settings: Record<string, any>) {
  const defaultFreeDistricts = "Hoàn Kiếm, Ba Đình, Đống Đa, Hai Bà Trưng, Cầu Giấy, Tây Hồ"
  const rawDistricts = settings.free_shipping_districts ?? defaultFreeDistricts
  const freeDistricts = rawDistricts.split(",").map((d: string) => normalizeAddress(d))

  return {
    originLat: Number(settings.shipping_origin_lat || process.env.SHIPPING_ORIGIN_LAT || 21.012805),
    originLng: Number(settings.shipping_origin_lng || process.env.SHIPPING_ORIGIN_LNG || 105.836483),
    baseFee: Number(settings.shipping_base_fee ?? 18000),
    hanoiFallbackFee: Number(settings.shipping_base_cost ?? 30000),
    nonHanoiFee: Number(settings.shipping_non_hanoi_fee ?? 45000),
    perKmFee: Number(settings.shipping_fee_per_km ?? 2200),
    minFee: Number(settings.shipping_min_fee ?? 18000),
    maxFee: Number(settings.shipping_max_fee ?? 60000),
    freeDistricts,
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function suggestLocations(query: string, limit = 6) {
  const normalized = normalizeAddress(query)
  const compact = compactDistrictQuery(query)
  if (!normalized) return []

  const cacheKey = `suggest:${normalized}:${limit}`
  if (memoryCache.has(cacheKey)) {
    return memoryCache.get(cacheKey)
  }

  const suggestions = HANOI_DISTRICTS
    .map((record) => {
      const haystacks = [record.district, record.city, ...record.aliases].map(normalizeAddress)
      const candidates = [normalized, compact].filter(Boolean)
      const exact = haystacks.some((value) => candidates.some((candidate) => value === candidate))
      const prefix = haystacks.some((value) => candidates.some((candidate) => value.startsWith(candidate) || candidate.startsWith(value)))
      const includes = haystacks.some((value) => candidates.some((candidate) => value.includes(candidate) || candidate.includes(value)))
      const score = exact ? 100 : prefix ? 80 : includes ? 60 : 0
      if (!score) return null
      return {
        type: "district",
        city: record.city,
        district: record.district,
        label: `${record.district}, ${record.city}`,
        lat: record.lat,
        lng: record.lng,
        fast_lane: Boolean(record.fastLane),
        confidence: exact ? 1 : prefix ? 0.86 : 0.72,
        score,
      }
    })
    .filter(Boolean)
    .sort((a: any, b: any) => b.score - a.score || a.label.localeCompare(b.label))
    .slice(0, limit)

  memoryCache.set(cacheKey, suggestions)
  return suggestions
}

export function resolveShippingQuote(
  input: { address?: string; city?: string; district?: string; lat?: number; lng?: number },
  settings: Record<string, any>
) {
  const config = getShippingConfig(settings)
  const cityNorm = normalizeAddress(input.city)
  const districtNorm = normalizeAddress(input.district)
  const compactDistrictNorm = compactDistrictQuery(input.district)
  const addressNorm = normalizeAddress(`${input.address || ""} ${input.district || ""} ${input.city || ""}`)
  const matched =
    HANOI_DISTRICTS.find((record) =>
      [record.district, ...record.aliases].map(normalizeAddress).some((value) =>
        value === districtNorm ||
        value === compactDistrictNorm ||
        addressNorm.includes(value)
      )
    ) ||
    (typeof input.lat === "number" && typeof input.lng === "number"
      ? {
          district: input.district || "Ha Noi",
          city: input.city || "Ha Noi",
          lat: Number(input.lat),
          lng: Number(input.lng),
          aliases: [],
          fastLane: false,
        }
      : null)

  if (!cityNorm && !districtNorm && !input.lat && !input.lng) {
    return { shipping: config.hanoiFallbackFee, mode: "fallback-empty", matched_location: null }
  }

  const inHanoi =
    cityNorm.includes("ha noi") ||
    cityNorm.includes("hanoi") ||
    Boolean(matched)

  if (!inHanoi) {
    return {
      shipping: config.nonHanoiFee,
      mode: "static-non-hanoi",
      matched_location: null,
    }
  }

  if (matched) {
    const matchedDistrictNorm = normalizeAddress(matched.district)
    const isFree = config.freeDistricts.includes(matchedDistrictNorm) ||
                   config.freeDistricts.some((fd: string) => matchedDistrictNorm.includes(fd))

    const distanceKm = haversineKm(config.originLat, config.originLng, matched.lat, matched.lng)
    const exactFee = config.baseFee + (distanceKm * config.perKmFee)
    const rawFee = Math.ceil(exactFee / 1000) * 1000

    return {
      shipping: isFree ? 0 : clamp(rawFee, config.minFee, config.maxFee),
      mode: isFree ? "district-free" : "distance-estimate",
      distance_km: Number(distanceKm.toFixed(2)),
      matched_location: {
        city: matched.city,
        district: matched.district,
        lat: matched.lat,
        lng: matched.lng,
      },
    }
  }

  return {
    shipping: config.hanoiFallbackFee,
    mode: "static-hanoi",
    matched_location: null,
  }
}
