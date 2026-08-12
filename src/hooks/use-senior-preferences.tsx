import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { getSeniorPreferences, upsertSeniorPreferences } from "@/lib/senior-preferences.functions";

/**
 * Mounted in __root.tsx, so it runs on public marketing pages as well as the
 * senior portal. That matters: the first page an older adult ever sees is a
 * marketing page, and Large Text Mode was previously unreachable there.
 *
 * Signed-out visitors get localStorage only. The server round-trips are gated
 * on an actual session rather than relying on catch(), so a public page load
 * doesn't fire a request that is guaranteed to fail auth.
 */

async function hasSession(): Promise<boolean> {
  try {
    const { data } = await supabase.auth.getSession();
    return Boolean(data.session);
  } catch {
    return false;
  }
}

export type TextSize = "normal" | "large" | "xlarge";

export type Preferences = {
  textSize: TextSize;
  highContrast: boolean;
  reduceMotion: boolean;
  notifyBeforeVisit: boolean;
  callForChanges: boolean;
  familyCanSee: boolean;
  familyCanEdit: boolean;
};

const DEFAULTS: Preferences = {
  textSize: "normal",
  highContrast: false,
  reduceMotion: false,
  notifyBeforeVisit: true,
  callForChanges: true,
  familyCanSee: true,
  familyCanEdit: false,
};

const STORAGE_KEY = "carematch:senior-preferences";

type Ctx = {
  prefs: Preferences;
  setPref: <K extends keyof Preferences>(key: K, value: Preferences[K]) => void;
};

const PreferencesContext = createContext<Ctx | null>(null);

function readStored(): Preferences {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return DEFAULTS;
  }
}

function applyToDocument(prefs: Preferences) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.dataset.textSize = prefs.textSize;
  root.dataset.contrast = prefs.highContrast ? "high" : "normal";
  root.dataset.motion = prefs.reduceMotion ? "reduce" : "auto";
}

function toRow(p: Preferences) {
  return {
    text_size: p.textSize,
    high_contrast: p.highContrast,
    reduce_motion: p.reduceMotion,
    notify_before_visit: p.notifyBeforeVisit,
    call_for_changes: p.callForChanges,
    family_can_see: p.familyCanSee,
    family_can_edit: p.familyCanEdit,
  };
}

export function SeniorPreferencesProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<Preferences>(DEFAULTS);
  const [hydrated, setHydrated] = useState(false);
  const fetchPrefs = useServerFn(getSeniorPreferences);
  const savePrefs = useServerFn(upsertSeniorPreferences);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load: apply localStorage instantly, then reconcile with the server when
  // (and only when) the visitor is actually signed in.
  useEffect(() => {
    const local = readStored();
    setPrefs(local);
    applyToDocument(local);
    setHydrated(true);

    hasSession()
      .then((signedIn) => (signedIn ? fetchPrefs() : null))
      .then((row) => {
        if (!row) return;
        const merged: Preferences = {
          textSize: row.text_size,
          highContrast: row.high_contrast,
          reduceMotion: row.reduce_motion,
          notifyBeforeVisit: row.notify_before_visit,
          callForChanges: row.call_for_changes,
          familyCanSee: row.family_can_see,
          familyCanEdit: row.family_can_edit,
        };
        setPrefs(merged);
        applyToDocument(merged);
        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        } catch {}
      })
      .catch(() => {
        // offline or a stale session — keep local values
      });
  }, [fetchPrefs]);

  useEffect(() => {
    applyToDocument(prefs);
  }, [prefs]);

  const setPref = <K extends keyof Preferences>(key: K, value: Preferences[K]) => {
    setPrefs((prev) => {
      const next = { ...prev, [key]: value };
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      // Debounce server writes so slider-like interactions don't spam.
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        void hasSession().then((signedIn) => {
          if (!signedIn) return; // anonymous visitor: localStorage is the record
          savePrefs({ data: toRow(next) }).catch(() => {
            // ignore; localStorage remains the source of truth if this fails
          });
        });
      }, 400);
      return next;
    });
  };

  // Avoid a flash of defaults before hydration finishes on first paint.
  void hydrated;

  return (
    <PreferencesContext.Provider value={{ prefs, setPref }}>{children}</PreferencesContext.Provider>
  );
}

export function useSeniorPreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error("useSeniorPreferences must be used inside SeniorPreferencesProvider");
  return ctx;
}
