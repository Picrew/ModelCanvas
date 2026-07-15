"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Layers3,
  LoaderCircle,
  Map,
  Maximize2,
  RotateCcw,
  ScanLine,
  TriangleAlert,
} from "lucide-react";
import type { RendererComponentProps } from "@/src/core";
import type { JsonValue, KnownRenderEnvelope } from "@/src/schema";

type MapEnvelope = Extract<
  KnownRenderEnvelope,
  {
    type: "map.geo" | "map.places" | "map.route" | "map.heatmap" | "map.track";
  }
>;
type ModelEnvelope = Extract<KnownRenderEnvelope, { type: "model.3d" }>;

function mapPresentation(envelope: MapEnvelope): {
  data: GeoJSON.FeatureCollection;
  label: string;
  summary: string;
  heatmap: boolean;
  heatmapRadius?: number;
} {
  if (envelope.type === "map.geo")
    return {
      data: envelope.payload.geojson as GeoJSON.FeatureCollection,
      label: "GeoJSON map",
      summary: `${envelope.payload.geojson.features.length} features`,
      heatmap: false,
    };
  if (envelope.type === "map.places")
    return {
      data: {
        type: "FeatureCollection",
        features: envelope.payload.places.map((place) => ({
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [place.location.longitude, place.location.latitude],
          },
          properties: {
            name: place.name,
            category: place.category,
            address: place.address ?? "",
            rating: place.rating ?? null,
          },
        })),
      },
      label: "Places",
      summary: `${envelope.payload.places.length} geocoded places`,
      heatmap: false,
    };
  if (envelope.type === "map.route") {
    const waypointFeatures = envelope.payload.waypoints.map((point) => ({
      type: "Feature" as const,
      geometry: {
        type: "Point" as const,
        coordinates: [point.longitude, point.latitude],
      },
      properties: { name: point.label ?? "Waypoint" },
    }));
    return {
      data: {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            geometry: {
              type: "LineString",
              coordinates: envelope.payload.path.map((point) => [
                point.longitude,
                point.latitude,
              ]),
            },
            properties: { name: `${envelope.payload.mode} route` },
          },
          ...waypointFeatures,
        ],
      },
      label: "Route",
      summary: `${envelope.payload.distanceKm} km · ${envelope.payload.durationMinutes} min · ${envelope.payload.mode}`,
      heatmap: false,
    };
  }
  if (envelope.type === "map.heatmap")
    return {
      data: {
        type: "FeatureCollection",
        features: envelope.payload.points.map((point) => ({
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [point.longitude, point.latitude],
          },
          properties: {
            name: point.label ?? envelope.payload.metric,
            weight: point.intensity,
          },
        })),
      },
      label: "Heatmap",
      summary: `${envelope.payload.points.length} samples · ${envelope.payload.metric}`,
      heatmap: true,
      heatmapRadius: envelope.payload.radius,
    };
  return {
    data: {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: envelope.payload.samples.map((point) => [
              point.longitude,
              point.latitude,
            ]),
          },
          properties: { name: `${envelope.payload.activity} track` },
        },
        ...[envelope.payload.samples[0], envelope.payload.samples.at(-1)].map(
          (point, index) => ({
            type: "Feature" as const,
            geometry: {
              type: "Point" as const,
              coordinates: [point!.longitude, point!.latitude],
            },
            properties: { name: index ? "Finish" : "Start" },
          }),
        ),
      ],
    },
    label: "Activity track",
    summary: `${envelope.payload.distanceKm} km · ${envelope.payload.durationMinutes} min · ${envelope.payload.activity}`,
    heatmap: false,
  };
}

function collectCoordinates(
  value: JsonValue,
  result: Array<[number, number]> = [],
): Array<[number, number]> {
  if (Array.isArray(value)) {
    if (
      value.length >= 2 &&
      typeof value[0] === "number" &&
      typeof value[1] === "number"
    )
      result.push([value[0], value[1]]);
    else value.forEach((child) => collectCoordinates(child, result));
  }
  return result;
}

function MapView({ envelope }: { envelope: MapEnvelope }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("maplibre-gl").Map | null>(null);
  const [error, setError] = useState<string>();
  const [layers, setLayers] = useState({
    points: envelope.type !== "map.heatmap",
    lines: true,
    polygons: true,
    heatmap: true,
  });
  const presentation = useMemo(() => mapPresentation(envelope), [envelope]);
  useEffect(() => {
    let active = true;
    void import("maplibre-gl").then(({ default: maplibregl }) => {
      if (!active || !containerRef.current) return;
      try {
        const map = new maplibregl.Map({
          container: containerRef.current,
          center: [116.397, 39.92],
          zoom: 11.5,
          attributionControl: false,
          style: {
            version: 8,
            sources: {},
            layers: [
              {
                id: "background",
                type: "background",
                paint: {
                  "background-color":
                    document.documentElement.dataset.theme === "dark"
                      ? "#0c1426"
                      : "#eef3fb",
                },
              },
            ],
          },
        });
        mapRef.current = map;
        map.addControl(
          new maplibregl.NavigationControl({ visualizePitch: true }),
          "top-right",
        );
        map.addControl(
          new maplibregl.AttributionControl({
            compact: true,
            customAttribution: "Offline GeoJSON fixture",
          }),
        );
        map.on("load", () => {
          map.addSource("modelcanvas", {
            type: "geojson",
            data: presentation.data,
          });
          map.addLayer({
            id: "polygons",
            type: "fill",
            source: "modelcanvas",
            filter: ["==", ["geometry-type"], "Polygon"],
            paint: {
              "fill-color": "#6f98ff",
              "fill-opacity": 0.2,
              "fill-outline-color": "#6f98ff",
            },
          });
          if (presentation.heatmap)
            map.addLayer({
              id: "heatmap",
              type: "heatmap",
              source: "modelcanvas",
              paint: {
                "heatmap-weight": ["coalesce", ["get", "weight"], 0],
                "heatmap-intensity": 1.25,
                "heatmap-radius": presentation.heatmapRadius ?? 28,
                "heatmap-opacity": 0.82,
                "heatmap-color": [
                  "interpolate",
                  ["linear"],
                  ["heatmap-density"],
                  0,
                  "rgba(91,121,234,0)",
                  0.25,
                  "#6f98ff",
                  0.55,
                  "#43b88a",
                  0.8,
                  "#f0b44d",
                  1,
                  "#dc4c64",
                ],
              },
            });
          map.addLayer({
            id: "lines",
            type: "line",
            source: "modelcanvas",
            filter: ["==", ["geometry-type"], "LineString"],
            paint: {
              "line-color": "#5b8cff",
              "line-width": 5,
              "line-opacity": 0.9,
            },
          });
          map.addLayer({
            id: "points",
            type: "circle",
            source: "modelcanvas",
            filter: ["==", ["geometry-type"], "Point"],
            layout: {
              visibility: presentation.heatmap ? "none" : "visible",
            },
            paint: {
              "circle-radius": 9,
              "circle-color": "#f59e0b",
              "circle-stroke-width": 3,
              "circle-stroke-color": "#fff",
            },
          });
          for (const layer of ["points", "lines", "polygons"])
            map.on("click", layer, (event) => {
              const feature = event.features?.[0];
              if (!feature) return;
              new maplibregl.Popup({ closeButton: true })
                .setLngLat(event.lngLat)
                .setHTML(
                  `<strong>${String(feature.properties?.name ?? "GeoJSON feature")}</strong>`,
                )
                .addTo(map);
            });
          const coordinates = presentation.data.features.flatMap((feature) =>
            "coordinates" in feature.geometry
              ? collectCoordinates(feature.geometry.coordinates as JsonValue)
              : [],
          );
          if (coordinates.length) {
            const bounds = coordinates.reduce(
              (box, coordinate) => box.extend(coordinate),
              new maplibregl.LngLatBounds(coordinates[0], coordinates[0]),
            );
            map.fitBounds(bounds, { padding: 60, maxZoom: 14 });
          }
        });
      } catch (cause) {
        setError(
          cause instanceof Error ? cause.message : "Map failed to initialize",
        );
      }
    });
    return () => {
      active = false;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [envelope, presentation]);
  useEffect(() => {
    const map = mapRef.current;
    if (!map?.loaded()) return;
    Object.entries(layers).forEach(([id, visible]) => {
      if (map.getLayer(id))
        map.setLayoutProperty(id, "visibility", visible ? "visible" : "none");
    });
  }, [layers]);
  return (
    <section className="map-renderer" data-testid="map-renderer">
      <div className="renderer-toolbar">
        <span className="toolbar-note">
          <Map /> {presentation.label} · {presentation.summary} · offline base
        </span>
        <details className="layer-picker">
          <summary>
            <Layers3 /> Layers
          </summary>
          <div>
            {Object.entries(layers).map(([id, visible]) => (
              <label key={id}>
                <input
                  type="checkbox"
                  checked={visible}
                  onChange={() =>
                    setLayers((current) => ({
                      ...current,
                      [id]: !current[id as keyof typeof current],
                    }))
                  }
                />{" "}
                {id}
              </label>
            ))}
          </div>
        </details>
        <button
          className="icon-button"
          type="button"
          onClick={() => containerRef.current?.requestFullscreen()}
        >
          <Maximize2 /> Fullscreen
        </button>
      </div>
      {error ? (
        <div className="renderer-state" role="alert">
          <TriangleAlert />
          <h2>Map data error</h2>
          <p>{error}</p>
        </div>
      ) : (
        <div ref={containerRef} className="map-canvas" />
      )}
    </section>
  );
}

function ModelView({ envelope }: { envelope: ModelEnvelope }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string>();
  const [progress, setProgress] = useState(0);
  const [wireframe, setWireframe] = useState(envelope.payload.wireframe);
  const [background, setBackground] = useState(envelope.payload.background);
  const cleanupRef = useRef<(() => void) | null>(null);
  const applyWireframeRef = useRef<((value: boolean) => void) | null>(null);
  const url =
    envelope.payload.source.url ??
    envelope.payload.source.dataUrl ??
    (envelope.payload.source.base64
      ? `data:${envelope.payload.source.mimeType};base64,${envelope.payload.source.base64}`
      : "");
  useEffect(() => {
    let cancelled = false;
    void Promise.all([
      import("three"),
      import("three/examples/jsm/controls/OrbitControls.js"),
    ])
      .then(async ([THREE, { OrbitControls }]) => {
        if (cancelled || !containerRef.current) return;
        const container = containerRef.current;
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(background);
        const camera = new THREE.PerspectiveCamera(
          45,
          container.clientWidth / Math.max(1, container.clientHeight),
          0.01,
          10_000,
        );
        const renderer = new THREE.WebGLRenderer({
          antialias: true,
          alpha: false,
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        container.appendChild(renderer.domElement);
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        scene.add(new THREE.HemisphereLight(0xffffff, 0x223355, 2.2));
        const directional = new THREE.DirectionalLight(0xffffff, 2.8);
        directional.position.set(4, 6, 5);
        scene.add(directional);
        const grid = new THREE.GridHelper(10, 20, 0x42517a, 0x27314b);
        scene.add(grid);
        let object: import("three").Object3D;
        const manager = new THREE.LoadingManager();
        manager.onProgress = (_item, loaded, total) =>
          setProgress(Math.round((loaded / total) * 100));
        try {
          if (envelope.payload.format === "stl") {
            const { STLLoader } =
              await import("three/examples/jsm/loaders/STLLoader.js");
            const geometry = await new STLLoader(manager).loadAsync(url);
            geometry.computeVertexNormals();
            object = new THREE.Mesh(
              geometry,
              new THREE.MeshStandardMaterial({
                color: 0x6f98ff,
                roughness: 0.45,
                metalness: 0.08,
                wireframe,
              }),
            );
          } else if (envelope.payload.format === "obj") {
            const { OBJLoader } =
              await import("three/examples/jsm/loaders/OBJLoader.js");
            object = await new OBJLoader(manager).loadAsync(url);
          } else if (envelope.payload.format === "ply") {
            const { PLYLoader } =
              await import("three/examples/jsm/loaders/PLYLoader.js");
            const geometry = await new PLYLoader(manager).loadAsync(url);
            geometry.computeVertexNormals();
            object = new THREE.Mesh(
              geometry,
              new THREE.MeshStandardMaterial({ color: 0x6f98ff, wireframe }),
            );
          } else {
            const { GLTFLoader } =
              await import("three/examples/jsm/loaders/GLTFLoader.js");
            object = (await new GLTFLoader(manager).loadAsync(url)).scene;
          }
        } catch (cause) {
          renderer.dispose();
          container.replaceChildren();
          setError(
            cause instanceof Error ? cause.message : "3D asset failed to load",
          );
          return;
        }
        if (cancelled) return;
        scene.add(object);
        const box = new THREE.Box3().setFromObject(object);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        object.position.sub(center);
        const radius = Math.max(size.x, size.y, size.z, 1);
        camera.position.set(radius * 1.8, radius * 1.4, radius * 2.2);
        camera.near = radius / 100;
        camera.far = radius * 100;
        camera.updateProjectionMatrix();
        controls.target.set(0, 0, 0);
        controls.update();
        grid.position.y = -size.y / 2;
        applyWireframeRef.current = (value) =>
          object.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              const materials = Array.isArray(child.material)
                ? child.material
                : [child.material];
              materials.forEach((material) => {
                if (
                  material instanceof THREE.MeshStandardMaterial ||
                  material instanceof THREE.MeshBasicMaterial ||
                  material instanceof THREE.MeshPhongMaterial
                )
                  material.wireframe = value;
              });
            }
          });
        let frame = 0;
        const animate = () => {
          frame = requestAnimationFrame(animate);
          controls.update();
          renderer.render(scene, camera);
        };
        animate();
        const resize = () => {
          if (!container.clientWidth || !container.clientHeight) return;
          camera.aspect = container.clientWidth / container.clientHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(container.clientWidth, container.clientHeight);
        };
        const observer = new ResizeObserver(resize);
        observer.observe(container);
        cleanupRef.current = () => {
          cancelAnimationFrame(frame);
          observer.disconnect();
          controls.dispose();
          scene.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.geometry.dispose();
              const materials = Array.isArray(child.material)
                ? child.material
                : [child.material];
              materials.forEach((material) => {
                Object.values(material).forEach(
                  (value) => value instanceof THREE.Texture && value.dispose(),
                );
                material.dispose();
              });
            }
          });
          renderer.dispose();
          renderer.forceContextLoss();
          container.replaceChildren();
        };
      })
      .catch((cause) =>
        setError(
          cause instanceof Error
            ? cause.message
            : "WebGL renderer failed to load",
        ),
      );
    return () => {
      cancelled = true;
      cleanupRef.current?.();
      cleanupRef.current = null;
    };
  }, [envelope, url]);
  useEffect(() => applyWireframeRef.current?.(wireframe), [wireframe]);
  useEffect(() => {
    const canvas = containerRef.current?.querySelector("canvas");
    if (canvas) canvas.style.background = background;
  }, [background]);
  return (
    <section className="model-renderer" data-testid="model-3d-renderer">
      <div className="renderer-toolbar">
        <span className="toolbar-note">
          <Box /> {envelope.payload.format.toUpperCase()} · WebGL isolated
          lifecycle
        </span>
        <button
          className={`icon-button ${wireframe ? "active" : ""}`}
          type="button"
          onClick={() => setWireframe((value) => !value)}
        >
          <ScanLine /> Wireframe
        </button>
        <label className="color-control">
          Background{" "}
          <input
            type="color"
            value={background}
            onChange={(event) => setBackground(event.target.value)}
          />
        </label>
        <button
          className="icon-button"
          type="button"
          onClick={() => containerRef.current?.requestFullscreen()}
        >
          <Maximize2 /> Fullscreen
        </button>
      </div>
      {error ? (
        <div className="renderer-state" role="alert">
          <TriangleAlert />
          <h2>3D model failed to load</h2>
          <p>{error}</p>
          <button
            className="button secondary"
            type="button"
            onClick={() => setError(undefined)}
          >
            <RotateCcw /> Retry
          </button>
        </div>
      ) : (
        <div className="model-stage" ref={containerRef}>
          {progress < 100 ? (
            <div className="model-progress">
              <LoaderCircle className="spin" /> Loading model · {progress}%
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}

export default function SpatialRenderer({ envelope }: RendererComponentProps) {
  if (
    envelope.type === "map.geo" ||
    envelope.type === "map.places" ||
    envelope.type === "map.route" ||
    envelope.type === "map.heatmap" ||
    envelope.type === "map.track"
  )
    return <MapView envelope={envelope as MapEnvelope} />;
  if (envelope.type === "model.3d")
    return <ModelView envelope={envelope as ModelEnvelope} />;
  throw new Error("Spatial renderer received an incompatible envelope");
}
