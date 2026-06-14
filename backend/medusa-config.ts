import { loadEnv, defineConfig, Modules } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

const redisUrl = process.env.REDIS_URL
const useRedis = Boolean(redisUrl) && (
  process.env.NODE_ENV === "production" ||
  process.env.MEDUSA_USE_REDIS === "true"
)

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
              file_url: process.env.S3_URL,
              access_key_id: process.env.S3_ACCESS_KEY_ID,
              secret_access_key: process.env.S3_SECRET_ACCESS_KEY,
              region: process.env.S3_REGION,
              bucket: process.env.S3_BUCKET,
              endpoint: process.env.S3_ENDPOINT,
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
  ],
})
