import { Component, lazy, Suspense, useEffect, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Desktop } from "@/retro/desktop/Desktop";
import { useMediaQuery, useRetroMode } from "@/retro/useRetroMode";
import "@/retro/retro.css";

// three / @react-three/* only load when the 3D view is actually used.
const RetroScene = lazy(() => import("@/retro/scene/RetroScene"));

class SceneErrorBoundary extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.warn("3D scene unavailable, falling back to the 2D desktop.", error);
    this.props.onError();
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function BootScreen() {
  return (
    <div className="retro-page">
      <div className="retro-boot" role="status">
        loading desk...
      </div>
    </div>
  );
}

const Retro = () => {
  const navigate = useNavigate();
  const { mode, canUse3d, smallViewport, chooseMode, reportWebglFailure } = useRetroMode();
  const compact = useMediaQuery("(max-width: 639px)");
  const canExit2d = mode === "2d" && canUse3d && !smallViewport;

  // Esc from outside the desktop (e.g. focus still on <body> after load); the desktop handles its own Esc first.
  useEffect(() => {
    if (!canExit2d) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !(e.target as Element | null)?.closest?.(".retro-desktop")) chooseMode("3d");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [canExit2d, chooseMode]);

  if (mode === "3d") {
    return (
      <SceneErrorBoundary onError={reportWebglFailure}>
        <Suspense fallback={<BootScreen />}>
          <RetroScene navigate={navigate} onSwitchTo2d={() => chooseMode("2d")} onFailure={reportWebglFailure} />
        </Suspense>
      </SceneErrorBoundary>
    );
  }

  return (
    <main className="retro-page retro-page--2d">
      <h1 className="sr-only">Linh Le — portfolio</h1>
      <Desktop
        mode="2d"
        compact={compact}
        navigate={navigate}
        onSwitchTo3d={canExit2d ? () => chooseMode("3d") : undefined}
      />
    </main>
  );
};

export default Retro;
