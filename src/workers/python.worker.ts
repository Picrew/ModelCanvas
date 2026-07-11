/// <reference lib="webworker" />

import { loadPyodide, type PyodideInterface } from "pyodide";

let runtime: PyodideInterface | undefined;

interface RunMessage {
  type: "run";
  code: string;
  packages: string[];
  allowPackages: boolean;
}

interface ResetMessage { type: "reset" }

async function getRuntime() {
  if (runtime) return runtime;
  self.postMessage({ type: "status", status: "loading", message: "Loading isolated Python runtime…" });
  runtime = await loadPyodide({ indexURL: "/pyodide/" });
  runtime.setStdout({ batched: (text) => self.postMessage({ type: "stdout", text }) });
  runtime.setStderr({ batched: (text) => self.postMessage({ type: "stderr", text }) });
  return runtime;
}

self.onmessage = async (event: MessageEvent<RunMessage | ResetMessage>) => {
  if (event.data.type === "reset") {
    runtime = undefined;
    self.postMessage({ type: "status", status: "idle", message: "Environment cleared" });
    return;
  }
  try {
    const pyodide = await getRuntime();
    if (event.data.packages.length) {
      if (!event.data.allowPackages) throw new Error("Scientific packages require an explicitly allow-listed Pyodide package origin");
      self.postMessage({ type: "status", status: "loading", message: `Loading ${event.data.packages.join(", ")}…` });
      await pyodide.loadPackage(event.data.packages);
    }
    self.postMessage({ type: "status", status: "running", message: "Running in Web Worker" });
    const result = await pyodide.runPythonAsync(event.data.code);
    self.postMessage({ type: "result", value: result === undefined ? undefined : String(result) });
    self.postMessage({ type: "status", status: "complete", message: "Execution complete" });
  } catch (error) {
    self.postMessage({ type: "stderr", text: error instanceof Error ? error.message : "Python execution failed" });
    self.postMessage({ type: "status", status: "error", message: "Execution failed" });
  }
};

export {};

