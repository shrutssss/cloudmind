"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import AgentActivity from "@/components/AgentActivity";
import ChatMessage from "@/components/ChatMessage";
import JsonViewer from "@/components/JsonViewer";
import { API_URL, getChatSessionState, sendChatMessage, type AgentEvent, type ChatResponse } from "@/lib/api";

type ChatRole = "user" | "agent";

type ChatItem = {
  id: string;
  role: ChatRole;
  message: string;
  timestamp: string;
};

type ActivityItem = {
  agent: string;
  status: "working" | "done";
  message: string;
};

type ToastItem = {
  id: string;
  message: string;
};

const quickActions = [
  "Why did costs spike?",
  "Generate CFO report",
  "Find zombie resources",
  "30-day forecast",
];

function formatAgentLabel(agent: string) {
  return agent
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatItem[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [sessionState, setSessionState] = useState<Record<string, unknown> | null>(null);
  const [showSessionState, setShowSessionState] = useState(true);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const streamCleanupRef = useRef<(() => void) | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const messageCounterRef = useRef(0);
  const sessionIdRef = useRef<string | undefined>(undefined);
  const toastTimersRef = useRef<number[]>([]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activities, typing]);

  useEffect(() => {
    const timers = toastTimersRef.current;

    return () => {
      streamCleanupRef.current?.();
      timers.forEach((timerId) => window.clearTimeout(timerId));
    };
  }, []);

  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) {
      return;
    }

    void refreshSessionState(sessionId);
  }, [sessionId]);

  const canSend = useMemo(() => input.trim().length > 0 && !isSending, [input, isSending]);

  function appendMessage(role: ChatRole, message: string) {
    messageCounterRef.current += 1;
    const id = `${role}-${messageCounterRef.current}`;
    setMessages((current) => [
      ...current,
      { id, role, message, timestamp: new Date().toISOString() },
    ]);
  }

  function appendActivity(activity: ActivityItem) {
    setActivities((current) => {
      const existingIndex = current.findIndex((item) => item.agent === activity.agent);

      if (existingIndex === -1) {
        return [...current, activity];
      }

      const next = [...current];
      next[existingIndex] = activity;
      return next;
    });
  }

  function pushToast(message: string) {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setToasts((current) => [...current, { id, message }]);

    const timerId = window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 3200);

    toastTimersRef.current.push(timerId);
  }

  async function refreshSessionState(nextSessionId?: string) {
    if (!nextSessionId) {
      return;
    }

    try {
      const response = await getChatSessionState(nextSessionId);
      setSessionState(response.state);
    } catch {
      // Keep the last known session state visible if refresh fails.
    }
  }

  function summarizeCompletion(agent: string, message: string) {
    if (agent === "anomaly_detection") {
      return "1 spike found";
    }

    const firstSentence = message.split(/[.!?]/)[0]?.trim();
    return firstSentence || "Task complete";
  }

  function clearRunState() {
    setActivities([]);
    setError(null);
  }

  async function sendViaSse(message: string, nextSessionId?: string) {
    return new Promise<void>((resolve, reject) => {
      let finalized = false;

      const safeResolve = () => {
        if (!finalized) {
          finalized = true;
          resolve();
        }
      };

      const safeReject = (reason: unknown) => {
        if (!finalized) {
          finalized = true;
          reject(reason);
        }
      };

      const controller = new AbortController();
      streamCleanupRef.current?.();
      streamCleanupRef.current = () => controller.abort();

      void fetch(`${API_URL}/api/chat/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify({ message, session_id: nextSessionId }),
        signal: controller.signal,
      })
        .then(async (response) => {
          if (!response.ok || !response.body) {
            throw new Error("Streaming unavailable");
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";
          let eventLines: string[] = [];
          let receivedFinal = false;

          const flushEvent = () => {
            if (!eventLines.length) {
              return;
            }

            const raw = eventLines.join("\n").trim();
            eventLines = [];

            if (!raw) {
              return;
            }

            try {
              const event = JSON.parse(raw) as AgentEvent;

              if (event.type === "session") {
                const nextSessionId = typeof event.session_id === "string" ? event.session_id : undefined;

                if (nextSessionId) {
                  sessionIdRef.current = nextSessionId;
                  setSessionId(nextSessionId);
                  void refreshSessionState(nextSessionId);
                }
              }

              if (event.type === "agent_start") {
                const agentName = typeof event.agent === "string" ? event.agent : "";
                const eventMessage = typeof event.message === "string" ? event.message : "";

                if (!agentName) {
                  return;
                }

                appendActivity({
                  agent: formatAgentLabel(agentName),
                  status: "working",
                  message: eventMessage,
                });
              }

              if (event.type === "agent_result") {
                const agentName = typeof event.agent === "string" ? event.agent : "";
                const eventMessage = typeof event.message === "string" ? event.message : "";

                if (!agentName) {
                  return;
                }

                const completionMessage = summarizeCompletion(agentName, eventMessage);

                appendActivity({
                  agent: formatAgentLabel(agentName),
                  status: "done",
                  message: eventMessage,
                });
                pushToast(`✅ ${formatAgentLabel(agentName)} complete — ${completionMessage}`);
              }

              if (event.type === "final_response") {
                const finalMessage = typeof event.message === "string" ? event.message : "";
                if (!finalMessage) {
                  return;
                }

                appendMessage("agent", finalMessage);
                receivedFinal = true;
              }

              if (event.type === "done") {
                void refreshSessionState(sessionIdRef.current);
                safeResolve();
              }
            } catch {
              // Ignore malformed event payloads.
            }
          };

          try {
            while (true) {
              const { value, done } = await reader.read();

              if (done) {
                flushEvent();
                if (!receivedFinal) {
                  safeResolve();
                }
                break;
              }

              buffer += decoder.decode(value, { stream: true });

              let nextBoundary = buffer.indexOf("\n");
              while (nextBoundary !== -1) {
                const line = buffer.slice(0, nextBoundary).replace(/\r$/, "");
                buffer = buffer.slice(nextBoundary + 1);

                if (line.startsWith("data:")) {
                  eventLines.push(line.slice(5).trimStart());
                } else if (line.trim() === "") {
                  flushEvent();
                }

                nextBoundary = buffer.indexOf("\n");
              }
            }
          } finally {
            reader.releaseLock();
          }
        })
        .then(() => safeResolve())
        .catch((streamError: unknown) => {
          safeReject(streamError);
        });
    });
  }

  async function handleSend(message: string) {
    const trimmed = message.trim();

    if (!trimmed || isSending) {
      return;
    }

    setInput("");
    setIsSending(true);
    clearRunState();
    setTyping(true);
    appendMessage("user", trimmed);

    const nextSessionId = sessionId;

    try {
      await sendViaSse(trimmed, nextSessionId);
    } catch {
      setError("Streaming failed, falling back to standard chat.");

      try {
        const fallbackResponse: ChatResponse = await sendChatMessage(trimmed, nextSessionId);
        setSessionId(fallbackResponse.session_id);
        sessionIdRef.current = fallbackResponse.session_id;
        appendMessage("agent", fallbackResponse.response);
        void refreshSessionState(fallbackResponse.session_id);
      } catch (fallbackError: unknown) {
        setError(fallbackError instanceof Error ? fallbackError.message : "Failed to send message.");
      }
    } finally {
      setTyping(false);
      setIsSending(false);
      streamCleanupRef.current?.();
      streamCleanupRef.current = null;
      void refreshSessionState(sessionIdRef.current);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-3rem)] flex-col gap-6 lg:min-h-[calc(100vh-3rem)] lg:grid lg:grid-cols-[minmax(0,1fr)_320px]">
      <section className="flex min-h-[75vh] flex-col rounded-[32px] border border-white/10 bg-white/[0.04] shadow-[0_30px_90px_rgba(0,0,0,0.32)] backdrop-blur-xl">
        <div className="page-header-surface border-b border-white/10 px-5 py-4 sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-[0.28em] text-slate-500">Chat orchestrator</div>
              <h1 className="mt-2 text-2xl font-semibold text-white">Talk to CloudMind</h1>
            </div>
            <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.22em] text-slate-300">
              SSE enabled
            </div>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-4 overflow-hidden px-4 py-5 sm:px-6">
          <div className="flex flex-wrap gap-3">
            {quickActions.map((action) => (
              <button
                key={action}
                type="button"
                onClick={() => void handleSend(action)}
                className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-slate-200 transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.08]"
              >
                {action}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto pr-1">
            <div className="space-y-4 pb-6">
              {messages.length === 0 ? (
                <div className="rounded-[28px] border border-dashed border-white/10 bg-white/[0.03] p-8 text-center text-slate-400">
                  Ask CloudMind about anomalies, budget risk, or optimization opportunities.
                </div>
              ) : null}

              {messages.map((message) => (
                <div key={message.id} className="fade-in">
                  <ChatMessage message={message.message} role={message.role} timestamp={message.timestamp} />
                </div>
              ))}

              {typing ? (
                <div className="flex items-center gap-3 text-sm text-slate-400">
                  <div className="h-3 w-3 animate-pulse rounded-full bg-sky-400" />
                  CloudMind is thinking...
                </div>
              ) : null}

              <div ref={endRef} />
            </div>
          </div>

          {error ? (
            <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
              {error}
            </div>
          ) : null}

          <form
            className="rounded-[28px] border border-white/10 bg-[rgba(7,10,18,0.72)] p-3 shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_20px_60px_rgba(0,0,0,0.3)] backdrop-blur-xl"
            onSubmit={(event) => {
              event.preventDefault();
              void handleSend(input);
            }}
          >
            <div className="flex items-end gap-3">
              <label className="flex-1">
                <span className="sr-only">Chat input</span>
                <textarea
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Ask CloudMind to analyze spend, find anomalies, or generate a report..."
                  rows={2}
                  className="min-h-[56px] w-full resize-none rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-sky-400/50 focus:ring-2 focus:ring-sky-400/15"
                />
              </label>

              <button
                type="submit"
                disabled={!canSend}
                className="inline-flex h-[56px] items-center justify-center rounded-[20px] bg-[linear-gradient(135deg,#3b82f6,#8b5cf6)] px-6 text-sm font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_35px_rgba(59,130,246,0.28)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      </section>

      <aside className="lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] lg:overflow-y-auto">
        <div className="flex flex-col gap-6">
          <AgentActivity activities={activities} />

          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.26)] backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-white">Session state</h2>
                <p className="text-sm text-slate-400">Live shared memory view for the current conversation</p>
              </div>
              <button
                type="button"
                onClick={() => setShowSessionState((current) => !current)}
                className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-200 transition hover:border-white/20 hover:bg-white/[0.08]"
              >
                {showSessionState ? "Hide" : "Show"}
              </button>
            </div>

            {showSessionState ? (
              <div className="mt-4">
                <JsonViewer value={sessionState} />
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-dashed border-white/10 px-4 py-6 text-sm text-slate-500">
                Toggle the panel back on to inspect the current session state.
              </div>
            )}
          </div>
        </div>
      </aside>

      <div className="pointer-events-none fixed bottom-6 right-6 z-50 flex w-[min(92vw,360px)] flex-col gap-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto animate-[fade-in_220ms_ease-out] rounded-2xl border border-white/10 bg-[rgba(8,12,20,0.92)] px-4 py-3 text-sm text-slate-100 shadow-[0_20px_60px_rgba(0,0,0,0.32)] backdrop-blur-xl"
          >
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}