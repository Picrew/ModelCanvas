import { parseRenderEnvelope } from "@/src/core";
import type { AnyRenderEnvelope } from "@/src/schema";

export interface A2UiNode {
  id: string;
  component: string;
  properties?: Record<string, unknown>;
  children?: A2UiNode[];
}
export interface A2UiDocument {
  id: string;
  title?: string;
  nodes: A2UiNode[];
  version?: string;
}

const allowedComponents = new Set([
  "TextInput",
  "Textarea",
  "Select",
  "Radio",
  "Checkbox",
  "Switch",
  "Date",
  "Time",
  "Slider",
  "FileUpload",
]);

function nodeToField(node: A2UiNode): Record<string, unknown> | undefined {
  if (!allowedComponents.has(node.component)) return undefined;
  const props = node.properties ?? {};
  const base = {
    id: node.id,
    label: typeof props.label === "string" ? props.label : node.id,
    required: props.required === true,
  };
  const kinds: Record<string, string> = {
    TextInput: "text",
    Textarea: "textarea",
    Select: "select",
    Radio: "radio",
    Checkbox: "checkbox",
    Switch: "switch",
    Date: "date",
    Time: "time",
    Slider: "slider",
    FileUpload: "file",
  };
  const kind = kinds[node.component]!;
  if (kind === "select" || kind === "radio")
    return {
      ...base,
      kind,
      options: Array.isArray(props.options) ? props.options : [],
    };
  if (kind === "slider")
    return {
      ...base,
      kind,
      min: typeof props.min === "number" ? props.min : 0,
      max: typeof props.max === "number" ? props.max : 100,
      step: typeof props.step === "number" ? props.step : 1,
    };
  if (kind === "checkbox" || kind === "switch")
    return { ...base, kind, defaultValue: props.defaultValue === true };
  return {
    ...base,
    kind,
    placeholder:
      typeof props.placeholder === "string" ? props.placeholder : undefined,
  };
}

export function a2uiToRenderEnvelope(
  document: A2UiDocument,
): AnyRenderEnvelope {
  const unknown: string[] = [];
  const fields = document.nodes.flatMap((node) => {
    const field = nodeToField(node);
    if (!field) unknown.push(node.component);
    return field ? [field] : [];
  });
  if (!fields.length)
    return {
      id: document.id,
      type: "a2ui.unsupported",
      version: "1.0.0",
      payload: {},
      fallback: {
        text: `A2UI contained no allow-listed components. Rejected: ${unknown.join(", ") || "none"}`,
      },
      metadata: { rejectedComponents: unknown },
    };
  const input = {
    id: document.id,
    type: "form.dynamic",
    version: "1.0.0",
    presentation: { title: document.title ?? "A2UI form" },
    payload: {
      title: document.title ?? "Generated form",
      description: unknown.length
        ? `Rejected unknown components: ${unknown.join(", ")}`
        : "Converted from an allow-listed A2UI document.",
      steps: [{ id: "main", title: "Details", fields }],
      submitLabel: "Submit",
      confirmation: true,
    },
    metadata: { adapter: "a2ui", rejectedComponents: unknown },
  };
  const parsed = parseRenderEnvelope(input);
  if (!parsed.success)
    throw new Error(
      parsed.issues
        .map((issue) => `${issue.path}: ${issue.message}`)
        .join("; "),
    );
  return parsed.data;
}
