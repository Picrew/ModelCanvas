export * from "./demo";
export * from "./remote";
export * from "./tts";
export * from "./types";

export function redactProviderError(message: string): string {
  return message
    .replace(/sk-[A-Za-z0-9_-]{12,}/g, "[REDACTED]")
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, "Bearer [REDACTED]")
    .slice(0, 1_000);
}
