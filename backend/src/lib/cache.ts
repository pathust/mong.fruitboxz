import { Modules } from "@medusajs/framework/utils"

export const CACHE_KEYS = {
  categories: "cat:all:v1",
  product: (id: string) => `product:${id}:v1`,
  search: (query: string) => `search:${encodeURIComponent(query)}:v1`,
  cart: (id: string) => `cart:${id}:v1`,
}

export const TTL = {
  categories: 3600,
  product: 1800,
  search: 300,
  cart: 60 * 60 * 24 * 7,
}

export interface CacheService {
  get<T>(key: string): Promise<T | null>
  set(key: string, data: unknown, ttl?: number): Promise<void>
  invalidate(key: string): Promise<void>
}

export interface ResolveScope {
  resolve(name: string): unknown
}

export function resolveCache(scope: ResolveScope) {
  return scope.resolve(Modules.CACHE) as CacheService
}

export async function cached<T>(
  cache: CacheService,
  key: string,
  ttl: number,
  loader: () => Promise<T>
): Promise<T> {
  const existing = await cache.get<T>(key)
  if (existing !== null) return existing

  const value = await loader()
  await cache.set(key, value, ttl)
  return value
}
