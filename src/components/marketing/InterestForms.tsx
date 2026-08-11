import { useEffect, useId, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { AlertCircle, Check, Loader2, ArrowRight } from "lucide-react";
import { z } from "zod";

import { submitWaitlistSignup, type WaitlistSegment } from "@/lib/waitlist.functions";

/**
 * Pre-launch interest capture for /coming-soon.
 *
 * Four segments because the ask genuinely differs: a senior tells us what help
 * they want, a caregiver what they're qualified for, a partner agency which
 * states they cover. One generic "email us" box would throw all of that away.
 *
 * Two deliberate choices for this audience (older adults, plus a Large Text
 * Mode that scales the whole UI):
 *  - Real <input type="radio"> and native <select>, not custom widgets. Arrow
 *    keys, screen-reader announcement and platform zoom all come free, and
 *    there's no JS keyboard handling to get wrong.
 *  - Nothing is hidden behind a hover state, and every target clears 44px.
 */

const HELP_OPTIONS = [
  "Companionship",
  "Errands & rides",
  "Housekeeping",
  "Meal prep",
  "Medication reminders",
  "Personal care",
  "Transportation",
  "Tech help",
];

// Mirrors SPECIALTY_OPTIONS / LANGUAGE_OPTIONS in src/routes/auth.tsx so the
// answers we collect now line up with the real signup taxonomy later.
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

const LANGUAGE_OPTIONS = [
  "English",
  "Spanish",
  "Mandarin",
  "Tagalog",
  "French",
  "Vietnamese",
  "Russian",
];

const TIMING_OPTIONS = [
  "As soon as you're open near me",
  "Within the next few months",
  "Just planning ahead for now",
];

const URGENCY_OPTIONS = [
  "We need help right away",
  "Within the next month or two",
  "Planning ahead, no rush",
];

const CREDENTIAL_OPTIONS = [
  "CNA — Certified Nursing Assistant",
  "HHA — Home Health Aide",
  "LPN or RN",
  "No certification — experience only",
  "Other",
];

const EXPERIENCE_OPTIONS = ["Less than a year", "1–3 years", "3–5 years", "More than 5 years"];

const ORG_TYPE_OPTIONS = [
  "Licensed home care agency",
  "Medicare-certified home health agency",
  "Hospital or discharge planning",
  "Senior living community",
  "Area Agency on Aging or nonprofit",
  "Other",
];

type SegmentMeta = {
  key: WaitlistSegment;
  /** First person, because the visitor is completing "I…" */
  choice: string;
  aside: string;
  heading: string;
  lead: string;
  cta: string;
  /** What we promise this segment once they're on the list. Kept concrete. */
  confirmation: string;
};

const SEGMENTS: SegmentMeta[] = [
  {
    key: "senior",
    choice: "I need help at home",
    aside: "For the older adult themselves",
    heading: "You decide who comes through your door.",
    lead: "Not your children, not an agency scheduler. Tell us what would actually help and where you are, and we'll come to you when we open nearby.",
    cta: "Put me on the list",
    confirmation:
      "When we open in your area, someone from our team will write to you directly — no automated blast. You'll never be handed to a salesperson.",
  },
  {
    key: "family",
    choice: "I'm helping a parent or relative",
    aside: "For adult children and relatives",
    heading: "Help without taking the decision away.",
    lead: "Family members propose; the older adult approves. Tell us about the situation and we'll reach out as we open in their area.",
    cta: "Keep me posted",
    confirmation:
      "We'll write when we open in their area. Nothing gets set up behind their back — they approve what you can see and do, and can revoke it in one tap.",
  },
  {
    key: "caregiver",
    choice: "I want to work as a caregiver",
    aside: "For helpers, aides and nurses",
    heading: "Set your own rate. Keep your clients.",
    lead: "We're building the helper bench before we open to families, so early applicants go through verification first. Tell us what you do.",
    cta: "Apply as a helper",
    // No timeframe: verification is manual today, so any SLA here would be
    // invented. See PRODUCT.md.
    confirmation:
      "You're in the first group we'll take through verification. We'll email you when it's your turn and tell you exactly what it needs.",
  },
  {
    key: "partner",
    choice: "I represent an organization",
    aside: "For agencies, hospitals, senior living",
    heading: "The licensed side of the network.",
    lead: "Personal care runs through state-licensed agencies and skilled care through Medicare-certified ones. If that's you, or you send patients home, let's talk.",
    cta: "Start the conversation",
    confirmation:
      "Someone from partnerships will follow up directly about referral flow and the states you cover.",
  },
];

/** Mirrors the server's rules so people get a message without a round trip. */
const nameSchema = z.string().trim().min(2, "Please tell us your name").max(80);
const emailSchema = z.string().trim().email("Please enter a valid email address").max(255);

const field =
  "w-full rounded-xl border border-input bg-background px-4 py-3 text-lg outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40";
/** Border, not color alone — the message below the field carries the meaning. */
const fieldInvalid =
  "w-full rounded-xl border-2 border-destructive bg-background px-4 py-3 text-lg outline-none focus-visible:ring-2 focus-visible:ring-destructive/40";
const labelText = "mb-1.5 block text-base font-semibold";

type FormState = {
  name: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  note: string;
  helpNeeded: string[];
  timing: string;
  relationship: string;
  urgency: string;
  specialties: string[];
  languages: string[];
  credential: string;
  experience: string;
  orgName: string;
  orgType: string;
  statesServed: string;
  botField: string;
};

const EMPTY_FORM: FormState = {
  name: "",
  email: "",
  phone: "",
  city: "",
  state: "",
  note: "",
  helpNeeded: [],
  timing: "",
  relationship: "",
  urgency: "",
  specialties: [],
  languages: [],
  credential: "",
  experience: "",
  orgName: "",
  orgType: "",
  statesServed: "",
  botField: "",
};

/** Multi-select as real checkboxes — the label is the target, 44px tall. */
function CheckGroup({
  legend,
  hint,
  options,
  selected,
  onToggle,
}: {
  legend: string;
  hint?: string;
  options: string[];
  selected: string[];
  onToggle: (option: string) => void;
}) {
  return (
    <fieldset>
      <legend className={labelText}>
        {legend}
        {hint && <span className="ml-1.5 font-normal text-muted-foreground">{hint}</span>}
      </legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = selected.includes(option);
          return (
            <label
              key={option}
              className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-base font-medium transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring/50 ${
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-input bg-background hover:border-primary hover:bg-secondary"
              }`}
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={active}
                onChange={() => onToggle(option)}
              />
              {active && <Check className="size-4 shrink-0" aria-hidden />}
              {option}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function Select({
  label,
  value,
  options,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  placeholder: string;
  onChange: (value: string) => void;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className={labelText}>
        {label}
      </label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={field}>
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

/** Field-level error text, rendered under the input and wired up by id. */
function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1.5 flex items-start gap-1.5 text-base font-medium text-destructive">
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
      {message}
    </p>
  );
}

type FieldName = "name" | "email" | "orgName";

const FIELD_IDS: Record<FieldName, string> = {
  name: "wl-name",
  email: "wl-email",
  orgName: "wl-org",
};

export function InterestForms() {
  const [segment, setSegment] = useState<WaitlistSegment>("senior");
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [done, setDone] = useState<WaitlistSegment | null>(null);
  /** Captured before the form is cleared, so the confirmation can echo it back. */
  const [submitted, setSubmitted] = useState<{ email: string; where: string } | null>(null);
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const groupName = useId();
  const confirmRef = useRef<HTMLDivElement>(null);

  // The form collapses into two short paragraphs on success, which can leave a
  // tall page scrolled past the confirmation entirely.
  useEffect(() => {
    if (done && confirmRef.current) {
      confirmRef.current.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }, [done]);

  const meta = SEGMENTS.find((s) => s.key === segment)!;
  const submit = useServerFn(submitWaitlistSignup);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const toggle = (key: "helpNeeded" | "specialties" | "languages", option: string) =>
    setForm((prev) => ({
      ...prev,
      [key]: prev[key].includes(option)
        ? prev[key].filter((v) => v !== option)
        : [...prev[key], option],
    }));

  const mutation = useMutation({
    mutationFn: () => {
      const base = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        source: "coming-soon",
        botField: form.botField,
        note: form.note.trim() || undefined,
      };
      switch (segment) {
        case "senior":
          return submit({
            data: { ...base, segment: "senior", helpNeeded: form.helpNeeded, timing: form.timing },
          });
        case "family":
          return submit({
            data: {
              ...base,
              segment: "family",
              relationship: form.relationship.trim(),
              urgency: form.urgency,
            },
          });
        case "caregiver":
          return submit({
            data: {
              ...base,
              segment: "caregiver",
              specialties: form.specialties,
              languages: form.languages,
              credential: form.credential,
              experience: form.experience,
            },
          });
        case "partner":
          return submit({
            data: {
              ...base,
              segment: "partner",
              orgName: form.orgName.trim(),
              orgType: form.orgType,
              statesServed: form.statesServed.trim(),
            },
          });
      }
    },
    onSuccess: () => {
      setSubmitted({
        email: form.email.trim(),
        where: [form.city.trim(), form.state.trim()].filter(Boolean).join(", "),
      });
      setDone(segment);
      setErrors({});
      setForm(EMPTY_FORM);
    },
    // Never surface a raw server message: it can carry a Postgres error string.
    // The real one goes to the console for us, the visitor gets one sentence.
    onError: (error: unknown) => {
      console.error("[waitlist] submit failed", error);
      toast.error("We couldn't save that. Please try again in a moment.");
    },
  });

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();

    // Validate everything at once so the visitor sees every problem in one
    // pass, rather than one toast per attempt.
    const next: Partial<Record<FieldName, string>> = {};

    const name = nameSchema.safeParse(form.name);
    if (!name.success) next.name = name.error.issues[0].message;

    const email = emailSchema.safeParse(form.email);
    if (!email.success) next.email = email.error.issues[0].message;

    if (segment === "partner" && form.orgName.trim().length < 2) {
      next.orgName = "Please tell us your organization's name";
    }

    setErrors(next);

    const firstInvalid: FieldName | undefined = (["name", "email", "orgName"] as const).find(
      (f) => next[f],
    );
    if (firstInvalid) {
      // Move focus to the problem. A corner toast is invisible to someone who
      // is looking at the button they just pressed.
      document.getElementById(FIELD_IDS[firstInvalid])?.focus();
      return;
    }

    mutation.mutate();
  }

  /** Clearing an error as the visitor fixes it keeps the message honest. */
  const clearError = (field: FieldName) =>
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));

  return (
    <div className="mt-10">
      {/* A radiogroup, not tabs: the visitor is completing the sentence "I…",
          and one of four is mutually exclusive. Native radios give arrow-key
          navigation and correct screen-reader semantics with no JS. */}
      <fieldset>
        {/* This is the first instruction on the page. It was previously the
            smallest, greyest type on it. */}
        <legend className="text-lg font-semibold text-foreground">First, which one are you?</legend>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {SEGMENTS.map((option) => {
            const active = option.key === segment;
            return (
              <label
                key={option.key}
                className={`flex min-h-16 cursor-pointer flex-col justify-center rounded-xl border px-4 py-3 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring/50 ${
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card hover:border-primary hover:bg-secondary"
                }`}
              >
                <input
                  type="radio"
                  name={groupName}
                  className="sr-only"
                  checked={active}
                  onChange={() => {
                    setSegment(option.key);
                    // Clear the confirmation so someone can sign up as a second
                    // segment — an adult child who is also a caregiver.
                    setDone(null);
                  }}
                />
                <span className="text-lg font-semibold leading-snug">{option.choice}</span>
                <span
                  className={`text-sm ${active ? "text-primary-foreground/80" : "text-muted-foreground"}`}
                >
                  {option.aside}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-8 border-t border-border pt-8">
        {done ? (
          /* The peak-end moment, so it gets the weight. role="status" announces
             it, and the echoed address is the only way someone catches a typo
             in the field everything else depends on. */
          <div
            ref={confirmRef}
            role="status"
            className="rounded-2xl border-l-4 border-primary bg-secondary/50 p-6 sm:p-8"
          >
            <p className="inline-flex items-center gap-2 text-base font-bold uppercase tracking-[0.12em] text-primary">
              <Check className="size-5" aria-hidden /> You&rsquo;re on the list
            </p>
            <p className="mt-3 max-w-xl font-serif text-2xl leading-snug text-pretty">
              {SEGMENTS.find((s) => s.key === done)!.confirmation}
            </p>
            {submitted?.email && (
              <p className="mt-4 max-w-xl text-lg text-muted-foreground">
                We&rsquo;ve got you down as{" "}
                <span className="font-semibold text-foreground">{submitted.email}</span>
                {submitted.where && (
                  <>
                    , in <span className="font-semibold text-foreground">{submitted.where}</span>
                  </>
                )}
                .
              </p>
            )}
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setDone(null)}
                className="inline-flex min-h-11 items-center rounded-full border-2 border-primary px-5 py-2.5 text-base font-semibold text-primary hover:bg-secondary"
              >
                Add another answer
              </button>
              <button
                type="button"
                onClick={() => setDone(null)}
                className="inline-flex min-h-11 items-center rounded-full px-4 py-2.5 text-base font-medium text-muted-foreground underline hover:text-foreground"
              >
                Email wrong? Send it again
              </button>
            </div>
          </div>
        ) : (
          /* noValidate: native `required` bubbles fired before our own checks,
             so a one-character name produced a toast reading "Please tell us
             your name" after the browser had already let it through. One
             system owns errors now. */
          <form onSubmit={onSubmit} noValidate className="space-y-7">
            <div>
              <h3 className="font-serif text-2xl tracking-tight text-balance md:text-3xl">
                {meta.heading}
              </h3>
              <p className="mt-2 max-w-xl text-lg text-muted-foreground text-pretty">{meta.lead}</p>
            </div>

            {/* Honeypot — positioned off-screen rather than display:none, which
                some bots specifically check for. Never shown to a person. */}
            <div className="absolute left-[-9999px]" aria-hidden>
              <label htmlFor="cc-website">Company website</label>
              <input
                id="cc-website"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={form.botField}
                onChange={(e) => set("botField", e.target.value)}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="wl-name" className={labelText}>
                  Your name
                </label>
                <input
                  id="wl-name"
                  autoComplete="name"
                  value={form.name}
                  onChange={(e) => {
                    set("name", e.target.value);
                    clearError("name");
                  }}
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? "wl-name-error" : undefined}
                  className={errors.name ? fieldInvalid : field}
                />
                <FieldError id="wl-name-error" message={errors.name} />
              </div>
              <div>
                <label htmlFor="wl-email" className={labelText}>
                  Email
                </label>
                <input
                  id="wl-email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => {
                    set("email", e.target.value);
                    clearError("email");
                  }}
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? "wl-email-error" : undefined}
                  className={errors.email ? fieldInvalid : field}
                />
                <FieldError id="wl-email-error" message={errors.email} />
              </div>
              <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-3">
                <div>
                  <label htmlFor="wl-city" className={labelText}>
                    City
                  </label>
                  <input
                    id="wl-city"
                    autoComplete="address-level2"
                    value={form.city}
                    onChange={(e) => set("city", e.target.value)}
                    className={field}
                  />
                </div>
                <div>
                  <label htmlFor="wl-state" className={labelText}>
                    State
                  </label>
                  <input
                    id="wl-state"
                    autoComplete="address-level1"
                    maxLength={20}
                    value={form.state}
                    onChange={(e) => set("state", e.target.value)}
                    className={field}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="wl-phone" className={labelText}>
                  Phone <span className="font-normal text-muted-foreground">(optional)</span>
                </label>
                <input
                  id="wl-phone"
                  type="tel"
                  autoComplete="tel"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  className={field}
                />
              </div>
            </div>

            {segment === "senior" && (
              <>
                <CheckGroup
                  legend="What would help most?"
                  hint="Pick as many as you like"
                  options={HELP_OPTIONS}
                  selected={form.helpNeeded}
                  onToggle={(option) => toggle("helpNeeded", option)}
                />
                <Select
                  label="When would you want to start?"
                  value={form.timing}
                  options={TIMING_OPTIONS}
                  placeholder="Choose one"
                  onChange={(value) => set("timing", value)}
                />
              </>
            )}

            {segment === "family" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="wl-relationship" className={labelText}>
                    Who are you helping?
                  </label>
                  <input
                    id="wl-relationship"
                    placeholder="My mother, my neighbour…"
                    value={form.relationship}
                    onChange={(e) => set("relationship", e.target.value)}
                    className={field}
                  />
                </div>
                <Select
                  label="How soon is help needed?"
                  value={form.urgency}
                  options={URGENCY_OPTIONS}
                  placeholder="Choose one"
                  onChange={(value) => set("urgency", value)}
                />
              </div>
            )}

            {segment === "caregiver" && (
              <>
                <CheckGroup
                  legend="What kind of work do you do?"
                  options={SPECIALTY_OPTIONS}
                  selected={form.specialties}
                  onToggle={(option) => toggle("specialties", option)}
                />
                <CheckGroup
                  legend="Languages you speak"
                  options={LANGUAGE_OPTIONS}
                  selected={form.languages}
                  onToggle={(option) => toggle("languages", option)}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Select
                    label="Certification"
                    value={form.credential}
                    options={CREDENTIAL_OPTIONS}
                    placeholder="Choose one"
                    onChange={(value) => set("credential", value)}
                  />
                  <Select
                    label="Experience"
                    value={form.experience}
                    options={EXPERIENCE_OPTIONS}
                    placeholder="Choose one"
                    onChange={(value) => set("experience", value)}
                  />
                </div>
              </>
            )}

            {segment === "partner" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="wl-org" className={labelText}>
                    Organization
                  </label>
                  <input
                    id="wl-org"
                    value={form.orgName}
                    onChange={(e) => {
                      set("orgName", e.target.value);
                      clearError("orgName");
                    }}
                    aria-invalid={Boolean(errors.orgName)}
                    aria-describedby={errors.orgName ? "wl-org-error" : undefined}
                    className={errors.orgName ? fieldInvalid : field}
                  />
                  <FieldError id="wl-org-error" message={errors.orgName} />
                </div>
                <Select
                  label="What kind of organization?"
                  value={form.orgType}
                  options={ORG_TYPE_OPTIONS}
                  placeholder="Choose one"
                  onChange={(value) => set("orgType", value)}
                />
                <div className="sm:col-span-2">
                  <label htmlFor="wl-states" className={labelText}>
                    States you serve{" "}
                    <span className="font-normal text-muted-foreground">(optional)</span>
                  </label>
                  <input
                    id="wl-states"
                    placeholder="FL, GA, AL"
                    value={form.statesServed}
                    onChange={(e) => set("statesServed", e.target.value)}
                    className={field}
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="wl-note" className={labelText}>
                Anything else we should know?{" "}
                <span className="font-normal text-muted-foreground">(optional)</span>
              </label>
              <textarea
                id="wl-note"
                rows={3}
                maxLength={1000}
                value={form.note}
                onChange={(e) => set("note", e.target.value)}
                className={field}
              />
            </div>

            <div className="flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-sm text-base text-muted-foreground">
                We'll only use this to contact you about CompanionCare. No selling, no sharing — see
                our{" "}
                {/* Plain anchor, not <Link>: a hard navigation is re-evaluated by
                    the pre-launch gate, which allowlists this page. */}
                <a href="/legal/privacy" className="font-medium text-primary underline">
                  privacy policy
                </a>
                .
              </p>
              <button
                type="submit"
                disabled={mutation.isPending}
                className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-lg font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-70"
              >
                {mutation.isPending ? (
                  <Loader2 className="size-5 animate-spin" aria-hidden />
                ) : (
                  <ArrowRight className="size-5" aria-hidden />
                )}
                {meta.cta}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
