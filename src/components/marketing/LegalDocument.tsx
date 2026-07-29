import { Fragment } from "react";

/** Renders inline **bold** and *italic* within a line of plain text. */
function renderInline(text: string, keyPrefix: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).filter(Boolean);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={`${keyPrefix}-${i}`}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return (
        <em key={`${keyPrefix}-${i}`} className="text-muted-foreground">
          {part.slice(1, -1)}
        </em>
      );
    }
    return <Fragment key={`${keyPrefix}-${i}`}>{part}</Fragment>;
  });
}

/**
 * Purpose-built renderer for the small markdown subset the legal documents
 * actually use (# / ## headings, **bold**, *italic*, "- " bullet lists,
 * blank-line-separated paragraphs) — not a general markdown library, since
 * that's more dependency than three static legal pages need.
 */
export function LegalDocument({ body }: { body: string }) {
  const lines = body.trim().split("\n");
  const blocks: React.ReactNode[] = [];
  let listItems: string[] = [];

  const flushList = (key: string) => {
    if (listItems.length === 0) return;
    blocks.push(
      <ul key={key} className="my-4 list-disc space-y-1.5 pl-6">
        {listItems.map((item, i) => (
          <li key={i}>{renderInline(item, `${key}-li-${i}`)}</li>
        ))}
      </ul>,
    );
    listItems = [];
  };

  lines.forEach((raw, i) => {
    const line = raw.trim();
    if (line.startsWith("- ")) {
      listItems.push(line.slice(2));
      return;
    }
    flushList(`list-${i}`);
    if (!line) return;
    if (line.startsWith("## ")) {
      blocks.push(
        <h2 key={i} className="mt-8 font-serif text-2xl">
          {line.slice(3)}
        </h2>,
      );
    } else if (line.startsWith("# ")) {
      blocks.push(
        <h1 key={i} className="font-serif text-3xl">
          {line.slice(2)}
        </h1>,
      );
    } else {
      blocks.push(
        <p key={i} className="mt-3 leading-relaxed text-foreground">
          {renderInline(line, `p-${i}`)}
        </p>,
      );
    }
  });
  flushList("list-end");

  return <div className="mx-auto max-w-3xl px-5 py-12 lg:px-0">{blocks}</div>;
}
