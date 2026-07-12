import { parseRenderEnvelope } from "@/src/core";
import type { KnownRenderEnvelope } from "@/src/schema";
import { demoScenarios } from "./scenarios";
import type { DemoScenario } from "./scenarios";

function parse(input: unknown): KnownRenderEnvelope {
  const result = parseRenderEnvelope(input);
  if (!result.success || result.unknownType)
    throw new Error("Invalid widget fixture");
  return result.data as KnownRenderEnvelope;
}

const common = {
  version: "1.0.0",
  source: { provider: "Demo fixture", createdAt: "2026-07-11T00:00:00.000Z" },
};
const weather = demoScenarios.find(
  (scenario) => scenario.id === "weather",
)!.envelope;
const stock = demoScenarios.find(
  (scenario) => scenario.id === "stock",
)!.envelope;

export const widgetFixtures: KnownRenderEnvelope[] = [
  weather,
  stock,
  parse({
    ...common,
    id: "widget-sports",
    type: "widget.sports",
    presentation: { title: "2026 World Cup · bracket fixture" },
    payload: {
      league: "World Cup · 2026 interface fixture",
      games: [
        {
          id: "g1",
          home: "France",
          away: "Morocco",
          homeCode: "france",
          awayCode: "morocco",
          homeScore: 2,
          awayScore: 0,
          status: "Full time",
          startsAt: "2026-07-10 20:00",
          stage: "QF",
        },
        {
          id: "g2",
          home: "Spain",
          away: "Belgium",
          homeCode: "spain",
          awayCode: "belgium",
          homeScore: 2,
          awayScore: 1,
          status: "Full time",
          startsAt: "2026-07-10 23:30",
          stage: "QF",
        },
        {
          id: "g3",
          home: "Norway",
          away: "England",
          homeCode: "norway",
          awayCode: "england",
          status: "Upcoming",
          startsAt: "2026-07-12 17:00",
          stage: "QF",
        },
        {
          id: "g4",
          home: "France",
          away: "Spain",
          homeCode: "france",
          awayCode: "spain",
          status: "Upcoming",
          startsAt: "2026-07-15 03:00",
          stage: "SF",
        },
      ],
      standings: [],
      updatedAt: "2026-07-11 08:00 CST",
      provider: "Demo fixture · illustrative bracket, not live tournament data",
    },
  }),
  parse({
    ...common,
    id: "widget-travel",
    type: "widget.travel",
    presentation: { title: "Shanghai → Tokyo" },
    payload: {
      origin: "Shanghai",
      destination: "Tokyo",
      startDate: "2026-08-14",
      endDate: "2026-08-18",
      options: [
        {
          id: "t1",
          kind: "flight",
          title: "HND morning arrival",
          price: 342,
          currency: "USD",
          details: ["2h 45m", "Nonstop", "1 carry-on"],
          amenities: ["Wi-Fi", "Meal"],
        },
        {
          id: "t2",
          kind: "hotel",
          title: "Shibuya design hotel",
          price: 184,
          currency: "USD/night",
          details: ["4 nights", "8.9 guest score", "Free cancellation"],
          amenities: ["Breakfast", "Gym"],
        },
      ],
    },
  }),
  parse({
    ...common,
    id: "widget-product",
    type: "widget.product",
    presentation: { title: "Headphone comparison" },
    payload: {
      products: [
        {
          id: "p1",
          name: "Aero Studio Pro",
          price: 349,
          originalPrice: 399,
          currency: "USD",
          stock: 12,
          rating: 4.8,
          merchant: "Aero Audio",
          specs: { Battery: "38 hours", Weight: "248 g", Codec: "LDAC" },
        },
        {
          id: "p2",
          name: "QuietForm X2",
          price: 299,
          currency: "USD",
          stock: 4,
          rating: 4.6,
          merchant: "QuietForm",
          specs: { Battery: "32 hours", Weight: "236 g", Codec: "aptX" },
        },
      ],
    },
  }),
  parse({
    ...common,
    id: "widget-calendar",
    type: "widget.calendar",
    presentation: { title: "Design review" },
    payload: {
      eventId: "evt-demo-1",
      title: "ModelCanvas design review",
      start: "2026-07-14 10:00",
      end: "2026-07-14 10:45",
      timezone: "Asia/Shanghai",
      attendees: ["alice@example.com", "chen@example.com"],
      location: "Studio 4 / Video call",
      description:
        "Review Playground interaction states and renderer security labels.",
      response: "none",
    },
    actions: [
      {
        id: "calendar-response",
        label: "Respond",
        type: "calendar.write",
        requiresConfirmation: true,
      },
    ],
  }),
  parse({
    ...common,
    id: "widget-email",
    type: "widget.email",
    presentation: { title: "Review notes" },
    payload: {
      messageId: "msg-demo-1",
      from: "alice@example.com",
      to: ["you@example.com"],
      subject: "ModelCanvas review notes",
      summary:
        "Three decisions and two follow-ups from today’s renderer review.",
      body: "The safe fallback reads clearly. Let’s tighten the mobile inspector and keep the fixture label visible in every data-backed widget.",
      attachments: [{ name: "review-notes.pdf", size: 184000 }],
      thread: [
        {
          from: "chen@example.com",
          sentAt: "2026-07-10 16:20",
          text: "Agreed on the trust labels.",
        },
      ],
    },
    actions: [
      {
        id: "email-reply",
        label: "Reply",
        type: "email.write",
        requiresConfirmation: true,
      },
    ],
  }),
  parse({
    ...common,
    id: "widget-logistics",
    type: "widget.logistics",
    presentation: { title: "Shipment MC-2048" },
    payload: {
      trackingNumber: "MC-2048-771",
      carrier: "Northstar Express",
      status: "transit",
      currentLocation: "Suzhou, Jiangsu",
      updatedAt: "2026-07-11 08:42 CST",
      events: [
        {
          time: "2026-07-11 08:42",
          location: "Suzhou",
          status: "In transit",
          description: "Departed regional sorting center",
        },
        {
          time: "2026-07-10 22:16",
          location: "Shanghai",
          status: "Processed",
          description: "Shipment processed at origin facility",
        },
        {
          time: "2026-07-10 15:03",
          location: "Shanghai",
          status: "Picked up",
          description: "Package received by carrier",
        },
      ],
    },
  }),
];

const widgetScenarioCopy: Record<
  string,
  Pick<DemoScenario, "title" | "description" | "prompt">
> = {
  "widget.sports": {
    title: "World Cup bracket",
    description: "Stage tabs, completed scores and upcoming knockout fixtures.",
    prompt: "Show a World Cup knockout bracket using sample data",
  },
  "widget.travel": {
    title: "Travel comparison",
    description: "Flights, stays, amenities and route actions.",
    prompt: "Compare a Shanghai to Tokyo trip",
  },
  "widget.product": {
    title: "Product comparison",
    description: "Prices, inventory, ratings and structured specs.",
    prompt: "Compare these headphones",
  },
  "widget.calendar": {
    title: "Calendar action",
    description: "Event detail with confirmed write actions.",
    prompt: "Schedule a ModelCanvas design review",
  },
  "widget.email": {
    title: "Email thread",
    description: "Thread summary, attachment metadata and confirmed reply.",
    prompt: "Summarize this email and prepare a reply",
  },
  "widget.logistics": {
    title: "Shipment tracking",
    description: "Current status and chronological carrier events.",
    prompt: "Track shipment MC-2048-771",
  },
};

export const widgetScenarios: DemoScenario[] = widgetFixtures
  .filter((envelope) => widgetScenarioCopy[envelope.type])
  .map((envelope) => ({
    id: envelope.type.replace("widget.", ""),
    category: "Start here",
    envelope,
    ...widgetScenarioCopy[envelope.type]!,
  }));

export const allDemoScenarios = [...demoScenarios, ...widgetScenarios];

export function findAnyScenario(query: string): DemoScenario {
  const normalized = query.trim().toLowerCase();
  return (
    allDemoScenarios.find((scenario) =>
      `${scenario.id} ${scenario.title} ${scenario.description} ${scenario.prompt}`
        .toLowerCase()
        .includes(normalized),
    ) ?? demoScenarios[0]!
  );
}

export function withDemoState(
  envelope: KnownRenderEnvelope,
  state: "loading" | "empty" | "error",
): KnownRenderEnvelope {
  return {
    ...envelope,
    id: `${envelope.id}-${state}`,
    metadata: { ...envelope.metadata, demoState: state },
  } as KnownRenderEnvelope;
}
