/** Minimal markdown renderer (headings, lists, bold/italic, code, links, quotes, rules). */
const inline = (s: string) => {
  const esc = s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return esc
    .replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 bg-white/10 rounded text-[0.85em]">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>")
    .replace(
      /\[([^\]]+)\]\((https?:[^)\s]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="underline hover:text-white">$1</a>'
    );
};

const MarkdownView = ({ source }: { source: string }) => {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: JSX.Element[] = [];
  let list: string[] = [];
  let code: string[] | null = null;

  const flushList = () => {
    if (!list.length) return;
    blocks.push(
      <ul key={`ul-${blocks.length}`} className="list-disc pl-5 space-y-1 my-2">
        {list.map((li, i) => (
          <li key={i} dangerouslySetInnerHTML={{ __html: inline(li) }} />
        ))}
      </ul>
    );
    list = [];
  };

  lines.forEach((raw, idx) => {
    const line = raw.trimEnd();
    if (line.trim().startsWith("```")) {
      if (code === null) {
        flushList();
        code = [];
      } else {
        blocks.push(
          <pre key={`code-${idx}`} className="my-3 p-3 bg-white/5 border border-white/10 rounded overflow-x-auto text-[11px] whitespace-pre">
            {code.join("\n")}
          </pre>
        );
        code = null;
      }
      return;
    }
    if (code !== null) {
      code.push(raw);
      return;
    }
    if (!line.trim()) {
      flushList();
      return;
    }
    const h = line.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      flushList();
      const level = h[1].length;
      const sizes = ["text-lg", "text-base", "text-sm", "text-xs"];
      blocks.push(
        <p
          key={`h-${idx}`}
          className={`${sizes[level - 1]} font-display tracking-[0.15em] uppercase text-white mt-4 mb-2`}
          dangerouslySetInnerHTML={{ __html: inline(h[2]) }}
        />
      );
      return;
    }
    if (/^(-{3,}|\*{3,})$/.test(line.trim())) {
      flushList();
      blocks.push(<hr key={`hr-${idx}`} className="my-4 border-white/10" />);
      return;
    }
    const li = line.match(/^\s*[-*+]\s+(.*)$/);
    if (li) {
      list.push(li[1]);
      return;
    }
    const q = line.match(/^>\s?(.*)$/);
    if (q) {
      flushList();
      blocks.push(
        <blockquote
          key={`q-${idx}`}
          className="my-2 pl-3 border-l-2 border-white/20 text-white/50 italic"
          dangerouslySetInnerHTML={{ __html: inline(q[1]) }}
        />
      );
      return;
    }
    flushList();
    blocks.push(
      <p key={`p-${idx}`} className="my-2 leading-relaxed" dangerouslySetInnerHTML={{ __html: inline(line) }} />
    );
  });
  flushList();

  return <div className="text-sm text-white/70 font-body">{blocks}</div>;
};

export default MarkdownView;
