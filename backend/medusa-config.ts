import { loadEnv, defineConfig, Modules } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

const redisUrl = process.env.REDIS_URL
const useRedis = Boolean(redisUrl) && (
  process.env.NODE_ENV === "production" ||
  process.env.MEDUSA_USE_REDIS === "true"
)
const objectStorageEndpoint = process.env.S3_ENDPOINT || process.env.MINIO_ENDPOINT
const objectStorageBucket = process.env.S3_BUCKET || process.env.MINIO_BUCKET
const objectStorageRegion = process.env.S3_REGION || process.env.MINIO_REGION
const objectStorageAccessKey = process.env.S3_ACCESS_KEY_ID || process.env.MINIO_ACCESS_KEY
const objectStorageSecretKey = process.env.S3_SECRET_ACCESS_KEY || process.env.MINIO_SECRET_KEY
const objectStorageUrl = process.env.S3_URL || process.env.MINIO_PUBLIC_BASE_URL

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: useRedis ? redisUrl : undefined,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    }
  },
  modules: [
    ...(useRedis ? [{
      resolve: "@medusajs/event-bus-redis",
      key: Modules.EVENT_BUS,
      options: {
        redisUrl,
        workerOptions: {
          concurrency: Number(process.env.EVENT_BUS_CONCURRENCY || 5),
        },
      },
    }, {
      resolve: "@medusajs/cache-redis",
      key: Modules.CACHE,
      options: {
        redisUrl,
        namespace: "mong",
        ttl: 300,
      },
    }] : []),
    {
      resolve: "@medusajs/file",
      options: {
        providers: [
          {
            resolve: "@medusajs/file-s3",
            id: "s3",
            options: {
              file_url: objectStorageUrl,
              access_key_id: objectStorageAccessKey,
              secret_access_key: objectStorageSecretKey,
              region: objectStorageRegion,
              bucket: objectStorageBucket,
              endpoint: objectStorageEndpoint,
              force_path_style: process.env.S3_FORCE_PATH_STYLE,
            },
          },
        ],
      },
    },
    {
      resolve: "./src/modules/rbac",
    },
    {
      resolve: "./src/modules/site",
    },
    {
      resolve: "./src/modules/bulk_orders",
    },
    {
      resolve: "./src/modules/voting",
    },
    {
      resolve: "./src/modules/ingredients",
    },
  ],
})
