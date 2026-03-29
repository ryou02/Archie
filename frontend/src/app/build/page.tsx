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

  // Start session on mount
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
      setMessages((prev) => [...prev, { role: "assistant", content: "Oops, something went wrong!" }]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Overall progress
  const overallProgress = tasks.length
    ? Math.round(tasks.reduce((sum, t) => sum + t.progress, 0) / tasks.length)
    : 0;

  return (
    <div className="flex flex-col h-screen" style={{ background: "var(--ink)" }}>
      {/* Top bar */}
      <header
        className="flex items-center justify-between px-6 py-3 shrink-0"
        style={{
          background: "var(--surface)",
          borderBottom: "1px solid var(--surface3)",
        }}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, var(--blue), var(--teal))" }}
          >
            <span className="text-white text-sm font-black">A</span>
          </div>
          <span className="nav-label">Archie</span>
        </div>

        {/* Center progress */}
        {tasks.length > 0 && (
          <div className="flex-1 max-w-md mx-8">
            <ProgressBar percent={overallProgress} />
          </div>
        )}

        <div className="flex items-center gap-4">
          <StatusDot />
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 min-h-0">
        {/* Chat — left side */}
        <div
          className="flex flex-col"
          style={{
            flex: tasks.length > 0 ? "1 1 0%" : "1 1 100%",
            background: "var(--surface)",
            borderRight: tasks.length > 0 ? "1px solid var(--surface3)" : "none",
            transition: "flex var(--t-slow)",
          }}
        >
          {/* Plan card */}
          {plan && plan.status === "waiting_approval" && (
            <div
              className="mx-5 mt-4 p-4 rounded-xl"
              style={{
                background: "var(--surface2)",
                border: "1px solid var(--blue-border)",
              }}
            >
              <h3 className="font-bold text-base mb-2">{plan.name}</h3>
              <div className="flex flex-col gap-1 text-sm" style={{ color: "var(--fog)" }}>
                <p><span className="font-semibold" style={{ color: "var(--text-primary)" }}>World:</span> {plan.world}</p>
                <p><span className="font-semibold" style={{ color: "var(--text-primary)" }}>Objects:</span> {plan.objects}</p>
                {plan.characters && (
                  <p><span className="font-semibold" style={{ color: "var(--text-primary)" }}>Characters:</span> {plan.characters}</p>
                )}
                <p><span className="font-semibold" style={{ color: "var(--text-primary)" }}>Gameplay:</span> {plan.gameplay}</p>
                <p><span className="font-semibold" style={{ color: "var(--text-primary)" }}>Audio:</span> {plan.audio}</p>
              </div>
            </div>
          )}

          <ChatPanel
            messages={messages}
            onSend={handleSend}
            disabled={loading}
            planStatus={plan?.status}
          />
        </div>

        {/* Task sidebar — right side, only shows when we have tasks */}
        {tasks.length > 0 && (
          <div
            className="w-80 shrink-0 flex flex-col overflow-y-auto p-4"
            style={{ background: "var(--surface2)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="nav-label">Build Progress</span>
              <span
                className="text-xs font-mono font-bold px-2 py-1 rounded-md"
                style={{
                  background:
                    plan?.status === "complete"
                      ? "var(--teal-dim)"
                      : plan?.status === "building"
                      ? "var(--blue-dim)"
                      : "var(--surface3)",
                  color:
                    plan?.status === "complete"
                      ? "var(--teal)"
                      : plan?.status === "building"
                      ? "var(--blue)"
                      : "var(--fog)",
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

            {/* Selected task detail */}
            {selectedTask && (() => {
              const task = tasks.find((t) => t.id === selectedTask);
              if (!task) return null;
              return (
                <div
                  className="mt-4 p-4 rounded-xl"
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--surface3)",
                  }}
                >
                  <h4 className="font-bold text-sm mb-1">{task.label}</h4>
                  <p className="text-xs" style={{ color: "var(--fog)" }}>
                    {task.detail || "Waiting to start..."}
                  </p>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
