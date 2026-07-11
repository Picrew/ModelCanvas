import { cp, mkdir, stat } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

async function copyIfChanged(source, destination) {
  try {
    const [from, to] = await Promise.all([stat(source), stat(destination)]);
    if (from.size === to.size && from.mtimeMs <= to.mtimeMs) return;
  } catch {}
  await mkdir(dirname(destination), { recursive: true });
  await cp(source, destination, { force: true });
}

await Promise.all([
  copyIfChanged(join(root, "node_modules/pdfjs-dist/build/pdf.worker.min.mjs"), join(root, "public/pdf.worker.min.mjs")),
  copyIfChanged(join(root, "node_modules/katex/dist/katex.min.css"), join(root, "public/katex/katex.min.css")),
  cp(join(root, "node_modules/katex/dist/fonts"), join(root, "public/katex/fonts"), { recursive: true, force: true }),
  ...["pyodide.asm.js", "pyodide.asm.wasm", "pyodide.mjs", "python_stdlib.zip", "pyodide-lock.json"].map((file) =>
    copyIfChanged(join(root, "node_modules/pyodide", file), join(root, "public/pyodide", file)),
  ),
]);
