import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  MapPin,
  ShieldCheck,
  CheckCircle2,
  Clock,
  XCircle,
  Plus,
  TrendingUp,
  Lock,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { listMyVerifications } from "@/lib/provider.functions";
import {
  getMyProviderProfile,
  saveProviderCapabilities,
  submitCredential,
} from "@/lib/provider-credentials.functions";
import { RouteErrorBoundary } from "@/components/carematch";

export const Route = createFileRoute("/_authenticated/provider/profile")({
  component: ProfilePage,
  errorComponent: RouteErrorBoundary,
});

const VERIFICATION_LABELS: Record<string, string> = {
  id_check: "Identity (Government ID)",
  background_check: "Background check",
  license_check: "Professional license",
  references: "Reference calls",
  insurance: "Liability insurance",
};

function daysUntil(iso: string) {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function ProfilePage() {
  const { data: user } = useQuery({
    queryKey: ["me"],
    queryFn: async () => (await supabase.auth.getUser()).data.user,
  });
  const userId = user?.id;

  const { data: provider, refetch } = useQuery({
    queryKey: ["provider", userId],
    enabled: !!userId,
    queryFn: async () =>
      (await supabase.from("providers").select("*").eq("id", userId!).maybeSingle()).data,
  });

  useEffect(() => {
    if (userId && provider === null) {
      supabase
        .from("providers")
        .upsert({ id: userId })
        .then(() => refetch());
    }
  }, [userId, provider, refetch]);

  const { data: availability, refetch: refetchAvailability } = useQuery({
    queryKey: ["provider", "availability", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase
        .from("provider_availability")
        .select("weekday, active")
        .eq("provider_id", userId!);
      return data ?? [];
    },
  });
  const [savingWeekday, setSavingWeekday] = useState<number | null>(null);
  const toggleAvailability = async (weekday: number) => {
    if (!userId) return;
    const current = availability?.find((a) => a.weekday === weekday);
    setSavingWeekday(weekday);
    const { error } = await supabase.from("provider_availability").upsert(
      {
        provider_id: userId,
        weekday,
        active: !(current?.active ?? false),
        start_time: "08:00",
        end_time: "20:00",
      },
      { onConflict: "provider_id,weekday" },
    );
    setSavingWeekday(null);
    if (error) {
      toast.error("Couldn't update availability");
      return;
    }
    refetchAvailability();
  };

  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [rate, setRate] = useState<number>(28);
  const [serviceArea, setServiceArea] = useState("");

  useEffect(() => {
    if (provider) {
      setHeadline(provider.headline ?? "");
      setBio(provider.bio ?? "");
      setRate(Math.round((provider.hourly_rate_cents ?? 2800) / 100));
      setServiceArea(provider.service_area ?? "");
    }
  }, [provider]);

  const verifsFn = useServerFn(listMyVerifications);
  const verifsQ = useQuery({
    queryKey: ["provider", "verifications", userId],
    enabled: !!userId,
    queryFn: () => verifsFn(),
  });

  const fullFn = useServerFn(getMyProviderProfile);
  const fullQ = useQuery({
    queryKey: ["provider", "profile-full", userId],
    enabled: !!userId,
    queryFn: () => fullFn(),
  });

  const saveCapsFn = useServerFn(saveProviderCapabilities);
  const submitCredFn = useServerFn(submitCredential);
  const [savingCaps, setSavingCaps] = useState(false);
  const [addingCred, setAddingCred] = useState<string | null>(null);
  const [uploadKind, setUploadKind] = useState<string>("cna");
  const [uploadState, setUploadState] = useState<string>("");
  const [uploadExpiry, setUploadExpiry] = useState<string>("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const toggleCapability = async (code: string) => {
    if (!fullQ.data) return;
    setSavingCaps(true);
    const current = new Set(fullQ.data.capabilities.filter((c) => c.opted_in).map((c) => c.code));
    if (current.has(code)) current.delete(code);
    else current.add(code);
    try {
      await saveCapsFn({ data: { codes: Array.from(current) } });
      await fullQ.refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update");
    } finally {
      setSavingCaps(false);
    }
  };

  const addCredential = async (kind: string) => {
    setAddingCred(kind);
    try {
      await submitCredFn({ data: { kind: kind as never } });
      await Promise.all([fullQ.refetch(), verifsQ.refetch()]);
      toast.success("Credential submitted — we'll review and get back to you.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add credential");
    } finally {
      setAddingCred(null);
    }
  };

  const uploadCredentialDoc = async () => {
    if (!userId || !uploadFile) return;
    setUploading(true);
    try {
      const ext = uploadFile.name.split(".").pop() ?? "bin";
      const path = `${userId}/${uploadKind}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("verification-docs")
        .upload(path, uploadFile, { upsert: true });
      if (upErr) throw upErr;
      await submitCredFn({
        data: {
          kind: uploadKind as never,
          document_path: path,
          issuing_state: uploadState || null,
          expires_on: uploadExpiry || null,
        },
      });
      toast.success("Document uploaded — staff will review it shortly.");
      setUploadFile(null);
      setUploadState("");
      setUploadExpiry("");
      await Promise.all([fullQ.refetch(), verifsQ.refetch()]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const tier = (provider?.tier ?? "bronze") as string;
  const serviceTier = fullQ.data?.provider.service_tier ?? 0;

  const saveProfile = async () => {
    if (!userId) return;
    const { error } = await supabase.from("providers").upsert({
      id: userId,
      headline,
      bio,
      hourly_rate_cents: Math.max(0, Math.round(rate * 100)),
      service_area: serviceArea,
    });
    if (error) return toast.error(error.message);
    toast.success("Profile updated");
    refetch();
  };

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Public profile</p>
        <h1 className="font-serif text-2xl lg:text-3xl">Profile & verification</h1>
      </header>

      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl">Verification tier</h2>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary capitalize">
            <ShieldCheck className="size-4" /> {tier}
          </span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Higher-tier providers appear above others in matches. Complete every check to reach Gold.
        </p>
        {verifsQ.isPending ? (
          <p className="mt-4 text-sm text-muted-foreground">Loading verifications…</p>
        ) : (verifsQ.data ?? []).length === 0 ? (
          <p className="mt-4 rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
            You have no verifications on file yet. Start with an ID check and background check to
            activate your listing.
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {(verifsQ.data ?? []).map((v) => {
              const label = VERIFICATION_LABELS[v.kind] ?? v.kind;
              const expiring =
                v.status === "passed" &&
                v.expires_on &&
                daysUntil(v.expires_on) <= 30 &&
                daysUntil(v.expires_on) > 0;
              const state: "passed" | "expiring" | "failed" | "expired" | "pending" = expiring
                ? "expiring"
                : (v.status as "passed" | "failed" | "expired" | "pending");
              return (
                <li
                  key={v.id}
                  className="flex items-center justify-between rounded-lg border border-border p-3 text-sm"
                >
                  <div className="flex items-center gap-2">
                    {state === "passed" ? (
                      <CheckCircle2 className="size-4 text-emerald-600" />
                    ) : state === "expiring" ? (
                      <Clock className="size-4 text-amber-600" />
                    ) : state === "failed" || state === "expired" ? (
                      <XCircle className="size-4 text-destructive" />
                    ) : (
                      <Clock className="size-4 text-muted-foreground" />
                    )}
                    <span>{label}</span>
                  </div>
                  <span
                    className={`text-xs ${
                      state === "passed"
                        ? "text-emerald-700"
                        : state === "expiring"
                          ? "text-amber-700"
                          : state === "failed" || state === "expired"
                            ? "text-destructive"
                            : "text-muted-foreground"
                    }`}
                  >
                    {state === "expiring"
                      ? `Renew by ${new Date(v.expires_on!).toLocaleDateString()}`
                      : v.verified_on
                        ? new Date(v.verified_on).toLocaleDateString()
                        : v.status}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="space-y-5 rounded-2xl border border-border bg-card p-5">
        <h2 className="font-serif text-xl">Public listing</h2>
        <div>
          <Label htmlFor="headline">Headline</Label>
          <Input
            id="headline"
            className="mt-1"
            placeholder="e.g. Dementia care specialist · 8 yrs"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="bio">About you</Label>
          <Textarea
            id="bio"
            rows={5}
            placeholder="What kind of families do you love working with?"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="rate">Hourly rate (USD)</Label>
            <Input
              id="rate"
              type="number"
              className="mt-1"
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Local band: $22–$36/hr for companionship
            </p>
          </div>
          <div>
            <Label htmlFor="area">Service area</Label>
            <div className="mt-1 flex items-center gap-2 rounded-md border border-input bg-background pl-3">
              <MapPin className="size-4 text-muted-foreground" />
              <Input
                id="area"
                className="border-0 focus-visible:ring-0"
                placeholder="Zip codes or neighborhoods"
                value={serviceArea}
                onChange={(e) => setServiceArea(e.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={saveProfile}>Save profile</Button>
        </div>
      </section>

      {fullQ.data && (
        <>
          <section className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl">Services I offer</h2>
              <span className="text-xs text-muted-foreground">Tier {serviceTier}</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Toggle the services you want to appear for in matches. Locked services unlock when you
              add the required credential.
            </p>
            <div className="mt-4 space-y-4">
              {[0, 1, 2, 3].map((t) => {
                const caps = fullQ.data.capabilities.filter((c) => c.required_tier === t);
                if (!caps.length) return null;
                const locked = t > serviceTier;
                return (
                  <div key={t}>
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="text-sm font-semibold">Tier {t}</h3>
                      {locked && (
                        <Link
                          to="/provider/grow"
                          className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground hover:text-foreground"
                        >
                          <Lock className="size-3" /> Get certified to unlock
                        </Link>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {caps.map((c) => {
                        const on = c.opted_in;
                        return (
                          <button
                            key={c.code}
                            type="button"
                            disabled={locked || savingCaps}
                            onClick={() => toggleCapability(c.code)}
                            className={`rounded-full border px-3 py-1.5 text-sm transition ${
                              locked
                                ? "cursor-not-allowed border-dashed border-border/60 opacity-60"
                                : on
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-border hover:border-primary/40"
                            }`}
                          >
                            {c.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl">Credentials</h2>
              <Link
                to="/provider/grow"
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                <TrendingUp className="size-3" /> Grow your income
              </Link>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Adding a credential unlocks higher-tier services and raises your match ranking.
            </p>
            {fullQ.data.credentials.length > 0 && (
              <ul className="mt-3 space-y-2">
                {fullQ.data.credentials.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center justify-between rounded-lg border border-border p-3 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      {c.status === "passed" ? (
                        <CheckCircle2 className="size-4 text-emerald-600" />
                      ) : c.status === "pending" ? (
                        <Clock className="size-4 text-amber-600" />
                      ) : (
                        <XCircle className="size-4 text-destructive" />
                      )}
                      <span className="capitalize">{c.kind.replace(/_/g, " ")}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {c.status}
                      {c.expires_on
                        ? ` · expires ${new Date(c.expires_on).toLocaleDateString()}`
                        : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Add a credential you already hold
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  "pca",
                  "hha",
                  "cna",
                  "cpr",
                  "first_aid",
                  "tb_test",
                  "phlebotomy",
                  "med_tech",
                  "lpn",
                  "rn",
                  "driver_license",
                  "auto_insurance",
                ].map((k) => {
                  const already = fullQ.data.credentials.some((c) => c.kind === k);
                  return (
                    <button
                      key={k}
                      disabled={already || addingCred === k}
                      onClick={() => addCredential(k)}
                      className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold hover:border-primary/40 disabled:opacity-50"
                    >
                      <Plus className="size-3" /> {k.replace(/_/g, " ")}
                      {already ? " ✓" : ""}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Adds a pending row for staff review. Upload the document below for faster approval.
              </p>
            </div>

            <div className="mt-5 rounded-xl border border-dashed border-border p-4">
              <p className="mb-3 text-sm font-semibold">Upload credential document</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="uk" className="text-xs">
                    Type
                  </Label>
                  <select
                    id="uk"
                    value={uploadKind}
                    onChange={(e) => setUploadKind(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  >
                    {[
                      "cna",
                      "pca",
                      "hha",
                      "cpr",
                      "first_aid",
                      "tb_test",
                      "phlebotomy",
                      "med_tech",
                      "lpn",
                      "rn",
                      "driver_license",
                      "auto_insurance",
                      "id_verification",
                    ].map((k) => (
                      <option key={k} value={k}>
                        {k.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="us" className="text-xs">
                    Issuing state
                  </Label>
                  <Input
                    id="us"
                    value={uploadState}
                    onChange={(e) => setUploadState(e.target.value)}
                    placeholder="CA"
                    maxLength={4}
                  />
                </div>
                <div>
                  <Label htmlFor="ue" className="text-xs">
                    Expires (optional)
                  </Label>
                  <Input
                    id="ue"
                    type="date"
                    value={uploadExpiry}
                    onChange={(e) => setUploadExpiry(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="uf" className="text-xs">
                    File (PDF or image)
                  </Label>
                  <Input
                    id="uf"
                    type="file"
                    accept="application/pdf,image/*"
                    onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                  />
                </div>
              </div>
              <Button
                onClick={uploadCredentialDoc}
                disabled={!uploadFile || uploading}
                className="mt-3"
                size="sm"
              >
                {uploading ? "Uploading…" : "Submit for review"}
              </Button>
            </div>
          </section>
        </>
      )}

      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-serif text-xl">Availability</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Which days can you accept new bookings?
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d, weekday) => {
            const row = availability?.find((a) => a.weekday === weekday);
            const active = row?.active ?? true;
            return (
              <button
                key={d}
                type="button"
                disabled={savingWeekday === weekday}
                onClick={() => toggleAvailability(weekday)}
                aria-pressed={active}
                className={`rounded-lg border px-3 py-2 text-sm font-semibold disabled:opacity-50 ${
                  active
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background text-muted-foreground"
                }`}
              >
                {d}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
