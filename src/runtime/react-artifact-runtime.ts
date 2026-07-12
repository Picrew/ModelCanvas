import * as React from "react";
import { createRoot, type Root } from "react-dom/client";
import * as Babel from "@babel/standalone";

type RuntimeMessage = {
  channel: "modelcanvas-react";
  type: "run";
  entry: string;
  files: Record<string, string>;
};

let root: Root | undefined;

function normalize(path: string) {
  const parts: string[] = [];
  for (const part of path.replaceAll("\\", "/").split("/")) {
    if (!part || part === ".") continue;
    if (part === "..") parts.pop();
    else parts.push(part);
  }
  return `/${parts.join("/")}`;
}

function resolveModule(
  from: string,
  request: string,
  files: Record<string, string>,
) {
  if (!request.startsWith(".")) return request;
  const directory = from.slice(0, Math.max(0, from.lastIndexOf("/")));
  const base = normalize(`${directory}/${request}`);
  return (
    [
      base,
      `${base}.tsx`,
      `${base}.ts`,
      `${base}.jsx`,
      `${base}.js`,
      `${base}/index.tsx`,
    ].find((candidate) => candidate in files) ?? base
  );
}

function execute(entry: string, files: Record<string, string>) {
  document
    .querySelectorAll("style[data-artifact]")
    .forEach((node) => node.remove());
  for (const [name, css] of Object.entries(files)) {
    if (!name.endsWith(".css")) continue;
    const style = document.createElement("style");
    style.dataset.artifact = name;
    style.textContent = css;
    document.head.appendChild(style);
  }
  const cache = new Map<string, { exports: Record<string, unknown> }>();
  const load = (id: string): unknown => {
    if (id === "react") return React;
    if (id === "react/jsx-runtime")
      return {
        jsx: React.createElement,
        jsxs: React.createElement,
        Fragment: React.Fragment,
      };
    if (id.endsWith(".css")) return {};
    const normalized = normalize(id);
    const existing = cache.get(normalized);
    if (existing) return existing.exports;
    const source = files[normalized];
    if (source === undefined)
      throw new Error(`Module is not available in the sandbox: ${id}`);
    const artifactModule = { exports: {} as Record<string, unknown> };
    cache.set(normalized, artifactModule);
    const output = Babel.transform(
      `const React = require('react');\n${source}`,
      {
        filename: normalized,
        presets: [
          ["typescript", { allExtensions: true, isTSX: true }],
          ["react", { runtime: "classic" }],
        ],
        plugins: ["transform-modules-commonjs"],
        sourceType: "module",
      },
    ).code;
    if (!output)
      throw new Error(`Compiler produced no output for ${normalized}`);
    const localRequire = (request: string) =>
      load(resolveModule(normalized, request, files));
    new Function("require", "module", "exports", output)(
      localRequire,
      artifactModule,
      artifactModule.exports,
    );
    return artifactModule.exports;
  };
  const exports = load(normalize(entry)) as { default?: React.ComponentType };
  if (typeof exports.default !== "function")
    throw new Error("The entry module must export a default React component");
  const mount = document.getElementById("root");
  if (!mount) throw new Error("Sandbox mount point is missing");
  root?.unmount();
  root = createRoot(mount);
  root.render(React.createElement(exports.default));
}

addEventListener("message", (event: MessageEvent<RuntimeMessage>) => {
  if (event.data?.channel !== "modelcanvas-react" || event.data.type !== "run")
    return;
  try {
    execute(event.data.entry, event.data.files);
    parent.postMessage({ channel: "modelcanvas-react", type: "ready" }, "*");
  } catch (error) {
    parent.postMessage(
      {
        channel: "modelcanvas-react",
        type: "error",
        message: error instanceof Error ? error.message : "Compilation failed",
      },
      "*",
    );
  }
});

parent.postMessage(
  { channel: "modelcanvas-react", type: "runtime-ready" },
  "*",
);
