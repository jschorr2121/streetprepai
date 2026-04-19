import { cn } from "@/lib/utils";

function renderInline(text: string, key: number): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex =
    /\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let idx = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(
        <span key={`${key}-t-${idx++}`}>{text.slice(last, match.index)}</span>,
      );
    }
    if (match[1])
      parts.push(<strong key={`${key}-b-${idx++}`}>{match[1]}</strong>);
    else if (match[2])
      parts.push(<em key={`${key}-i-${idx++}`}>{match[2]}</em>);
    else if (match[3])
      parts.push(<code key={`${key}-c-${idx++}`}>{match[3]}</code>);
    else if (match[4] && match[5])
      parts.push(
        <a
          key={`${key}-a-${idx++}`}
          href={match[5]}
          className="underline underline-offset-2 text-primary"
        >
          {match[4]}
        </a>,
      );
    last = regex.lastIndex;
  }
  if (last < text.length) {
    parts.push(<span key={`${key}-t-${idx++}`}>{text.slice(last)}</span>);
  }
  return parts.length ? parts : text;
}

export function Markdown({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  const lines = content.split("\n");
  const blocks: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i++;
      continue;
    }

    const h3 = line.match(/^### (.+)$/);
    const h2 = line.match(/^## (.+)$/);
    const h1 = line.match(/^# (.+)$/);
    if (h1) {
      blocks.push(<h1 key={key++}>{h1[1]}</h1>);
      i++;
      continue;
    }
    if (h2) {
      blocks.push(<h2 key={key++}>{h2[1]}</h2>);
      i++;
      continue;
    }
    if (h3) {
      blocks.push(<h3 key={key++}>{h3[1]}</h3>);
      i++;
      continue;
    }

    if (line.startsWith("> ")) {
      const bqLines: string[] = [];
      while (i < lines.length && lines[i].startsWith("> ")) {
        bqLines.push(lines[i].slice(2));
        i++;
      }
      blocks.push(
        <blockquote key={key++}>
          {bqLines.map((l, idx) => (
            <p key={idx}>{renderInline(l, idx)}</p>
          ))}
        </blockquote>,
      );
      continue;
    }

    if (/^[-*] /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*] /.test(lines[i])) {
        items.push(lines[i].replace(/^[-*] /, ""));
        i++;
      }
      blocks.push(
        <ul key={key++}>
          {items.map((t, idx) => (
            <li key={idx}>{renderInline(t, idx)}</li>
          ))}
        </ul>,
      );
      continue;
    }

    if (/^\d+\. /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\. /, ""));
        i++;
      }
      blocks.push(
        <ol key={key++}>
          {items.map((t, idx) => (
            <li key={idx}>{renderInline(t, idx)}</li>
          ))}
        </ol>,
      );
      continue;
    }

    const paragraph: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^#{1,3} /.test(lines[i]) &&
      !/^[-*] /.test(lines[i]) &&
      !/^\d+\. /.test(lines[i]) &&
      !lines[i].startsWith("> ")
    ) {
      paragraph.push(lines[i]);
      i++;
    }
    blocks.push(
      <p key={key++}>{renderInline(paragraph.join(" "), key)}</p>,
    );
  }

  return <div className={cn("prose-guide", className)}>{blocks}</div>;
}
