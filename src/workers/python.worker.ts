/// <reference lib="webworker" />

import type { PyodideInterface } from "pyodide";
import { withBasePath } from "@/src/core/base-path";
import {
  isAllowedPythonRuntimeRequest,
  PYODIDE_PACKAGE_BASE_URL,
} from "@/src/security/python-runtime";

let runtime: PyodideInterface | undefined;
const nativeFetch = globalThis.fetch.bind(globalThis);

interface RunMessage {
  type: "run";
  code: string;
  packages: string[];
  allowPackages: boolean;
  allowedOrigins: string[];
}

interface ResetMessage {
  type: "reset";
}

async function getRuntime() {
  if (runtime) return runtime;
  self.postMessage({
    type: "status",
    status: "loading",
    message: "Loading isolated Python runtime…",
  });
  const { loadPyodide } = await import("pyodide");
  runtime = await loadPyodide({
    indexURL: withBasePath("/pyodide/"),
    packageBaseUrl: PYODIDE_PACKAGE_BASE_URL,
  });
  runtime.setStdout({
    batched: (text) => self.postMessage({ type: "stdout", text }),
  });
  runtime.setStderr({
    batched: (text) => self.postMessage({ type: "stderr", text }),
  });
  return runtime;
}

function lockDownNetwork(allowedOrigins: string[]) {
  const allowPackageCdn = allowedOrigins.some((origin) => {
    try {
      return new URL(origin).origin === "https://cdn.jsdelivr.net";
    } catch {
      return false;
    }
  });
  const runtimeAssetBaseUrl = new URL(
    withBasePath("/pyodide/"),
    self.location.origin,
  ).href;
  const restrictedFetch = (input: RequestInfo | URL, init?: RequestInit) => {
    const target = new URL(
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url,
      self.location.href,
    );
    const method =
      init?.method ?? (input instanceof Request ? input.method : "GET");
    if (
      !isAllowedPythonRuntimeRequest({
        targetUrl: target.href,
        method,
        appOrigin: self.location.origin,
        runtimeAssetBaseUrl,
        allowPackageCdn,
      })
    )
      return Promise.reject(
        new Error(`Python runtime network request blocked: ${target.href}`),
      );
    return nativeFetch(input, {
      ...init,
      credentials: "omit",
      redirect: "error",
      referrerPolicy: "no-referrer",
    });
  };
  Object.defineProperty(globalThis, "fetch", {
    value: restrictedFetch,
    configurable: false,
    writable: false,
  });
}

function disableActiveNetworkPrimitives() {
  for (const name of [
    "WebSocket",
    "EventSource",
    "Worker",
    "SharedWorker",
    "WebTransport",
    "XMLHttpRequest",
    "importScripts",
    "cookieStore",
    "indexedDB",
    "caches",
  ]) {
    if (!(name in globalThis)) continue;
    Object.defineProperty(globalThis, name, {
      value: function blockedPythonNetworkPrimitive() {
        throw new Error(`${name} is disabled in the Python runtime`);
      },
      configurable: false,
      writable: false,
    });
  }
}

self.onmessage = async (event: MessageEvent<RunMessage | ResetMessage>) => {
  if (event.data.type === "reset") {
    runtime = undefined;
    self.postMessage({
      type: "status",
      status: "idle",
      message: "Environment cleared",
    });
    return;
  }
  try {
    lockDownNetwork(event.data.allowedOrigins);
    const pyodide = await getRuntime();
    if (event.data.packages.length) {
      if (!event.data.allowPackages)
        throw new Error(
          "Scientific packages require an explicitly allow-listed Pyodide package origin",
        );
      self.postMessage({
        type: "status",
        status: "loading",
        message: `Loading ${event.data.packages.join(", ")}…`,
      });
      await pyodide.loadPackage(event.data.packages);
      if (event.data.packages.includes("matplotlib"))
        await pyodide.runPythonAsync(
          "import matplotlib\nmatplotlib.use('Agg', force=True)",
        );
    }
    disableActiveNetworkPrimitives();
    self.postMessage({
      type: "status",
      status: "running",
      message: "Running in Web Worker",
    });
    const result = await pyodide.runPythonAsync(event.data.code);
    self.postMessage({
      type: "result",
      value: result === undefined ? undefined : String(result),
    });
    self.postMessage({
      type: "status",
      status: "complete",
      message: "Execution complete",
    });
  } catch (error) {
    self.postMessage({
      type: "stderr",
      text: error instanceof Error ? error.message : "Python execution failed",
    });
    self.postMessage({
      type: "status",
      status: "error",
      message: "Execution failed",
    });
  }
};

export {};
