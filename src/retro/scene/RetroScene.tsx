import { Suspense, useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import { Canvas, type ThreeEvent } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, OrbitControls } from "@react-three/drei";
import { Vector3 } from "three";
import { CameraRig } from "./CameraRig";
import { GlbComputer } from "./GlbComputer";
import { NightCity } from "./NightCity";
import { ACTIVE_SCREEN, COMPUTER_MODEL } from "./model.config";
import { ProceduralComputer } from "./ProceduralComputer";
import { ScreenSlot } from "./ScreenSlot";

const FOV = 35;
const IDLE_TARGET = new Vector3(0, 0.95, 0.35);
const IDLE_TARGET_ARRAY = IDLE_TARGET.toArray();
/** Three-quarter view direction from the target; distance is fitted to the viewport. */
const IDLE_DIRECTION = new Vector3(0.38, 0.42, 1).normalize();
/** Rough half-extents of the desk setup that should stay in frame when idle. */
const SCENE_HALF = { width: 2.1, height: 1.15 };

function idleCameraPosition(aspect: number) {
  const tanHalf = Math.tan(((FOV / 2) * Math.PI) / 180);
  const distance = Math.max(5, SCENE_HALF.height / tanHalf, SCENE_HALF.width / (tanHalf * aspect));
  return IDLE_TARGET.clone().addScaledVector(IDLE_DIRECTION, distance);
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

  const wasZoomed = useRef(false);

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
        <span className="retro-hud__brand">LINH LE · PORTFOLIO</span>
        <div className="retro-hud__actions">
          {zoomed && (
            <button type="button" className="retro-btn" onClick={zoomOut}>
              Power off <span className="retro-hud__key">Esc</span>
            </button>
          )}
          <button type="button" className="retro-btn" onClick={onSwitchTo2d}>
            2D mode
          </button>
          <button type="button" className="retro-btn" onClick={() => navigate("/classic")}>
            Classic site
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
              onFailure();
            });
          }}
        >
          {/* Night room: dim warm key (desk lamp), cool city light spilling in from the window. */}
          <ambientLight intensity={0.28} color="#c9c4ff" />
          <directionalLight position={[-3, 5, 4]} intensity={1.25} color="#ffe2b8" />
          <directionalLight position={[2.5, 3.5, -6]} intensity={0.9} color="#8a9cff" />
          <directionalLight position={[-4, 2, -5]} intensity={0.45} color="#ff86bd" />
          {/* CRT glow spilling onto the desk and keyboard. */}
          <pointLight
            position={[ACTIVE_SCREEN.position[0], ACTIVE_SCREEN.position[1] - 0.2, ACTIVE_SCREEN.position[2] + 0.7]}
            intensity={active ? 1.8 : 1.1}
            distance={3.2}
            color="#a8ffc4"
          />
          <Environment resolution={64} frames={1} environmentIntensity={0.55}>
            <Lightformer form="rect" intensity={2} position={[-3, 4, 3]} scale={[4, 2, 1]} color="#fff3df" />
            <Lightformer form="rect" intensity={0.8} position={[4, 2, 2]} scale={[3, 3, 1]} color="#dbe6ff" />
            <Lightformer form="ring" intensity={0.6} position={[0, 5, -3]} scale={2} color="#ffffff" />
          </Environment>

          <NightCity />

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
              active={active}
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
          <CameraRig zoomed={zoomed} screen={ACTIVE_SCREEN} idleTarget={IDLE_TARGET} onSettled={onSettled} />
        </Canvas>
      </div>

      {!zoomed && (
        <div className="retro-hud retro-hud--bottom">
          <button ref={powerButtonRef} type="button" className="retro-btn retro-btn--primary" onClick={zoomIn}>
            Turn on the computer
          </button>
          <p className="retro-hud__hint">Drag to look around · click the monitor to zoom in</p>
        </div>
      )}
    </main>
  );
}
