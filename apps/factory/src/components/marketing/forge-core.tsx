"use client";

import {
  useEffect,
  useRef,
  useSyncExternalStore,
  type CSSProperties,
  type PointerEvent,
} from "react";
import styles from "./forge-core.module.css";

const layers = [
  { name: "apps/web", type: "product shell", tone: "orange" },
  { name: "packages/auth", type: "identity", tone: "lime" },
  { name: "packages/billing", type: "entitlements", tone: "violet" },
  { name: "tooling/forge-cli", type: "automation", tone: "blue" },
] as const;

const reducedMotionQuery = "(prefers-reduced-motion: reduce)";

function subscribeToReducedMotion(callback: () => void): () => void {
  const mediaQuery = window.matchMedia(reducedMotionQuery);
  mediaQuery.addEventListener("change", callback);

  return () => mediaQuery.removeEventListener("change", callback);
}

function prefersReducedMotion(): boolean {
  return window.matchMedia(reducedMotionQuery).matches;
}

function serverPrefersReducedMotion(): boolean {
  return true;
}

export function ForgeCore() {
  const stageRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useSyncExternalStore(
    subscribeToReducedMotion,
    prefersReducedMotion,
    serverPrefersReducedMotion,
  );

  useEffect(() => {
    if (!reducedMotion) return;

    const stage = stageRef.current;
    if (!stage) return;

    stage.style.removeProperty("--core-rotate-y");
    stage.style.removeProperty("--core-rotate-x");
    stage.style.removeProperty("--glow-x");
    stage.style.removeProperty("--glow-y");
  }, [reducedMotion]);

  function moveCore(event: PointerEvent<HTMLDivElement>) {
    if (reducedMotion) return;

    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    event.currentTarget.style.setProperty("--core-rotate-y", `${x * 7}deg`);
    event.currentTarget.style.setProperty("--core-rotate-x", `${y * -7}deg`);
    event.currentTarget.style.setProperty("--glow-x", `${(x + 0.5) * 100}%`);
    event.currentTarget.style.setProperty("--glow-y", `${(y + 0.5) * 100}%`);
  }

  function resetCore(event: PointerEvent<HTMLDivElement>) {
    if (reducedMotion) return;

    event.currentTarget.style.removeProperty("--core-rotate-y");
    event.currentTarget.style.removeProperty("--core-rotate-x");
    event.currentTarget.style.removeProperty("--glow-x");
    event.currentTarget.style.removeProperty("--glow-y");
  }

  return (
    <div
      aria-hidden="true"
      className={styles.stage}
      data-motion={reducedMotion ? "reduced" : "full"}
      data-testid="forge-core"
      onPointerLeave={reducedMotion ? undefined : resetCore}
      onPointerMove={reducedMotion ? undefined : moveCore}
      ref={stageRef}
    >
      <div className={styles.ambient} />
      <div className={styles.orbitOne} />
      <div className={styles.orbitTwo} />
      <div className={styles.statusRail}>
        <span>COMPOSITION</span>
        <strong>04 / 04</strong>
      </div>
      <div className={styles.core} data-testid="forge-core-panel">
        <div className={styles.coreTop}>
          <span>SAASFORGE</span>
          <span>BLUEPRINT 02</span>
        </div>
        <div className={styles.layerStack}>
          {layers.map((layer, index) => (
            <div
              className={styles.layer}
              data-tone={layer.tone}
              key={layer.name}
              style={{ "--layer-index": index } as CSSProperties}
            >
              <span className={styles.layerIndex}>0{index + 1}</span>
              <div>
                <strong>{layer.name}</strong>
                <small>{layer.type}</small>
              </div>
              <span className={styles.layerState}>linked</span>
            </div>
          ))}
        </div>
        <div className={styles.coreFooter}>
          <span className={styles.pulse} />
          <span>standalone repository ready</span>
          <strong>SF/02</strong>
        </div>
      </div>
      <div className={styles.floatingChip} data-position="auth">
        <span /> auth
      </div>
      <div className={styles.floatingChip} data-position="email">
        <span /> email
      </div>
      <div className={styles.floatingChip} data-position="storage">
        <span /> storage
      </div>
      <div className={styles.coordinate}>X 14.02 / Y 08.26</div>
    </div>
  );
}
