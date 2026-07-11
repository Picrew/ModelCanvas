import type { JsonValue } from "@/src/schema";

const dangerousChartKeys = new Set(["formatter", "renderItem", "animationDelay", "animationDuration", "sort"]);

export function sanitizeDataOnlyChartOption(option: Record<string, JsonValue>): Record<string, JsonValue> {
  const visit = (value: JsonValue): JsonValue => {
    if (Array.isArray(value)) return value.map(visit);
    if (value && typeof value === "object") {
      return Object.fromEntries(
        Object.entries(value)
          .filter(([key, child]) => !(dangerousChartKeys.has(key) && typeof child === "string"))
          .map(([key, child]) => [key, visit(child)]),
      );
    }
    return value;
  };
  return visit(option) as Record<string, JsonValue>;
}

