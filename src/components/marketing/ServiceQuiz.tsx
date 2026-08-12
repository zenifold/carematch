import { useId, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, ArrowLeft, Compass, RotateCcw } from "lucide-react";

type ServiceKey =
  | "companionship"
  | "personal-care"
  | "housekeeping"
  | "errands"
  | "respite-care";

type Outcome = {
  service: ServiceKey;
  title: string;
  why: string;
  to: string;
};

const OUTCOMES: Record<ServiceKey, Outcome> = {
  companionship: {
    service: "companionship",
    title: "Companionship care",
    why: "Regular company and a familiar face who notices the small changes a weekly phone call misses.",
    to: "/services/companionship",
  },
  "personal-care": {
    service: "personal-care",
    title: "Personal care",
    why: "Hands-on help with bathing, dressing, and moving safely — provided by a CNA or HHA.",
    to: "/services/personal-care",
  },
  housekeeping: {
    service: "housekeeping",
    title: "Housekeeping & laundry",
    why: "Keeping the home manageable, which is often what actually makes staying at home viable.",
    to: "/services/housekeeping",
  },
  errands: {
    service: "errands",
    title: "Errands & rides",
    why: "Groceries, pharmacy runs, and getting to appointments without depending on family schedules.",
    to: "/services/errands",
  },
  "respite-care": {
    service: "respite-care",
    title: "Respite care",
    why: "Scheduled cover so the family caregiver can rest — the thing most often skipped until burnout.",
    to: "/services/respite-care",
  },
};

type Question = {
  id: string;
  prompt: string;
  options: { label: string; hint?: string; scores: Partial<Record<ServiceKey, number>> }[];
};

/**
 * Three questions, weighted rather than a decision tree.
 *
 * A tree would force one answer to dominate; weighting lets "needs bathing
 * help AND is isolated" surface personal care while still acknowledging
 * companionship. Ties break toward the earlier question's stronger signal.
 */
const QUESTIONS: Question[] = [
  {
    id: "biggest-worry",
    prompt: "What worries you most right now?",
    options: [
      {
        label: "They're alone too much",
        hint: "Isolation, low mood, long stretches with no visitors",
        scores: { companionship: 3, errands: 1 },
      },
      {
        label: "Day-to-day tasks are slipping",
        hint: "Dishes piling up, laundry, post unopened",
        scores: { housekeeping: 3, errands: 1 },
      },
      {
        label: "Getting around safely",
        hint: "Unsteady on their feet, trouble with stairs or the bath",
        scores: { "personal-care": 3 },
      },
      {
        label: "I'm exhausted doing it all",
        hint: "You or another family member is the main carer",
        scores: { "respite-care": 3, housekeeping: 1 },
      },
    ],
  },
  {
    id: "personal-help",
    prompt: "Do they need hands-on help with bathing, dressing, or moving?",
    options: [
      { label: "Yes, regularly", scores: { "personal-care": 3, "respite-care": 1 } },
      { label: "Occasionally", scores: { "personal-care": 1, companionship: 1 } },
      { label: "No, not yet", scores: { companionship: 1, housekeeping: 1, errands: 1 } },
    ],
  },
  {
    id: "cadence",
    prompt: "How often would help be useful?",
    options: [
      { label: "A few hours a week", scores: { companionship: 2, errands: 1 } },
      { label: "Most days", scores: { "personal-care": 2, housekeeping: 1 } },
      { label: "Just now and then, to cover a gap", scores: { "respite-care": 2, errands: 1 } },
    ],
  },
];

export function ServiceQuiz() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(() => QUESTIONS.map(() => null));
  const headingId = useId();

  const finished = step >= QUESTIONS.length;

  const tally = () => {
    const scores = new Map<ServiceKey, number>();
    answers.forEach((choice, qi) => {
      if (choice === null) return;
      const picked = QUESTIONS[qi].options[choice];
      for (const [key, value] of Object.entries(picked.scores)) {
        const k = key as ServiceKey;
        scores.set(k, (scores.get(k) ?? 0) + (value ?? 0));
      }
    });
    const ranked = [...scores.entries()].sort((a, b) => b[1] - a[1]);
    return ranked;
  };

  const answer = (optionIndex: number) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[step] = optionIndex;
      return next;
    });
    setStep((s) => s + 1);
  };

  const restart = () => {
    setAnswers(QUESTIONS.map(() => null));
    setStep(0);
  };

  const ranked = finished ? tally() : [];
  const top = ranked[0] ? OUTCOMES[ranked[0][0]] : null;
  const runnerUp = ranked[1] ? OUTCOMES[ranked[1][0]] : null;

  return (
    <section
      aria-labelledby={headingId}
      className="not-prose my-10 overflow-hidden rounded-3xl border border-border bg-secondary/30"
    >
      <div className="border-b border-border bg-background/60 px-6 py-5 md:px-8">
        <div className="flex items-center gap-2">
          <Compass className="size-4 text-primary" aria-hidden />
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
            Not sure what you need?
          </p>
        </div>
        <h2 id={headingId} className="mt-2 font-serif text-2xl tracking-tight md:text-3xl">
          {finished ? "Here's where we'd start" : "Three questions, about a minute"}
        </h2>
        {!finished && (
          <div className="mt-4 flex items-center gap-3">
            <div
              className="h-2 flex-1 overflow-hidden rounded-full bg-border"
              role="progressbar"
              aria-valuenow={step}
              aria-valuemin={0}
              aria-valuemax={QUESTIONS.length}
              aria-label={`Question ${step + 1} of ${QUESTIONS.length}`}
            >
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${(step / QUESTIONS.length) * 100}%` }}
              />
            </div>
            <span className="text-sm text-muted-foreground">
              {step + 1} of {QUESTIONS.length}
            </span>
          </div>
        )}
      </div>

      <div className="p-6 md:p-8">
        {!finished ? (
          <>
            <p className="font-serif text-xl tracking-tight">{QUESTIONS[step].prompt}</p>
            <ul className="mt-5 space-y-3">
              {QUESTIONS[step].options.map((opt, i) => (
                <li key={opt.label}>
                  <button
                    type="button"
                    onClick={() => answer(i)}
                    className="w-full rounded-2xl border border-border bg-background px-5 py-4 text-left transition hover:border-primary hover:bg-background/70 focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <span className="block text-base font-semibold">{opt.label}</span>
                    {opt.hint && (
                      <span className="mt-1 block text-sm text-muted-foreground">{opt.hint}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
              >
                <ArrowLeft className="size-3.5" aria-hidden /> Back
              </button>
            )}
          </>
        ) : (
          top && (
            <>
              <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Most likely fit
              </p>
              <h3 className="mt-1 font-serif text-3xl tracking-tight text-primary">{top.title}</h3>
              <p className="mt-3 text-lg leading-relaxed">{top.why}</p>

              {runnerUp && (
                <p className="mt-4 text-base text-muted-foreground">
                  Also worth a look:{" "}
                  <Link to={runnerUp.to} className="font-semibold text-foreground underline">
                    {runnerUp.title}
                  </Link>
                </p>
              )}

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link
                  to={top.to}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-base font-semibold text-primary-foreground transition hover:opacity-90"
                >
                  Read about {top.title.toLowerCase()}{" "}
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
                <Link
                  to="/auth"
                  search={{ mode: "signup" }}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-background px-6 py-3 text-base font-semibold transition hover:bg-secondary"
                >
                  Find someone near me
                </Link>
              </div>

              <button
                type="button"
                onClick={restart}
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
              >
                <RotateCcw className="size-3.5" aria-hidden /> Start over
              </button>

              <p className="mt-5 text-sm text-muted-foreground">
                A starting point, not an assessment. Most families end up mixing two or three of
                these — you can change anything later, and we're happy to talk it through.
              </p>
            </>
          )
        )}
      </div>
    </section>
  );
}
