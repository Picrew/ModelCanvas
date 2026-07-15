import { describe, expect, it } from "vitest";
import { assertJsonWithinLimits } from "@/src/security/json";
import { validateUrl } from "@/src/security/url";
import { buildArtifactSrcDoc } from "@/src/security/artifact";
import { sanitizeDataOnlyChartOption } from "@/src/security/chart";
import {
  isAllowedPythonRuntimeRequest,
  PYODIDE_PACKAGE_BASE_URL,
} from "@/src/security/python-runtime";

describe("security boundaries", () => {
  it("blocks executable and insecure URLs", () => {
    expect(validateUrl("javascript:alert(1)").ok).toBe(false);
    expect(validateUrl("http://example.com/a").ok).toBe(false);
    expect(
      validateUrl("data:text/html,<script>1</script>", { allowData: true }).ok,
    ).toBe(false);
    expect(validateUrl("/fixtures/protocol-brief.pdf").ok).toBe(true);
  });

  it("enforces origin allowlists", () => {
    expect(
      validateUrl("https://assets.example.com/a.png", {
        allowedOrigins: ["https://assets.example.com"],
      }).ok,
    ).toBe(true);
    expect(
      validateUrl("https://evil.example/a.png", {
        allowedOrigins: ["https://assets.example.com"],
      }).ok,
    ).toBe(false);
  });

  it("detects deep and circular JSON", () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    expect(assertJsonWithinLimits(circular).code).toBe("not_json");
    expect(
      assertJsonWithinLimits({ a: { b: { c: 1 } } }, { maxDepth: 1 }).code,
    ).toBe("too_deep");
  });

  it("builds a restrictive artifact CSP", () => {
    const srcdoc = buildArtifactSrcDoc(
      "<main>safe</main><script>console.log('running')</script>",
      [],
    );
    expect(srcdoc).toContain("default-src 'none'");
    expect(srcdoc).toContain("connect-src 'none'");
    expect(srcdoc).toContain("modelcanvas-artifact");
    expect(srcdoc).toContain("<script>console.log('running')</script>");
  });

  it("removes functions and prototype keys from chart options", () => {
    const option = sanitizeDataOnlyChartOption({
      series: [{ type: "bar", data: [1, 2] }],
      __proto__: { polluted: true },
      formatter: "safe string",
    });
    expect(option.series).toBeDefined();
    expect(Object.prototype.hasOwnProperty.call(option, "__proto__")).toBe(
      false,
    );
  });

  it("isolates Python from server routes and arbitrary network origins", () => {
    const policy = (targetUrl: string, method = "GET") =>
      isAllowedPythonRuntimeRequest({
        targetUrl,
        method,
        appOrigin: "https://www.seekcopywriter.com",
        runtimeAssetBaseUrl:
          "https://www.seekcopywriter.com/modelcanvas/pyodide/",
        allowPackageCdn: true,
      });

    expect(
      policy("https://www.seekcopywriter.com/modelcanvas/pyodide/pyodide.wasm"),
    ).toBe(true);
    expect(policy(`${PYODIDE_PACKAGE_BASE_URL}pandas.whl`)).toBe(true);
    expect(policy("https://www.seekcopywriter.com/modelcanvas/api/model")).toBe(
      false,
    );
    expect(policy("https://www.seekcopywriter.com/.env")).toBe(false);
    expect(policy("https://attacker.example/collect")).toBe(false);
    expect(policy(`${PYODIDE_PACKAGE_BASE_URL}pandas.whl`, "POST")).toBe(false);
  });
});
