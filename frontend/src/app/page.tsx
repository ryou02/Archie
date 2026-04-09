"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import AmbientBackground from "@/components/AmbientBackground";

const LANDING_FADE_MS = 280;
const BUILD_ROUTE = "/build";

export default function Home() {
  const router = useRouter();
  const [isLeaving, setIsLeaving] = useState(false);
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (leaveTimerRef.current) {
        clearTimeout(leaveTimerRef.current);
      }
    };
  }, []);

  const handleStartBuilding = () => {
    if (isLeaving) {
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      router.push(BUILD_ROUTE);
      return;
    }

    setIsLeaving(true);
    leaveTimerRef.current = setTimeout(() => {
      router.push(BUILD_ROUTE);
    }, LANDING_FADE_MS);
  };

  return (
    <div
      className={`landing-page relative flex min-h-screen flex-1 items-center justify-center overflow-hidden px-6 pt-28 pb-16${
        isLeaving ? " landing-page--leaving" : ""
      }`}
    >
      <AmbientBackground surface="landing" />

      <div className="landing-shell relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center text-center">
        <div className="hero-mark">
          <Image
            src="/logo-mark.png"
            alt="Archie mark"
            className="hero-mark__image"
            width={250}
            height={250}
            priority
          />
        </div>

        <div className="hero-copy-wrap">
          <p className="hero-kicker">Made for imaginative Roblox builders</p>
          <h1 className="hero-title">ARCHIE</h1>
          <p className="hero-copy">
            Describe the game, shape the <span className="editorial-accent">vision</span>,
            and let Archie help turn your ideas into playable Roblox worlds.
          </p>
        </div>

        <button
          onClick={handleStartBuilding}
          className="btn-primary mt-8 text-base"
          disabled={isLeaving}
        >
          Start Building
        </button>

        <div className="landing-floor" />
      </div>
    </div>
  );
}
