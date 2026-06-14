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

async function fetchJson(url: string, headers?: Record<string, string>) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 6000)

  try {
    const response = await fetch(url, {
      headers,
      signal: controller.signal,
    })
    if (!response.ok) return null
    return await response.json()
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

function cleanAddressLabel(raw?: string) {
  return (raw || "")
    .replace(/,\s*\d{5,6}(?=,|$)/g, "")
    .replace(/,\s*Việt Nam$/i, "")
    .replace(/\s*,\s*,+/g, ", ")
    .trim()
}

function joinUniqueAddressParts(parts: unknown[]) {
  const seen = new Set<string>()
  return parts
    .filter((part): part is string => typeof part === "string" && Boolean(part.trim()))
    .map((part) => part.trim())
    .filter((part) => {
      const normalized = normalizeAddress(part)
      if (!normalized || seen.has(normalized)) return false
      seen.add(normalized)
      return true
    })
    .join(", ")
}

function nearestDistrict(lat: number, lng: number) {
  return HANOI_DISTRICTS
    .map((record) => ({ record, distance: haversineKm(lat, lng, record.lat, record.lng) }))
    .sort((a, b) => a.distance - b.distance)[0]?.record || null
}

function vietnameseDistrictName(record: DistrictRecord) {
  const accentedAlias = record.aliases.find((alias) =>
    /[^\u0000-\u007f]/.test(alias) && !alias.toLowerCase().startsWith("quận ")
  )
  const name = accentedAlias || record.district
  return name.charAt(0).toLocaleUpperCase("vi-VN") + name.slice(1)
}

export async function reverseGeocodeLocation(lat: number, lng: number) {
  const cacheKey = `reverse:${lat.toFixed(5)}:${lng.toFixed(5)}`
  if (memoryCache.has(cacheKey)) {
    return memoryCache.get(cacheKey)
  }

  const nominatimUrl = new URL("https://nominatim.openstreetmap.org/reverse")
  nominatimUrl.searchParams.set("lat", lat.toString())
  nominatimUrl.searchParams.set("lon", lng.toString())
  nominatimUrl.searchParams.set("format", "jsonv2")
  nominatimUrl.searchParams.set("addressdetails", "1")
  nominatimUrl.searchParams.set("zoom", "18")
  nominatimUrl.searchParams.set("accept-language", "vi")

  const bigDataCloudUrl = new URL("https://api.bigdatacloud.net/data/reverse-geocode-client")
  bigDataCloudUrl.searchParams.set("latitude", lat.toString())
  bigDataCloudUrl.searchParams.set("longitude", lng.toString())
  bigDataCloudUrl.searchParams.set("localityLanguage", "vi")

  const [nominatimResult, bigDataCloudResult] = await Promise.all([
    fetchJson(nominatimUrl.toString(), {
      "Accept-Language": "vi",
      "User-Agent": "mong-fruitboxz/1.0",
    }),
    fetchJson(bigDataCloudUrl.toString()),
  ])

  if (nominatimResult?.address || nominatimResult?.display_name) {
    const details = nominatimResult.address || {}
    const district =
      details.city_district ||
      details.district ||
      details.county ||
      details.town ||
      details.suburb ||
      ""
    const city = details.city || details.municipality || details.state || ""
    const componentAddress = joinUniqueAddressParts([
      details.house_number,
      details.road,
      details.neighbourhood,
      details.quarter,
      details.suburb,
      district,
      city,
    ])
    const result = {
      address: cleanAddressLabel(nominatimResult.display_name) || componentAddress,
      city,
      district,
      provider: "nominatim",
      precision: "address",
    }
    memoryCache.set(cacheKey, result)
    return result
  }

  if (bigDataCloudResult?.locality || bigDataCloudResult?.city || bigDataCloudResult?.principalSubdivision) {
    const district =
      bigDataCloudResult.locality ||
      bigDataCloudResult.localityInfo?.administrative?.[0]?.name ||
      ""
    const city = bigDataCloudResult.city || bigDataCloudResult.principalSubdivision || ""
    const result = {
      address: joinUniqueAddressParts([
        bigDataCloudResult.locality,
        bigDataCloudResult.city,
        bigDataCloudResult.principalSubdivision,
      ]),
      city,
      district,
      provider: "bigdatacloud",
      precision: "area",
    }
    memoryCache.set(cacheKey, result)
    return result
  }

  const nearbyDistrict = nearestDistrict(lat, lng)
  const result = {
    address: null,
    city: nearbyDistrict?.city || "",
    district: nearbyDistrict?.district || "",
    area_label: nearbyDistrict
      ? `Khu vực ${vietnameseDistrictName(nearbyDistrict)}, Hà Nội`
      : "Khu vực vị trí hiện tại",
    provider: "local-area",
    precision: "area",
  }
  memoryCache.set(cacheKey, result)
  return result
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
