import { useEffect, useId, useMemo, useState } from "react";
import { Check, RotateCcw } from "lucide-react";

export type ChecklistSection = {
  /** Stable key — used in the saved state, so don't renumber these casually. */
  key: string;
  title: string;
  items: string[];
};

/**
 * A working checklist, not a list of bullets.
 *
 * Progress persists to localStorage because the realistic use is a family
 * walking the house over an evening (or a weekend), not reading top to bottom
 * in one sitting. Losing their ticks on a page refresh would make the tool
 * worse than paper.
 */
export function InteractiveChecklist({
  sections,
  storageKey,
}: {
  sections: ChecklistSection[];
  storageKey: string;
}) {
  const allIds = useMemo(
    () => sections.flatMap((s) => s.items.map((_, i) => `${s.key}:${i}`)),
    [sections],
  );

  const [checked, setChecked] = useState<Set<string>>(new Set());
  // Gate persistence until after the first client render. Writing on mount
  // would clobber saved state with an empty set during hydration.
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          // Intersect with current ids so edits to the checklist don't
          // resurrect ticks for items that no longer exist.
          const valid = new Set(allIds);
          setChecked(new Set(parsed.filter((id): id is string => typeof id === "string" && valid.has(id))));
        }
      }
    } catch {
      // Private browsing, disabled storage, or corrupt JSON — start empty
      // rather than breaking the page over a nice-to-have.
    }
    setRestored(true);
  }, [storageKey, allIds]);

  useEffect(() => {
    if (!restored) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify([...checked]));
    } catch {
      // Storage unavailable or full — the checklist still works in-session.
    }
  }, [checked, restored, storageKey]);

  const toggle = (id: string) =>
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const done = checked.size;
  const total = allIds.length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  const headingId = useId();

  return (
    <section
      aria-labelledby={headingId}
      className="not-prose my-10 overflow-hidden rounded-3xl border border-border bg-secondary/30"
    >
      <div className="border-b border-border bg-background/60 px-6 py-5 md:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
              Your checklist
            </p>
            <h2 id={headingId} className="mt-1 font-serif text-2xl tracking-tight">
              {done} of {total} done
            </h2>
          </div>
          {done > 0 && (
            <button
              type="button"
              onClick={() => setChecked(new Set())}
              className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold transition hover:bg-secondary"
            >
              <RotateCcw className="size-3.5" aria-hidden /> Start over
            </button>
          )}
        </div>

        <div
          className="mt-4 h-2 overflow-hidden rounded-full bg-border"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${pct}% complete`}
        >
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Ticks are saved on this device — come back and pick up where you left off.
        </p>
      </div>

      <div className="divide-y divide-border">
        {sections.map((section) => {
          const sectionIds = section.items.map((_, i) => `${section.key}:${i}`);
          const sectionDone = sectionIds.filter((id) => checked.has(id)).length;
          const complete = sectionDone === section.items.length;

          return (
            <div key={section.key} className="px-6 py-5 md:px-8">
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-lg tracking-tight">{section.title}</h3>
                {complete && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                    <Check className="size-3" aria-hidden /> Done
                  </span>
                )}
              </div>
              <ul className="mt-3 space-y-1">
                {section.items.map((item, i) => {
                  const id = `${section.key}:${i}`;
                  const isChecked = checked.has(id);
                  return (
                    <li key={id}>
                      <label className="flex cursor-pointer items-start gap-3 rounded-2xl px-3 py-2.5 transition hover:bg-background/70">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggle(id)}
                          className="mt-1 size-5 shrink-0 accent-primary"
                        />
                        <span
                          className={
                            isChecked
                              ? "text-base leading-relaxed text-muted-foreground line-through"
                              : "text-base leading-relaxed"
                          }
                        >
                          {item}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}
