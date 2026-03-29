"use client";

import { useSyncExternalStore } from "react";
import {
  getAmbientBackgroundConfig,
  type AmbientSurface,
} from "@/lib/ambient-background";

interface AmbientBackgroundProps {
  surface: AmbientSurface;
}

export default function AmbientBackground({
  surface,
}: AmbientBackgroundProps) {
  const config = getAmbientBackgroundConfig(surface);
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  return (
    <div className={config.containerClassName} aria-hidden="true">
      {config.enableVideo && isMounted ? (
        <video
          className={config.videoClassName}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
        >
          <source src={config.videoSrc} type="video/mp4" />
        </video>
      ) : null}
    </div>
  );
}
