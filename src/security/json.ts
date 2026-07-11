export interface JsonLimitResult {
  ok: boolean;
  path: string;
  message: string;
  code: string;
}

const encoder = new TextEncoder();

export function assertJsonWithinLimits(
  value: unknown,
  limits: { maxBytes?: number; maxDepth?: number; maxNodes?: number } = {},
): JsonLimitResult {
  const maxBytes = limits.maxBytes ?? 2_000_000;
  const maxDepth = limits.maxDepth ?? 40;
  const maxNodes = limits.maxNodes ?? 200_000;
  let serialized: string;
  try {
    serialized = JSON.stringify(value);
  } catch {
    return { ok: false, path: "$", message: "Payload must be JSON serializable", code: "not_json" };
  }
  if (serialized === undefined) {
    return { ok: false, path: "$", message: "Payload must be a JSON value", code: "not_json" };
  }
  if (encoder.encode(serialized).byteLength > maxBytes) {
    return { ok: false, path: "$", message: `Payload exceeds ${maxBytes} bytes`, code: "payload_too_large" };
  }

  const stack: Array<{ value: unknown; depth: number; path: string }> = [{ value, depth: 0, path: "$" }];
  const seen = new WeakSet<object>();
  let nodes = 0;
  while (stack.length) {
    const current = stack.pop()!;
    nodes += 1;
    if (nodes > maxNodes) {
      return { ok: false, path: current.path, message: `Payload exceeds ${maxNodes} nodes`, code: "too_many_nodes" };
    }
    if (current.depth > maxDepth) {
      return { ok: false, path: current.path, message: `Payload exceeds depth ${maxDepth}`, code: "too_deep" };
    }
    if (!current.value || typeof current.value !== "object") continue;
    if (seen.has(current.value)) {
      return { ok: false, path: current.path, message: "Payload contains a circular reference", code: "circular" };
    }
    seen.add(current.value);
    if (Array.isArray(current.value)) {
      current.value.forEach((child, index) => stack.push({ value: child, depth: current.depth + 1, path: `${current.path}[${index}]` }));
    } else {
      Object.entries(current.value).forEach(([key, child]) => stack.push({ value: child, depth: current.depth + 1, path: `${current.path}.${key}` }));
    }
  }
  return { ok: true, path: "$", message: "Payload is within limits", code: "ok" };
}

