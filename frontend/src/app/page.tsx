"use client";

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <div className="flex flex-1 flex-col items-center justify-center relative overflow-hidden"
      style={{ background: "linear-gradient(180deg, #EBF5FF 0%, #DDE8F5 40%, #E5F0FA 100%)" }}>

      {/* Soft radial glow */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(circle at 50% 60%, rgba(74,138,212,0.08) 0%, transparent 50%)"
        }} />

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-6 text-center px-6">
        {/* Logo / Title */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-2"
            style={{ background: "linear-gradient(135deg, var(--blue), var(--teal))" }}>
            <span className="text-white text-3xl font-black">A</span>
          </div>
          <h1 className="text-5xl font-black tracking-tight"
            style={{ color: "var(--text-primary)", letterSpacing: "-0.03em" }}>
            ARC<span style={{ color: "var(--blue)" }}>HIE</span>
          </h1>
          <p className="text-base mt-1" style={{ color: "var(--fog)" }}>
            Build Roblox games with your voice.
          </p>
        </div>

        {/* CTA Button */}
        <button
          onClick={() => router.push("/build")}
          className="mt-4 px-10 py-4 rounded-xl text-white font-bold text-sm tracking-wide cursor-pointer"
          style={{
            background: "linear-gradient(135deg, var(--blue), #3a7ac4)",
            border: "1px solid rgba(74,138,212,0.3)",
            boxShadow: "0 8px 32px rgba(74,138,212,0.25), inset 0 1px 0 rgba(255,255,255,0.15)",
            transition: "transform var(--t-fast), box-shadow var(--t-fast)",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            fontFamily: "var(--font-mono)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 12px 40px rgba(74,138,212,0.35), inset 0 1px 0 rgba(255,255,255,0.15)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 8px 32px rgba(74,138,212,0.25), inset 0 1px 0 rgba(255,255,255,0.15)";
          }}
        >
          Start Building
        </button>
      </div>

      {/* Bottom decorative wave */}
      <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
        style={{
          background: "linear-gradient(180deg, transparent, rgba(74,138,212,0.06))"
        }} />
    </div>
  );
}
