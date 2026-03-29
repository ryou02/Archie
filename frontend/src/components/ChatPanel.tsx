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
      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3"
        style={{ overscrollBehavior: "contain" }}
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`max-w-[88%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
              msg.role === "user" ? "self-end" : "self-start"
            }`}
            style={{
              background:
                msg.role === "user"
                  ? "rgba(74,138,212,0.14)"
                  : "var(--surface)",
              border: `1px solid ${
                msg.role === "user"
                  ? "var(--blue-border)"
                  : "rgba(0,0,0,0.04)"
              }`,
              color: "var(--text-primary)",
              whiteSpace: "pre-wrap",
            }}
          >
            {msg.content}
          </div>
        ))}

        {disabled && (
          <div className="self-start flex items-center gap-2 px-4 py-3 rounded-2xl text-sm"
            style={{ background: "var(--surface)", border: "1px solid rgba(0,0,0,0.04)", color: "var(--fog)" }}>
            <span className="inline-block w-2 h-2 rounded-full animate-pulse" style={{ background: "var(--blue)" }} />
            {planStatus === "building" ? "Building..." : "Thinking..."}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-4 pb-4 pt-2 flex gap-2"
        style={{ borderTop: "1px solid var(--surface3)" }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="Tell Archie what to build..."
          disabled={disabled}
          className="flex-1 px-4 py-3 rounded-xl text-sm outline-none"
          style={{
            background: "var(--surface2)",
            border: "1px solid var(--surface3)",
            color: "var(--text-primary)",
            fontFamily: "var(--font-sans)",
          }}
        />
        <button
          onClick={handleSubmit}
          disabled={disabled || !input.trim()}
          className="glass-btn px-4 py-3 font-bold"
          style={{ opacity: disabled || !input.trim() ? 0.4 : 1 }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
