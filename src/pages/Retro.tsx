import { Component, lazy, Suspense, type ReactNode } from "react";
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
        onSwitchTo3d={canUse3d && !smallViewport ? () => chooseMode("3d") : undefined}
      />
    </main>
  );
};

export default Retro;
