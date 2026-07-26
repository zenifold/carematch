import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Copy, Loader2, Mail, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RouteErrorBoundary } from "@/components/carematch";
import { upsertSeniorPreferences } from "@/lib/senior-preferences.functions";
import { createFamilyInvite } from "@/lib/invites.functions";
import { useServerFn } from "@tanstack/react-start";

export const Route = createFileRoute("/_authenticated/onboarding/senior")({
  component: SeniorOnboarding,
  errorComponent: RouteErrorBoundary,
});

const TEXT_SIZES = [
  { id: "normal", label: "Standard" },
  { id: "large", label: "Larger" },
  { id: "xlarge", label: "Largest" },
] as const;

const NEEDS = [
  { id: "companionship", label: "Company & conversation", emoji: "☕" },
  { id: "housekeeping", label: "Light housekeeping", emoji: "🧺" },
  { id: "errands", label: "Errands & rides", emoji: "🛒" },
  { id: "personal_care", label: "Bathing & personal care", emoji: "🛁" },
  { id: "meals", label: "Meal prep", emoji: "🍲" },
  { id: "medication", label: "Medication reminders", emoji: "💊" },
] as const;

function SeniorOnboarding() {
  const navigate = useNavigate();
  const upsertPrefs = useServerFn(upsertSeniorPreferences);
  const createInvite = useServerFn(createFamilyInvite);

  const [fullName, setFullName] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [budget, setBudget] = useState<number>(1200);
  const [textSize, setTextSize] = useState<"normal" | "large" | "xlarge">("large");
  const [callForChanges, setCallForChanges] = useState(true);
  const [familyCanSee, setFamilyCanSee] = useState(true);
  const [needs, setNeeds] = useState<string[]>([]);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [invitingBusy, setInvitingBusy] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: p } = await supabase
        .from("profiles")
        .select("full_name, phone, city, monthly_budget_cents")
        .eq("id", data.user.id)
        .maybeSingle();
      if (p) {
        setFullName(p.full_name ?? "");
        setPhone(p.phone ?? "");
        setCity(p.city ?? "");
        if (p.monthly_budget_cents) setBudget(Math.round(p.monthly_budget_cents / 100));
      }
    });
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const { error: profErr } = await supabase
        .from("profiles")
        .update({
          full_name: fullName || null,
          phone: phone || null,
          city: city || null,
          monthly_budget_cents: Math.max(0, Math.round(budget * 100)),
          onboarded_at: new Date().toISOString(),
        })
        .eq("id", u.user.id);
      if (profErr) throw profErr;

      await upsertPrefs({
        data: {
          text_size: textSize,
          high_contrast: false,
          reduce_motion: false,
          notify_before_visit: true,
          call_for_changes: callForChanges,
          family_can_see: familyCanSee,
        },
      });
      toast.success("You're all set!");
      // If they told us what they need, take them straight to booking.
      navigate({ to: needs.length > 0 ? "/senior/book" : "/senior", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const skip = async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    await supabase
      .from("profiles")
      .update({ onboarded_at: new Date().toISOString() })
      .eq("id", u.user.id);
    navigate({ to: "/senior", replace: true });
  };

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2 text-primary">
          <Sparkles className="size-5" />
          <p className="text-xs font-bold uppercase tracking-widest">Welcome to CareMatch</p>
        </div>
        <h1 className="mt-2 font-serif text-3xl lg:text-4xl">Let's set up your account</h1>
        <p className="mt-2 text-muted-foreground">
          A few details help us find the right caregivers near you. You can change anything later.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-8">
        <section className="surface-card space-y-4 p-5 lg:p-6">
          <h2 className="font-serif text-xl">About you</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 555-0100"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Portland, OR"
              />
            </div>
          </div>
        </section>

        <section className="surface-card space-y-4 p-5 lg:p-6">
          <div>
            <h2 className="font-serif text-xl">What do you need help with?</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Pick as many as you like. We'll use this to suggest caregivers.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {NEEDS.map((n) => {
              const active = needs.includes(n.id);
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() =>
                    setNeeds((prev) =>
                      prev.includes(n.id) ? prev.filter((x) => x !== n.id) : [...prev, n.id],
                    )
                  }
                  aria-pressed={active}
                  className={`flex min-h-20 flex-col items-center justify-center gap-1 rounded-2xl border-2 p-3 text-center text-sm font-medium transition ${
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <span className="text-2xl" aria-hidden>
                    {n.emoji}
                  </span>
                  <span>{n.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="surface-card space-y-4 p-5 lg:p-6">
          <h2 className="font-serif text-xl">Monthly care budget</h2>
          <p className="text-sm text-muted-foreground">
            A soft budget target — we'll help you plan visits around it.
          </p>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-serif">$</span>
            <Input
              type="number"
              min={0}
              step={50}
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              className="max-w-[10rem] text-lg"
            />
            <span className="text-sm text-muted-foreground">/ month</span>
          </div>
        </section>

        <section className="surface-card space-y-4 p-5 lg:p-6">
          <h2 className="font-serif text-xl">Reading & alerts</h2>
          <div>
            <p className="mb-2 text-sm font-medium">Text size</p>
            <div className="grid grid-cols-3 gap-2">
              {TEXT_SIZES.map((t) => {
                const active = textSize === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTextSize(t.id)}
                    className={`rounded-2xl border p-3 text-sm font-semibold transition ${
                      active ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                    }`}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {(
            [
              ["callForChanges", "Call me before any schedule changes", callForChanges, setCallForChanges],
              ["familyCanSee", "Let approved family view my visits", familyCanSee, setFamilyCanSee],
            ] as const
          ).map(([k, label, val, setter]) => (
            <label
              key={k}
              className="flex items-center justify-between rounded-2xl border border-border bg-secondary/40 p-4"
            >
              <span className="font-medium">{label}</span>
              <button
                type="button"
                onClick={() => setter(!val)}
                aria-pressed={val}
                className={`relative h-6 w-11 rounded-full transition ${val ? "bg-primary" : "bg-muted"}`}
              >
                <span
                  className={`absolute top-0.5 size-5 rounded-full bg-background transition-all ${
                    val ? "left-5" : "left-0.5"
                  }`}
                />
              </button>
            </label>
          ))}
        </section>

        <section className="surface-card space-y-4 p-5 lg:p-6">
          <div>
            <h2 className="font-serif text-xl">Invite family (optional)</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Generate a share code so a loved one can view your visits and help coordinate.
            </p>
          </div>
          {inviteCode ? (
            <div className="rounded-2xl border-2 border-primary/40 bg-primary/5 p-4">
              <p className="text-sm text-muted-foreground">Share this code:</p>
              <p className="mt-1 font-mono text-2xl font-bold tracking-widest">{inviteCode}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(inviteCode);
                    toast.success("Copied");
                  }}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full border border-input bg-card px-4 text-sm font-semibold"
                >
                  <Copy className="size-4" /> Copy code
                </button>
                <a
                  href={`sms:?body=${encodeURIComponent(
                    `Join me on CareMatch — use code ${inviteCode}`,
                  )}`}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full border border-input bg-card px-4 text-sm font-semibold"
                >
                  <Mail className="size-4" /> Text it
                </a>
              </div>
            </div>
          ) : (
            <button
              type="button"
              disabled={invitingBusy}
              onClick={async () => {
                setInvitingBusy(true);
                try {
                  const inv = await createInvite({ data: { permission: "view" } });
                  setInviteCode(inv.code);
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Could not create invite");
                } finally {
                  setInvitingBusy(false);
                }
              }}
              className="inline-flex min-h-12 items-center gap-2 rounded-full border border-input bg-card px-5 text-base font-semibold hover:bg-secondary disabled:opacity-50"
            >
              {invitingBusy ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}
              Generate invite code
            </button>
          )}
        </section>


        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={skip}
            className="text-sm text-muted-foreground underline-offset-2 hover:underline"
          >
            Skip for now
          </button>
          <Button type="submit" disabled={busy} size="lg" className="min-w-40">
            {busy ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            Finish setup
          </Button>
        </div>
      </form>
    </div>
  );
}
