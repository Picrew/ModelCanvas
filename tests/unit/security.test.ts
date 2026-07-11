import { describe, expect, it } from "vitest";
import { assertJsonWithinLimits } from "@/src/security/json";
import { validateUrl } from "@/src/security/url";
import { buildArtifactSrcDoc } from "@/src/security/artifact";
import { sanitizeDataOnlyChartOption } from "@/src/security/chart";

describe("security boundaries", () => {
  it("blocks executable and insecure URLs", () => {
    expect(validateUrl("javascript:alert(1)").ok).toBe(false);
    expect(validateUrl("http://example.com/a").ok).toBe(false);
    expect(validateUrl("data:text/html,<script>1</script>", { allowData: true }).ok).toBe(false);
    expect(validateUrl("/fixtures/protocol-brief.pdf").ok).toBe(true);
  });

  it("enforces origin allowlists", () => {
    expect(validateUrl("https://assets.example.com/a.png", { allowedOrigins: ["https://assets.example.com"] }).ok).toBe(true);
    expect(validateUrl("https://evil.example/a.png", { allowedOrigins: ["https://assets.example.com"] }).ok).toBe(false);
  });

  it("detects deep and circular JSON", () => {
    const circular: Record<string, unknown> = {}; circular.self = circular;
    expect(assertJsonWithinLimits(circular).code).toBe("not_json");
    expect(assertJsonWithinLimits({ a: { b: { c: 1 } } }, { maxDepth: 1 }).code).toBe("too_deep");
  });

  it("builds a restrictive artifact CSP", () => {
    const srcdoc = buildArtifactSrcDoc("<main>safe</main>", []);
    expect(srcdoc).toContain("default-src 'none'");
    expect(srcdoc).toContain("connect-src 'none'");
    expect(srcdoc).toContain("modelcanvas-artifact");
  });

  it("removes functions and prototype keys from chart options", () => {
    const option = sanitizeDataOnlyChartOption({ series: [{ type: "bar", data: [1, 2] }], __proto__: { polluted: true }, formatter: "safe string" });
    expect(option.series).toBeDefined();
    expect(Object.prototype.hasOwnProperty.call(option, "__proto__")).toBe(false);
  });
});
