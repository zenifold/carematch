import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { CONSENT_DOCS, findConsentDoc, hashConsentText, type ConsentKind } from "./provider-consent-content";

const CONSENT_KIND_VALUES = [
  "fcra_disclosure","fcra_summary_of_rights","background_check_authorization",
  "investigative_consumer_report","continuous_monitoring","mvr_authorization",
  "state_addendum_ca","state_addendum_ny","state_addendum_wa","state_addendum_ma",
  "state_addendum_nj","state_addendum_mn",
] as const;

const DOC_KINDS = [
  "id_front","id_back","selfie_liveness","selfie_with_id","proof_of_address","ssn_card","passport",
] as const;

const AddressSchema = z.object({
  line1: z.string().trim().min(1).max(200),
  line2: z.string().trim().max(200).optional().nullable(),
  city: z.string().trim().min(1).max(120),
  state: z.string().trim().min(2).max(4),
  postal: z.string().trim().min(3).max(20),
  country: z.string().trim().min(2).max(4).default("US"),
  from: z.string().min(4).max(10), // YYYY-MM
  to: z.string().min(4).max(10).optional().nullable(),
});

// ============ Reads ============

export type IdentityRow = {
  legal_first_name: string | null;
  legal_middle_name: string | null;
  legal_last_name: string | null;
  other_names_used: Array<{ first: string; middle?: string; last: string; from?: string; to?: string }>;
  date_of_birth: string | null;
  ssn_last4: string | null;
  ssn_provided_at: string | null;
  phone: string | null;
  email: string | null;
  current_address: z.infer<typeof AddressSchema> | null;
  address_history: Array<z.infer<typeof AddressSchema>>;
  drivers_license_number: string | null;
  drivers_license_state: string | null;
  drivers_license_expires_on: string | null;
  identity_completed_at: string | null;
};

export type ConsentRow = {
  id: string;
  kind: ConsentKind;
  document_version: string;
  signed_at: string;
  signed_full_name: string;
  state: string | null;
};

export type DocumentRow = {
  id: string;
  kind: (typeof DOC_KINDS)[number];
  document_type: string | null;
  storage_path: string;
  mime_type: string | null;
  status: "uploaded" | "accepted" | "rejected" | "superseded";
  rejected_reason: string | null;
  uploaded_at: string;
  capture_metadata: Record<string, any>;
};

const EMPTY_IDENTITY: IdentityRow = {
  legal_first_name: null, legal_middle_name: null, legal_last_name: null,
  other_names_used: [], date_of_birth: null, ssn_last4: null, ssn_provided_at: null,
  phone: null, email: null, current_address: null, address_history: [],
  drivers_license_number: null, drivers_license_state: null, drivers_license_expires_on: null,
  identity_completed_at: null,
};

export const getMyIdentity = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{
    identity: IdentityRow;
    consents: ConsentRow[];
    documents: DocumentRow[];
  }> => {
    const uid = context.userId;
    // Make sure provider row exists (idempotent).
    await context.supabase.from("providers").upsert({ id: uid }, { onConflict: "id" });

    const [{ data: id }, { data: cons }, { data: docs }] = await Promise.all([
      context.supabase.from("provider_identity").select("*").eq("provider_id", uid).maybeSingle(),
      context.supabase.from("provider_consents")
        .select("id, kind, document_version, signed_at, signed_full_name, state")
        .eq("provider_id", uid)
        .order("signed_at", { ascending: false }),
      context.supabase.from("provider_documents")
        .select("id, kind, document_type, storage_path, mime_type, status, rejected_reason, uploaded_at, capture_metadata")
        .eq("provider_id", uid)
        .order("uploaded_at", { ascending: false }),
    ]);

    const identity: IdentityRow = id
      ? {
          ...EMPTY_IDENTITY,
          ...(id as unknown as IdentityRow),
          other_names_used: ((id as any).other_names_used ?? []) as IdentityRow["other_names_used"],
          address_history: ((id as any).address_history ?? []) as IdentityRow["address_history"],
        }
      : EMPTY_IDENTITY;

    return {
      identity,
      consents: (cons ?? []) as ConsentRow[],
      documents: (docs ?? []) as DocumentRow[],
    };
  });

// ============ Writes ============

async function ensureIdentityRow(supabase: any, uid: string) {
  await supabase.from("provider_identity").upsert({ provider_id: uid }, { onConflict: "provider_id" });
}

const CoreInput = z.object({
  legal_first_name: z.string().trim().min(1).max(80),
  legal_middle_name: z.string().trim().max(80).optional().nullable(),
  legal_last_name: z.string().trim().min(1).max(80),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  other_names_used: z.array(z.object({
    first: z.string().trim().max(80),
    middle: z.string().trim().max(80).optional(),
    last: z.string().trim().max(80),
    from: z.string().max(10).optional(),
    to: z.string().max(10).optional(),
  })).max(10).optional(),
  phone: z.string().trim().min(7).max(40),
  email: z.string().trim().email().max(200),
});

export const saveIdentityCore = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => CoreInput.parse(i))
  .handler(async ({ data, context }) => {
    const uid = context.userId;
    await ensureIdentityRow(context.supabase, uid);
    const { error } = await context.supabase.from("provider_identity").update({
      legal_first_name: data.legal_first_name,
      legal_middle_name: data.legal_middle_name ?? null,
      legal_last_name: data.legal_last_name,
      date_of_birth: data.date_of_birth,
      other_names_used: (data.other_names_used ?? []) as any,
      phone: data.phone,
      email: data.email,
    }).eq("provider_id", uid);
    if (error) throw error;
    return { ok: true };
  });

const AddressesInput = z.object({
  current_address: AddressSchema,
  address_history: z.array(AddressSchema).max(20),
});

export const saveIdentityAddresses = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => AddressesInput.parse(i))
  .handler(async ({ data, context }) => {
    const uid = context.userId;
    await ensureIdentityRow(context.supabase, uid);
    const { error } = await context.supabase.from("provider_identity").update({
      current_address: data.current_address as any,
      address_history: data.address_history as any,
    }).eq("provider_id", uid);
    if (error) throw error;
    return { ok: true };
  });

const SSNInput = z.object({ ssn: z.string().regex(/^\d{3}-?\d{2}-?\d{4}$/) });

export const saveIdentitySSN = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => SSNInput.parse(i))
  .handler(async ({ data, context }) => {
    const uid = context.userId;
    await ensureIdentityRow(context.supabase, uid);
    const digits = data.ssn.replace(/-/g, "");
    const last4 = digits.slice(-4);
    // NOTE: Phase 1 policy — full SSN is intentionally dropped. Phase 2 will
    // re-collect and forward directly to the background check vendor.
    const { error } = await context.supabase.from("provider_identity").update({
      ssn_last4: last4,
      ssn_provided_at: new Date().toISOString(),
    }).eq("provider_id", uid);
    if (error) throw error;
    return { ok: true, last4 };
  });

const DLInput = z.object({
  drivers_license_number: z.string().trim().max(40).nullable(),
  drivers_license_state: z.string().trim().max(4).nullable(),
  drivers_license_expires_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
});

export const saveDriversLicense = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => DLInput.parse(i))
  .handler(async ({ data, context }) => {
    const uid = context.userId;
    await ensureIdentityRow(context.supabase, uid);
    const { error } = await context.supabase.from("provider_identity").update(data as any).eq("provider_id", uid);
    if (error) throw error;
    return { ok: true };
  });

// ============ Consent ============

const ConsentInput = z.object({
  kind: z.enum(CONSENT_KIND_VALUES),
  document_version: z.string().min(1).max(40),
  signed_full_name: z.string().trim().min(2).max(200),
  state: z.string().max(4).optional().nullable(),
});

export const recordConsent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ConsentInput.parse(i))
  .handler(async ({ data, context }) => {
    const doc = findConsentDoc(data.kind, data.document_version);
    if (!doc) throw new Error("Unknown or outdated disclosure version.");
    const hash = await hashConsentText(doc.text);

    // NOTE: IP/UA capture is intentionally omitted in Phase 1 — helper API
    // varies across TanStack Start versions. Consent record still has
    // signed_at, signed_full_name, kind, version, and text hash, which is
    // sufficient for the audit trail.
    const ip: string | null = null;
    const ua: string | null = null;

    const { error } = await context.supabase.from("provider_consents").insert({
      provider_id: context.userId,
      kind: data.kind,
      document_version: data.document_version,
      document_text_hash: hash,
      state: data.state ?? doc.state ?? null,
      signed_full_name: data.signed_full_name,
      ip_address: ip,
      user_agent: ua,
    });
    if (error) throw error;
    return { ok: true };
  });

// ============ Documents ============

const UploadIntentInput = z.object({
  kind: z.enum(DOC_KINDS),
  mime_type: z.string().max(120),
});

export const uploadDocumentIntent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => UploadIntentInput.parse(i))
  .handler(async ({ data, context }): Promise<{ storage_path: string; signed_url: string; token: string }> => {
    const uid = context.userId;
    const ext = (data.mime_type.split("/")[1] || "bin").split(";")[0];
    const id = crypto.randomUUID();
    const storage_path = `${uid}/${data.kind}/${id}.${ext}`;
    const { data: signed, error } = await context.supabase.storage
      .from("verification-docs")
      .createSignedUploadUrl(storage_path);
    if (error) throw error;
    return { storage_path, signed_url: signed.signedUrl, token: signed.token };
  });

const FinalizeInput = z.object({
  kind: z.enum(DOC_KINDS),
  document_type: z.string().max(80).optional().nullable(),
  storage_path: z.string().min(1).max(400),
  mime_type: z.string().max(120).optional().nullable(),
  byte_size: z.number().int().nonnegative().optional().nullable(),
  width: z.number().int().nonnegative().optional().nullable(),
  height: z.number().int().nonnegative().optional().nullable(),
  capture_metadata: z.record(z.unknown()).optional().nullable(),
});

export const finalizeDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => FinalizeInput.parse(i))
  .handler(async ({ data, context }) => {
    const uid = context.userId;
    // Only accept paths inside the user's own prefix.
    if (!data.storage_path.startsWith(`${uid}/`)) {
      throw new Error("Invalid storage path.");
    }
    // Supersede any previously uploaded doc of the same kind.
    await context.supabase.from("provider_documents")
      .update({ status: "superseded" })
      .eq("provider_id", uid)
      .eq("kind", data.kind)
      .eq("status", "uploaded");
    const { data: row, error } = await context.supabase.from("provider_documents").insert({
      provider_id: uid,
      kind: data.kind,
      document_type: data.document_type ?? null,
      storage_path: data.storage_path,
      mime_type: data.mime_type ?? null,
      byte_size: data.byte_size ?? null,
      width: data.width ?? null,
      height: data.height ?? null,
      capture_metadata: (data.capture_metadata ?? {}) as any,
    }).select("id").single();
    if (error) throw error;
    return { ok: true, id: row.id };
  });

// ============ Submit ============

export const submitIdentityForReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const uid = context.userId;
    const [{ data: id }, { data: cons }, { data: docs }] = await Promise.all([
      context.supabase.from("provider_identity").select("*").eq("provider_id", uid).maybeSingle(),
      context.supabase.from("provider_consents").select("kind, document_version").eq("provider_id", uid),
      context.supabase.from("provider_documents").select("kind, status").eq("provider_id", uid).in("status", ["uploaded", "accepted"]),
    ]);
    if (!id) throw new Error("Complete your personal details first.");
    const missing: string[] = [];
    if (!id.legal_first_name || !id.legal_last_name) missing.push("Legal name");
    if (!id.date_of_birth) missing.push("Date of birth");
    if (!id.ssn_last4) missing.push("SSN");
    if (!id.current_address) missing.push("Current address");
    if (!id.phone || !id.email) missing.push("Contact info");

    const docKinds = new Set((docs ?? []).map((d: any) => d.kind));
    if (!docKinds.has("id_front")) missing.push("Government ID (front)");
    // passport is single-page — allow either id_back or a passport doc
    if (!docKinds.has("id_back") && !docKinds.has("passport")) missing.push("Government ID (back or passport)");
    if (!docKinds.has("selfie_liveness")) missing.push("Selfie");

    // Required consents at current versions.
    const stateCode = ((id.current_address as any)?.state ?? null) as string | null;
    const isDriver = !!id.drivers_license_number;
    const consMap = new Map<string, string>();
    for (const c of cons ?? []) consMap.set(c.kind, c.document_version);
    for (const d of CONSENT_DOCS) {
      if (d.onlyIf === "driver" && !isDriver) continue;
      if (d.state && d.state !== (stateCode ?? "").toUpperCase()) continue;
      if (!d.required) continue;
      if (consMap.get(d.kind) !== d.version) missing.push(`Signed: ${d.title}`);
    }

    if (missing.length) throw new Error("Still needed: " + missing.join(", "));

    const now = new Date().toISOString();
    await context.supabase.from("provider_identity")
      .update({ identity_completed_at: now })
      .eq("provider_id", uid);

    // Upsert an id_verification credential at status 'submitted'.
    const { data: existing } = await context.supabase.from("provider_credentials")
      .select("id, status").eq("provider_id", uid).eq("kind", "id_verification").maybeSingle();
    if (existing) {
      await context.supabase.from("provider_credentials")
        .update({ notes: "Identity submission via guided flow" })
        .eq("id", existing.id);
    } else {
      await context.supabase.from("provider_credentials").insert({
        provider_id: uid,
        kind: "id_verification",
        status: "submitted" as any,
        notes: "Identity submission via guided flow",
      });
    }

    await context.supabase.from("provider_onboarding_events").insert({
      provider_id: uid,
      event_type: "identity_submitted",
      step: "identity",
    });

    return { ok: true };
  });
