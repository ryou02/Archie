"use client";

import { useState, useEffect, useCallback } from "react";
import { startSession, sendMessage, type Plan, type TaskStep } from "@/lib/api";
import ProgressBar from "@/components/ProgressBar";
import TaskList from "@/components/TaskList";
import ChatPanel from "@/components/ChatPanel";
import StatusDot from "@/components/StatusDot";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function BuildPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [tasks, setTasks] = useState<TaskStep[]>([]);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (initialized) return;
    setInitialized(true);
    setLoading(true);
    startSession()
      .then((data) => {
        if (data.speech) {
          setMessages([{ role: "assistant", content: data.speech }]);
        }
        if (data.plan) setPlan(data.plan);
        if (data.taskPlan) setTasks(data.taskPlan);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [initialized]);

  const handleSend = useCallback(async (text: string) => {
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setLoading(true);
    try {
      const data = await sendMessage(text);
      if (data.speech) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.speech }]);
      }
      if (data.plan) setPlan(data.plan);
      if (data.taskPlan) setTasks(data.taskPlan);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Oops, something went wrong!" },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  const overallProgress = tasks.length
    ? Math.round(tasks.reduce((sum, t) => sum + t.progress, 0) / tasks.length)
    : 0;

  return (
    <div className="relative h-screen overflow-hidden">
      {/* Aurora background — full screen */}
      <div className="aurora-bg" />
      <div className="aurora-streaks" />
      <div className="stars" />

      {/* Top bar — minimal, floating */}
      <header
        className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 py-3"
        style={{
          background: "linear-gradient(180deg, rgba(5,8,16,0.7) 0%, transparent 100%)",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-7 h-7 flex items-center justify-center"
            style={{
              background: "rgba(61,245,167,0.12)",
              border: "1px solid rgba(61,245,167,0.20)",
            }}
          >
            <span
              className="text-xs font-black"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--aurora-green)",
              }}
            >
              A
            </span>
          </div>
          <span
            className="text-sm font-semibold tracking-wide"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--text-primary)",
              letterSpacing: "0.08em",
            }}
          >
            ARCHIE
          </span>
        </div>

        {/* Center progress */}
        {tasks.length > 0 && (
          <div className="flex-1 max-w-xs mx-8">
            <div className="flex items-center gap-3">
              <ProgressBar percent={overallProgress} />
              <span
                className="text-xs font-mono font-bold shrink-0"
                style={{ color: "var(--aurora-green)" }}
              >
                {overallProgress}%
              </span>
            </div>
          </div>
        )}

        <StatusDot />
      </header>

      {/* Task overlay — top left when building */}
      {tasks.length > 0 && (
        <div
          className="absolute top-14 left-4 z-20 w-64 game-panel p-4 overflow-y-auto"
          style={{ maxHeight: "50vh" }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="nav-label">Build Progress</span>
            <span
              className="text-[10px] font-mono font-bold px-2 py-0.5"
              style={{
                background:
                  plan?.status === "complete"
                    ? "rgba(61,245,167,0.12)"
                    : plan?.status === "building"
                    ? "rgba(74,158,255,0.12)"
                    : "var(--surface2)",
                color:
                  plan?.status === "complete"
                    ? "var(--aurora-green)"
                    : plan?.status === "building"
                    ? "var(--aurora-blue)"
                    : "var(--text-muted)",
                border: `1px solid ${
                  plan?.status === "complete"
                    ? "rgba(61,245,167,0.15)"
                    : plan?.status === "building"
                    ? "rgba(74,158,255,0.15)"
                    : "transparent"
                }`,
              }}
            >
              {plan?.status === "complete"
                ? "DONE"
                : plan?.status === "building"
                ? "BUILDING"
                : plan?.status === "waiting_approval"
                ? "PLANNING"
                : "IDLE"}
            </span>
          </div>

          <TaskList
            tasks={tasks}
            selectedId={selectedTask}
            onSelect={(t) => setSelectedTask(t.id === selectedTask ? null : t.id)}
          />

          {selectedTask &&
            (() => {
              const task = tasks.find((t) => t.id === selectedTask);
              if (!task) return null;
              return (
                <div
                  className="mt-3 p-3"
                  style={{
                    background: "var(--surface)",
                    borderTop: "1px solid var(--panel-divider)",
                  }}
                >
                  <h4
                    className="font-bold text-xs mb-1"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {task.label}
                  </h4>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {task.detail || "Waiting to start..."}
                  </p>
                </div>
              );
            })()}
        </div>
      )}

      {/* Plan card overlay — bottom left */}
      {plan && plan.status === "waiting_approval" && (
        <div
          className="absolute bottom-6 left-6 z-20 game-panel p-5 max-w-md"
        >
          <h3
            className="font-bold text-base mb-3"
            style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
          >
            {plan.name}
          </h3>
          <div className="flex flex-col gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
            {[
              { label: "World", value: plan.world, color: "var(--aurora-green)" },
              { label: "Objects", value: plan.objects, color: "var(--aurora-teal)" },
              ...(plan.characters ? [{ label: "Characters", value: plan.characters, color: "var(--aurora-blue)" }] : []),
              { label: "Gameplay", value: plan.gameplay, color: "var(--aurora-purple)" },
              { label: "Audio", value: plan.audio, color: "var(--aurora-blue)" },
            ].map((item, i) => (
              <div
                key={i}
                className="flex gap-2 py-1"
                style={{ borderBottom: "1px solid var(--panel-divider)" }}
              >
                <span className="font-semibold shrink-0 w-20" style={{ color: item.color }}>
                  {item.label}
                </span>
                <span>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Right panel — Chat — 80% height, square, game-UI */}
      <div
        className="absolute right-4 z-20 flex flex-col"
        style={{
          top: "10%",
          height: "80%",
          width: "360px",
          background: "var(--panel-bg)",
          backdropFilter: "blur(20px) saturate(1.2)",
          WebkitBackdropFilter: "blur(20px) saturate(1.2)",
          border: "1px solid var(--panel-border)",
          /* square — no border-radius */
        }}
      >
        <ChatPanel
          messages={messages}
          onSend={handleSend}
          disabled={loading}
          planStatus={plan?.status}
        />
      </div>
    </div>
  );
}
