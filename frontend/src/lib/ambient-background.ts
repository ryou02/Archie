export const AMBIENT_BACKGROUND_VIDEO_SRC = "/media/archie-ambient-loop.mp4";

export type AmbientSurface = "landing" | "build";

export interface AmbientBackgroundConfig {
  surface: AmbientSurface;
  enableVideo: boolean;
  videoSrc: string;
  videoClassName: string;
  containerClassName: string;
}

const AMBIENT_BACKGROUND_CONFIG: Record<AmbientSurface, AmbientBackgroundConfig> = {
  landing: {
    surface: "landing",
    enableVideo: true,
    videoSrc: AMBIENT_BACKGROUND_VIDEO_SRC,
    videoClassName: "ambient-video ambient-video--landing",
    containerClassName: "ambient-bg ambient-bg--landing",
  },
  build: {
    surface: "build",
    enableVideo: true,
    videoSrc: AMBIENT_BACKGROUND_VIDEO_SRC,
    videoClassName: "ambient-video ambient-video--build",
    containerClassName: "ambient-bg ambient-bg--build",
  },
};

export function getAmbientBackgroundConfig(
  surface: AmbientSurface
): AmbientBackgroundConfig {
  return AMBIENT_BACKGROUND_CONFIG[surface];
}
