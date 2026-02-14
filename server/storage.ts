// S3-compatible storage (AWS S3 / Cloudflare R2 / MinIO)
// Falls back to Manus forge API if S3 credentials are not set
//
// Required env vars for S3/R2:
//   S3_ENDPOINT    — e.g. https://<account_id>.r2.cloudflarestorage.com
//   S3_BUCKET      — e.g. alqasem-media
//   S3_ACCESS_KEY  — IAM / R2 API token access key
//   S3_SECRET_KEY  — IAM / R2 API token secret key
//   S3_REGION      — e.g. auto (R2) or me-south-1 (AWS)
//   S3_PUBLIC_URL  — public base URL, e.g. https://pub-xxx.r2.dev or https://bucket.s3.region.amazonaws.com

import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ENV } from "./_core/env";

// ---- S3 Client (lazy singleton) ----

let _s3Client: S3Client | null = null;

function getS3Config() {
  const endpoint = process.env.S3_ENDPOINT;
  const bucket = process.env.S3_BUCKET;
  const accessKey = process.env.S3_ACCESS_KEY;
  const secretKey = process.env.S3_SECRET_KEY;
  const region = process.env.S3_REGION || "auto";
  const publicUrl = process.env.S3_PUBLIC_URL;

  if (!endpoint || !bucket || !accessKey || !secretKey) {
    return null;
  }

  return { endpoint, bucket, accessKey, secretKey, region, publicUrl };
}

function getS3Client(): S3Client {
  if (_s3Client) return _s3Client;

  const config = getS3Config();
  if (!config) throw new Error("S3 not configured");

  _s3Client = new S3Client({
    endpoint: config.endpoint,
    region: config.region,
    credentials: {
      accessKeyId: config.accessKey,
      secretAccessKey: config.secretKey,
    },
    forcePathStyle: true, // Required for R2 and MinIO
  });

  return _s3Client;
}

function hasS3(): boolean {
  return getS3Config() !== null;
}

// ---- S3 storage operations ----

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

async function s3Put(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType: string
): Promise<{ key: string; url: string }> {
  const config = getS3Config()!;
  const client = getS3Client();
  const key = normalizeKey(relKey);

  const body = typeof data === "string" ? Buffer.from(data) : data;

  await client.send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );

  // Build public URL
  const url = config.publicUrl
    ? `${config.publicUrl.replace(/\/+$/, "")}/${key}`
    : `${config.endpoint.replace(/\/+$/, "")}/${config.bucket}/${key}`;

  return { key, url };
}

async function s3Get(relKey: string): Promise<{ key: string; url: string }> {
  const config = getS3Config()!;
  const client = getS3Client();
  const key = normalizeKey(relKey);

  // If public URL is set, return direct public link
  if (config.publicUrl) {
    return {
      key,
      url: `${config.publicUrl.replace(/\/+$/, "")}/${key}`,
    };
  }

  // Otherwise generate a presigned URL (valid 1 hour)
  const command = new GetObjectCommand({
    Bucket: config.bucket,
    Key: key,
  });
  const url = await getSignedUrl(client, command, { expiresIn: 3600 });
  return { key, url };
}

// ---- Manus Forge API storage (fallback for Manus deployment) ----

function hasForgeApi(): boolean {
  return !!(ENV.forgeApiUrl && ENV.forgeApiKey);
}

function ensureTrailingSlash(value: string): string {
  return value.endsWith("/") ? value : `${value}/`;
}

function buildAuthHeaders(apiKey: string): HeadersInit {
  return { Authorization: `Bearer ${apiKey}` };
}

async function forgeStoragePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType: string
): Promise<{ key: string; url: string }> {
  const baseUrl = ENV.forgeApiUrl.replace(/\/+$/, "");
  const apiKey = ENV.forgeApiKey;
  const key = normalizeKey(relKey);

  const uploadUrl = new URL("v1/storage/upload", ensureTrailingSlash(baseUrl));
  uploadUrl.searchParams.set("path", key);

  const blob =
    typeof data === "string"
      ? new Blob([data], { type: contentType })
      : new Blob([data as any], { type: contentType });
  const form = new FormData();
  form.append("file", blob, key.split("/").pop() ?? key);

  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: buildAuthHeaders(apiKey),
    body: form,
  });

  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(`Storage upload failed (${response.status}): ${message}`);
  }
  const url = (await response.json()).url;
  return { key, url };
}

async function forgeStorageGet(
  relKey: string
): Promise<{ key: string; url: string }> {
  const baseUrl = ENV.forgeApiUrl.replace(/\/+$/, "");
  const apiKey = ENV.forgeApiKey;
  const key = normalizeKey(relKey);

  const downloadApiUrl = new URL(
    "v1/storage/downloadUrl",
    ensureTrailingSlash(baseUrl)
  );
  downloadApiUrl.searchParams.set("path", key);
  const response = await fetch(downloadApiUrl, {
    method: "GET",
    headers: buildAuthHeaders(apiKey),
  });
  return { key, url: (await response.json()).url };
}

// ---- Public API (auto-selects backend) ----

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  // Priority: S3/R2 → Manus Forge API
  if (hasS3()) {
    return s3Put(relKey, data, contentType);
  }
  if (hasForgeApi()) {
    return forgeStoragePut(relKey, data, contentType);
  }

  throw new Error(
    "Storage not configured. Set S3_ENDPOINT/S3_BUCKET/S3_ACCESS_KEY/S3_SECRET_KEY env vars, " +
      "or BUILT_IN_FORGE_API_URL/BUILT_IN_FORGE_API_KEY for Manus deployment."
  );
}

export async function storageGet(
  relKey: string
): Promise<{ key: string; url: string }> {
  if (hasS3()) {
    return s3Get(relKey);
  }
  if (hasForgeApi()) {
    return forgeStorageGet(relKey);
  }

  throw new Error("Storage not configured.");
}
