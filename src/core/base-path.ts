const configuredBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const APP_BASE_PATH = configuredBasePath
  ? `/${configuredBasePath.replace(/^\/+|\/+$/g, "")}`
  : "";

export function withBasePath(path: string): string {
  if (!path.startsWith("/") || path.startsWith("//")) return path;
  if (
    !APP_BASE_PATH ||
    path === APP_BASE_PATH ||
    path.startsWith(`${APP_BASE_PATH}/`)
  )
    return path;
  return `${APP_BASE_PATH}${path}`;
}
