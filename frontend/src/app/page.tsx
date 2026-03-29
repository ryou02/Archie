"use client";

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <div className="flex flex-1 flex-col items-center justify-center relative min-h-screen overflow-hidden">
      {/* Aurora background */}
      <div className="aurora-bg" />
      <div className="aurora-streaks" />
      <div className="stars" />

      {/* Ground / horizon glow */}
      <div
        className="fixed bottom-0 left-0 right-0 h-[50vh] pointer-events-none z-[1]"
        style={{
          background:
            "radial-gradient(ellipse 100% 40% at 50% 100%, rgba(61,245,167,0.06) 0%, transparent 60%), radial-gradient(ellipse 60% 30% at 50% 100%, rgba(74,158,255,0.04) 0%, transparent 50%)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-8 text-center px-6">
        {/* Logo mark */}
        <div className="relative">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center"
            style={{
              background:
                "linear-gradient(135deg, rgba(61,245,167,0.18), rgba(74,158,255,0.12))",
              border: "1px solid rgba(61,245,167,0.25)",
              boxShadow: "0 0 50px rgba(61,245,167,0.12), 0 0 100px rgba(61,245,167,0.05)",
            }}
          >
            <span
              className="text-3xl font-black"
              style={{
                fontFamily: "var(--font-display)",
                background: "linear-gradient(135deg, var(--aurora-green), var(--aurora-teal))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              A
            </span>
          </div>
          {/* Glow behind logo */}
          <div
            className="absolute -inset-4 rounded-3xl -z-10"
            style={{
              background: "radial-gradient(circle, rgba(61,245,167,0.08) 0%, transparent 70%)",
            }}
          />
        </div>

        {/* Title */}
        <div className="flex flex-col items-center gap-4">
          <h1
            className="text-7xl font-black tracking-tight"
            style={{
              fontFamily: "var(--font-display)",
              letterSpacing: "-0.04em",
              background:
                "linear-gradient(160deg, #ffffff 0%, rgba(232,236,244,0.85) 40%, var(--aurora-green) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              textShadow: "0 0 60px rgba(61,245,167,0.15)",
            }}
          >
            ARCHIE
          </h1>
          <p
            className="text-lg font-light tracking-wide"
            style={{
              fontFamily: "var(--font-body)",
              color: "var(--text-secondary)",
              letterSpacing: "0.08em",
            }}
          >
            Build Roblox games with your voice
          </p>
        </div>

        {/* CTA */}
        <button
          onClick={() => router.push("/build")}
          className="btn-primary mt-6 text-base px-12 py-4"
          style={{
            boxShadow: "0 0 30px rgba(61,245,167,0.12), 0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)",
          }}
        >
          Start Building
        </button>
      </div>

      {/* Model silhouette area */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-[2] pointer-events-none">
        <div
          className="w-[300px] h-[400px] relative"
          style={{
            background: "radial-gradient(ellipse 60% 80% at 50% 60%, rgba(61,245,167,0.04) 0%, transparent 70%)",
          }}
        >
          {/* Subtle ground reflection */}
          <div
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[200px] h-[3px] rounded-full"
            style={{
              background: "radial-gradient(ellipse, rgba(61,245,167,0.20) 0%, transparent 70%)",
              boxShadow: "0 0 20px rgba(61,245,167,0.08)",
            }}
          />
        </div>
      </div>
    </div>
  );
}
