import { randomUUID } from "crypto"
import { CreateBucketCommand, DeleteObjectCommand, GetObjectCommand, HeadBucketCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
import * as fs from "fs"
import * as path from "path"

const LOCAL_IMAGES_DIR = path.resolve(process.cwd(), "..", "frontend", "public", "images")
const ALLOWED = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif", ".svg"]

function getMinioClient() {
  const endpoint = process.env.MINIO_ENDPOINT
  const accessKeyId = process.env.MINIO_ACCESS_KEY
  const secretAccessKey = process.env.MINIO_SECRET_KEY

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    return null
  }

  return new S3Client({
    region: process.env.MINIO_REGION || "us-east-1",
    endpoint,
    forcePathStyle: true,
    credentials: { accessKeyId, secretAccessKey },
  })
}

function getBucket() {
  return process.env.MINIO_BUCKET || "mong-media"
}

let bucketReady = false

async function ensureBucket(client: S3Client) {
  if (bucketReady) return
  const bucket = getBucket()
  await client.send(new HeadBucketCommand({ Bucket: bucket })).catch(async () => {
    await client.send(new CreateBucketCommand({ Bucket: bucket }))
  })
  bucketReady = true
}

function getPublicBaseUrl() {
  const base = process.env.MINIO_PUBLIC_BASE_URL?.replace(/\/$/, "")
  if (base) return base
  const endpoint = process.env.MINIO_ENDPOINT?.replace(/\/$/, "")
  return endpoint ? `${endpoint}/${getBucket()}` : ""
}

function ensureLocalDir() {
  if (!fs.existsSync(LOCAL_IMAGES_DIR)) {
    fs.mkdirSync(LOCAL_IMAGES_DIR, { recursive: true })
  }
}

function isAllowedExtension(ext: string) {
  return ALLOWED.includes(ext.toLowerCase())
}

function getContentType(filename: string) {
  const ext = path.extname(filename).toLowerCase()
  const contentTypeMap: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".avif": "image/avif",
    ".svg": "image/svg+xml",
  }
  return contentTypeMap[ext] || "application/octet-stream"
}

function parseBase64Payload(data: string) {
  const base64 = data.includes(",") ? data.split(",")[1] : data
  return Buffer.from(base64, "base64")
}

export async function uploadMediaObject({ filename, data }: { filename?: string; data: string }) {
  const ext = filename ? path.extname(filename).toLowerCase() : ".png"
  if (!isAllowedExtension(ext)) {
    throw new Error(`File type not allowed. Use: ${ALLOWED.join(", ")}`)
  }

  const objectKey = `${randomUUID()}${ext}`
  const buffer = parseBase64Payload(data)
  const client = getMinioClient()

  if (client) {
    await ensureBucket(client)
    await client.send(new PutObjectCommand({
      Bucket: getBucket(),
      Key: objectKey,
      Body: buffer,
      ContentType: getContentType(objectKey),
    }))

    return {
      filename: objectKey,
      key: objectKey,
      url: `/media/${encodeURIComponent(objectKey)}`,
      public_url: `${getPublicBaseUrl()}/${objectKey}`,
      provider: "minio",
      size: buffer.byteLength,
    }
  }

  ensureLocalDir()
  const filePath = path.join(LOCAL_IMAGES_DIR, objectKey)
  fs.writeFileSync(filePath, buffer)
  return {
    filename: objectKey,
    key: objectKey,
      url: `/media/${encodeURIComponent(objectKey)}`,
    public_url: `/images/${objectKey}`,
    provider: "local",
    size: buffer.byteLength,
  }
}

export async function listMediaObjects() {
  const client = getMinioClient()
  if (client) {
    await ensureBucket(client)
    const response = await client.send(new ListObjectsV2Command({ Bucket: getBucket(), MaxKeys: 500 }))
    return (response.Contents || [])
      .filter((item) => item.Key)
      .map((item) => ({
        key: item.Key as string,
        filename: item.Key as string,
        url: `/media/${encodeURIComponent(item.Key as string)}`,
        public_url: `${getPublicBaseUrl()}/${item.Key}`,
        size: Number(item.Size || 0),
        updated_at: item.LastModified?.toISOString() || null,
        provider: "minio",
      }))
      .sort((a, b) => a.filename.localeCompare(b.filename))
  }

  if (!fs.existsSync(LOCAL_IMAGES_DIR)) {
    return []
  }

  return fs.readdirSync(LOCAL_IMAGES_DIR)
    .filter((file) => isAllowedExtension(path.extname(file)))
    .sort()
    .map((file) => ({
      key: file,
      filename: file,
      url: `/media/${encodeURIComponent(file)}`,
      public_url: `/images/${file}`,
      size: fs.statSync(path.join(LOCAL_IMAGES_DIR, file)).size,
      updated_at: fs.statSync(path.join(LOCAL_IMAGES_DIR, file)).mtime.toISOString(),
      provider: "local",
    }))
}

export async function getMediaObject(objectKey: string) {
  if (!objectKey || !isAllowedExtension(path.extname(objectKey))) {
    throw new Error("Invalid media object")
  }

  const client = getMinioClient()
  if (client) {
    await ensureBucket(client)
    const response = await client.send(new GetObjectCommand({ Bucket: getBucket(), Key: objectKey }))
    return {
      body: response.Body,
      contentType: response.ContentType || getContentType(objectKey),
      size: Number(response.ContentLength || 0),
      provider: "minio",
    }
  }

  const filePath = path.join(LOCAL_IMAGES_DIR, objectKey)
  if (!fs.existsSync(filePath)) {
    throw new Error("Media object not found")
  }

  return {
    body: fs.createReadStream(filePath),
    contentType: getContentType(objectKey),
    size: fs.statSync(filePath).size,
    provider: "local",
  }
}

export async function deleteMediaObject(objectKey: string) {
  const client = getMinioClient()
  if (client) {
    await ensureBucket(client)
    await client.send(new DeleteObjectCommand({ Bucket: getBucket(), Key: objectKey }))
    return { ok: true, provider: "minio" }
  }

  const filePath = path.join(LOCAL_IMAGES_DIR, objectKey)
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath)
  }
  return { ok: true, provider: "local" }
}

export function isObjectStorageEnabled() {
  return Boolean(getMinioClient())
}
