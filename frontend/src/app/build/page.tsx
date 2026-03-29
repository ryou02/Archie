"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import AmbientBackground from "@/components/AmbientBackground";
import AvatarExperience from "@/components/AvatarExperience";
import ChatPanel from "@/components/ChatPanel";
import {
  mergeArchivedBuildSessions,
  toggleBuildSessionExpanded,
  type BuildSession,
  type ChatHistoryItem,
} from "@/lib/build-history";
import {
  getPlan,
  sendMessage,
  startSession,
  type Plan,
  type PlanSnapshot,
} from "@/lib/api";
import { useVoiceInput } from "@/lib/use-voice-input";
import { useVoiceOutput } from "@/lib/use-voice-output";

const BUILD_REVEAL_MS = 480;

function appendAssistantMessage(history: ChatHistoryItem[], content: string) {
  return [...history, { type: "text", role: "assistant", content } satisfies ChatHistoryItem];
}

function appendUserMessage(history: ChatHistoryItem[], content: string) {
  return [...history, { type: "text", role: "user", content } satisfies ChatHistoryItem];
}

export default function BuildPage() {
  const [isEntering, setIsEntering] = useState(true);
  const [composerInput, setComposerInput] = useState("");
  const [history, setHistory] = useState<ChatHistoryItem[]>([]);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeSession, setActiveSession] = useState<BuildSession | null>(null);
  const startedRef = useRef(false);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { speak, visemes, isPlaying, audioRef } = useVoiceOutput();

  const applySnapshot = useCallback(
    (snapshot: PlanSnapshot) => {
      setPlan(snapshot.plan ?? null);
      setActiveSession(snapshot.activeBuildSession ?? null);
      setHistory((currentHistory) =>
        mergeArchivedBuildSessions(
          currentHistory,
          snapshot.archivedBuildSessions ?? []
        )
      );
    },
    []
  );

  const stopPlanPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const pollPlan = useCallback(async () => {
    try {
      const snapshot = await getPlan();
      applySnapshot(snapshot);
    } catch (error) {
      console.error("Plan polling error:", error);
    }
  }, [applySnapshot]);

  const startPlanPolling = useCallback(() => {
    stopPlanPolling();
    void pollPlan();
    pollTimerRef.current = setInterval(() => {
      void pollPlan();
    }, 600);
  }, [pollPlan, stopPlanPolling]);

  useEffect(() => {
    if (startedRef.current) {
      return;
    }

    startedRef.current = true;
    setLoading(true);

    startSession()
      .then((data) => {
        applySnapshot(data);
        if (data.speech) {
          setHistory((currentHistory) =>
            appendAssistantMessage(currentHistory, data.speech as string)
          );
          void speak(data.speech).catch((error) => {
            console.error("TTS playback error:", error);
          });
        }
      })
      .catch((error) => {
        console.error(error);
      })
      .finally(() => setLoading(false));
  }, [applySnapshot, speak]);

  useEffect(() => stopPlanPolling, [stopPlanPolling]);

  const handleSend = useCallback(
    async (text: string) => {
      setHistory((currentHistory) => appendUserMessage(currentHistory, text));
      setLoading(true);
      startPlanPolling();

      try {
        const data = await sendMessage(text);
        stopPlanPolling();
        applySnapshot(data);

        if (data.speech) {
          setHistory((currentHistory) =>
            appendAssistantMessage(currentHistory, data.speech as string)
          );
          void speak(data.speech).catch((error) => {
            console.error("TTS playback error:", error);
          });
        }
      } catch (error) {
        console.error(error);
        setHistory((currentHistory) =>
          appendAssistantMessage(currentHistory, "Oops, something went wrong!")
        );

        try {
          const snapshot = await getPlan();
          applySnapshot(snapshot);
        } catch (planError) {
          console.error("Plan refresh error:", planError);
        }
      } finally {
        stopPlanPolling();
        setLoading(false);
      }
    },
    [applySnapshot, speak, startPlanPolling, stopPlanPolling]
  );

  const {
    supported: micSupported,
    state: micState,
    startRecording,
    stopRecording,
  } = useVoiceInput({
    onTranscript: (text) => {
      const transcript = text.trim();
      if (transcript) {
        setComposerInput(transcript);
      }
    },
    onError: (error) => {
      console.error("Voice input error:", error);
    },
  });

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setIsEntering(false);
      return;
    }

    const enterTimer = setTimeout(() => {
      setIsEntering(false);
    }, BUILD_REVEAL_MS);

    return () => {
      clearTimeout(enterTimer);
    };
  }, []);

  return (
    <div className={`build-page relative h-screen overflow-hidden${isEntering ? " build-page--entering" : ""}`}>
      <AmbientBackground surface="build" />

      <div className="workspace-layout">
        <section className="workspace-stage">
          <div className={`workspace-avatar${isEntering ? " workspace-avatar--entering" : ""}`}>
            <AvatarExperience
              visemes={visemes}
              isPlaying={isPlaying}
              audioRef={audioRef}
            />
          </div>
        </section>

        <aside className="workspace-rail">
          <div
            className={`workspace-chat glass-shell glass-shell--chat flex flex-col${
              isEntering ? " workspace-chat--entering" : ""
            }`}
          >
            <ChatPanel
              history={history}
              plan={plan}
              activeSession={activeSession}
              inputValue={composerInput}
              onInputChange={setComposerInput}
              onSend={handleSend}
              onToggleSession={(sessionId) =>
                setHistory((currentHistory) =>
                  toggleBuildSessionExpanded(currentHistory, sessionId)
                )
              }
              disabled={loading}
              planStatus={plan?.status}
              micSupported={micSupported}
              micState={micState}
              onMicStart={() => {
                void startRecording();
              }}
              onMicStop={stopRecording}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
