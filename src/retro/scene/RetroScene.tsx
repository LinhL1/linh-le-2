import { Suspense, useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import { Canvas, type ThreeEvent } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, OrbitControls } from "@react-three/drei";
import { Vector3 } from "three";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";
import { Desktop } from "../desktop/Desktop";
import { COMPACT_QUERY, SMALL_VIEWPORT_QUERY, useMediaQuery } from "../useRetroMode";
import { CameraRig } from "./CameraRig";
import { GlbComputer } from "./GlbComputer";
import { ACTIVE_SCREEN, COMPUTER_MODEL } from "./model.config";
import { ProceduralComputer } from "./ProceduralComputer";
import { ScreenHalo } from "./ScreenHalo";
import { ScreenSlot } from "./ScreenSlot";

// RectAreaLight needs its lookup tables uploaded once before any material renders with it.
RectAreaLightUniformsLib.init();

/** Light thrown by the monitor: the desktop's teal-green (--r-desk, lifted toward the lit wallpaper) so the room
 *  is lit by what's actually on the screen. Both lights brighten a little while the screen is on (zoomed in). */
const SCREEN_GLOW = { color: "#9fd1bb", area: 0.9, point: 1.4, onBoost: 1.15 };

const FOV = 35;
const IDLE_TARGET = new Vector3(0, 0.95, 0.35);
const IDLE_TARGET_ARRAY = IDLE_TARGET.toArray();
/** Three-quarter view direction from the target; distance is fitted to the viewport. */
const IDLE_DIRECTION = new Vector3(0.38, 0.42, 1).normalize();
/** Rough half-extents of the computer (case + monitor) that should stay in frame when idle.
 *  Desk props (plant, mouse) and the keyboard's front edge may crop so the computer stays the focus. */
const SCENE_HALF = { width: 1.35, height: 1.05 };
/** Closest the idle camera gets; on landscape windows this, not SCENE_HALF, sets the distance. */
const IDLE_MIN_DISTANCE = 3.8;

/** How far the idle camera sits from IDLE_TARGET so the computer fits a viewport of this aspect.
 *  Portrait phones are width-limited, so they get a much farther camera than laptops. */
function idleDistance(aspect: number) {
  const tanHalf = Math.tan(((FOV / 2) * Math.PI) / 180);
  return Math.max(IDLE_MIN_DISTANCE, SCENE_HALF.height / tanHalf, SCENE_HALF.width / (tanHalf * aspect));
}

function idleCameraPosition(aspect: number) {
  return IDLE_TARGET.clone().addScaledVector(IDLE_DIRECTION, idleDistance(aspect));
}

interface RetroSceneProps {
  navigate: (path: string) => void;
  onSwitchTo2d: () => void;
  /** WebGL context lost / creation failure. */
  onFailure: () => void;
}

export default function RetroScene({ navigate, onSwitchTo2d, onFailure }: RetroSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const powerButtonRef = useRef<HTMLButtonElement>(null);
  // `zoomed` is what the visitor asked for; `active` flips once the camera has arrived,
  // and is what makes the screen interactive.
  const [zoomed, setZoomed] = useState(false);
  const [active, setActive] = useState(false);
  const initialCamera = useMemo(() => idleCameraPosition(window.innerWidth / window.innerHeight), []);
  // Too small to read the 800×600 desktop on the glass (phones): once the camera arrives, the
  // desktop powers on full-screen instead, as a regular 2D DOM layer (readable, touch-scrollable).
  const flatScreen = useMediaQuery(SMALL_VIEWPORT_QUERY);
  const compact = useMediaQuery(COMPACT_QUERY);
  const touch = useMediaQuery("(hover: none)");

  const wasZoomed = useRef(false);

  // R3F calls forceContextLoss() when the Canvas unmounts (e.g. switching to 2D). That fires
  // `webglcontextlost` too, and must not be mistaken for a real GPU failure.
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const zoomIn = useCallback(() => setZoomed(true), []);
  const zoomOut = useCallback(() => {
    setZoomed(false);
    setActive(false);
  }, []);

  // After powering off, return keyboard focus to the "Turn on" button.
  useEffect(() => {
    if (wasZoomed.current && !zoomed) powerButtonRef.current?.focus({ preventScroll: true });
    wasZoomed.current = zoomed;
  }, [zoomed]);

  const onSettled = useCallback((isZoomed: boolean) => setActive(isZoomed), []);

  // Esc from anywhere outside the screen (the desktop handles its own Esc first).
  useEffect(() => {
    if (!zoomed) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !(e.target as Element | null)?.closest?.(".retro-desktop")) zoomOut();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoomed, zoomOut]);

  const setHovering = (hovering: boolean) => containerRef.current?.classList.toggle("is-hovering", hovering && !zoomed);

  const onComputerClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    // Ignore the click that ends an orbit drag.
    if (e.delta > 6 || zoomed) return;
    setHovering(false);
    zoomIn();
  };

  return (
    <main className="retro-page">
      <h1 className="sr-only">Linh Le — portfolio</h1>
      <div className="retro-hud retro-hud--top">
        <span className="retro-hud__brand">
          LINH LE<span className="retro-hud__brand-extra"> · PORTFOLIO</span>
        </span>
        <div className="retro-hud__actions">
          {zoomed && (
            <button type="button" className="retro-btn" onClick={zoomOut}>
              Exit <span className="retro-hud__key">Esc</span>
            </button>
          )}
          <button type="button" className="retro-btn" onClick={onSwitchTo2d}>
            2D mode
          </button>
        </div>
      </div>

      <div ref={containerRef} className="retro-scene">
        <Canvas
          eventSource={containerRef as MutableRefObject<HTMLElement>}
          eventPrefix="client"
          dpr={[1, 1.75]}
          frameloop="demand"
          camera={{ fov: FOV, near: 0.1, far: 90, position: initialCamera.toArray() }}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
          onCreated={({ gl }) => {
            gl.domElement.addEventListener("webglcontextlost", (e) => {
              e.preventDefault();
              if (mounted.current) onFailure();
            });
          }}
        >
          {/* Dark room lit only by the monitor. Every light source sits on the glass, so faces turned toward the
              screen catch light and faces turned away (or level with it, like the bezel front) stay dark. */}
          <ambientLight intensity={0.03} color={SCREEN_GLOW.color} />
          {/* Faint back rim so the computer's silhouette doesn't dissolve into the dark. */}
          <directionalLight position={[1.5, 4, -5]} intensity={0.08} color="#8f9cc4" />
          {/* The glass as a glowing panel (lights emit along -Z, hence the half turn to face out of the screen). */}
          <rectAreaLight
            position={[ACTIVE_SCREEN.position[0], ACTIVE_SCREEN.position[1], ACTIVE_SCREEN.position[2] + 0.02]}
            rotation={[ACTIVE_SCREEN.rotation[0], ACTIVE_SCREEN.rotation[1] + Math.PI, ACTIVE_SCREEN.rotation[2]]}
            width={ACTIVE_SCREEN.width}
            height={ACTIVE_SCREEN.height}
            intensity={active ? SCREEN_GLOW.area * SCREEN_GLOW.onBoost : SCREEN_GLOW.area}
            color={SCREEN_GLOW.color}
          />
          {/* Just in front of the glass: gives the falloff with distance (keyboard bright, plant dim) the area light
              lacks. Any closer and the bezel's inner bevel, inches away, burns white; it stays behind the base unit's
              front face (z = 0.6) so that face stays in shadow. */}
          <pointLight
            position={[ACTIVE_SCREEN.position[0], ACTIVE_SCREEN.position[1] - 0.1, ACTIVE_SCREEN.position[2] + 0.2]}
            intensity={active ? SCREEN_GLOW.point * SCREEN_GLOW.onBoost : SCREEN_GLOW.point}
            distance={3.6}
            color={SCREEN_GLOW.color}
          />
          {/* Reflections only: the one bright thing in the room is the screen, so that's what plastic reflects. */}
          <Environment resolution={64} frames={1} environmentIntensity={0.12}>
            <Lightformer
              form="rect"
              intensity={2}
              position={ACTIVE_SCREEN.position}
              scale={[ACTIVE_SCREEN.width, ACTIVE_SCREEN.height, 1]}
              color={SCREEN_GLOW.color}
            />
          </Environment>
          <ScreenHalo screen={ACTIVE_SCREEN} color={SCREEN_GLOW.color} opacity={active ? 0.3 : 0.35} />

          <group
            onClick={onComputerClick}
            onPointerOver={() => setHovering(true)}
            onPointerOut={() => setHovering(false)}
          >
            <Suspense fallback={null}>
              {COMPUTER_MODEL.kind === "glb" ? (
                <GlbComputer config={COMPUTER_MODEL} />
              ) : (
                <ProceduralComputer poweredOn={active} />
              )}
            </Suspense>
            <ScreenSlot
              screen={ACTIVE_SCREEN}
              active={active && !flatScreen}
              focusOnActivate
              navigate={navigate}
              onPowerOff={zoomOut}
            />
          </group>

          <ContactShadows position={[0, 0.002, 0.4]} opacity={0.5} scale={9} blur={2.2} far={2.2} resolution={512} frames={1} />

          <OrbitControls
            makeDefault
            target={IDLE_TARGET_ARRAY}
            enablePan={false}
            enableZoom={false}
            enableDamping
            dampingFactor={0.08}
            rotateSpeed={0.5}
            minAzimuthAngle={-0.55}
            maxAzimuthAngle={0.65}
            minPolarAngle={0.95}
            maxPolarAngle={1.42}
          />
          <CameraRig
            zoomed={zoomed}
            screen={ACTIVE_SCREEN}
            idleTarget={IDLE_TARGET}
            idleDistance={idleDistance}
            onSettled={onSettled}
          />
        </Canvas>
      </div>

      {active && flatScreen && (
        <div className="retro-flatscreen">
          <Desktop mode="2d" compact={compact} navigate={navigate} onPowerOff={zoomOut} focusOnActivate />
        </div>
      )}

      {!zoomed && (
        <div className="retro-hud retro-hud--bottom">
          <button ref={powerButtonRef} type="button" className="retro-btn retro-btn--primary" onClick={zoomIn}>
            {touch ? "Tap" : "Click"} the computer to start
          </button>
          <p className="retro-hud__hint">
            {touch ? "Drag to look around · tap the monitor" : "Drag to look around · click the monitor to zoom in"}
          </p>
        </div>
      )}
    </main>
  );
}
