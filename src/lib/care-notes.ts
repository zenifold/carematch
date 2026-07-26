// profiles.care_notes is an append-only ledger written by
// apply_change_request's 'care_note' branch (and, directly, by the senior):
// entries look like "[YYYY-MM-DD] text", separated by a blank line, newest
// appended last. Shared by both the senior and family care-plan pages.
export type CareNoteEntry = { date: string; text: string };

export function parseCareNotes(raw: string | null | undefined): CareNoteEntry[] {
  if (!raw) return [];
  return raw
    .split(/\n\n+/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const m = chunk.match(/^\[(\d{4}-\d{2}-\d{2})\]\s*([\s\S]*)$/);
      return m ? { date: m[1], text: m[2] } : { date: "", text: chunk };
    })
    .reverse();
}

export function appendCareNote(existing: string | null | undefined, note: string): string {
  const today = new Date().toISOString().slice(0, 10);
  const entry = `[${today}] ${note.trim()}`;
  return existing ? `${existing}\n\n${entry}` : entry;
}
