"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatPanelProps {
  messages: Message[];
  onSend: (text: string) => void;
  disabled?: boolean;
  planStatus?: string | null;
}

export default function ChatPanel({ messages, onSend, disabled, planStatus }: ChatPanelProps) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = () => {
    const text = input.trim();
    if (!text || disabled) return;
    setInput("");
    onSend(text);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="px-5 py-3 shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <span className="nav-label">Chat</span>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3"
        style={{ overscrollBehavior: "contain" }}
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`max-w-[90%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
              msg.role === "user" ? "self-end" : "self-start"
            }`}
            style={{
              background:
                msg.role === "user"
                  ? "rgba(74,158,255,0.12)"
                  : "var(--surface)",
              border: `1px solid ${
                msg.role === "user"
                  ? "rgba(74,158,255,0.18)"
                  : "rgba(255,255,255,0.04)"
              }`,
              color: "var(--text-primary)",
              whiteSpace: "pre-wrap",
              fontFamily: "var(--font-body)",
            }}
          >
            {msg.content}
          </div>
        ))}

        {disabled && (
          <div
            className="self-start flex items-center gap-2.5 px-4 py-3 rounded-2xl text-sm"
            style={{
              background: "var(--surface)",
              border: "1px solid rgba(255,255,255,0.04)",
              color: "var(--text-secondary)",
            }}
          >
            <div className="flex items-center gap-1">
              <div className="typing-dot" />
              <div className="typing-dot" />
              <div className="typing-dot" />
            </div>
            <span className="text-xs">
              {planStatus === "building" ? "Building..." : "Thinking..."}
            </span>
          </div>
        )}
      </div>

      {/* Input */}
      <div
        className="px-4 pb-4 pt-3 flex gap-2"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="Tell Archie what to build..."
          disabled={disabled}
          className="flex-1 px-4 py-3 rounded-full text-sm outline-none"
          style={{
            background: "var(--surface2)",
            border: "1px solid var(--glass-border)",
            color: "var(--text-primary)",
            fontFamily: "var(--font-body)",
          }}
        />
        <button
          onClick={handleSubmit}
          disabled={disabled || !input.trim()}
          className="btn-send"
        >
          Send
        </button>
      </div>
    </div>
  );
}
