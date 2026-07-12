import { validateUrl } from "./url";

export function sanitizeAllowedOrigins(origins: string[]): string[] {
  return [
    ...new Set(
      origins.flatMap((origin) => {
        const result = validateUrl(origin);
        if (!result.ok) return [];
        try {
          return [new URL(result.url).origin];
        } catch {
          return [];
        }
      }),
    ),
  ].slice(0, 20);
}

function escapeClosingScript(value: string): string {
  return value.replace(/<\/script/gi, "<\\/script");
}

export function buildArtifactSrcDoc(
  html: string,
  allowedOrigins: string[] = [],
): string {
  const safeOrigins = sanitizeAllowedOrigins(allowedOrigins);
  const connectSource = safeOrigins.length ? safeOrigins.join(" ") : "'none'";
  const csp = [
    "default-src 'none'",
    "img-src data: blob:",
    "media-src data: blob:",
    "style-src 'unsafe-inline'",
    "script-src 'unsafe-inline'",
    `connect-src ${connectSource}`,
    "font-src data:",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'none'",
  ].join("; ");
  const bridge = `<script>
  (() => {
    const send = (level, args) => parent.postMessage({ channel: 'modelcanvas-artifact', level, args: args.map(String) }, '*');
    for (const level of ['log','info','warn','error']) {
      const original = console[level];
      console[level] = (...args) => { send(level, args); original.apply(console, args); };
    }
    addEventListener('error', event => send('error', [event.message]));
    addEventListener('unhandledrejection', event => send('error', [event.reason?.message || event.reason]));
    parent.postMessage({ channel: 'modelcanvas-artifact', level: 'ready', args: [] }, '*');
  })();
  <\/script>`;
  return `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${csp}"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>${escapeClosingScript(html)}${bridge}</body></html>`;
}
