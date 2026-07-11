"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  CloudSun,
  Droplets,
  Forward,
  Mail,
  MapPin,
  PackageCheck,
  Plane,
  Reply,
  ShoppingBag,
  Star,
  TrendingDown,
  TrendingUp,
  Trophy,
  Users,
  Wind,
  X,
} from "lucide-react";
import type { RendererComponentProps } from "@/src/core";
import type { KnownRenderEnvelope } from "@/src/schema";

type WidgetEnvelope = Extract<KnownRenderEnvelope, { type: `widget.${string}` }>;

function WidgetState({ envelope, children }: { envelope: WidgetEnvelope; children: ReactNode }) {
  const state = envelope.metadata?.demoState;
  if (state === "loading") return <div className="widget-shell widget-loading" aria-busy="true"><div className="skeleton wide" /><div className="skeleton hero" /><div className="skeleton-grid">{Array.from({ length: 4 }, (_, index) => <div className="skeleton" key={index} />)}</div></div>;
  if (state === "empty") return <div className="widget-shell empty-state" role="status"><PackageCheck /><h2>No data yet</h2><p>The widget received a valid empty response.</p></div>;
  if (state === "error") return <div className="widget-shell renderer-state" role="alert"><AlertTriangle /><h2>Provider unavailable</h2><p>The renderer is healthy, but the data provider returned an error.</p></div>;
  return <>{children}</>;
}

function SourceLine({ provider, updatedAt }: { provider: string; updatedAt: string }) {
  return <footer className="source-line"><span className="fixture-dot" /> {provider}<span>Updated {updatedAt}</span></footer>;
}

function WeatherWidget({ envelope }: { envelope: Extract<KnownRenderEnvelope, { type: "widget.weather" }> }) {
  const data = envelope.payload;
  return <div className="weather-widget widget-shell" data-testid="weather-widget">
    <div className="weather-hero"><div><p className="eyebrow">{data.location}</p><div className="temperature">{data.temperature}°<span>{data.unit}</span></div><p className="condition"><CloudSun /> {data.condition}</p></div><div className="weather-orb"><CloudSun /></div></div>
    <div className="weather-stats"><div><span><CloudSun /> Feels like</span><strong>{data.feelsLike}°</strong></div><div><span><Droplets /> Humidity</span><strong>{data.humidity}%</strong></div><div><span><Wind /> Wind</span><strong>{data.windSpeed} km/h</strong></div><div><span>Rain</span><strong>{data.precipitationProbability}%</strong></div>{data.airQualityIndex !== undefined ? <div><span>Air quality</span><strong>AQI {data.airQualityIndex}</strong></div> : null}</div>
    <div className="hourly-strip" aria-label="Hourly forecast">{data.hourly.map((hour) => <div key={hour.time}><span>{hour.time}</span><CloudSun /><strong>{hour.temperature}°</strong><small>{hour.precipitationProbability}%</small></div>)}</div>
    <div className="daily-list" aria-label="Daily forecast">{data.daily.map((day) => <div key={day.date}><strong>{day.date}</strong><span><CloudSun /> {day.condition}</span><small>{day.precipitationProbability}% rain</small><b>{day.high}° <i>{day.low}°</i></b></div>)}</div>
    <SourceLine provider={data.provider} updatedAt={data.updatedAt} />
  </div>;
}

function StockSparkline({ values, positive }: { values: number[]; positive: boolean }) {
  const width = 640, height = 180;
  const min = Math.min(...values), max = Math.max(...values);
  const points = values.map((value, index) => `${(index / Math.max(1, values.length - 1)) * width},${height - ((value - min) / Math.max(1, max - min)) * (height - 16) - 8}`).join(" ");
  const fillPoints = `0,${height} ${points} ${width},${height}`;
  return <svg className="stock-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Stock price trend"><defs><linearGradient id="stock-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={positive ? "#34d399" : "#fb7185"} stopOpacity=".32"/><stop offset="1" stopColor={positive ? "#34d399" : "#fb7185"} stopOpacity="0"/></linearGradient></defs><polygon points={fillPoints} fill="url(#stock-fill)"/><polyline points={points} fill="none" stroke={positive ? "#34d399" : "#fb7185"} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}

function StockWidget({ envelope }: { envelope: Extract<KnownRenderEnvelope, { type: "widget.stock" }> }) {
  const [range, setRange] = useState(envelope.payload.range);
  const data = envelope.payload;
  const positive = data.change >= 0;
  const values = data.series.map((point) => point.close);
  return <div className="stock-widget widget-shell" data-testid="stock-widget">
    <header className="stock-header"><div><span className="ticker">{data.symbol}</span><h2>{data.name}</h2><p><span className="market-dot" /> Market {data.marketStatus}</p></div><div className="stock-price"><strong>{data.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong><span>{data.currency}</span><p className={positive ? "positive" : "negative"}>{positive ? <TrendingUp /> : <TrendingDown />}{positive ? "+" : ""}{data.change.toFixed(2)} ({positive ? "+" : ""}{data.changePercent.toFixed(2)}%)</p></div></header>
    <div className="range-tabs" aria-label="Stock chart range">{(["1D", "1W", "1M", "3M", "1Y"] as const).map((value) => <button className={range === value ? "active" : ""} type="button" key={value} onClick={() => setRange(value)}>{value}</button>)}</div>
    <StockSparkline values={values} positive={positive} />
    <div className="stock-axis"><span>{data.series[0]?.time}</span><span>{range} synthetic trend</span><span>{data.series.at(-1)?.time}</span></div>
    <div className="metric-grid stock-metrics">{Object.entries(data.metrics).map(([label, value]) => <div key={label}><span>{label}</span><strong>{String(value)}</strong></div>)}</div>
    <SourceLine provider={data.provider} updatedAt={data.updatedAt} />
  </div>;
}

function SportsWidget({ envelope }: { envelope: Extract<KnownRenderEnvelope, { type: "widget.sports" }> }) {
  const data = envelope.payload;
  return <div className="widget-shell sports-widget"><header className="widget-heading"><div><p className="eyebrow">{data.league}</p><h2>Scores & fixtures</h2></div><Trophy /></header><div className="game-list">{data.games.map((game) => <article key={game.id}><span>{game.status}</span><div><b>{game.home}</b><strong>{game.homeScore ?? "—"}</strong></div><div><b>{game.away}</b><strong>{game.awayScore ?? "—"}</strong></div><time>{game.startsAt}</time></article>)}</div><h3>Standings</h3><div className="standing-list">{data.standings.map((team, index) => <div key={team.team}><span>{index + 1}</span><b>{team.team}</b><small>{team.played} played</small><strong>{team.points} pts</strong></div>)}</div><SourceLine provider={data.provider} updatedAt={data.updatedAt} /></div>;
}

function TravelWidget({ envelope }: { envelope: Extract<KnownRenderEnvelope, { type: "widget.travel" }> }) {
  const data = envelope.payload;
  return <div className="widget-shell travel-widget"><header className="widget-heading"><div><p className="eyebrow">Trip comparison</p><h2>{data.origin} <span>→</span> {data.destination}</h2><p>{data.startDate} – {data.endDate}</p></div><Plane /></header><div className="travel-options">{data.options.map((option) => <article key={option.id}><span className="kind-pill">{option.kind}</span><h3>{option.title}</h3><strong>{option.currency} {option.price.toLocaleString()}</strong><ul>{option.details.map((detail) => <li key={detail}>{detail}</li>)}</ul><div>{option.amenities.map((amenity) => <span key={amenity}>{amenity}</span>)}</div><button className="button secondary" type="button"><MapPin /> View route</button></article>)}</div></div>;
}

function ProductWidget({ envelope }: { envelope: Extract<KnownRenderEnvelope, { type: "widget.product" }> }) {
  return <div className="widget-shell product-widget"><header className="widget-heading"><div><p className="eyebrow">Structured comparison</p><h2>Products</h2></div><ShoppingBag /></header><div className="product-grid">{envelope.payload.products.map((product) => <article key={product.id}>{product.imageUrl ? <img src={product.imageUrl} alt="" /> : <div className="product-placeholder"><ShoppingBag /></div>}<h3>{product.name}</h3><div className="rating"><Star /> {product.rating.toFixed(1)}</div><strong>{product.currency} {product.price.toLocaleString()}</strong>{product.originalPrice ? <del>{product.currency} {product.originalPrice.toLocaleString()}</del> : null}<p>{product.stock ? `${product.stock} in stock` : "Out of stock"} · {product.merchant}</p><dl>{Object.entries(product.specs).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></article>)}</div></div>;
}

function ConfirmDialog({ action, onCancel, onConfirm }: { action: string; onCancel: () => void; onConfirm: () => void }) {
  return <div className="confirm-backdrop" role="presentation"><div className="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title"><AlertTriangle /><p className="eyebrow">Confirmation required</p><h2 id="confirm-title">{action}</h2><p>This demo does not perform an external write. Confirming emits a local component event only.</p><div className="button-row"><button className="button secondary" type="button" onClick={onCancel}><X /> Cancel</button><button className="button primary" type="button" onClick={onConfirm}><Check /> Confirm locally</button></div></div></div>;
}

function CalendarWidget({ envelope, onEvent }: { envelope: Extract<KnownRenderEnvelope, { type: "widget.calendar" }>; onEvent?: RendererComponentProps["onEvent"] }) {
  const [pending, setPending] = useState<string>();
  const [response, setResponse] = useState(envelope.payload.response);
  const data = envelope.payload;
  return <div className="widget-shell calendar-widget"><header className="widget-heading"><div><p className="eyebrow">Calendar event</p><h2>{data.title}</h2></div><CalendarDays /></header><div className="calendar-time"><Clock3 /><div><strong>{data.start}</strong><span>to {data.end} · {data.timezone}</span></div></div>{data.location ? <p><MapPin /> {data.location}</p> : null}<p>{data.description}</p><div className="attendees"><Users /> {data.attendees.join(", ")}</div><div className="response-actions">{(["accepted", "tentative", "declined"] as const).map((action) => <button className={response === action ? "active" : ""} type="button" key={action} onClick={() => setPending(`Respond “${action}” to ${data.title}`)}>{action}</button>)}</div>{pending ? <ConfirmDialog action={pending} onCancel={() => setPending(undefined)} onConfirm={() => { const next = pending.includes("accepted") ? "accepted" : pending.includes("tentative") ? "tentative" : "declined"; setResponse(next); onEvent?.({ type: "widget.action", renderer: "widget.calendar", action: next, payload: { eventId: data.eventId } }); setPending(undefined); }} /> : null}</div>;
}

function EmailWidget({ envelope, onEvent }: { envelope: Extract<KnownRenderEnvelope, { type: "widget.email" }>; onEvent?: RendererComponentProps["onEvent"] }) {
  const [pending, setPending] = useState<string>(); const [notice, setNotice] = useState<string>(); const data = envelope.payload;
  return <div className="widget-shell email-widget"><header className="email-header"><div className="avatar">{data.from[0]?.toUpperCase()}</div><div><p className="eyebrow">From {data.from}</p><h2>{data.subject}</h2><span>To {data.to.join(", ")}</span></div><Mail /></header><p className="email-summary">{data.summary}</p><div className="email-body">{data.body}</div>{data.attachments.length ? <div className="attachment-list">{data.attachments.map((attachment) => <span key={attachment.name}><PackageCheck /> {attachment.name} · {Math.round(attachment.size / 1_000)} KB</span>)}</div> : null}<div className="button-row"><button className="button secondary" type="button" onClick={() => setPending("Reply to this email")}><Reply /> Reply</button><button className="button secondary" type="button" onClick={() => setPending("Forward this email")}><Forward /> Forward</button><button className="button secondary" type="button" onClick={() => setPending("Archive this email")}><PackageCheck /> Archive</button></div>{notice ? <div className="success-banner"><Check /> {notice}</div> : null}{pending ? <ConfirmDialog action={pending} onCancel={() => setPending(undefined)} onConfirm={() => { onEvent?.({ type: "widget.action", renderer: "widget.email", action: pending.toLowerCase().split(" ")[0], payload: { messageId: data.messageId } }); setNotice(`${pending} emitted as a local demo event.`); setPending(undefined); }} /> : null}</div>;
}

function LogisticsWidget({ envelope }: { envelope: Extract<KnownRenderEnvelope, { type: "widget.logistics" }> }) {
  const data = envelope.payload; return <div className="widget-shell logistics-widget"><header className="widget-heading"><div><p className="eyebrow">{data.carrier} · {data.trackingNumber}</p><h2>{data.status.replaceAll("-", " ")}</h2><p><MapPin /> {data.currentLocation}</p></div><PackageCheck /></header><div className="logistics-timeline">{data.events.map((event, index) => <div key={`${event.time}-${index}`}><span className={index === 0 ? "active" : ""} /><div><strong>{event.status}</strong><p>{event.description}</p><small>{event.location} · {event.time}</small></div></div>)}</div><SourceLine provider={data.carrier} updatedAt={data.updatedAt} /></div>;
}

export default function WidgetRenderer({ envelope, onEvent }: RendererComponentProps) {
  if (!envelope.type.startsWith("widget.")) throw new Error("Widget renderer received an incompatible envelope");
  let widget: ReactNode;
  switch (envelope.type) {
    case "widget.weather": widget = <WeatherWidget envelope={envelope as Extract<KnownRenderEnvelope, { type: "widget.weather" }>} />; break;
    case "widget.stock": widget = <StockWidget envelope={envelope as Extract<KnownRenderEnvelope, { type: "widget.stock" }>} />; break;
    case "widget.sports": widget = <SportsWidget envelope={envelope as Extract<KnownRenderEnvelope, { type: "widget.sports" }>} />; break;
    case "widget.travel": widget = <TravelWidget envelope={envelope as Extract<KnownRenderEnvelope, { type: "widget.travel" }>} />; break;
    case "widget.product": widget = <ProductWidget envelope={envelope as Extract<KnownRenderEnvelope, { type: "widget.product" }>} />; break;
    case "widget.calendar": widget = <CalendarWidget envelope={envelope as Extract<KnownRenderEnvelope, { type: "widget.calendar" }>} onEvent={onEvent} />; break;
    case "widget.email": widget = <EmailWidget envelope={envelope as Extract<KnownRenderEnvelope, { type: "widget.email" }>} onEvent={onEvent} />; break;
    case "widget.logistics": widget = <LogisticsWidget envelope={envelope as Extract<KnownRenderEnvelope, { type: "widget.logistics" }>} />; break;
    default: throw new Error(`No widget implementation for ${envelope.type}`);
  }
  return <WidgetState envelope={envelope as WidgetEnvelope}>{widget}</WidgetState>;
}

