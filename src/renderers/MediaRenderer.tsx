"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import DOMPurify from "dompurify";
import {
  Captions,
  Download,
  Gauge,
  ImageOff,
  Maximize2,
  Mic2,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  SkipBack,
  Volume2,
  Waves,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import type { RendererComponentProps } from "@/src/core";
import type { KnownRenderEnvelope } from "@/src/schema";
import { validateUrl } from "@/src/security";

type MediaEnvelope = Extract<
  KnownRenderEnvelope,
  {
    type: "media.image" | "media.audio" | "media.video" | "audio.pronunciation";
  }
>;
type DataSource = Extract<
  KnownRenderEnvelope,
  { type: "media.image" }
>["payload"]["source"];

function sourceUrl(source: DataSource): string {
  if (source.url) return source.url;
  if (source.dataUrl) return source.dataUrl;
  return source.base64
    ? `data:${source.mimeType ?? "application/octet-stream"};base64,${source.base64}`
    : "";
}

function useSafeImageSource(source: DataSource) {
  const [safe, setSafe] = useState<string>();
  const [error, setError] = useState<string>();
  useEffect(() => {
    let active = true;
    let objectUrl: string | undefined;
    const raw = sourceUrl(source);
    const checked = validateUrl(raw, { allowData: true, allowBlob: true });
    if (!checked.ok) {
      setError(checked.reason);
      return;
    }
    if (
      source.mimeType === "image/svg+xml" ||
      raw.toLowerCase().endsWith(".svg")
    ) {
      void fetch(checked.url)
        .then((response) => {
          if (!response.ok)
            throw new Error(`Image request failed (${response.status})`);
          return response.text();
        })
        .then((svg) => {
          const clean = DOMPurify.sanitize(svg, {
            USE_PROFILES: { svg: true, svgFilters: true },
            FORBID_TAGS: ["script", "foreignObject"],
          });
          objectUrl = URL.createObjectURL(
            new Blob([clean], { type: "image/svg+xml" }),
          );
          if (active) setSafe(objectUrl);
        })
        .catch(
          (cause) =>
            active &&
            setError(
              cause instanceof Error
                ? cause.message
                : "SVG could not be sanitized",
            ),
        );
    } else {
      setSafe(checked.url);
    }
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [source]);
  return { safe, error };
}

function ImageView({
  envelope,
}: {
  envelope: Extract<KnownRenderEnvelope, { type: "media.image" }>;
}) {
  const primary = useSafeImageSource(envelope.payload.source);
  const comparison = useSafeImageSource(
    envelope.payload.comparisonSource ?? envelope.payload.source,
  );
  const [split, setSplit] = useState(52);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [loadError, setLoadError] = useState<string>();
  const frameRef = useRef<HTMLDivElement>(null);
  const hasComparison = Boolean(envelope.payload.comparisonSource);
  if (primary.error || loadError)
    return (
      <div className="renderer-state" role="alert">
        <ImageOff />
        <h2>Image could not load</h2>
        <p>{primary.error ?? loadError}</p>
      </div>
    );
  return (
    <section className="image-renderer" data-testid="image-renderer">
      <div className="renderer-toolbar">
        <span className="toolbar-note">
          {envelope.payload.width ?? "?"} × {envelope.payload.height ?? "?"} ·{" "}
          {envelope.payload.source.mimeType ?? "image"}
        </span>
        <button
          className="icon-button compact"
          type="button"
          aria-label="Zoom out"
          onClick={() => setZoom((value) => Math.max(0.25, value - 0.25))}
        >
          <ZoomOut />
        </button>
        <output>{Math.round(zoom * 100)}%</output>
        <button
          className="icon-button compact"
          type="button"
          aria-label="Zoom in"
          onClick={() => setZoom((value) => Math.min(4, value + 0.25))}
        >
          <ZoomIn />
        </button>
        <button
          className="icon-button"
          type="button"
          onClick={() => setRotation((value) => value + 90)}
        >
          <RotateCw /> Rotate
        </button>
        <a
          className="icon-button"
          href={primary.safe}
          download={envelope.payload.source.fileName}
        >
          <Download /> Download
        </a>
        <button
          className="icon-button"
          type="button"
          onClick={() => frameRef.current?.requestFullscreen()}
        >
          <Maximize2 /> Fullscreen
        </button>
      </div>
      <div className="image-stage" ref={frameRef}>
        {primary.safe ? (
          <div
            className="image-transform"
            style={{ transform: `scale(${zoom}) rotate(${rotation}deg)` }}
          >
            {hasComparison && comparison.safe ? (
              <div className="image-compare">
                <img
                  src={comparison.safe}
                  alt={envelope.payload.alt}
                  onError={() =>
                    setLoadError("Comparison image failed to load")
                  }
                />
                <div
                  className="image-before"
                  style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }}
                >
                  <img
                    src={primary.safe}
                    alt={envelope.payload.alt}
                    onError={() => setLoadError("Primary image failed to load")}
                  />
                </div>
                <span className="compare-line" style={{ left: `${split}%` }} />
              </div>
            ) : (
              <img
                src={primary.safe}
                alt={envelope.payload.alt}
                onError={() => setLoadError("Image failed to load")}
              />
            )}
            {envelope.payload.overlays?.map((overlay) => (
              <span
                className="image-overlay"
                key={overlay.id}
                style={{
                  left: `${overlay.x * 100}%`,
                  top: `${overlay.y * 100}%`,
                  width: overlay.width ? `${overlay.width * 100}%` : undefined,
                  height: overlay.height
                    ? `${overlay.height * 100}%`
                    : undefined,
                  borderColor: overlay.color,
                }}
              >
                <b>{overlay.label}</b>
              </span>
            ))}
          </div>
        ) : (
          <div className="inline-loader">Sanitizing image…</div>
        )}
      </div>
      {hasComparison ? (
        <label className="compare-slider">
          <span>Before</span>
          <input
            aria-label="Image comparison position"
            type="range"
            min="0"
            max="100"
            value={split}
            onChange={(event) => setSplit(Number(event.target.value))}
          />
          <span>After</span>
        </label>
      ) : null}
    </section>
  );
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds)) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.floor(seconds % 60);
  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
}

function AudioView({
  envelope,
}: {
  envelope: Extract<KnownRenderEnvelope, { type: "media.audio" }>;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const waveRef = useRef<HTMLDivElement>(null);
  const waveSurferRef = useRef<import("wavesurfer.js").default | null>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [volume, setVolume] = useState(0.8);
  const [error, setError] = useState<string>();
  const url = sourceUrl(envelope.payload.source);
  useEffect(() => {
    if (!envelope.payload.waveform || !waveRef.current) return;
    let active = true;
    void import("wavesurfer.js").then(({ default: WaveSurfer }) => {
      if (!active || !waveRef.current) return;
      const wave = WaveSurfer.create({
        container: waveRef.current,
        url,
        height: 74,
        waveColor: "#54617d",
        progressColor: "#6f98ff",
        cursorColor: "#b9c9ff",
        barWidth: 2,
        barGap: 2,
        barRadius: 2,
        normalize: true,
      });
      waveSurferRef.current = wave;
      wave.on("error", (cause) => setError(cause.message));
      wave.on("timeupdate", setCurrent);
      wave.on("ready", setDuration);
      wave.on("play", () => setPlaying(true));
      wave.on("pause", () => setPlaying(false));
    });
    return () => {
      active = false;
      waveSurferRef.current?.destroy();
      waveSurferRef.current = null;
    };
  }, [envelope.payload.waveform, url]);
  const control = (action: "play" | "pause") => {
    const wave = waveSurferRef.current;
    if (wave) {
      void (action === "play" ? wave.play() : Promise.resolve(wave.pause()));
      return;
    }
    const audio = audioRef.current;
    if (audio)
      void (action === "play" ? audio.play() : Promise.resolve(audio.pause()));
  };
  const seek = (time: number) => {
    if (waveSurferRef.current && duration)
      waveSurferRef.current.seekTo(time / duration);
    if (audioRef.current) audioRef.current.currentTime = time;
    setCurrent(time);
  };
  useEffect(() => {
    if (waveSurferRef.current) {
      waveSurferRef.current.setPlaybackRate(speed);
      waveSurferRef.current.setVolume(volume);
    }
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
      audioRef.current.volume = volume;
    }
  }, [speed, volume]);
  return (
    <section className="audio-renderer" data-testid="audio-renderer">
      <header className="media-heading">
        <div className="audio-icon">
          <Waves />
        </div>
        <div>
          <p className="eyebrow">
            Audio · {envelope.payload.source.mimeType ?? "browser format"}
          </p>
          <h2>
            {envelope.payload.title ??
              envelope.payload.source.fileName ??
              "Audio"}
          </h2>
        </div>
      </header>
      {error ? (
        <div className="inline-error" role="alert">
          Waveform unavailable: {error}. Native audio remains available.
        </div>
      ) : null}
      <div ref={waveRef} className="waveform" />
      {!envelope.payload.waveform || error ? (
        <audio
          ref={audioRef}
          src={url}
          controls
          onTimeUpdate={(event) => setCurrent(event.currentTarget.currentTime)}
          onDurationChange={(event) =>
            setDuration(event.currentTarget.duration)
          }
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onError={() => setError("Browser could not decode this audio format")}
        />
      ) : (
        <audio ref={audioRef} src={url} hidden />
      )}
      <div className="audio-controls">
        <button
          className="round-control"
          type="button"
          aria-label="Replay"
          onClick={() => seek(0)}
        >
          <SkipBack />
        </button>
        <button
          className="play-control"
          type="button"
          aria-label={playing ? "Pause" : "Play"}
          onClick={() => control(playing ? "pause" : "play")}
        >
          {playing ? <Pause /> : <Play />}
        </button>
        <span>
          {formatTime(current)} / {formatTime(duration)}
        </span>
        <label>
          <Volume2 />
          <span className="sr-only">Volume</span>
          <input
            type="range"
            min="0"
            max="1"
            step=".05"
            value={volume}
            onChange={(event) => setVolume(Number(event.target.value))}
          />
        </label>
        <label>
          <Gauge />
          <span className="sr-only">Playback speed</span>
          <select
            value={speed}
            onChange={(event) => setSpeed(Number(event.target.value))}
          >
            <option value=".75">0.75×</option>
            <option value="1">1×</option>
            <option value="1.25">1.25×</option>
            <option value="1.5">1.5×</option>
            <option value="2">2×</option>
          </select>
        </label>
        <a
          className="icon-button"
          href={url}
          download={envelope.payload.source.fileName}
        >
          <Download /> Download
        </a>
      </div>
      {envelope.payload.regions?.length ? (
        <div className="audio-regions">
          {envelope.payload.regions.map((region) => (
            <button
              type="button"
              key={region.id}
              onClick={() => seek(region.start)}
            >
              <span style={{ background: region.color }} />
              {region.label ?? "Region"}
              <small>
                {formatTime(region.start)}–{formatTime(region.end)}
              </small>
            </button>
          ))}
        </div>
      ) : null}
      {envelope.payload.transcript?.length ? (
        <div className="transcript">
          <h3>
            <Captions /> Transcript
          </h3>
          {envelope.payload.transcript.map((cue) => (
            <button
              className={
                current >= cue.start && current <= cue.end ? "active" : ""
              }
              type="button"
              key={cue.id}
              onClick={() => seek(cue.start)}
            >
              <time>{formatTime(cue.start)}</time>
              <span>
                {cue.speaker ? <b>{cue.speaker}: </b> : null}
                {cue.text}
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function PronunciationView({
  envelope,
}: {
  envelope: Extract<KnownRenderEnvelope, { type: "audio.pronunciation" }>;
}) {
  const [accent, setAccent] = useState(envelope.payload.accent);
  const [speed, setSpeed] = useState(envelope.payload.speed);
  const [speaking, setSpeaking] = useState<string>();
  const [error, setError] = useState<string>();
  const [generation, setGeneration] = useState(0);
  const speak = (text: string, label: string) => {
    if (!("speechSynthesis" in window)) {
      setError("Browser SpeechSynthesis is unavailable");
      return;
    }
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = accent === "us" ? "en-US" : "en-GB";
    utterance.rate = speed;
    utterance.onstart = () => setSpeaking(label);
    utterance.onend = () => setSpeaking(undefined);
    utterance.onerror = (event) => {
      setSpeaking(undefined);
      setError(`Speech synthesis failed: ${event.error}`);
    };
    speechSynthesis.speak(utterance);
  };
  useEffect(() => () => speechSynthesis.cancel(), []);
  return (
    <section
      className="pronunciation-renderer"
      data-testid="pronunciation-renderer"
    >
      <div className="pronunciation-hero">
        <div>
          <p className="eyebrow">{envelope.payload.language} pronunciation</p>
          <h1>{envelope.payload.word}</h1>
          <div className="syllables">
            {envelope.payload.syllables.map((syllable, index) => (
              <span
                className={
                  index === envelope.payload.stressIndex ? "stress" : ""
                }
                key={`${syllable}-${index}`}
              >
                {syllable}
              </span>
            ))}
          </div>
        </div>
        <button
          className={`pronounce-main ${speaking === "word" ? "speaking" : ""}`}
          type="button"
          aria-label={`Pronounce ${envelope.payload.word}`}
          onClick={() => speak(envelope.payload.word, "word")}
        >
          <Mic2 />
        </button>
      </div>
      <div className="ipa-grid">
        <div>
          <span>American</span>
          <strong>{envelope.payload.ipaUS}</strong>
        </div>
        <div>
          <span>British</span>
          <strong>{envelope.payload.ipaUK}</strong>
        </div>
      </div>
      <p className="definition">{envelope.payload.definition}</p>
      <div className="example">
        <p>“{envelope.payload.example}”</p>
        <button
          className="icon-button"
          type="button"
          onClick={() => speak(envelope.payload.example, "example")}
        >
          {speaking === "example" ? <Pause /> : <Play />} Example
        </button>
      </div>
      <div className="pronunciation-settings">
        <label>
          Accent
          <select
            value={accent}
            onChange={(event) => setAccent(event.target.value as "us" | "uk")}
          >
            <option value="us">American</option>
            <option value="uk">British</option>
          </select>
        </label>
        <label>
          Speed
          <select
            value={speed}
            onChange={(event) => setSpeed(Number(event.target.value))}
          >
            <option value=".6">Slow · 0.6×</option>
            <option value=".8">Clear · 0.8×</option>
            <option value="1">Natural · 1×</option>
            <option value="1.25">Fast · 1.25×</option>
          </select>
        </label>
        <button
          className="button secondary"
          type="button"
          onClick={() => {
            speechSynthesis.cancel();
            setGeneration((value) => value + 1);
            setError(undefined);
          }}
        >
          <RotateCcw /> Regenerate #{generation + 1}
        </button>
      </div>
      {error ? (
        <div className="inline-error" role="alert">
          {error}
        </div>
      ) : null}
      <footer className="source-line">
        <span className="fixture-dot" /> {envelope.payload.ttsProvider}
        <span>No audio leaves this browser</span>
      </footer>
    </section>
  );
}

function VideoView({
  envelope,
}: {
  envelope: Extract<KnownRenderEnvelope, { type: "media.video" }>;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [current, setCurrent] = useState(0);
  const [error, setError] = useState<string>();
  const url = sourceUrl(envelope.payload.source);
  return (
    <section className="video-renderer" data-testid="video-renderer">
      <div className="video-frame">
        {error ? (
          <div className="renderer-state" role="alert">
            <AlertTriangleIcon />
            <h2>Video could not load</h2>
            <p>{error}</p>
          </div>
        ) : (
          <video
            ref={videoRef}
            src={url}
            poster={envelope.payload.poster}
            controls
            playsInline
            onTimeUpdate={(event) =>
              setCurrent(event.currentTarget.currentTime)
            }
            onError={() =>
              setError(
                "The browser could not decode this video. Download the source or use the transcript fallback.",
              )
            }
          />
        )}
      </div>
      <div className="renderer-toolbar">
        <a
          className="icon-button"
          href={url}
          download={envelope.payload.source.fileName}
        >
          <Download /> Download
        </a>
        <button
          className="icon-button"
          type="button"
          onClick={() => videoRef.current?.requestFullscreen()}
        >
          <Maximize2 /> Fullscreen
        </button>
      </div>
      {envelope.payload.chapters?.length ? (
        <div className="chapter-strip">
          {envelope.payload.chapters.map((chapter) => (
            <button
              className={
                current >= chapter.start && current <= chapter.end
                  ? "active"
                  : ""
              }
              type="button"
              key={chapter.id}
              onClick={() => {
                if (videoRef.current)
                  videoRef.current.currentTime = chapter.start;
              }}
            >
              <time>{formatTime(chapter.start)}</time>
              {chapter.text}
            </button>
          ))}
        </div>
      ) : null}
      {envelope.payload.transcript?.length ? (
        <div className="transcript">
          <h3>
            <Captions /> Transcript
          </h3>
          {envelope.payload.transcript.map((cue) => (
            <button
              className={
                current >= cue.start && current <= cue.end ? "active" : ""
              }
              type="button"
              key={cue.id}
              onClick={() => {
                if (videoRef.current) videoRef.current.currentTime = cue.start;
              }}
            >
              <time>{formatTime(cue.start)}</time>
              <span>{cue.text}</span>
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function AlertTriangleIcon() {
  return <ImageOff aria-hidden="true" />;
}

export default function MediaRenderer({ envelope }: RendererComponentProps) {
  if (envelope.type === "media.image")
    return (
      <ImageView
        envelope={
          envelope as Extract<KnownRenderEnvelope, { type: "media.image" }>
        }
      />
    );
  if (envelope.type === "media.audio")
    return (
      <AudioView
        envelope={
          envelope as Extract<KnownRenderEnvelope, { type: "media.audio" }>
        }
      />
    );
  if (envelope.type === "audio.pronunciation")
    return (
      <PronunciationView
        envelope={
          envelope as Extract<
            KnownRenderEnvelope,
            { type: "audio.pronunciation" }
          >
        }
      />
    );
  if (envelope.type === "media.video")
    return (
      <VideoView
        envelope={
          envelope as Extract<KnownRenderEnvelope, { type: "media.video" }>
        }
      />
    );
  throw new Error("Media renderer received an incompatible envelope");
}
