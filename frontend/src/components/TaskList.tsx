"use client";

import type { TaskStep } from "@/lib/api";

interface TaskListProps {
  tasks: TaskStep[];
  onSelect?: (task: TaskStep) => void;
  selectedId?: string | null;
}

export default function TaskList({ tasks, onSelect, selectedId }: TaskListProps) {
  return (
    <div className="flex flex-col gap-2">
      {tasks.map((task) => {
        const isSelected = selectedId === task.id;
        const isDone = task.status === "done";
        const isActive = task.status === "active";

        return (
          <button
            key={task.id}
            onClick={() => onSelect?.(task)}
            className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-left cursor-pointer"
            style={{
              background: isSelected
                ? "rgba(74,138,212,0.12)"
                : "var(--surface)",
              border: `1px solid ${isSelected ? "var(--blue-border)" : "transparent"}`,
              transition: "background var(--t-fast), border-color var(--t-fast)",
            }}
          >
            <div className="flex items-center gap-3 min-w-0">
              {/* Status dot */}
              <div
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{
                  background: isDone
                    ? "var(--teal)"
                    : isActive
                    ? "var(--blue)"
                    : "var(--surface3)",
                }}
              />
              <span
                className="text-sm font-semibold truncate"
                style={{ color: isDone ? "var(--fog)" : "var(--text-primary)" }}
              >
                {task.label}
              </span>
            </div>

            {/* Progress */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="progress-bar w-16" style={{ height: 6 }}>
                <div
                  className="progress-fill"
                  style={{
                    width: `${task.progress}%`,
                    background: isDone
                      ? "var(--teal)"
                      : "linear-gradient(90deg, var(--blue), var(--teal))",
                  }}
                />
              </div>
              <span
                className="text-xs font-mono font-bold w-8 text-right"
                style={{
                  color: isDone ? "var(--teal)" : isActive ? "var(--blue)" : "var(--fog-light)",
                }}
              >
                {task.progress}%
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
