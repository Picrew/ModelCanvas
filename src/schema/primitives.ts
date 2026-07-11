import { z } from "zod";

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export const JsonPrimitiveSchema = z.union([
  z.string(),
  z.number().finite(),
  z.boolean(),
  z.null(),
]);

export const JsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([
    JsonPrimitiveSchema,
    z.array(JsonValueSchema),
    z.record(z.string(), JsonValueSchema),
  ]),
);

export const UrlStringSchema = z.string().min(1).max(16_384);
export const DataSourceSchema = z
  .object({
    url: UrlStringSchema.optional(),
    dataUrl: UrlStringSchema.optional(),
    base64: z.string().max(20_000_000).optional(),
    mimeType: z.string().max(255).optional(),
    fileName: z.string().max(255).optional(),
    size: z.number().int().nonnegative().max(100_000_000).optional(),
  })
  .strict()
  .refine((value) => Boolean(value.url || value.dataUrl || value.base64), {
    message: "Provide url, dataUrl, or base64",
  });

export const TranscriptCueSchema = z
  .object({
    id: z.string().min(1),
    start: z.number().nonnegative(),
    end: z.number().positive(),
    text: z.string().min(1),
    speaker: z.string().optional(),
  })
  .strict()
  .refine((cue) => cue.end > cue.start, {
    message: "end must be greater than start",
    path: ["end"],
  });

export const StringMapSchema = z.record(z.string(), z.string());

