import { useEffect, useState } from "react";
import "./Loader.css";

import frame01 from "@/assets/loader_animation/loader_frame_01.jpg";
import frame02 from "@/assets/loader_animation/loader_frame_02.jpg";
import frame03 from "@/assets/loader_animation/loader_frame_03.jpg";
import frame04 from "@/assets/loader_animation/loader_frame_04.jpg";
import frame05 from "@/assets/loader_animation/loader_frame_05.jpg";
import frame06 from "@/assets/loader_animation/loader_frame_06.jpg";
import frame07 from "@/assets/loader_animation/loader_frame_07.jpg";

const FRAMES = [frame01, frame02, frame03, frame04, frame05, frame06, frame07];
const FRAME_DURATION = 190;
const FADE_DURATION = 500; // ms — must match the opacity transition in Loader.css

// Boot text for the retro desktop (`/`). Lines reveal via CSS animation delays.
const BOOT_LINES = ["LINH-OS BIOS v1.0", "Memory test ........ 640K OK", "Detecting drives .... A: C:", "Starting desktop..."];
const BOOT_LINE_DELAY = 700; // ms between lines; keep the last line well inside RETRO_LOADER_DURATION in App.tsx

interface LoaderProps {
  loading: boolean;
  /** "classic" = sketch animation frames, "retro" = BIOS boot screen. */
  variant?: "classic" | "retro";
}

const Loader = ({ loading, variant = "classic" }: LoaderProps) => {
  const [frameIndex, setFrameIndex] = useState(0);
  const [fadingOut, setFadingOut] = useState(false);
  const [mounted, setMounted] = useState(true);

  useEffect(() => {
    if (variant !== "classic") return;
    const interval = setInterval(() => {
      setFrameIndex((index) => (index + 1) % FRAMES.length);
    }, FRAME_DURATION);
    return () => clearInterval(interval);
  }, [variant]);

  useEffect(() => {
    if (!loading) {
      setFadingOut(true);
      const timeout = setTimeout(() => setMounted(false), FADE_DURATION);
      return () => clearTimeout(timeout);
    }
  }, [loading]);

  if (!mounted) return null;

  if (variant === "retro") {
    return (
      <div className={`loader-overlay loader-overlay--retro${fadingOut ? " loader-overlay--hidden" : ""}`} aria-hidden="true">
        <div className="loader-boot">
          {BOOT_LINES.map((line, i) => (
            <p key={line} style={{ animationDelay: `${i * BOOT_LINE_DELAY}ms` }}>
              {line}
            </p>
          ))}
          <span className="loader-boot__cursor" />
        </div>
      </div>
    );
  }

  return (
    <div className={`loader-overlay${fadingOut ? " loader-overlay--hidden" : ""}`}>
      <img src={FRAMES[frameIndex]} alt="" className="loader-frame" />
    </div>
  );
};

export default Loader;
