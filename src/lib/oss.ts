import crypto from "node:crypto";

interface OssConfig {
  bucket: string;
  endpoint: string;
  accessKeyId: string;
  accessKeySecret: string;
  securityToken?: string;
  publicBaseUrl?: string;
}

interface UploadToOssInput {
  objectKey: string;
  content: Buffer;
  contentType: string;
}

function getEnv(name: string) {
  const value = process.env[name];
  if (!value || !value.trim()) {
    return "";
  }
  return value.trim();
}

function mustEnv(primary: string, aliases: string[] = []) {
  const candidates = [primary, ...aliases];
  for (const name of candidates) {
    const value = getEnv(name);
    if (value) {
      return value;
    }
  }
  throw new Error(`Missing required environment variable: ${primary}`);
}

function normalizeEndpoint(value: string) {
  return value.replace(/^https?:\/\//i, "").replace(/\/+$/g, "");
}

function normalizeBaseUrl(value: string) {
  return value.replace(/\/+$/g, "");
}

function normalizeObjectKey(value: string) {
  return value.trim().replace(/^\/+/, "");
}

function encodeObjectKey(value: string) {
  return value
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

function decodeObjectKeyFromPath(pathname: string) {
  return pathname
    .split("/")
    .filter(Boolean)
    .map((segment) => decodeURIComponent(segment))
    .join("/");
}

export function getOssConfig(): OssConfig {
  const bucket = mustEnv("ALIYUN_OSS_BUCKET", ["OSS_BUCKET"]);
  const endpointRaw =
    getEnv("ALIYUN_OSS_ENDPOINT") ||
    getEnv("OSS_ENDPOINT") ||
    getEnv("ALIYUN_OSS_REGION");
  if (!endpointRaw) {
    throw new Error("Missing required environment variable: ALIYUN_OSS_ENDPOINT");
  }

  const endpointWithRegion = endpointRaw.includes(".aliyuncs.com")
    ? normalizeEndpoint(endpointRaw)
    : normalizeEndpoint(`${endpointRaw}.aliyuncs.com`);
  const endpoint = endpointWithRegion.startsWith(`${bucket}.`)
    ? endpointWithRegion.slice(bucket.length + 1)
    : endpointWithRegion;

  const publicBaseUrl =
    getEnv("ALIYUN_OSS_PUBLIC_BASE_URL") || getEnv("OSS_PUBLIC_BASE_URL");

  return {
    bucket,
    endpoint,
    accessKeyId: mustEnv("ALIYUN_OSS_ACCESS_KEY_ID", ["OSS_ACCESS_KEY_ID"]),
    accessKeySecret: mustEnv("ALIYUN_OSS_ACCESS_KEY_SECRET", [
      "OSS_ACCESS_KEY_SECRET",
    ]),
    securityToken:
      getEnv("ALIYUN_OSS_SECURITY_TOKEN") || getEnv("OSS_SECURITY_TOKEN") || undefined,
    publicBaseUrl: publicBaseUrl ? normalizeBaseUrl(publicBaseUrl) : undefined,
  };
}

function createAuthorization(input: {
  config: OssConfig;
  method: "PUT" | "GET";
  contentType: string;
  date: string;
  resourcePath: string;
}) {
  const headersForSign: Array<[string, string]> = [];
  if (input.config.securityToken) {
    headersForSign.push(["x-oss-security-token", input.config.securityToken]);
  }

  const canonicalizedOssHeaders = headersForSign
    .map(([key, value]) => [key.toLowerCase().trim(), value.trim()] as const)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, value]) => `${key}:${value}\n`)
    .join("");

  const stringToSign =
    `${input.method}\n` +
    `\n` +
    `${input.contentType}\n` +
    `${input.date}\n` +
    `${canonicalizedOssHeaders}${input.resourcePath}`;

  const signature = crypto
    .createHmac("sha1", input.config.accessKeySecret)
    .update(stringToSign, "utf8")
    .digest("base64");

  return `OSS ${input.config.accessKeyId}:${signature}`;
}

export async function uploadToOss(input: UploadToOssInput) {
  const config = getOssConfig();
  const objectKey = normalizeObjectKey(input.objectKey);
  if (!objectKey) {
    throw new Error("Invalid OSS object key");
  }

  const encodedObjectKey = encodeObjectKey(objectKey);
  const resourcePath = `/${config.bucket}/${objectKey}`;
  const uploadUrl = `https://${config.bucket}.${config.endpoint}/${encodedObjectKey}`;
  const date = new Date().toUTCString();
  const authorization = createAuthorization({
    config,
    method: "PUT",
    contentType: input.contentType,
    date,
    resourcePath,
  });

  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": input.contentType,
      Date: date,
      Authorization: authorization,
      ...(config.securityToken
        ? { "x-oss-security-token": config.securityToken }
        : {}),
    },
    body: new Uint8Array(input.content),
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OSS upload failed (${response.status}): ${text}`);
  }

  const publicUrl = config.publicBaseUrl
    ? `${config.publicBaseUrl}/${encodedObjectKey}`
    : uploadUrl;

  return {
    objectKey,
    url: publicUrl,
  };
}

export function tryGetOssObjectKeyFromUrl(rawUrl: string) {
  try {
    const url = new URL(rawUrl);
    const objectKey = decodeObjectKeyFromPath(url.pathname);
    return objectKey || null;
  } catch {
    return null;
  }
}

export async function downloadTextFromOss(input: {
  objectKey: string;
  revalidate?: number;
}) {
  const config = getOssConfig();
  const objectKey = normalizeObjectKey(input.objectKey);
  if (!objectKey) {
    throw new Error("Invalid OSS object key");
  }

  const encodedObjectKey = encodeObjectKey(objectKey);
  const resourcePath = `/${config.bucket}/${objectKey}`;
  const requestUrl = `https://${config.bucket}.${config.endpoint}/${encodedObjectKey}`;
  const date = new Date().toUTCString();
  const authorization = createAuthorization({
    config,
    method: "GET",
    contentType: "",
    date,
    resourcePath,
  });

  const response = await fetch(requestUrl, {
    method: "GET",
    headers: {
      Date: date,
      Authorization: authorization,
      ...(config.securityToken
        ? { "x-oss-security-token": config.securityToken }
        : {}),
    },
    cache: "force-cache",
    next: { revalidate: input.revalidate ?? 3600 },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OSS download failed (${response.status}): ${text}`);
  }

  return response.text();
}
