const safeRemoteProtocols = new Set(["https:", "http:"]);
const safeDataMimeTypes = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/avif",
  "audio/wav",
  "audio/mpeg",
  "audio/ogg",
  "video/mp4",
  "video/webm",
  "application/pdf",
]);

export interface UrlPolicy {
  allowedOrigins?: string[];
  allowData?: boolean;
  allowBlob?: boolean;
  allowHttpLocalhost?: boolean;
}

export function validateUrl(
  value: string,
  policy: UrlPolicy = {},
): { ok: true; url: string } | { ok: false; reason: string } {
  const trimmed = value.trim();
  if (!trimmed) return { ok: false, reason: "URL is empty" };
  if (/^[\u0000-\u001F\u007F]/.test(trimmed))
    return { ok: false, reason: "URL contains control characters" };
  if (trimmed.toLowerCase().startsWith("javascript:"))
    return { ok: false, reason: "javascript: URLs are forbidden" };
  if (trimmed.toLowerCase().startsWith("blob:")) {
    return policy.allowBlob
      ? { ok: true, url: trimmed }
      : { ok: false, reason: "Blob URLs are not allowed here" };
  }
  if (trimmed.toLowerCase().startsWith("data:")) {
    if (!policy.allowData)
      return { ok: false, reason: "Data URLs are not allowed here" };
    const mime = trimmed.slice(5).split(/[;,]/)[0]?.toLowerCase() ?? "";
    return safeDataMimeTypes.has(mime)
      ? { ok: true, url: trimmed }
      : {
          ok: false,
          reason: `Unsafe data URL MIME type: ${mime || "missing"}`,
        };
  }
  let parsed: URL;
  try {
    parsed = new URL(trimmed, "http://modelcanvas.invalid");
  } catch {
    return { ok: false, reason: "Malformed URL" };
  }
  if (!safeRemoteProtocols.has(parsed.protocol))
    return { ok: false, reason: `Protocol ${parsed.protocol} is not allowed` };
  if (parsed.origin === "http://modelcanvas.invalid")
    return { ok: true, url: parsed.pathname + parsed.search + parsed.hash };
  const isLocalhost =
    parsed.hostname === "localhost" ||
    parsed.hostname === "127.0.0.1" ||
    parsed.hostname === "[::1]";
  if (
    parsed.protocol === "http:" &&
    !(isLocalhost && policy.allowHttpLocalhost)
  ) {
    return { ok: false, reason: "Remote URLs must use HTTPS" };
  }
  if (
    policy.allowedOrigins?.length &&
    !policy.allowedOrigins.includes(parsed.origin)
  ) {
    return { ok: false, reason: `Origin ${parsed.origin} is not allow-listed` };
  }
  return { ok: true, url: parsed.toString() };
}
