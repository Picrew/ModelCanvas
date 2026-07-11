import { z } from "zod";
import {
  DataSourceSchema,
  JsonPrimitiveSchema,
  JsonValueSchema,
  StringMapSchema,
  TranscriptCueSchema,
  UrlStringSchema,
} from "./primitives";

export const RENDER_PROTOCOL_VERSION = "1.0.0" as const;

export const RenderTypeSchema = z.enum([
  "text.markdown",
  "text.code",
  "text.math",
  "data.table",
  "data.json",
  "chart.echarts",
  "chart.vega-lite",
  "diagram.mermaid",
  "diagram.excalidraw",
  "media.image",
  "media.audio",
  "media.video",
  "audio.pronunciation",
  "document.pdf",
  "document.docx",
  "document.spreadsheet",
  "document.presentation",
  "document.epub",
  "data.notebook",
  "data.parquet",
  "map.geo",
  "model.3d",
  "artifact.html",
  "artifact.react",
  "artifact.python",
  "widget.weather",
  "widget.stock",
  "widget.sports",
  "widget.travel",
  "widget.product",
  "widget.calendar",
  "widget.email",
  "widget.logistics",
  "form.dynamic",
]);

export type RenderType = z.infer<typeof RenderTypeSchema>;

const PresentationSchema = z
  .object({
    title: z.string().max(240).optional(),
    description: z.string().max(2_000).optional(),
    display: z.enum(["inline", "block", "panel", "fullscreen"]).optional(),
    height: z.number().int().min(80).max(4_096).optional(),
    minHeight: z.number().int().min(40).max(4_096).optional(),
    aspectRatio: z
      .string()
      .regex(/^\d+(?:\.\d+)?\s*\/\s*\d+(?:\.\d+)?$/)
      .optional(),
    theme: z.enum(["light", "dark", "system"]).optional(),
  })
  .strict();

const SourceMetadataSchema = z
  .object({
    tool: z.string().max(160).optional(),
    provider: z.string().max(160).optional(),
    model: z.string().max(160).optional(),
    url: UrlStringSchema.optional(),
    createdAt: z.string().datetime({ offset: true }).optional(),
  })
  .strict();

const FallbackSchema = z
  .object({
    text: z.string().max(100_000).optional(),
    markdown: z.string().max(100_000).optional(),
    imageUrl: UrlStringSchema.optional(),
    downloadUrl: UrlStringSchema.optional(),
  })
  .strict();

const SecurityPolicySchema = z
  .object({
    trusted: z.boolean().default(false),
    sandbox: z.boolean().default(true),
    allowScripts: z.boolean().default(false),
    allowNetwork: z.boolean().default(false),
    allowedOrigins: z.array(z.string().url()).max(20).default([]),
  })
  .strict();

const RenderActionSchema = z
  .object({
    id: z.string().min(1).max(120),
    label: z.string().min(1).max(120),
    type: z.string().min(1).max(120),
    requiresConfirmation: z.boolean().default(false),
    payload: JsonValueSchema.optional(),
  })
  .strict();

const envelopeShape = {
  id: z.string().min(1).max(160),
  version: z.string().regex(/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/),
  presentation: PresentationSchema.optional(),
  source: SourceMetadataSchema.optional(),
  fallback: FallbackSchema.optional(),
  security: SecurityPolicySchema.optional(),
  actions: z.array(RenderActionSchema).max(30).optional(),
  metadata: z.record(z.string(), JsonValueSchema).optional(),
};

function envelope<T extends RenderType, P extends z.ZodType>(
  type: T,
  payload: P,
) {
  return z
    .object({
      ...envelopeShape,
      type: z.literal(type),
      payload,
    })
    .strict();
}

const MarkdownPayloadSchema = z
  .object({
    content: z.string().max(1_000_000),
    streaming: z.boolean().default(false),
    allowHtml: z.boolean().default(false),
    citations: z
      .array(
        z
          .object({ id: z.string(), label: z.string(), url: UrlStringSchema })
          .strict(),
      )
      .max(100)
      .optional(),
  })
  .strict();

const CodePayloadSchema = z
  .object({
    code: z.string().max(2_000_000),
    language: z.string().max(80).default("text"),
    fileName: z.string().max(255).optional(),
    diff: z.boolean().default(false),
    editable: z.boolean().default(false),
    startLine: z.number().int().positive().default(1),
    wrap: z.boolean().default(false),
  })
  .strict();

const MathPayloadSchema = z
  .object({
    latex: z.string().min(1).max(100_000),
    display: z.enum(["inline", "block"]).default("block"),
  })
  .strict();

const TableColumnSchema = z
  .object({
    key: z.string().min(1),
    label: z.string().min(1),
    type: z
      .enum([
        "string",
        "number",
        "boolean",
        "date",
        "currency",
        "percent",
        "auto",
      ])
      .default("auto"),
    format: z.string().optional(),
    hidden: z.boolean().default(false),
  })
  .strict();

const TablePayloadSchema = z
  .object({
    columns: z.array(TableColumnSchema).min(1).max(300),
    rows: z.array(z.record(z.string(), JsonPrimitiveSchema)).max(100_000),
    pageSize: z.number().int().min(5).max(500).default(25),
    sourceFormat: z.enum(["json", "csv", "tsv"]).default("json"),
    caption: z.string().max(500).optional(),
  })
  .strict();

const JsonPayloadSchema = z
  .object({
    data: JsonValueSchema,
    format: z.enum(["json", "yaml", "xml", "log"]).default("json"),
    schema: JsonValueSchema.optional(),
  })
  .strict();

const EChartsPayloadSchema = z
  .object({
    option: z.record(z.string(), JsonValueSchema),
    renderer: z.enum(["canvas", "svg"]).default("canvas"),
  })
  .strict();

const VegaLitePayloadSchema = z
  .object({ spec: z.record(z.string(), JsonValueSchema) })
  .strict();

const MermaidPayloadSchema = z
  .object({ code: z.string().min(1).max(300_000) })
  .strict();

const ExcalidrawPayloadSchema = z
  .object({
    elements: z.array(z.record(z.string(), JsonValueSchema)).max(20_000),
    appState: z.record(z.string(), JsonValueSchema).optional(),
    files: z.record(z.string(), JsonValueSchema).optional(),
    editable: z.boolean().default(true),
  })
  .strict();

const ImageOverlaySchema = z
  .object({
    id: z.string(),
    label: z.string().optional(),
    x: z.number().min(0).max(1),
    y: z.number().min(0).max(1),
    width: z.number().positive().max(1).optional(),
    height: z.number().positive().max(1).optional(),
    color: z.string().optional(),
  })
  .strict();

const ImagePayloadSchema = z
  .object({
    source: DataSourceSchema,
    alt: z.string().min(1).max(2_000),
    comparisonSource: DataSourceSchema.optional(),
    overlays: z.array(ImageOverlaySchema).max(1_000).optional(),
    width: z.number().int().positive().optional(),
    height: z.number().int().positive().optional(),
  })
  .strict();

const AudioRegionSchema = z
  .object({
    id: z.string(),
    start: z.number().nonnegative(),
    end: z.number().positive(),
    label: z.string().optional(),
    color: z.string().optional(),
  })
  .strict()
  .refine((region) => region.end > region.start, {
    path: ["end"],
    message: "end must be greater than start",
  });

const AudioPayloadSchema = z
  .object({
    source: DataSourceSchema,
    title: z.string().max(240).optional(),
    transcript: z.array(TranscriptCueSchema).max(20_000).optional(),
    regions: z.array(AudioRegionSchema).max(1_000).optional(),
    waveform: z.boolean().default(true),
  })
  .strict();

const VideoPayloadSchema = z
  .object({
    source: DataSourceSchema,
    poster: UrlStringSchema.optional(),
    subtitles: z.array(TranscriptCueSchema).max(20_000).optional(),
    chapters: z.array(TranscriptCueSchema).max(1_000).optional(),
    transcript: z.array(TranscriptCueSchema).max(20_000).optional(),
  })
  .strict();

const PronunciationPayloadSchema = z
  .object({
    word: z.string().min(1).max(120),
    language: z.string().min(2).max(80),
    ipaUS: z.string().min(1),
    ipaUK: z.string().min(1),
    syllables: z.array(z.string().min(1)).min(1).max(20),
    stressIndex: z.number().int().nonnegative(),
    definition: z.string().min(1).max(2_000),
    example: z.string().min(1).max(1_000),
    accent: z.enum(["us", "uk"]).default("us"),
    speed: z.number().min(0.5).max(2).default(1),
    audioUrl: UrlStringSchema.optional(),
    exampleAudioUrl: UrlStringSchema.optional(),
    ttsProvider: z.string().min(1).default("Browser SpeechSynthesis"),
  })
  .strict();

const DocumentPayloadSchema = z
  .object({
    source: DataSourceSchema,
    title: z.string().max(240).optional(),
    page: z.number().int().positive().default(1),
  })
  .strict();

const SpreadsheetPayloadSchema = z
  .object({
    source: DataSourceSchema.optional(),
    sheets: z
      .array(
        z
          .object({
            name: z.string().min(1),
            rows: z.array(z.array(JsonPrimitiveSchema)).max(100_000),
          })
          .strict(),
      )
      .max(100)
      .optional(),
    activeSheet: z.string().optional(),
  })
  .strict()
  .refine((value) => Boolean(value.source || value.sheets?.length), {
    message: "Provide source or sheets",
  });

const EpubPayloadSchema = z
  .object({ source: DataSourceSchema, initialChapter: z.string().optional() })
  .strict();

const NotebookCellSchema = z.discriminatedUnion("cellType", [
  z
    .object({
      id: z.string(),
      cellType: z.literal("markdown"),
      source: z.string(),
    })
    .strict(),
  z
    .object({
      id: z.string(),
      cellType: z.literal("code"),
      source: z.string(),
      language: z.string().default("python"),
      executionCount: z.number().int().nullable().optional(),
      outputs: z
        .array(
          z
            .object({
              outputType: z.enum([
                "stream",
                "error",
                "display_data",
                "execute_result",
              ]),
              text: z.string().optional(),
              name: z.string().optional(),
              data: z.record(z.string(), JsonValueSchema).optional(),
            })
            .strict(),
        )
        .default([]),
    })
    .strict(),
]);

const NotebookPayloadSchema = z
  .object({
    cells: z.array(NotebookCellSchema).max(10_000),
    metadata: z.record(z.string(), JsonValueSchema).optional(),
  })
  .strict();

const ParquetPayloadSchema = z
  .object({
    source: DataSourceSchema.optional(),
    columns: z
      .array(z.object({ name: z.string(), type: z.string() }).strict())
      .default([]),
    rowCount: z.number().int().nonnegative().optional(),
    preview: z
      .array(z.record(z.string(), JsonPrimitiveSchema))
      .max(1_000)
      .default([]),
  })
  .strict();

const GeoJsonGeometrySchema = z
  .object({
    type: z.enum([
      "Point",
      "MultiPoint",
      "LineString",
      "MultiLineString",
      "Polygon",
      "MultiPolygon",
    ]),
    coordinates: JsonValueSchema,
  })
  .strict();

const GeoPayloadSchema = z
  .object({
    geojson: z
      .object({
        type: z.literal("FeatureCollection"),
        features: z
          .array(
            z
              .object({
                type: z.literal("Feature"),
                geometry: GeoJsonGeometrySchema,
                properties: z
                  .record(z.string(), JsonValueSchema)
                  .nullable()
                  .default({}),
              })
              .strict(),
          )
          .max(100_000),
      })
      .strict(),
    styleUrl: UrlStringSchema.optional(),
  })
  .strict();

const Model3dPayloadSchema = z
  .object({
    source: DataSourceSchema,
    format: z.enum(["gltf", "glb", "obj", "stl", "ply"]),
    background: z.string().default("#0b1020"),
    wireframe: z.boolean().default(false),
  })
  .strict();

const HtmlArtifactPayloadSchema = z
  .object({
    html: z.string().max(2_000_000),
    allowedOrigins: z.array(z.string().url()).max(20).default([]),
    timeoutMs: z.number().int().min(500).max(30_000).default(5_000),
  })
  .strict();

const ReactArtifactPayloadSchema = z
  .object({
    files: StringMapSchema.refine(
      (files) => Object.keys(files).length > 0,
      "At least one file is required",
    ),
    entry: z.string().default("/App.tsx"),
    dependencies: StringMapSchema.default({}),
    timeoutMs: z.number().int().min(500).max(30_000).default(10_000),
  })
  .strict();

const PythonArtifactPayloadSchema = z
  .object({
    code: z.string().max(500_000),
    packages: z
      .array(z.enum(["numpy", "pandas", "matplotlib"]))
      .max(3)
      .default([]),
    timeoutMs: z.number().int().min(500).max(30_000).default(10_000),
    fixtureOutput: z
      .object({
        stdout: z.string().optional(),
        imageUrl: UrlStringSchema.optional(),
        table: TablePayloadSchema.optional(),
      })
      .strict()
      .optional(),
  })
  .strict();

const HourlyWeatherSchema = z
  .object({
    time: z.string(),
    temperature: z.number(),
    precipitationProbability: z.number().min(0).max(100),
    condition: z.string(),
  })
  .strict();
const DailyWeatherSchema = z
  .object({
    date: z.string(),
    high: z.number(),
    low: z.number(),
    condition: z.string(),
    precipitationProbability: z.number().min(0).max(100),
  })
  .strict();
const WeatherPayloadSchema = z
  .object({
    location: z.string().min(1),
    temperature: z.number(),
    unit: z.enum(["C", "F"]),
    condition: z.string(),
    feelsLike: z.number(),
    humidity: z.number().min(0).max(100),
    windSpeed: z.number().nonnegative(),
    precipitationProbability: z.number().min(0).max(100),
    airQualityIndex: z.number().nonnegative().optional(),
    hourly: z.array(HourlyWeatherSchema).max(48),
    daily: z.array(DailyWeatherSchema).max(16),
    updatedAt: z.string(),
    provider: z.string(),
  })
  .strict();

const PricePointSchema = z
  .object({
    time: z.string(),
    open: z.number(),
    high: z.number(),
    low: z.number(),
    close: z.number(),
    volume: z.number().nonnegative(),
  })
  .strict();
const StockPayloadSchema = z
  .object({
    name: z.string(),
    symbol: z.string(),
    price: z.number(),
    currency: z.string(),
    change: z.number(),
    changePercent: z.number(),
    marketStatus: z.enum(["open", "closed", "pre", "after"]),
    range: z.enum(["1D", "1W", "1M", "3M", "1Y"]).default("1M"),
    series: z.array(PricePointSchema).min(1).max(10_000),
    metrics: z.record(z.string(), JsonPrimitiveSchema).default({}),
    updatedAt: z.string(),
    provider: z.string(),
  })
  .strict();

const SportsPayloadSchema = z
  .object({
    league: z.string(),
    games: z
      .array(
        z
          .object({
            id: z.string(),
            home: z.string(),
            away: z.string(),
            homeScore: z.number().int().optional(),
            awayScore: z.number().int().optional(),
            status: z.string(),
            startsAt: z.string(),
          })
          .strict(),
      )
      .max(100),
    standings: z
      .array(
        z
          .object({
            team: z.string(),
            played: z.number().int(),
            points: z.number().int(),
          })
          .strict(),
      )
      .max(100),
    updatedAt: z.string(),
    provider: z.string(),
  })
  .strict();

const TravelPayloadSchema = z
  .object({
    origin: z.string(),
    destination: z.string(),
    startDate: z.string(),
    endDate: z.string(),
    options: z
      .array(
        z
          .object({
            id: z.string(),
            kind: z.enum(["flight", "hotel", "route"]),
            title: z.string(),
            price: z.number().nonnegative(),
            currency: z.string(),
            details: z.array(z.string()),
            amenities: z.array(z.string()).default([]),
          })
          .strict(),
      )
      .max(100),
  })
  .strict();

const ProductPayloadSchema = z
  .object({
    products: z
      .array(
        z
          .object({
            id: z.string(),
            name: z.string(),
            imageUrl: UrlStringSchema.optional(),
            price: z.number().nonnegative(),
            originalPrice: z.number().nonnegative().optional(),
            currency: z.string(),
            stock: z.number().int().nonnegative(),
            rating: z.number().min(0).max(5),
            merchant: z.string(),
            specs: StringMapSchema,
          })
          .strict(),
      )
      .min(1)
      .max(20),
  })
  .strict();

const CalendarPayloadSchema = z
  .object({
    eventId: z.string(),
    title: z.string(),
    start: z.string(),
    end: z.string(),
    timezone: z.string(),
    attendees: z.array(z.string().email()),
    location: z.string().optional(),
    description: z.string().optional(),
    response: z
      .enum(["none", "accepted", "tentative", "declined"])
      .default("none"),
  })
  .strict();

const EmailPayloadSchema = z
  .object({
    messageId: z.string(),
    from: z.string().email(),
    to: z.array(z.string().email()),
    subject: z.string(),
    summary: z.string(),
    body: z.string(),
    attachments: z
      .array(
        z
          .object({ name: z.string(), size: z.number().int().nonnegative() })
          .strict(),
      )
      .default([]),
    thread: z
      .array(
        z
          .object({
            from: z.string().email(),
            sentAt: z.string(),
            text: z.string(),
          })
          .strict(),
      )
      .default([]),
  })
  .strict();

const LogisticsPayloadSchema = z
  .object({
    trackingNumber: z.string(),
    carrier: z.string(),
    status: z.enum([
      "label",
      "transit",
      "out-for-delivery",
      "delivered",
      "exception",
    ]),
    currentLocation: z.string(),
    updatedAt: z.string(),
    events: z
      .array(
        z
          .object({
            time: z.string(),
            location: z.string(),
            status: z.string(),
            description: z.string(),
          })
          .strict(),
      )
      .max(200),
  })
  .strict();

const FormFieldSchema = z.discriminatedUnion("kind", [
  z
    .object({
      id: z.string(),
      kind: z.enum(["text", "textarea", "date", "time", "file"]),
      label: z.string(),
      required: z.boolean().default(false),
      placeholder: z.string().optional(),
    })
    .strict(),
  z
    .object({
      id: z.string(),
      kind: z.enum(["select", "radio"]),
      label: z.string(),
      required: z.boolean().default(false),
      options: z
        .array(z.object({ label: z.string(), value: z.string() }).strict())
        .min(1),
    })
    .strict(),
  z
    .object({
      id: z.string(),
      kind: z.enum(["checkbox", "switch"]),
      label: z.string(),
      required: z.boolean().default(false),
      defaultValue: z.boolean().default(false),
    })
    .strict(),
  z
    .object({
      id: z.string(),
      kind: z.literal("slider"),
      label: z.string(),
      required: z.boolean().default(false),
      min: z.number(),
      max: z.number(),
      step: z.number().positive().default(1),
      defaultValue: z.number().optional(),
    })
    .strict(),
]);
const DynamicFormPayloadSchema = z
  .object({
    title: z.string(),
    description: z.string().optional(),
    steps: z
      .array(
        z
          .object({
            id: z.string(),
            title: z.string(),
            fields: z.array(FormFieldSchema).min(1),
          })
          .strict(),
      )
      .min(1)
      .max(20),
    submitLabel: z.string().default("Submit"),
    confirmation: z.boolean().default(false),
  })
  .strict();

export const RenderEnvelopeSchema = z.discriminatedUnion("type", [
  envelope("text.markdown", MarkdownPayloadSchema),
  envelope("text.code", CodePayloadSchema),
  envelope("text.math", MathPayloadSchema),
  envelope("data.table", TablePayloadSchema),
  envelope("data.json", JsonPayloadSchema),
  envelope("chart.echarts", EChartsPayloadSchema),
  envelope("chart.vega-lite", VegaLitePayloadSchema),
  envelope("diagram.mermaid", MermaidPayloadSchema),
  envelope("diagram.excalidraw", ExcalidrawPayloadSchema),
  envelope("media.image", ImagePayloadSchema),
  envelope("media.audio", AudioPayloadSchema),
  envelope("media.video", VideoPayloadSchema),
  envelope("audio.pronunciation", PronunciationPayloadSchema),
  envelope("document.pdf", DocumentPayloadSchema),
  envelope("document.docx", DocumentPayloadSchema),
  envelope("document.spreadsheet", SpreadsheetPayloadSchema),
  envelope("document.presentation", DocumentPayloadSchema),
  envelope("document.epub", EpubPayloadSchema),
  envelope("data.notebook", NotebookPayloadSchema),
  envelope("data.parquet", ParquetPayloadSchema),
  envelope("map.geo", GeoPayloadSchema),
  envelope("model.3d", Model3dPayloadSchema),
  envelope("artifact.html", HtmlArtifactPayloadSchema),
  envelope("artifact.react", ReactArtifactPayloadSchema),
  envelope("artifact.python", PythonArtifactPayloadSchema),
  envelope("widget.weather", WeatherPayloadSchema),
  envelope("widget.stock", StockPayloadSchema),
  envelope("widget.sports", SportsPayloadSchema),
  envelope("widget.travel", TravelPayloadSchema),
  envelope("widget.product", ProductPayloadSchema),
  envelope("widget.calendar", CalendarPayloadSchema),
  envelope("widget.email", EmailPayloadSchema),
  envelope("widget.logistics", LogisticsPayloadSchema),
  envelope("form.dynamic", DynamicFormPayloadSchema),
]);

export type KnownRenderEnvelope = z.infer<typeof RenderEnvelopeSchema>;
export type RenderEnvelopeInput = z.input<typeof RenderEnvelopeSchema>;

export interface UnknownRenderEnvelope {
  id: string;
  type: string;
  version: string;
  payload: Record<string, never>;
  presentation?: z.infer<typeof PresentationSchema>;
  source?: z.infer<typeof SourceMetadataSchema>;
  fallback?: z.infer<typeof FallbackSchema>;
  security?: z.infer<typeof SecurityPolicySchema>;
  actions?: Array<z.infer<typeof RenderActionSchema>>;
  metadata?: Record<string, import("./primitives").JsonValue>;
}

export type AnyRenderEnvelope = KnownRenderEnvelope | UnknownRenderEnvelope;

export const schemas = {
  markdown: MarkdownPayloadSchema,
  code: CodePayloadSchema,
  math: MathPayloadSchema,
  table: TablePayloadSchema,
  json: JsonPayloadSchema,
  echarts: EChartsPayloadSchema,
  vegaLite: VegaLitePayloadSchema,
  mermaid: MermaidPayloadSchema,
  excalidraw: ExcalidrawPayloadSchema,
  image: ImagePayloadSchema,
  audio: AudioPayloadSchema,
  video: VideoPayloadSchema,
  pronunciation: PronunciationPayloadSchema,
  weather: WeatherPayloadSchema,
  stock: StockPayloadSchema,
  sports: SportsPayloadSchema,
  travel: TravelPayloadSchema,
  product: ProductPayloadSchema,
  calendar: CalendarPayloadSchema,
  email: EmailPayloadSchema,
  logistics: LogisticsPayloadSchema,
  dynamicForm: DynamicFormPayloadSchema,
};

export function renderEnvelopeJsonSchema(): Record<string, unknown> {
  return z.toJSONSchema(RenderEnvelopeSchema, {
    target: "draft-2020-12",
    unrepresentable: "any",
  }) as Record<string, unknown>;
}
