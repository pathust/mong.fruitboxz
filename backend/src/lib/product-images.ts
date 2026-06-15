import fs from "fs"
import path from "path"

type ProductImageSource = string | {
  src?: string
  url?: string
}

const PUBLIC_IMAGES_DIR = path.resolve(process.cwd(), "../frontend/public/images")

function getSourceUrl(source: ProductImageSource | null | undefined) {
  if (typeof source === "string") return source
  return source?.src || source?.url || ""
}

export function resolveLocalProductImage(source: ProductImageSource | null | undefined) {
  const sourceUrl = getSourceUrl(source)
  if (!sourceUrl) return null

  let filename = ""
  try {
    filename = path.basename(new URL(sourceUrl, "http://local").pathname)
  } catch {
    filename = path.basename(sourceUrl)
  }

  if (!filename || !fs.existsSync(path.join(PUBLIC_IMAGES_DIR, filename))) {
    return null
  }

  return `/images/${filename}`
}

export function resolveLocalProductImages(product: {
  thumbnail?: ProductImageSource
  images?: ProductImageSource[]
}) {
  const resolved = [product.thumbnail, ...(product.images || [])]
    .map(resolveLocalProductImage)
    .filter((url): url is string => Boolean(url))

  return [...new Set(resolved)]
}
