const dangerousFileName = /[\u0000-\u001F\u007F<>:"/\\|?*]/g;

export function sanitizeFileName(name: string): string {
  const baseName = name.split(/[\\/]/).pop() ?? "file";
  const sanitized = baseName
    .replace(dangerousFileName, "_")
    .replace(/^\.+/, "")
    .trim()
    .slice(0, 180);
  return sanitized || "file";
}

export interface FilePolicy {
  maxBytes: number;
  extensions: string[];
  mimeTypes: string[];
}

export function validateFile(
  file: Pick<File, "name" | "size" | "type">,
  policy: FilePolicy,
): { ok: true; safeName: string } | { ok: false; reason: string } {
  if (file.size <= 0) return { ok: false, reason: "File is empty" };
  if (file.size > policy.maxBytes)
    return {
      ok: false,
      reason: `File exceeds ${Math.round(policy.maxBytes / 1_000_000)} MB`,
    };
  const extension = file.name.includes(".")
    ? (file.name.split(".").pop()?.toLowerCase() ?? "")
    : "";
  if (
    !policy.extensions
      .map((item) => item.replace(/^\./, "").toLowerCase())
      .includes(extension)
  ) {
    return {
      ok: false,
      reason: `.${extension || "unknown"} is not an allowed extension`,
    };
  }
  const normalizedType = file.type.toLowerCase().split(";")[0] ?? "";
  if (
    normalizedType &&
    !policy.mimeTypes.map((item) => item.toLowerCase()).includes(normalizedType)
  ) {
    return {
      ok: false,
      reason: `MIME type ${normalizedType} does not match the allowed file types`,
    };
  }
  return { ok: true, safeName: sanitizeFileName(file.name) };
}
