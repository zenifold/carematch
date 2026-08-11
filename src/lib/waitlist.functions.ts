import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Json } from "@/integrations/supabase/types";

/**
 * Pre-launch interest capture for /coming-soon.
 *
 * Deliberately has no requireSupabaseAuth middleware — the whole point is that
 * these people don't have accounts. The insert therefore goes through the
 * service-role client (lazily imported so it stays out of the client bundle),
 * which lets `waitlist_signups` stay completely closed to the anon key: no
 * grants, no INSERT policy, nothing to enumerate or spam directly.
 *
 * See src/lib/coming-soon-gate.ts — /_serverFn/* is allowlisted through the
 * gate unconditionally, since anonymous visitors submitting this form have no
 * preview cookie.
 */

export const WAITLIST_SEGMENTS = ["senior", "family", "caregiver", "partner"] as const;
export type WaitlistSegment = (typeof WAITLIST_SEGMENTS)[number];

/** Free text we store but never interpret — cap it so a bot can't post a novel. */
const shortText = z.string().trim().max(120);
const choices = z.array(z.string().trim().min(1).max(60)).max(20).default([]);

const BaseInput = {
  name: z.string().trim().min(2, "Please tell us your name").max(80),
  email: z.string().trim().toLowerCase().email("Please enter a valid email").max(255),
  phone: shortText.optional().or(z.literal("")),
  city: shortText.optional().or(z.literal("")),
  state: shortText.optional().or(z.literal("")),
  source: shortText.optional(),
  /**
   * Honeypot. A real person never sees this field, so anything in it is a bot;
   * we return success rather than an error so the bot doesn't learn to retry.
   */
  botField: z.string().max(200).optional(),
};

const SubmitInput = z.discriminatedUnion("segment", [
  z.object({
    ...BaseInput,
    segment: z.literal("senior"),
    helpNeeded: choices,
    timing: shortText.optional(),
    note: z.string().trim().max(1000).optional(),
  }),
  z.object({
    ...BaseInput,
    segment: z.literal("family"),
    relationship: shortText.optional(),
    urgency: shortText.optional(),
    note: z.string().trim().max(1000).optional(),
  }),
  z.object({
    ...BaseInput,
    segment: z.literal("caregiver"),
    specialties: choices,
    languages: choices,
    credential: shortText.optional(),
    experience: shortText.optional(),
    note: z.string().trim().max(1000).optional(),
  }),
  z.object({
    ...BaseInput,
    segment: z.literal("partner"),
    orgName: z.string().trim().min(2, "Please tell us your organization").max(120),
    orgType: shortText.optional(),
    statesServed: shortText.optional(),
    note: z.string().trim().max(1000).optional(),
  }),
]);

export type SubmitWaitlistInput = z.input<typeof SubmitInput>;

type Parsed = z.output<typeof SubmitInput>;

/**
 * An unanswered <select> posts "", not undefined, so `?? null` would leave
 * empty strings in the jsonb. Normalise to null everywhere — inside `details`
 * as well as on the columns — so staff can filter on `IS NULL` without also
 * having to check for "".
 */
function orNull(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

/** Everything segment-specific lands in the `details` jsonb column. */
function detailsFor(data: Parsed): { [key: string]: Json | undefined } {
  const base = data.note ? { note: data.note } : {};
  switch (data.segment) {
    case "senior":
      return { ...base, help_needed: data.helpNeeded, timing: orNull(data.timing) };
    case "family":
      return {
        ...base,
        relationship: orNull(data.relationship),
        urgency: orNull(data.urgency),
      };
    case "caregiver":
      return {
        ...base,
        specialties: data.specialties,
        languages: data.languages,
        credential: orNull(data.credential),
        experience: orNull(data.experience),
      };
    case "partner":
      return {
        ...base,
        org_name: data.orgName,
        org_type: orNull(data.orgType),
        states_served: orNull(data.statesServed),
      };
  }
}

const SEGMENT_LABELS: Record<WaitlistSegment, string> = {
  senior: "Older adult",
  family: "Family member",
  caregiver: "Caregiver",
  partner: "Partner organization",
};

export const submitWaitlistSignup = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => SubmitInput.parse(input))
  .handler(async ({ data }) => {
    if (data.botField) return { ok: true as const };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: row, error } = await supabaseAdmin
      .from("waitlist_signups")
      .insert({
        segment: data.segment,
        name: data.name,
        email: data.email,
        phone: orNull(data.phone),
        city: orNull(data.city),
        state: orNull(data.state),
        details: detailsFor(data),
        source: orNull(data.source) ?? "coming-soon",
      })
      .select("id")
      .single();
    if (error) throw error;

    // Best-effort on both sends, matching createSupportTicket: a mail failure
    // must never lose the signup we've already stored. sendTemplateEmail
    // no-ops quietly when no provider is configured.
    try {
      const { sendTemplateEmail } = await import("./email-templates/send-email");
      const firstName = data.name.split(" ")[0] || "there";

      await sendTemplateEmail("waitlist-confirmation", data.email, {
        templateData: { first_name: firstName, segment_label: SEGMENT_LABELS[data.segment] },
        idempotencyKey: `waitlist-confirm-${row.id}`,
      });

      const notifyTo = process.env.WAITLIST_NOTIFY_ADDRESS;
      if (notifyTo) {
        await sendTemplateEmail("waitlist-internal-notification", notifyTo, {
          templateData: {
            segment_label: SEGMENT_LABELS[data.segment],
            name: data.name,
            email: data.email,
            phone: orNull(data.phone) ?? "—",
            location: [orNull(data.city), orNull(data.state)].filter(Boolean).join(", ") || "—",
            details: JSON.stringify(detailsFor(data), null, 2),
          },
          idempotencyKey: `waitlist-notify-${row.id}`,
        });
      }
    } catch {
      // swallow — the signup is already durable
    }

    return { ok: true as const };
  });

/* ---------- Staff side: working the list ---------- */

const WAITLIST_STAFF = ["admin", "staff", "support", "success"] as const;

async function isWaitlistStaff(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_any_role", {
    _user_id: context.userId,
    _roles: WAITLIST_STAFF,
  });
  if (error) throw error;
  return !!data;
}

export type WaitlistRow = {
  id: string;
  segment: WaitlistSegment;
  name: string;
  email: string;
  phone: string | null;
  city: string | null;
  state: string | null;
  /**
   * `Json` rather than `Record<string, unknown>`: server-function return types
   * are checked for serializability, and `unknown` fails that check.
   */
  details: { [key: string]: Json | undefined };
  source: string | null;
  contacted_at: string | null;
  created_at: string;
};

const ListWaitlistInput = z
  .object({
    segment: z
      .enum(["all", ...WAITLIST_SEGMENTS])
      .optional()
      .default("all"),
    status: z.enum(["all", "new", "contacted"]).optional().default("new"),
    limit: z.number().int().min(1).max(500).optional().default(200),
  })
  .optional();

/**
 * Reads through the caller's own RLS context (not supabaseAdmin) so the
 * staff-only SELECT policy on waitlist_signups is the thing enforcing access —
 * the explicit role check below is a second gate, not the only one.
 */
export const listWaitlistSignups = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ListWaitlistInput.parse(i ?? {}))
  .handler(async ({ data, context }): Promise<WaitlistRow[]> => {
    if (!(await isWaitlistStaff(context))) throw new Error("Forbidden");

    let q = context.supabase
      .from("waitlist_signups")
      .select(
        "id, segment, name, email, phone, city, state, details, source, contacted_at, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(data?.limit ?? 200);

    if (data?.segment && data.segment !== "all") q = q.eq("segment", data.segment);
    if (data?.status === "new") q = q.is("contacted_at", null);
    else if (data?.status === "contacted") q = q.not("contacted_at", "is", null);

    const { data: rows, error } = await q;
    if (error) throw error;
    return (rows ?? []) as WaitlistRow[];
  });

/** Per-segment counts for the filter chips, so staff see where the demand is. */
export const getWaitlistCounts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    if (!(await isWaitlistStaff(context))) throw new Error("Forbidden");
    const { data, error } = await context.supabase
      .from("waitlist_signups")
      .select("segment, contacted_at")
      .limit(5000);
    if (error) throw error;

    const counts = { total: 0, uncontacted: 0 } as Record<string, number>;
    for (const seg of WAITLIST_SEGMENTS) counts[seg] = 0;
    for (const row of data ?? []) {
      counts.total += 1;
      if (!row.contacted_at) counts.uncontacted += 1;
      if (row.segment in counts) counts[row.segment] += 1;
    }
    return counts;
  });

const MarkContactedInput = z.object({
  id: z.string().uuid(),
  /** false puts someone back on the new list if they were marked by mistake. */
  contacted: z.boolean(),
});

export const markWaitlistContacted = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => MarkContactedInput.parse(i))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    if (!(await isWaitlistStaff(context))) throw new Error("Forbidden");
    const { error } = await context.supabase
      .from("waitlist_signups")
      .update({ contacted_at: data.contacted ? new Date().toISOString() : null })
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });
