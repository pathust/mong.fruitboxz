import Redis from "ioredis"

let redisClient: Redis | null | undefined

function getRedisClient() {
  if (redisClient !== undefined) return redisClient

  const redisUrl = process.env.REDIS_URL
  if (!redisUrl) {
    redisClient = null
    return redisClient
  }

  redisClient = new Redis(redisUrl, {
    enableOfflineQueue: false,
    lazyConnect: true,
    maxRetriesPerRequest: 1,
  })
  redisClient.on("error", () => undefined)
  return redisClient
}

export async function consumeRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
) {
  const redis = getRedisClient()
  if (!redis) return { allowed: true, remaining: limit, retryAfter: 0 }

  try {
    if (redis.status === "wait") await redis.connect()
    const count = await redis.incr(key)
    if (count === 1) await redis.expire(key, windowSeconds)
    const retryAfter = Math.max(0, await redis.ttl(key))
    return {
      allowed: count <= limit,
      remaining: Math.max(0, limit - count),
      retryAfter,
    }
  } catch {
    return { allowed: true, remaining: limit, retryAfter: 0 }
  }
}
