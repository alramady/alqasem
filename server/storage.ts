// S3-compatible storage for Railway deployment
// Falls back to Manus forge API if S3 credentials are not set

import { ENV } from './_core/env';

// Check if we have Manus forge API (original Manus deployment)
function hasForgeApi(): boolean {
  return !!(ENV.forgeApiUrl && ENV.forgeApiKey);
}

// ---- Manus Forge API storage (original) ----

function ensureTrailingSlash(value: string): string {
  return value.endsWith("/") ? value : `${value}/`;
}

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
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
  
  const blob = typeof data === "string"
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

async function forgeStorageGet(relKey: string): Promise<{ key: string; url: string }> {
  const baseUrl = ENV.forgeApiUrl.replace(/\/+$/, "");
  const apiKey = ENV.forgeApiKey;
  const key = normalizeKey(relKey);
  
  const downloadApiUrl = new URL("v1/storage/downloadUrl", ensureTrailingSlash(baseUrl));
  downloadApiUrl.searchParams.set("path", key);
  const response = await fetch(downloadApiUrl, {
    method: "GET",
    headers: buildAuthHeaders(apiKey),
  });
  return { key, url: (await response.json()).url };
}

// ---- Public API ----

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  if (hasForgeApi()) {
    return forgeStoragePut(relKey, data, contentType);
  }
  
  // Fallback: store locally (for Railway without S3)
  // In production, you should configure S3_* env vars
  console.warn("No storage backend configured. File upload will fail.");
  throw new Error("Storage not configured. Set BUILT_IN_FORGE_API_URL and BUILT_IN_FORGE_API_KEY, or configure S3.");
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  if (hasForgeApi()) {
    return forgeStorageGet(relKey);
  }
  
  throw new Error("Storage not configured.");
}
