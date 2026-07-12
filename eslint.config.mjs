import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Renderer effects deliberately reset loading state when their external
      // runtime (worker, iframe, diagram engine) changes.
      "react-hooks/set-state-in-effect": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "public/pdf.worker.min.mjs",
    "public/pyodide/**",
    "public/react-artifact-runtime.js",
    "tmp/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
