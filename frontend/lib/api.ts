export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const API_BASE = `${API_URL}/api`;

export interface SpendSummary {
  project_id?: string;
  service?: string;
  total_cost: number;
}

export interface Budget {
  id?: number;
  project_id: string;
  monthly_budget: number;
  current_month_spend: number;
  budget_used_pct: number;
  alert_threshold_pct: number;
  alert_triggered: boolean | number;
}

export interface AuditLogEntry {
  id?: number;
  timestamp: string;
  agent_name: string;
  action: string;
  resource_id?: string | null;
  details: string;
  severity: string;
  session_id?: string | null;
  status: string;
}

export interface DashboardData {
  spend_by_project: SpendSummary[];
  spend_by_service: SpendSummary[];
  budgets: Budget[];
  recent_audit_logs: AuditLogEntry[];
  total_resources: number;
}

export interface ChatResponse {
  response: string;
  session_id: string;
}

export interface SessionStateResponse {
  session_id: string;
  state: Record<string, unknown>;
}

export interface ReportResponse {
  report: string;
  audience: string;
  project_id: string;
}

export interface AlertsResponse {
  alerts: string;
}

export interface QuickAlertsResponse {
  alerts: Budget[];
  total: number;
}

export interface ForecastResponse {
  forecast: string;
  project_id: string;
  horizon_days: number;
}

export interface AuditLogResponse {
  logs: AuditLogEntry[];
  total: number;
}

export interface AgentStartEvent {
  type: "agent_start";
  agent: string;
  message: string;
}

export interface SessionEvent {
  type: "session";
  session_id: string;
}

export interface AgentResultEvent {
  type: "agent_result";
  agent: string;
  message: string;
}

export interface FinalResponseEvent {
  type: "final_response";
  message: string;
}

export interface DoneEvent {
  type: "done";
}

export type AgentEvent =
  | AgentStartEvent
  | AgentResultEvent
  | FinalResponseEvent
  | SessionEvent
  | DoneEvent
  | { type: string; [key: string]: unknown };

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
    ...init,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Request failed with ${response.status} ${response.statusText}: ${errorBody}`,
    );
  }

  return (await response.json()) as T;
}

export async function getDashboardSummary(): Promise<DashboardData> {
  return requestJson<DashboardData>("/dashboard/summary");
}

export async function sendChatMessage(
  message: string,
  sessionId?: string,
): Promise<ChatResponse> {
  return requestJson<ChatResponse>("/chat", {
    method: "POST",
    body: JSON.stringify({ message, session_id: sessionId }),
  });
}

export async function getChatSessionState(sessionId: string): Promise<SessionStateResponse> {
  return requestJson<SessionStateResponse>(
    `/chat/session-state?session_id=${encodeURIComponent(sessionId)}`,
  );
}

export function streamChatMessage(
  message: string,
  sessionId: string | undefined,
  onEvent: (event: AgentEvent) => void,
  onDone: () => void,
): () => void {
  const controller = new AbortController();

  void fetch(`${API_BASE}/chat/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify({ message, session_id: sessionId }),
    signal: controller.signal,
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`Stream failed with ${response.status} ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error("Streaming response body is not available.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let eventLines: string[] = [];
      let streamCompleted = false;

      const flushEvent = () => {
        if (eventLines.length === 0) {
          return;
        }

        const data = eventLines.join("\n").trim();
        eventLines = [];

        if (!data) {
          return;
        }

        try {
          const parsed = JSON.parse(data) as AgentEvent;
          onEvent(parsed);
          if ((parsed as { type?: string }).type === "done") {
            streamCompleted = true;
            onDone();
          }
        } catch {
          // Ignore malformed SSE payloads and keep consuming the stream.
        }
      };

      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) {
            flushEvent();
            if (!streamCompleted) {
              onDone();
            }
            break;
          }

          buffer += decoder.decode(value, { stream: true });

          let boundaryIndex = buffer.indexOf("\n");
          while (boundaryIndex !== -1) {
            const rawLine = buffer.slice(0, boundaryIndex).replace(/\r$/, "");
            buffer = buffer.slice(boundaryIndex + 1);

            if (rawLine.startsWith("data:")) {
              eventLines.push(rawLine.slice(5).trimStart());
            } else if (rawLine.trim() === "") {
              flushEvent();
            }

            boundaryIndex = buffer.indexOf("\n");
          }
        }
      } finally {
        reader.releaseLock();
      }
    })
    .catch((error: unknown) => {
      if (!controller.signal.aborted) {
        console.error("CloudMind chat stream error:", error);
        onDone();
      }
    });

  return () => controller.abort();
}

export async function generateReport(
  audience: "cfo" | "engineering",
  projectId?: string,
): Promise<ReportResponse> {
  const query = new URLSearchParams({ audience });

  if (projectId) {
    query.set("project_id", projectId);
  }

  return requestJson<ReportResponse>(`/reports/generate?${query.toString()}`);
}

export async function getAlerts(): Promise<AlertsResponse> {
  return requestJson<AlertsResponse>("/alerts");
}

export async function getQuickAlerts(): Promise<QuickAlertsResponse> {
  return requestJson<QuickAlertsResponse>("/alerts/quick");
}

export async function getForecast(
  projectId: string,
  horizonDays = 30,
): Promise<ForecastResponse> {
  return requestJson<ForecastResponse>(
    `/forecast/${encodeURIComponent(projectId)}?horizon_days=${encodeURIComponent(String(horizonDays))}`,
  );
}

export async function getAuditLog(
  limit = 50,
  agentName?: string,
  severity?: string,
): Promise<AuditLogResponse> {
  const query = new URLSearchParams({ limit: String(limit) });

  if (agentName) {
    query.set("agent_name", agentName);
  }

  if (severity) {
    query.set("severity", severity);
  }

  return requestJson<AuditLogResponse>(`/audit-log?${query.toString()}`);
}