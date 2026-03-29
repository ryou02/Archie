"use client";

import { useState, useRef, useEffect, useSyncExternalStore } from "react";
import BuildSessionCard from "@/components/BuildSessionCard";
import type { BuildSession, ChatHistoryItem } from "@/lib/build-history";
import type { Plan } from "@/lib/api";

interface ChatPanelProps {
  history: ChatHistoryItem[];
  plan?: Plan | null;
  activeSession?: BuildSession | null;
  onSend: (text: string) => void;
  onToggleSession?: (sessionId: string) => void;
  disabled?: boolean;
  planStatus?: string | null;
  micSupported?: boolean;
  micState?: "idle" | "connecting" | "recording";
  onMicStart?: () => void;
  onMicStop?: () => void;
}

function SendIcon() {
  return (
    <svg
      className="icon-send"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <path
        fill="currentColor"
        d="M13.7 2.3a.75.75 0 0 0-.8-.15l-9.9 4a.75.75 0 0 0 .06 1.42l3.92 1.3 1.3 3.92a.75.75 0 0 0 1.42.06l4-9.9a.75.75 0 0 0-.15-.8Zm-5.56 6.14-2.65-.88 5.6-2.27-2.95 3.15Zm.3 2.06-.87-2.64 3.14-2.96-2.27 5.6Z"
      />
    </svg>
  );
}

export default function ChatPanel({
  history,
  plan,
  activeSession,
  onSend,
  onToggleSession,
  disabled,
  planStatus,
  micSupported = false,
  micState = "idle",
  onMicStart,
  onMicStop,
}: ChatPanelProps) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const shouldStickRef = useRef(true);

  useEffect(() => {
    if (scrollRef.current && shouldStickRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeSession, disabled, history]);

  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const currentPlanStatus = plan?.status ?? planStatus ?? null;
  const showApprovalSummary = plan?.status === "waiting_approval";
  const showMeta = showApprovalSummary;

  const effectiveMicSupported = hydrated && micSupported;

  const updateStickiness = () => {
    if (!scrollRef.current) {
      return;
    }

    const distanceFromBottom =
      scrollRef.current.scrollHeight -
      scrollRef.current.clientHeight -
      scrollRef.current.scrollTop;
    shouldStickRef.current = distanceFromBottom <= 96;
  };

  const handleSubmit = () => {
    const text = input.trim();
    if (!text || disabled) return;
    setInput("");
    onSend(text);
  };

  const handleMicStart = (event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (disabled || !effectiveMicSupported) {
      return;
    }
    onMicStart?.();
  };

  const handleMicStop = (event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    onMicStop?.();
  };

  return (
    <div className="chat-panel flex h-full flex-col">
      {showMeta ? (
        <div className="chat-panel__meta shrink-0 px-4 py-4">
          {showApprovalSummary && plan ? (
            <div className="chat-panel__section">
              <h3
                className="mb-3 text-base font-bold"
                style={{
                  fontFamily: "var(--font-display)",
                  color: "var(--text-primary)",
                }}
              >
                {plan.name}
              </h3>
              <div
                className="flex flex-col gap-2 text-sm"
                style={{ color: "var(--text-secondary)" }}
              >
                {[
                  { label: "World", value: plan.world, color: "var(--aurora-green)" },
                  { label: "Objects", value: plan.objects, color: "var(--aurora-teal)" },
                  ...(plan.characters
                    ? [
                        {
                          label: "Characters",
                          value: plan.characters,
                          color: "var(--aurora-blue)",
                        },
                      ]
                    : []),
                  {
                    label: "Gameplay",
                    value: plan.gameplay,
                    color: "var(--aurora-purple)",
                  },
                  { label: "Audio", value: plan.audio, color: "var(--aurora-blue)" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex gap-2 py-1"
                    style={{ borderBottom: "1px solid var(--panel-divider)" }}
                  >
                    <span
                      className="w-20 shrink-0 font-semibold"
                      style={{ color: item.color }}
                    >
                      {item.label}
                    </span>
                    <span>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <div
        ref={scrollRef}
        onScroll={updateStickiness}
        className="chat-panel__messages flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4"
        style={{ overscrollBehavior: "contain" }}
      >
        {history.map((item, index) =>
          item.type === "build-session" ? (
            <BuildSessionCard
              key={item.session.id}
              session={item.session}
              expanded={item.expanded}
              onToggle={() => onToggleSession?.(item.session.id)}
            />
          ) : (
            <div
              key={`${item.role}-${index}`}
              className={`chat-bubble max-w-[90%] px-4 py-3 text-sm leading-relaxed ${
                item.role === "user"
                  ? "chat-bubble--user self-end"
                  : "chat-bubble--assistant self-start"
              }`}
            >
              {item.content}
            </div>
          )
        )}

        {activeSession ? (
          <BuildSessionCard session={activeSession} expanded live />
        ) : null}

        {disabled && (
          <div
            className="chat-bubble chat-bubble--status self-start flex items-center gap-2.5 px-4 py-3 text-sm"
          >
            <div className="flex items-center gap-1">
              <div className="typing-dot" />
              <div className="typing-dot" />
              <div className="typing-dot" />
            </div>
            <span className="text-xs">
              {currentPlanStatus === "building" ? "Building..." : "Thinking..."}
            </span>
          </div>
        )}
      </div>

      <div className="chat-panel__composer flex gap-2 px-4 pb-4 pt-3">
        <div className="chat-input-shell flex flex-1 items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="Tell Archie what to build..."
            disabled={disabled}
            className="chat-input chat-input-control flex-1 text-sm outline-none"
          />
          <button
            type="button"
            disabled={disabled || !effectiveMicSupported}
            className={`chat-input-action btn-mic btn-mic--inline ${micState !== "idle" ? "btn-mic--active" : ""}`}
            onPointerDown={handleMicStart}
            onPointerUp={handleMicStop}
            onPointerLeave={handleMicStop}
            onPointerCancel={handleMicStop}
            aria-label="Hold to talk"
            title={
              effectiveMicSupported
                ? micState === "recording"
                  ? "Release to send"
                  : "Hold to talk"
                : "Voice input unavailable"
            }
          >
            <span className="icon-mic" aria-hidden="true">
              <span className="icon-mic__stem" />
            </span>
          </button>
        </div>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={disabled || !input.trim()}
          className="btn-send btn-send--icon"
          aria-label="Send message"
          title="Send message"
        >
          <SendIcon />
        </button>
      </div>
    </div>
  );
}
