type ChatMessageProps = {
  message: string;
  role: "user" | "agent";
  timestamp: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function renderMarkdown(value: string) {
  const escaped = escapeHtml(value);

  return escaped
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/\n/g, "<br />");
}

export default function ChatMessage({ message, role, timestamp }: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <div className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`flex max-w-[80%] items-start gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
        {!isUser ? (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#3b82f6,#8b5cf6)] text-sm font-semibold text-white shadow-[0_10px_30px_rgba(59,130,246,0.25)]">
            CM
          </div>
        ) : null}

        <div
          className={`rounded-[24px] px-4 py-3 shadow-[0_20px_50px_rgba(0,0,0,0.18)] backdrop-blur-xl ${
            isUser
              ? "bg-[linear-gradient(135deg,rgba(59,130,246,0.95),rgba(139,92,246,0.92))] text-white"
              : "border border-white/10 bg-white/[0.05] text-slate-100"
          }`}
        >
          <div
            className="prose prose-invert max-w-none prose-headings:mt-0 prose-headings:mb-2 prose-p:my-2 prose-strong:text-white prose-code:rounded prose-code:bg-white/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:text-white"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(message) }}
          />
          <div className={`mt-2 text-xs ${isUser ? "text-white/75" : "text-slate-500"}`}>
            {new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>
      </div>
    </div>
  );
}