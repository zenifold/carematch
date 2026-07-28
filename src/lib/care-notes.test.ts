import { describe, expect, it } from "vitest";
import { appendCareNote, parseCareNotes } from "./care-notes";

describe("parseCareNotes", () => {
  it("returns an empty array for null/undefined/empty input", () => {
    expect(parseCareNotes(null)).toEqual([]);
    expect(parseCareNotes(undefined)).toEqual([]);
    expect(parseCareNotes("")).toEqual([]);
  });

  it("parses a single dated entry", () => {
    const parsed = parseCareNotes("[2026-07-01] Loved the garden walk today.");
    expect(parsed).toEqual([{ date: "2026-07-01", text: "Loved the garden walk today." }]);
  });

  it("parses multiple entries and returns newest first", () => {
    const raw = "[2026-07-01] First note.\n\n[2026-07-15] Second note.";
    const parsed = parseCareNotes(raw);
    expect(parsed).toEqual([
      { date: "2026-07-15", text: "Second note." },
      { date: "2026-07-01", text: "First note." },
    ]);
  });

  it("falls back to an empty date for a chunk with no date prefix", () => {
    const parsed = parseCareNotes("Just some legacy text with no date.");
    expect(parsed).toEqual([{ date: "", text: "Just some legacy text with no date." }]);
  });

  it("round-trips through appendCareNote", () => {
    const first = appendCareNote(null, "Ate a full lunch.");
    const second = appendCareNote(first, "Slept most of the afternoon.");
    const parsed = parseCareNotes(second);
    expect(parsed).toHaveLength(2);
    expect(parsed[0].text).toBe("Slept most of the afternoon.");
    expect(parsed[1].text).toBe("Ate a full lunch.");
    expect(parsed[0].date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("appendCareNote", () => {
  it("starts a fresh ledger when there's no existing text", () => {
    const result = appendCareNote(null, "First entry.");
    expect(result).toMatch(/^\[\d{4}-\d{2}-\d{2}\] First entry\.$/);
  });

  it("trims the note text before storing it", () => {
    const result = appendCareNote(null, "  spaced out note  ");
    expect(result).toContain("spaced out note");
    expect(result).not.toContain("  spaced out note  ]");
  });
});
