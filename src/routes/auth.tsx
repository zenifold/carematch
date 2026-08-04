import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import {
  Heart,
  ArrowLeft,
  ArrowRight,
  Check,
  Phone,
  Sparkles,
  Users,
  HandHeart,
  Eye,
  EyeOff,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import authSenior from "@/assets/auth-senior.jpg";
import authFamily from "@/assets/auth-family.jpg";
import authProvider from "@/assets/auth-provider.jpg";
import { requiredDocumentsFor, LEGAL_DOCUMENTS, type LegalDocumentKind } from "@/lib/legal";
import { acceptLegalDocuments } from "@/lib/legal.functions";
import { finishOAuthSignup } from "@/lib/oauth-signup.functions";

type Role = "senior" | "family" | "provider";

const search = z.object({
  mode: z.enum(["signin", "signup"]).optional(),
  role: z.enum(["senior", "family", "provider"]).optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: search,
  component: AuthPage,
});

const roleMeta: Record<Role, {
  label: string;
  short: string;
  description: string;
  image: string;
  icon: typeof Users;
  quote: string;
  attribution: string;
  benefits: string[];
}> = {
  senior: {
    label: "I'm the older adult",
    short: "The senior",
    description: "You're in charge. Find a friendly helper for what you need, on your schedule.",
    image: authSenior,
    icon: Heart,
    quote: "It feels like family, not a stranger walking through the door.",
    attribution: "Marta, 78 — Sarasota, FL",
    benefits: [
      "Meet your helper before the first visit — no surprises",
      "Same friendly face week after week, not a rotating stranger",
      "One phone number, a real person answers on the first ring",
      "Share only what you want with family — you stay in charge",
    ],

  },
  family: {
    label: "I'm helping a parent or loved one",
    short: "Family",
    description: "Coordinate care alongside your loved one — with their permission, always.",
    image: authFamily,
    icon: Users,
    quote: "I finally sleep at night knowing someone reliable checks on Mom.",
    attribution: "Dana — daughter, three states away",
    benefits: [
      "See visits, notes, and messages in one place",
      "Get a real-time update after every visit",
      "Invite siblings and stay coordinated",
    ],
  },
  provider: {
    label: "I want to help as a caregiver",
    short: "A helper",
    description: "List yourself, set your own rate, and get matched with families nearby.",
    image: authProvider,
    icon: HandHeart,
    quote: "The families see me, not just a resume. That changed everything.",
    attribution: "Andrea — home helper, Phoenix, AZ",
    benefits: [
      "Set your own hourly rate",
      "Keep clients week after week",
      "Insurance and verification built in",
    ],
  },
};

const SPECIALTY_OPTIONS = [
  "Companionship",
  "Errands & rides",
  "Housekeeping",
  "Meal prep",
  "Medication reminders",
  "Pet care",
  "Tech help",
  "Dementia-informed",
  "Personal care",
];

const LANGUAGE_OPTIONS = ["English", "Spanish", "Mandarin", "Tagalog", "French", "Vietnamese", "Russian"];

const emailSchema = z.string().trim().email("Please enter a valid email").max(255);
const passwordSchema = z.string().min(8, "Use at least 8 characters").max(72);
const nameSchema = z.string().trim().min(2, "Please tell us your name").max(80);

function AuthPage() {
  const { mode: modeParam, role: roleParam } = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">(modeParam ?? "signin");
  const [step, setStep] = useState(0); // signup steps: 0 role, 1 basics, 2 role-specific, 3 credentials
  const [busy, setBusy] = useState(false);

  // shared
  const [role, setRole] = useState<Role>(roleParam ?? "senior");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [legalAccepted, setLegalAccepted] = useState(false);

  // senior + family
  const [monthlyBudget, setMonthlyBudget] = useState<string>("");

  // senior only
  const [textSize, setTextSize] = useState<"normal" | "large" | "xlarge">("normal");
  const [familyCanSee, setFamilyCanSee] = useState(true);

  // family only
  const [relationship, setRelationship] = useState<string>("");
  const [seniorName, setSeniorName] = useState("");

  // provider only
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [hourlyRate, setHourlyRate] = useState<string>("25");
  const [yearsExperience, setYearsExperience] = useState<string>("");
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>(["English"]);

  // Bounce if already signed in. A `?role=` in the URL means we just landed
  // back here from the Google OAuth redirect — that round-trip has no way to
  // carry the role the user picked on the form, so handle_new_user() always
  // defaults fresh OAuth accounts to 'senior' and never records the legal
  // consent the signup form's checkbox implied. Reconcile both before
  // continuing on (finishOAuthSignup no-ops for anyone already onboarded).
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return;
      if (roleParam) {
        try {
          await finishOAuthSignup({ data: { role: roleParam } });
        } catch (err) {
          console.error("Failed to reconcile OAuth signup", err);
        }
      }
      navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate, roleParam]);

  // Required documents differ by role (providers additionally need the
  // Independent Contractor Agreement) — re-require acceptance if role changes.
  useEffect(() => setLegalAccepted(false), [role]);
  const requiredDocs = useMemo(() => requiredDocumentsFor(role), [role]);

  const activeRole = roleMeta[role];

  const totalSteps = 4;

  const toggle = (arr: string[], v: string, setter: (a: string[]) => void) =>
    setter(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const validateStep = (s: number): string | null => {
    if (mode !== "signup") return null;
    if (s === 0) return legalAccepted ? null : "Please agree to the required terms to continue";
    if (s === 1) {
      const nameOk = nameSchema.safeParse(fullName);
      if (!nameOk.success) return nameOk.error.issues[0].message;
      if (phone && phone.replace(/\D/g, "").length < 7) return "Please enter a valid phone number";
    }
    if (s === 2) {
      if (role === "provider") {
        if (headline.trim().length < 4) return "Add a short headline (e.g. \"Friendly Tuesday helper\")";
        const rate = Number(hourlyRate);
        if (!Number.isFinite(rate) || rate < 15 || rate > 200) return "Set an hourly rate between $15 and $200";
      }
      if (role === "family") {
        if (seniorName.trim().length < 2) return "Who are you helping? Add their first name.";
      }
    }
    if (s === 3) {
      const emailOk = emailSchema.safeParse(email);
      if (!emailOk.success) return emailOk.error.issues[0].message;
      const pwOk = passwordSchema.safeParse(password);
      if (!pwOk.success) return pwOk.error.issues[0].message;
    }
    return null;
  };

  const goNext = () => {
    const err = validateStep(step);
    if (err) {
      toast.error(err);
      return;
    }
    setStep((s) => Math.min(s + 1, totalSteps - 1));
  };
  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  const persistRoleData = async (userId: string) => {
    // Base profile — trigger already inserted this row, so update the extras.
    const budgetCents = monthlyBudget ? Math.round(Number(monthlyBudget) * 100) : null;
    const profilePatch = {
      full_name: fullName,
      phone: phone || null,
      city: city || null,
      ...(role !== "provider" ? { monthly_budget_cents: budgetCents } : {}),
    };
    await supabase.from("profiles").update(profilePatch).eq("id", userId);


    if (role === "senior") {
      await supabase.from("senior_preferences").upsert(
        {
          user_id: userId,
          text_size: textSize,
          high_contrast: false,
          reduce_motion: false,
          notify_before_visit: true,
          call_for_changes: true,
          family_can_see: familyCanSee,
        },
        { onConflict: "user_id" },
      );
    }

    if (role === "provider") {
      await supabase.from("providers").upsert(
        {
          id: userId,
          headline: headline || null,
          bio: bio || null,
          hourly_rate_cents: Math.round(Number(hourlyRate || 25) * 100),
          years_experience: yearsExperience ? Number(yearsExperience) : null,
          service_area: city || null,
          specialties,
          languages: languages.length ? languages : ["English"],
          is_active: false, // needs verification before going live
        },
        { onConflict: "id" },
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;

    if (mode === "signin") {
      setBusy(true);
      try {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back");
        navigate({ to: "/dashboard", replace: true });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setBusy(false);
      }
      return;
    }

    // signup: validate the final step
    const err = validateStep(3);
    if (err) return toast.error(err);

    setBusy(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            name: fullName,
            role,
            intended_role: role,
          },
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (error) throw error;

      // If email confirmation is off, we get a session immediately — persist extras.
      if (data.user && data.session) {
        try {
          await persistRoleData(data.user.id);
        } catch (persistErr) {
          console.error("Failed to persist role data on signup", persistErr);
        }
        try {
          await acceptLegalDocuments({
            data: {
              acceptances: requiredDocs.map((kind) => ({
                kind,
                version: LEGAL_DOCUMENTS[kind].version,
              })),
            },
          });
        } catch (consentErr) {
          // Don't block account creation on this — but this is a real gap:
          // surface it loudly rather than losing it silently, since a
          // missing acceptance record is a compliance problem, not a UX one.
          console.error("Failed to record legal document acceptance", consentErr);
        }
        toast.success("Welcome to CompanionCare");
        navigate({ to: "/dashboard", replace: true });
      } else {
        toast.success("Check your email to confirm your account");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setBusy(true);
    // Pass role via URL query so the /auth page can reconcile it once the
    // OAuth redirect lands back here (see finishOAuthSignup).
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth?role=${role}`,
      },
    });
    if (error) {
      toast.error(error.message ?? "Google sign-in failed");
      setBusy(false);
    }
    // On success, Supabase redirects the browser to Google itself — nothing
    // left to do here.
  };

  // Reset step when toggling mode
  const switchMode = (next: "signin" | "signup") => {
    setMode(next);
    setStep(0);
  };

  return (
    <div className="min-h-dvh bg-background">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-10">
        <Link to="/" className="font-serif text-2xl font-bold tracking-tight text-foreground">
          CompanionCare
        </Link>

        <a
          href="tel:18002273362"
          className="hidden items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground sm:inline-flex"
        >
          <Phone className="size-4" /> 1-800-COMPANION
        </a>
      </header>

      <main className="mx-auto grid max-w-7xl gap-0 px-4 pb-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-14 lg:px-10">
        {/* LEFT — Form. Mobile shows the trust/hero image first (order-2
            below) — same reasoning as the desktop side-by-side layout,
            just stacked instead of side-by-side: a stranger sizing up
            whether to trust this site with a password shouldn't have to
            scroll past a whole form to see the one thing (a real person's
            face + quote) doing that work. */}
        <section className="order-2 lg:order-1">
          <div className="mx-auto max-w-xl">
            {mode === "signup" && (
              <StepIndicator step={step} total={totalSteps} />
            )}

            <div className="mt-6">
              <h1 className="font-serif text-3xl tracking-tight sm:text-4xl">
                {mode === "signup" ? headingForStep(step, activeRole) : "Welcome back"}
              </h1>
              <p className="mt-2 text-base text-muted-foreground">
                {mode === "signup" ? subHeadingForStep(step, activeRole) : "Sign in to continue where you left off."}
              </p>
            </div>

            {mode === "signin" ? (
              <SigninForm
                email={email}
                setEmail={setEmail}
                password={password}
                setPassword={setPassword}
                onSubmit={handleSubmit}
                onGoogle={handleGoogle}
                busy={busy}
              />
            ) : (
              <form onSubmit={handleSubmit} className="mt-8 grid gap-6">
                {step === 0 && (
                  <RoleStep
                    role={role}
                    setRole={setRole}
                    onGoogle={handleGoogle}
                    busy={busy}
                    legalAccepted={legalAccepted}
                    setLegalAccepted={setLegalAccepted}
                  />
                )}
                {step === 1 && (
                  <BasicsStep
                    role={role}
                    fullName={fullName}
                    setFullName={setFullName}
                    phone={phone}
                    setPhone={setPhone}
                    city={city}
                    setCity={setCity}
                  />
                )}
                {step === 2 && role === "senior" && (
                  <SeniorStep
                    monthlyBudget={monthlyBudget}
                    setMonthlyBudget={setMonthlyBudget}
                    textSize={textSize}
                    setTextSize={setTextSize}
                    familyCanSee={familyCanSee}
                    setFamilyCanSee={setFamilyCanSee}
                  />
                )}
                {step === 2 && role === "family" && (
                  <FamilyStep
                    seniorName={seniorName}
                    setSeniorName={setSeniorName}
                    relationship={relationship}
                    setRelationship={setRelationship}
                    monthlyBudget={monthlyBudget}
                    setMonthlyBudget={setMonthlyBudget}
                  />
                )}
                {step === 2 && role === "provider" && (
                  <ProviderStep
                    headline={headline}
                    setHeadline={setHeadline}
                    bio={bio}
                    setBio={setBio}
                    hourlyRate={hourlyRate}
                    setHourlyRate={setHourlyRate}
                    yearsExperience={yearsExperience}
                    setYearsExperience={setYearsExperience}
                    specialties={specialties}
                    toggleSpecialty={(v) => toggle(specialties, v, setSpecialties)}
                    languages={languages}
                    toggleLanguage={(v) => toggle(languages, v, setLanguages)}
                  />
                )}
                {step === 3 && (
                  <CredentialsStep
                    email={email}
                    setEmail={setEmail}
                    password={password}
                    setPassword={setPassword}
                  />
                )}

                <div className="flex items-center justify-between gap-3 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={goBack}
                    disabled={step === 0 || busy}
                    className="h-12 gap-2 text-base"
                  >
                    <ArrowLeft className="size-4" /> Back
                  </Button>
                  {step < totalSteps - 1 ? (
                    <Button
                      type="button"
                      onClick={goNext}
                      disabled={busy}
                      size="lg"
                      className="h-12 gap-2 text-base font-semibold"
                    >
                      Continue <ArrowRight className="size-4" />
                    </Button>
                  ) : (
                    <Button type="submit" disabled={busy} size="lg" className="h-12 gap-2 text-base font-semibold">
                      {busy ? "Creating account…" : "Create my account"}
                      <Check className="size-4" />
                    </Button>
                  )}
                </div>
              </form>
            )}

            <p className="mt-8 text-center text-base text-muted-foreground">
              {mode === "signup" ? "Already have an account?" : "New to CompanionCare?"}{" "}
              <button
                type="button"
                className="font-semibold text-primary underline-offset-4 hover:underline"
                onClick={() => switchMode(mode === "signup" ? "signin" : "signup")}
              >
                {mode === "signup" ? "Sign in" : "Create an account"}
              </button>
            </p>

          </div>
        </section>

        {/* RIGHT on desktop, FIRST on mobile — role image + quote */}
        <aside className="order-1 mb-6 lg:order-2 lg:mb-0">
          <div className="relative overflow-hidden rounded-3xl border border-border bg-warm-cream lg:sticky lg:top-6 lg:h-[calc(100dvh-3rem)]">
            <img
              key={activeRole.image}
              src={activeRole.image}
              alt={activeRole.label}
              width={1024}
              height={1536}
              // Eager, not lazy — on mobile this is now the first thing in
              // the DOM (see the section above), i.e. the actual LCP
              // candidate, not an off-screen image lazy-load was meant for.
              fetchPriority="high"
              className="h-64 w-full object-cover object-top transition-opacity duration-500 sm:h-96 lg:h-full"
            />
            {/* The quote/benefits overlay needs real height to not just
                swallow the whole photo behind a wall of text — the mobile
                image (h-64/h-96) isn't tall enough for that, so the overlay
                is desktop-only; mobile shows the plain photo. */}
            <div className="absolute inset-0 hidden bg-gradient-to-t from-foreground/70 via-foreground/20 to-transparent lg:block" />
            <div className="absolute inset-x-0 bottom-0 hidden space-y-4 p-6 text-primary-foreground sm:p-8 lg:block">
              <blockquote className="font-serif text-2xl leading-snug text-primary-foreground sm:text-3xl">
                &ldquo;{activeRole.quote}&rdquo;
              </blockquote>
              <p className="text-sm font-medium text-primary-foreground/85">— {activeRole.attribution}</p>

              <ul className="mt-4 grid gap-2">
                {activeRole.benefits.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-sm text-primary-foreground">
                    <Sparkles className="mt-0.5 size-4 shrink-0" aria-hidden />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}

/* ---------------- helpers ---------------- */

function headingForStep(step: number, r: (typeof roleMeta)[Role]): string {
  if (step === 0) return "First, who are you?";
  if (step === 1) return "Let's get to know you";
  if (step === 2) return `A little about your ${r.short.toLowerCase().includes("helper") ? "work" : "situation"}`;
  return "One last step — your login";
}

function subHeadingForStep(step: number, r: (typeof roleMeta)[Role]): string {
  if (step === 0) return "This shapes what we show you next. You can change it later.";
  if (step === 1) return "The basics we'll use to introduce you.";
  if (step === 2) return r.description;
  return "You'll use this to sign in going forward.";
}

function StepIndicator({ step, total }: { step: number; total: number }) {
  const pct = ((step + 1) / total) * 100;
  return (
    <div>
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        <span>Step {step + 1} of {total}</span>
        <span>{Math.round(pct)}%</span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
        <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function SigninForm({
  email,
  setEmail,
  password,
  setPassword,
  onSubmit,
  onGoogle,
  busy,
}: {
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onGoogle: () => void;
  busy: boolean;
}) {
  return (
    <div className="mt-8 grid gap-5">
      <Button
        type="button"
        variant="outline"
        size="lg"
        className="h-14 w-full text-base"
        onClick={onGoogle}
        disabled={busy}
      >
        <GoogleIcon /> Continue with Google
      </Button>
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span className="h-px flex-1 bg-border" /> or with email <span className="h-px flex-1 bg-border" />
      </div>
      <form onSubmit={onSubmit} className="grid gap-4">
        <div>
          <Label htmlFor="signin-email" className="text-base">Email</Label>
          <Input
            id="signin-email"
            type="email"
            autoComplete="email"
            className="mt-1 h-12 text-base"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="signin-password" className="text-base">Password</Label>
          <PasswordInput
            id="signin-password"
            autoComplete="current-password"
            value={password}
            onChange={setPassword}
            required
          />
        </div>

        <Button type="submit" size="lg" className="h-14 text-base font-semibold" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </div>
  );
}

const DOC_LINK: Record<LegalDocumentKind, string> = {
  terms_of_service: "/legal/terms",
  privacy_policy: "/legal/privacy",
  provider_agreement: "/legal/provider-agreement",
};

/** Required-document checkbox gate — shown once, on role selection, since
 * that's the earliest point both the Google and email/password signup paths
 * diverge from. Neither path should be reachable without this checked. */
function LegalConsentCheckboxes({
  role,
  accepted,
  setAccepted,
}: {
  role: Role;
  accepted: boolean;
  setAccepted: (v: boolean) => void;
}) {
  const docs = requiredDocumentsFor(role);
  return (
    <label className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 text-sm">
      <input
        type="checkbox"
        checked={accepted}
        onChange={(e) => setAccepted(e.target.checked)}
        className="mt-0.5 size-5 shrink-0 accent-primary"
      />
      <span className="text-foreground">
        I agree to CompanionCare's{" "}
        {docs.map((kind, i) => (
          <span key={kind}>
            {i > 0 && (i === docs.length - 1 ? " and " : ", ")}
            <Link
              to={DOC_LINK[kind]}
              target="_blank"
              className="font-semibold text-primary underline-offset-2 hover:underline"
            >
              {LEGAL_DOCUMENTS[kind].title}
            </Link>
          </span>
        ))}
        .
      </span>
    </label>
  );
}

function RoleStep({
  role,
  setRole,
  onGoogle,
  busy,
  legalAccepted,
  setLegalAccepted,
}: {
  role: Role;
  setRole: (r: Role) => void;
  onGoogle: () => void;
  busy: boolean;
  legalAccepted: boolean;
  setLegalAccepted: (v: boolean) => void;
}) {
  const roles: Role[] = ["senior", "family", "provider"];
  return (
    <div className="grid gap-5">
      <div className="grid gap-3">
        {roles.map((r) => {
          const m = roleMeta[r];
          const active = role === r;
          const Icon = m.icon;
          return (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`group grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 rounded-2xl border p-4 text-left transition ${
                active
                  ? "border-primary bg-primary/5 shadow-soft"
                  : "border-input bg-card hover:border-primary/40 hover:bg-secondary/40"
              }`}
            >
              <span
                className={`grid size-12 shrink-0 place-items-center rounded-2xl ${
                  active ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
                }`}
              >
                <Icon className="size-6" />
              </span>
              <span className="min-w-0">
                <span className="block text-base font-semibold text-foreground">{m.label}</span>
                <span className="mt-0.5 block text-sm text-muted-foreground">{m.description}</span>
              </span>
              <span
                className={`grid size-6 shrink-0 place-items-center rounded-full border-2 ${
                  active ? "border-primary bg-primary text-primary-foreground" : "border-input"
                }`}
                aria-hidden
              >
                {active && <Check className="size-3.5" />}
              </span>
            </button>
          );
        })}
      </div>
      {(role === "senior" || role === "family") && (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm text-foreground">
          <p className="font-semibold">
            {role === "senior"
              ? "Either of you can start — you're both welcome here."
              : "Either of you can start — no need to wait on anyone."}
          </p>
          <p className="mt-1 text-muted-foreground">
            {role === "senior" ? (
              <>
                Sign up on your own and invite family later, or ask a family member to
                create the account for you and send you a link. However you start, you
                stay in charge of what family can see.
              </>
            ) : (
              <>
                Sign up for yourself and invite your loved one with a link — or if
                they've already signed up, join their account with the code they share
                with you. Either way works.
              </>
            )}
          </p>
        </div>
      )}
      <LegalConsentCheckboxes role={role} accepted={legalAccepted} setAccepted={setLegalAccepted} />

      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span className="h-px flex-1 bg-border" /> or sign up with <span className="h-px flex-1 bg-border" />
      </div>

      <Button
        type="button"
        variant="outline"
        size="lg"
        className="h-14 w-full text-base"
        onClick={onGoogle}
        disabled={busy || !legalAccepted}
      >
        <GoogleIcon /> Continue with Google
      </Button>
    </div>
  );
}

function BasicsStep({
  role,
  fullName,
  setFullName,
  phone,
  setPhone,
  city,
  setCity,
}: {
  role: Role;
  fullName: string;
  setFullName: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  city: string;
  setCity: (v: string) => void;
}) {
  const nameLabel = useMemo(() => {
    if (role === "family") return "Your full name";
    if (role === "provider") return "Your full name (as it appears on ID)";
    return "Your full name";
  }, [role]);
  return (
    <div className="grid gap-4">
      <div>
        <Label htmlFor="fullName" className="text-base">{nameLabel}</Label>
        <Input
          id="fullName"
          className="mt-1 h-12 text-base"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Jane Doe"
          required
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="phone" className="text-base">Phone <span className="text-muted-foreground">(optional)</span></Label>
          <Input
            id="phone"
            type="tel"
            className="mt-1 h-12 text-base"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(555) 123-4567"
          />
        </div>
        <div>
          <Label htmlFor="city" className="text-base">City &amp; state</Label>
          <Input
            id="city"
            className="mt-1 h-12 text-base"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Sarasota, FL"
          />
        </div>
      </div>
      <p className="rounded-xl bg-secondary/50 p-3 text-sm text-muted-foreground">
        We use your phone only for visit updates and to reach you if something comes up — never for marketing.
      </p>
    </div>
  );
}

function SeniorStep({
  monthlyBudget,
  setMonthlyBudget,
  textSize,
  setTextSize,
  familyCanSee,
  setFamilyCanSee,
}: {
  monthlyBudget: string;
  setMonthlyBudget: (v: string) => void;
  textSize: "normal" | "large" | "xlarge";
  setTextSize: (v: "normal" | "large" | "xlarge") => void;
  familyCanSee: boolean;
  setFamilyCanSee: (v: boolean) => void;
}) {
  return (
    <div className="grid gap-5">
      <div>
        <Label htmlFor="budget" className="text-base">Monthly budget for help <span className="text-muted-foreground">(optional)</span></Label>
        <div className="relative mt-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base text-muted-foreground">$</span>
          <Input
            id="budget"
            type="number"
            inputMode="numeric"
            min={0}
            step={50}
            className="h-12 pl-7 text-base"
            value={monthlyBudget}
            onChange={(e) => setMonthlyBudget(e.target.value)}
            placeholder="e.g. 600"
          />
        </div>
        <p className="mt-1 text-sm text-muted-foreground">A ballpark helps us match helpers who fit — you can change it any time.</p>
      </div>

      <div>
        <Label className="text-base">Text size in the app</Label>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {(["normal", "large", "xlarge"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setTextSize(s)}
              className={`rounded-xl border px-3 py-3 font-medium capitalize transition ${
                textSize === s
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-input bg-card text-foreground hover:bg-secondary"
              } ${s === "normal" ? "text-sm" : s === "large" ? "text-base" : "text-lg"}`}
            >
              {s === "xlarge" ? "Extra large" : s}
            </button>
          ))}
        </div>
      </div>

      <label className="flex items-start gap-3 rounded-2xl border border-input bg-card p-4">
        <input
          type="checkbox"
          checked={familyCanSee}
          onChange={(e) => setFamilyCanSee(e.target.checked)}
          className="mt-1 size-5 accent-primary"
        />
        <span>
          <span className="block text-base font-semibold">Family can see my visits</span>
          <span className="text-sm text-muted-foreground">
            You choose who to invite. You can turn this off any time.
          </span>
        </span>
      </label>
    </div>
  );
}

function FamilyStep({
  seniorName,
  setSeniorName,
  relationship,
  setRelationship,
  monthlyBudget,
  setMonthlyBudget,
}: {
  seniorName: string;
  setSeniorName: (v: string) => void;
  relationship: string;
  setRelationship: (v: string) => void;
  monthlyBudget: string;
  setMonthlyBudget: (v: string) => void;
}) {
  const rels = ["Mother", "Father", "Grandparent", "Spouse", "Aunt or uncle", "Friend", "Other"];
  return (
    <div className="grid gap-5">
      <div>
        <Label htmlFor="seniorName" className="text-base">Who are you helping? (first name)</Label>
        <Input
          id="seniorName"
          className="mt-1 h-12 text-base"
          value={seniorName}
          onChange={(e) => setSeniorName(e.target.value)}
          placeholder="e.g. Mom, or Marta"
          required
        />
      </div>
      <div>
        <Label className="text-base">Your relationship</Label>
        <div className="mt-2 flex flex-wrap gap-2">
          {rels.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRelationship(r)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                relationship === r
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-input bg-card hover:bg-secondary"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
      <div>
        <Label htmlFor="budget" className="text-base">Monthly budget for help <span className="text-muted-foreground">(optional)</span></Label>
        <div className="relative mt-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base text-muted-foreground">$</span>
          <Input
            id="budget"
            type="number"
            inputMode="numeric"
            min={0}
            step={50}
            className="h-12 pl-7 text-base"
            value={monthlyBudget}
            onChange={(e) => setMonthlyBudget(e.target.value)}
            placeholder="e.g. 800"
          />
        </div>
      </div>
      <p className="rounded-xl bg-secondary/50 p-3 text-sm text-muted-foreground">
        Your loved one stays in charge of every decision. You'll be able to invite them (or accept their invite) after you sign up.
      </p>
    </div>
  );
}

function ProviderStep({
  headline,
  setHeadline,
  bio,
  setBio,
  hourlyRate,
  setHourlyRate,
  yearsExperience,
  setYearsExperience,
  specialties,
  toggleSpecialty,
  languages,
  toggleLanguage,
}: {
  headline: string;
  setHeadline: (v: string) => void;
  bio: string;
  setBio: (v: string) => void;
  hourlyRate: string;
  setHourlyRate: (v: string) => void;
  yearsExperience: string;
  setYearsExperience: (v: string) => void;
  specialties: string[];
  toggleSpecialty: (v: string) => void;
  languages: string[];
  toggleLanguage: (v: string) => void;
}) {
  return (
    <div className="grid gap-5">
      <div>
        <Label htmlFor="headline" className="text-base">Your headline</Label>
        <Input
          id="headline"
          className="mt-1 h-12 text-base"
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          placeholder="Warm, dependable Tuesday helper"
          maxLength={80}
          required
        />
        <p className="mt-1 text-sm text-muted-foreground">Families see this first — keep it warm and specific.</p>
      </div>
      <div>
        <Label htmlFor="bio" className="text-base">Short introduction <span className="text-muted-foreground">(optional)</span></Label>
        <Textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className="mt-1 min-h-24 text-base"
          maxLength={500}
          placeholder="A few sentences about who you love working with and what you bring."
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="rate" className="text-base">Hourly rate</Label>
          <div className="relative mt-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base text-muted-foreground">$</span>
            <Input
              id="rate"
              type="number"
              inputMode="numeric"
              min={15}
              max={200}
              step={1}
              className="h-12 pl-7 text-base"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
              required
            />
          </div>
        </div>
        <div>
          <Label htmlFor="years" className="text-base">Years of experience <span className="text-muted-foreground">(optional)</span></Label>
          <Input
            id="years"
            type="number"
            inputMode="numeric"
            min={0}
            max={60}
            className="mt-1 h-12 text-base"
            value={yearsExperience}
            onChange={(e) => setYearsExperience(e.target.value)}
            placeholder="e.g. 5"
          />
        </div>
      </div>
      <div>
        <Label className="text-base">What you do best</Label>
        <div className="mt-2 flex flex-wrap gap-2">
          {SPECIALTY_OPTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => toggleSpecialty(s)}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
                specialties.includes(s)
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-input bg-card hover:bg-secondary"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
      <div>
        <Label className="text-base">Languages you speak</Label>
        <div className="mt-2 flex flex-wrap gap-2">
          {LANGUAGE_OPTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => toggleLanguage(s)}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
                languages.includes(s)
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-input bg-card hover:bg-secondary"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
      <p className="rounded-xl bg-secondary/50 p-3 text-sm text-muted-foreground">
        Your profile stays hidden from families until identity, background, and reference checks are complete.
      </p>
    </div>
  );
}

function CredentialsStep({
  email,
  setEmail,
  password,
  setPassword,
}: {
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
}) {
  return (
    <div className="grid gap-4">
      <div>
        <Label htmlFor="email" className="text-base">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          className="mt-1 h-12 text-base"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="password" className="text-base">Password</Label>
        <PasswordInput
          id="password"
          autoComplete="new-password"
          value={password}
          onChange={setPassword}
          minLength={8}
          required
        />
        <p className="mt-1 text-sm text-muted-foreground">At least 8 characters. Mix letters and numbers for extra safety.</p>
      </div>

      <p className="text-xs text-muted-foreground">
        By creating an account you agree to our terms of service and privacy policy. We never sell your data.
      </p>
    </div>
  );
}

function PasswordInput(props: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
  minLength?: number;
  required?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative mt-1">
      <Input
        id={props.id}
        type={visible ? "text" : "password"}
        autoComplete={props.autoComplete}
        className="h-12 pr-12 text-base"
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        minLength={props.minLength}
        required={props.required}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        className="absolute inset-y-0 right-0 grid w-12 place-items-center text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-r-md"
        tabIndex={0}
      >
        {visible ? <EyeOff className="size-5" aria-hidden /> : <Eye className="size-5" aria-hidden />}
      </button>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.24 1.5-1.7 4.4-5.5 4.4-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 3.6 14.7 2.6 12 2.6 6.9 2.6 2.8 6.7 2.8 12s4.1 9.4 9.2 9.4c5.3 0 8.8-3.7 8.8-9 0-.6-.1-1.1-.2-1.6H12z"
      />
    </svg>
  );
}

