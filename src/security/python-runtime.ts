export const PYODIDE_PACKAGE_BASE_URL =
  "https://cdn.jsdelivr.net/pyodide/v0.28.3/full/";

interface PythonRuntimeRequestPolicy {
  targetUrl: string;
  method: string;
  appOrigin: string;
  runtimeAssetBaseUrl: string;
  allowPackageCdn: boolean;
}

export function isAllowedPythonRuntimeRequest({
  targetUrl,
  method,
  appOrigin,
  runtimeAssetBaseUrl,
  allowPackageCdn,
}: PythonRuntimeRequestPolicy): boolean {
  if (method.toUpperCase() !== "GET") return false;
  try {
    const target = new URL(targetUrl, appOrigin);
    if (target.username || target.password) return false;
    const localRuntimeBase = new URL(runtimeAssetBaseUrl, appOrigin);
    if (
      target.origin === appOrigin &&
      target.href.startsWith(localRuntimeBase.href)
    )
      return true;
    return allowPackageCdn && target.href.startsWith(PYODIDE_PACKAGE_BASE_URL);
  } catch {
    return false;
  }
}
