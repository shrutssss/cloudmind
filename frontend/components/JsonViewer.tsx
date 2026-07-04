type JsonViewerProps = {
  value: Record<string, unknown> | null;
};

function escapeHtml(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function highlightJson(input: string) {
  const escaped = escapeHtml(input);

  return escaped
    .replace(/("(?:\\.|[^"\\])*")(?=\s*:)/g, '<span class="json-key">$1</span>')
    .replace(/: ("(?:\\.|[^"\\])*")/g, ': <span class="json-string">$1</span>')
    .replace(/: (-?\d+(?:\.\d+)?(?:e[+-]?\d+)?)/gi, ': <span class="json-number">$1</span>')
    .replace(/: (true|false)/g, ': <span class="json-boolean">$1</span>')
    .replace(/: (null)/g, ': <span class="json-null">$1</span>');
}

export default function JsonViewer({ value }: JsonViewerProps) {
  if (!value || Object.keys(value).length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-6 text-sm text-slate-400">
        Session state will appear here after the next agent run.
      </div>
    );
  }

  const json = JSON.stringify(value, null, 2);

  return (
    <pre
      className="json-viewer overflow-auto rounded-2xl border border-white/10 bg-[#07101d] px-4 py-4 text-xs leading-6 text-slate-200"
      dangerouslySetInnerHTML={{ __html: highlightJson(json) }}
    />
  );
}