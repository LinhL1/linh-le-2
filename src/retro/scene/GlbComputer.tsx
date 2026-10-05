import { useEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { Mesh, type Material, type Texture } from "three";
import type { ComputerModelConfig } from "./model.config";

type GlbConfig = Extract<ComputerModelConfig, { kind: "glb" }>;

/** Renders a downloaded .glb computer model, configured in model.config.ts. */
export function GlbComputer({ config }: { config: GlbConfig }) {
  const { scene } = useGLTF(config.url);
  const model = useMemo(() => {
    const root = scene.clone(true);
    const hidden = new Set(config.hideMeshes ?? []);
    root.traverse((obj) => {
      if (hidden.has(obj.name)) obj.visible = false;
    });
    return root;
  }, [scene, config.hideMeshes]);

  // Free GPU memory when the scene unmounts (e.g. navigating to /classic).
  useEffect(
    () => () => {
      scene.traverse((obj) => {
        if (!(obj instanceof Mesh)) return;
        obj.geometry.dispose();
        const materials: Material[] = Array.isArray(obj.material) ? obj.material : [obj.material];
        materials.forEach((m) => {
          Object.values(m).forEach((v) => (v as Texture | undefined)?.isTexture && (v as Texture).dispose());
          m.dispose();
        });
      });
      useGLTF.clear(config.url);
    },
    [scene, config.url],
  );

  return <primitive object={model} position={config.position} rotation={config.rotation} scale={config.scale} />;
}
