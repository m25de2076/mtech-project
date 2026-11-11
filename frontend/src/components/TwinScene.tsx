import { useEffect, useRef, useState } from "react";
import * as T from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { createDistrict, zoneSites } from "../scene/district";
import type { TwinZoneReading } from "../types";

interface TwinSceneProps {
  zones: TwinZoneReading[];
  selectedZoneId: string | null;
  onSelect: (id: string) => void;
}
interface SceneActions {
  reset: (top?: boolean) => void;
  ar: () => Promise<void>;
  exit: () => void;
  exportModel: () => Promise<void>;
}
const colors = {
  stable: "#3bba8c",
  watch: "#dfa83b",
  hotspot: "#e2763b",
  critical: "#e65353",
};
export function TwinScene({ zones, selectedZoneId, onSelect }: TwinSceneProps) {
  const host = useRef<HTMLDivElement>(null),
    panel = useRef<HTMLDivElement>(null),
    actions = useRef<SceneActions>();
  const [paused, setPaused] = useState(false),
    [dusk, setDusk] = useState(false),
    [labels, setLabels] = useState(true),
    [people, setPeople] = useState(true),
    [traffic, setTraffic] = useState(true);
  const [message, setMessage] = useState(""),
    [ar, setAR] = useState(false),
    [arHelp, setARHelp] = useState(false),
    [busy, setBusy] = useState(false),
    [quickLook, setQuickLook] = useState("");
  const live = useRef({
    zones,
    selectedZoneId,
    onSelect,
    paused,
    dusk,
    labels,
    people,
    traffic,
  });
  live.current = {
    zones,
    selectedZoneId,
    onSelect,
    paused,
    dusk,
    labels,
    people,
    traffic,
  };
  useEffect(() => {
    const container = host.current!;
    let renderer: T.WebGLRenderer;
    try {
      renderer = new T.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      setMessage(
        "This device cannot initialize WebGL. Enable hardware acceleration and reload.",
      );
      return;
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFSoftShadowMap;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.xr.enabled = true;
    renderer.xr.setReferenceSpaceType("local");
    container.appendChild(renderer.domElement);
    const scene = new T.Scene();
    scene.background = new T.Color("#b6cdd2");
    const camera = new T.PerspectiveCamera(40, 1, 0.05, 400);
    camera.position.set(69, 64, 82);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 1, 0);
    controls.enableDamping = true;
    controls.minDistance = 15;
    controls.maxDistance = 160;
    controls.maxPolarAngle = Math.PI / 2.08;
    controls.update();
    const ambient = new T.HemisphereLight("#d3e8f3", "#657255", 2);
    scene.add(ambient);
    const sun = new T.DirectionalLight("#fff1d6", 3.2);
    sun.position.set(-28, 60, 25);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, {
      left: -50,
      right: 50,
      top: 45,
      bottom: -45,
      near: 1,
      far: 150,
    });
    sun.shadow.bias = -0.0003;
    sun.shadow.normalBias = 0.08;
    scene.add(sun);
    const district = createDistrict();
    scene.add(district.root);
    district.update(0);
    const markers = new T.Group();
    markers.name = "telemetry-markers";
    district.root.add(markers);
    const markerMap = new Map<
      string,
      {
        sprite: T.Sprite;
        canvas: HTMLCanvasElement;
        texture: T.CanvasTexture;
        last: string;
      }
    >();
    for (const [id, p] of Object.entries(zoneSites)) {
      const canvas = document.createElement("canvas");
      canvas.width = 512;
      canvas.height = 128;
      const texture = new T.CanvasTexture(canvas);
      texture.colorSpace = T.SRGBColorSpace;
      const sprite = new T.Sprite(
        new T.SpriteMaterial({
          map: texture,
          depthTest: false,
          transparent: true,
        }),
      );
      sprite.position.set(p[0], p[1] + 2, p[2]);
      sprite.scale.set(10, 2.5, 1);
      sprite.renderOrder = 5;
      sprite.userData.zoneId = id;
      markers.add(sprite);
      markerMap.set(id, { sprite, canvas, texture, last: "" });
    }
    const reticle = new T.Mesh(
      new T.RingGeometry(0.075, 0.095, 32).rotateX(-Math.PI / 2),
      new T.MeshBasicMaterial({ color: "#42e0bf" }),
    );
    reticle.matrixAutoUpdate = false;
    reticle.visible = false;
    scene.add(reticle);
    let disposed = false,
      time = 0,
      last = 0,
      session: XRSession | null = null,
      hitSource: XRHitTestSource | undefined,
      placed = false;
    const resize = () => {
      if (renderer.xr.isPresenting) return;
      const w = container.clientWidth,
        h = container.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    resize();
    const reset = (top = false) => {
      camera.position.set(
        ...((top ? [0, 100, 0.1] : [69, 64, 82]) as [number, number, number]),
      );
      controls.target.set(0, 1, 0);
      controls.update();
    };
    const end = () => {
      hitSource?.cancel();
      hitSource = undefined;
      session = null;
      placed = false;
      reticle.visible = false;
      district.root.position.set(0, 0, 0);
      district.root.scale.setScalar(1);
      district.root.visible = true;
      controls.enabled = true;
      setAR(false);
      setMessage("");
      reset();
      resize();
    };
    const select = () => {
      if (reticle.visible) {
        district.root.position.setFromMatrixPosition(reticle.matrix);
        district.root.scale.setScalar(0.014);
        district.root.visible = true;
        placed = true;
        setMessage("District placed. Walk around to explore.");
      }
    };
    const controller = renderer.xr.getController(0);
    controller.addEventListener("select", select);
    scene.add(controller);
    const save = (bytes: ArrayBuffer, name: string, type: string) => {
      const url = URL.createObjectURL(new Blob([bytes], { type }));
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    };
    actions.current = {
      reset,
      exit: () => {
        void session?.end();
      },
      exportModel: async () => {
        const copy = district.root.clone(true);
        const telemetry = copy.getObjectByName("telemetry-markers");
        if (telemetry) copy.remove(telemetry);
        copy.position.set(0, 0, 0);
        copy.scale.setScalar(1);
        copy.visible = true;
        copy.updateMatrixWorld(true);
        const { GLTFExporter } =
          await import("three/examples/jsm/exporters/GLTFExporter.js");
        const result = await new GLTFExporter().parseAsync(copy, {
          binary: true,
        });
        save(
          result as ArrayBuffer,
          "urban-microclimate-district.glb",
          "model/gltf-binary",
        );
      },
      ar: async () => {
        setARHelp(true);
        const isApple =
          /iPad|iPhone|iPod/.test(navigator.userAgent) ||
          (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
        if (isApple) {
          setQuickLook("/models/urban-microclimate-district.usdz");
          setMessage(
            "Tap Open iPhone AR below. This AR snapshot has no live telemetry or animation.",
          );
          return;
        }
        if (!window.isSecureContext) {
          setMessage(
            "Phone AR needs an HTTPS address. Open this app through a trusted HTTPS deployment; a local-network HTTP address cannot start AR.",
          );
          return;
        }
        if (
          !navigator.xr ||
          !(await navigator.xr.isSessionSupported("immersive-ar"))
        ) {
          setMessage(
            "Immersive AR is unavailable in this browser. Use a WebXR-capable Android phone, or Safari on iPhone for the AR snapshot.",
          );
          return;
        }
        const next = await navigator.xr.requestSession("immersive-ar", {
          requiredFeatures: ["hit-test"],
          optionalFeatures: ["dom-overlay"],
          domOverlay: { root: panel.current! },
        });
        if (disposed) {
          await next.end();
          return;
        }
        session = next;
        session.addEventListener("end", end, { once: true });
        try {
          await renderer.xr.setSession(session);
          const space = await session.requestReferenceSpace("viewer");
          hitSource =
            (await session.requestHitTestSource!({ space })) || undefined;
          scene.background = null;
          controls.enabled = false;
          district.root.visible = false;
          setAR(true);
          setARHelp(false);
          setMessage(
            "Move your phone to find a surface. Tap when the green ring appears.",
          );
        } catch (e) {
          await next.end();
          throw e;
        }
      },
    };
    const raycaster = new T.Raycaster();
    let down = [0, 0];
    const pointerDown = (e: PointerEvent) => {
      down = [e.clientX, e.clientY];
    };
    const pointerUp = (e: PointerEvent) => {
      if (session || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 5)
        return;
      const rect = renderer.domElement.getBoundingClientRect();
      raycaster.setFromCamera(
        new T.Vector2(
          ((e.clientX - rect.left) / rect.width) * 2 - 1,
          (-(e.clientY - rect.top) / rect.height) * 2 + 1,
        ),
        camera,
      );
      if (live.current.labels) {
        const hit = raycaster.intersectObjects(markers.children)[0];
        if (hit) live.current.onSelect(hit.object.userData.zoneId);
      }
    };
    renderer.domElement.addEventListener("pointerdown", pointerDown);
    renderer.domElement.addEventListener("pointerup", pointerUp);
    renderer.setAnimationLoop((now, frame) => {
      const state = live.current;
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
      last = now;
      if (!state.paused) time += dt;
      district.update(time);
      district.people.visible = state.people;
      district.traffic.visible = state.traffic;
      markers.visible = state.labels;
      sun.intensity = state.dusk ? 1.1 : 3.2;
      sun.color.set(state.dusk ? "#ffb37e" : "#fff1d6");
      ambient.intensity = state.dusk ? 1.1 : 2;
      if (!session) {
        (scene.background as T.Color | null)?.set(
          state.dusk ? "#56657a" : "#b6cdd2",
        );
        if (!scene.background)
          scene.background = new T.Color(state.dusk ? "#56657a" : "#b6cdd2");
        controls.update();
      }
      for (const [id, marker] of markerMap) {
        const zone = state.zones.find((z) => z.zone_id === id);
        marker.sprite.visible = !!zone;
        if (!zone) continue;
        const key = JSON.stringify([
          zone.air_temp_c,
          zone.status,
          state.selectedZoneId === id,
        ]);
        if (key === marker.last) continue;
        marker.last = key;
        const ctx = marker.canvas.getContext("2d")!;
        ctx.clearRect(0, 0, 512, 128);
        ctx.fillStyle = state.selectedZoneId === id ? "#174853" : "#102b38";
        ctx.beginPath();
        ctx.roundRect(4, 4, 504, 120, 20);
        ctx.fill();
        ctx.strokeStyle = colors[zone.status];
        ctx.lineWidth = 5;
        ctx.stroke();
        ctx.fillStyle = "#f1f5f3";
        ctx.font = "bold 38px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(`${id}  ·  ${zone.air_temp_c.toFixed(1)}°C`, 256, 57);
        ctx.fillStyle = colors[zone.status];
        ctx.font = "24px sans-serif";
        ctx.fillText(zone.status.toUpperCase(), 256, 99);
        marker.texture.needsUpdate = true;
      }
      if (session && frame && hitSource) {
        const ref = renderer.xr.getReferenceSpace();
        const hits = frame.getHitTestResults(hitSource);
        reticle.visible = !placed && hits.length > 0;
        if (reticle.visible && ref) {
          const pose = hits[0].getPose(ref);
          if (pose) reticle.matrix.fromArray(pose.transform.matrix);
        }
      }
      renderer.render(scene, camera);
    });
    return () => {
      disposed = true;
      void session?.end();
      observer.disconnect();
      renderer.setAnimationLoop(null);
      controls.dispose();
      controller.removeEventListener("select", select);
      renderer.domElement.removeEventListener("pointerdown", pointerDown);
      renderer.domElement.removeEventListener("pointerup", pointerUp);
      const geometries = new Set<T.BufferGeometry>(),
        mats = new Set<T.Material>();
      scene.traverse((o) => {
        if (o instanceof T.Mesh || o instanceof T.Sprite) {
          if (o instanceof T.Mesh) geometries.add(o.geometry);
          (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) =>
            mats.add(m),
          );
        }
      });
      geometries.forEach((g) => g.dispose());
      mats.forEach((m) => m.dispose());
      markerMap.forEach((m) => m.texture.dispose());
      renderer.dispose();
      renderer.domElement.remove();
      actions.current = undefined;
    };
  }, []);
  async function run(action: () => Promise<void> | undefined) {
    setBusy(true);
    try {
      await action();
    } catch (e) {
      setMessage(
        e instanceof Error ? e.message : "Unable to complete this action.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div
      ref={panel}
      className={`panel twin-panel ${ar ? "twin-ar-active" : ""}`}
    >
      <div className="panel-header">
        <div>
          <span className="eyebrow">Spatial intelligence / Urban district</span>
          <h3>Microclimate digital twin</h3>
        </div>
        <span className="twin-detail-badge">8 monitored micro-zones</span>
      </div>
      <div className="twin-toolbar">
        <button onClick={() => actions.current?.reset()}>Reset view</button>
        <button onClick={() => actions.current?.reset(true)}>Top view</button>
        <button aria-pressed={dusk} onClick={() => setDusk(!dusk)}>
          {dusk ? "Daylight" : "Dusk"}
        </button>
        <button aria-pressed={paused} onClick={() => setPaused(!paused)}>
          {paused ? "Resume motion" : "Pause motion"}
        </button>
        <button
          className="ar-launch"
          disabled={busy}
          onClick={() => run(() => actions.current?.ar())}
        >
          Phone AR
        </button>
        <button
          disabled={busy}
          onClick={() => run(() => actions.current?.exportModel())}
        >
          Export GLB
        </button>
        <button
          onClick={() => {
            if (document.fullscreenElement) void document.exitFullscreen();
            else
              void panel.current
                ?.requestFullscreen()
                .catch(() =>
                  setMessage("Fullscreen is unavailable in this browser."),
                );
          }}
        >
          Fullscreen
        </button>
      </div>
      <div className="twin-layers">
        <label>
          <input
            type="checkbox"
            checked={people}
            onChange={(e) => setPeople(e.target.checked)}
          />
          People
        </label>
        <label>
          <input
            type="checkbox"
            checked={traffic}
            onChange={(e) => setTraffic(e.target.checked)}
          />
          Cars & bicycles
        </label>
        <label>
          <input
            type="checkbox"
            checked={labels}
            onChange={(e) => setLabels(e.target.checked)}
          />
          Telemetry labels
        </label>
        <span>Illustrative district · Simulated movement</span>
      </div>
      <div className="canvas-shell" ref={host} />
      <div className="twin-caption">
        <span>Drag to orbit · Scroll to zoom · Right-drag to pan</span>
        <span>{paused ? "Motion paused" : "Street activity running"}</span>
      </div>
      {(message || arHelp) && (
        <div className="twin-ar-message" role="status">
          {message}
          {busy && <span> Please wait…</span>}
          {quickLook && (
            <a rel="ar" href={quickLook}>
              <img
                alt=""
                src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'/%3E"
              />
              Open iPhone AR
            </a>
          )}
          {ar && (
            <button onClick={() => actions.current?.exit()}>Exit AR</button>
          )}
          {!ar && (
            <button
              onClick={() => {
                setMessage("");
                setARHelp(false);
              }}
            >
              Close
            </button>
          )}
        </div>
      )}
      {!zones.length && (
        <p className="twin-offline">
          District ready. Waiting for backend telemetry; no sensor values are
          fabricated.
        </p>
      )}
    </div>
  );
}
