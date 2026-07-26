import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, ArrowRight, CheckCircle2, XCircle, GraduationCap, ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageSkeleton, ErrorState, RouteErrorBoundary } from "@/components/carematch";
import { getTrainingModule, submitTrainingQuiz } from "@/lib/provider-training.functions";

export const Route = createFileRoute("/_authenticated/onboarding/provider/basics-course")({
  component: BasicsCoursePage,
  errorComponent: RouteErrorBoundary,
});

type Phase = "intro" | "lesson" | "quiz" | "results";

type ScoreResult = {
  score: number;
  total: number;
  passed: boolean;
  results: { id: string; correct: boolean; correct_index: number; explanation: string }[];
};

function BasicsCoursePage() {
  const navigate = useNavigate();
  const getMod = useServerFn(getTrainingModule);
  const submit = useServerFn(submitTrainingQuiz);

  const modQ = useQuery({
    queryKey: ["training", "companion_basics_v1"],
    queryFn: () => getMod({ data: { code: "companion_basics_v1" } }),
  });

  const [phase, setPhase] = useState<Phase>("intro");
  const [lessonIdx, setLessonIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ScoreResult | null>(null);

  const alreadyPassed = modQ.data?.completion?.passed === true;

  const questions = modQ.data?.module.questions ?? [];
  const answered = useMemo(() => Object.keys(answers).length, [answers]);

  if (modQ.isPending) return <PageSkeleton title="Companion Basics" cards={3} />;
  if (modQ.isError) return <ErrorState error={modQ.error} onRetry={() => modQ.refetch()} />;

  const mod = modQ.data!.module;

  const submitQuiz = async () => {
    if (answered < questions.length) {
      toast.error("Answer every question before submitting.");
      return;
    }
    setBusy(true);
    try {
      const res = await submit({ data: { code: "companion_basics_v1", answers } });
      setResult(res);
      setPhase("results");
      if (res.passed) toast.success("You passed! You can now accept jobs.");
      else toast.error(`Scored ${res.score}/${res.total}. Review the feedback and try again.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not submit");
    } finally {
      setBusy(false);
    }
  };

  const retry = () => {
    setAnswers({});
    setResult(null);
    setPhase("quiz");
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 lg:px-0">
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-primary">
          <GraduationCap className="size-5" />
          <p className="text-xs font-bold uppercase tracking-widest">Required · 15 min</p>
        </div>
        <h1 className="font-serif text-3xl lg:text-4xl">{mod.title}</h1>
        {alreadyPassed && (
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-900">
            <ShieldCheck className="size-3.5" /> Passed — you can retake anytime to refresh
          </div>
        )}
      </header>

      {phase === "intro" && (
        <Card>
          <p className="text-base leading-relaxed text-muted-foreground">{mod.intro}</p>
          <ul className="mt-4 space-y-2 text-sm">
            {mod.lessons.map((l, i) => (
              <li key={l.title} className="flex items-start gap-2">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {i + 1}
                </span>
                <span>{l.title.replace(/^\d+\.\s*/, "")}</span>
              </li>
            ))}
          </ul>
          <div className="flex justify-between pt-4">
            <Link to="/onboarding/provider" className="text-sm text-muted-foreground underline-offset-2 hover:underline">
              <ArrowLeft className="mr-1 inline size-3" /> Back to onboarding
            </Link>
            <Button size="lg" onClick={() => { setLessonIdx(0); setPhase("lesson"); }}>
              Start lesson 1 <ArrowRight className="ml-1 size-4" />
            </Button>
          </div>
        </Card>
      )}

      {phase === "lesson" && (() => {
        const l = mod.lessons[lessonIdx];
        return (
          <Card>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Lesson {lessonIdx + 1} of {mod.lessons.length}
            </p>
            <h2 className="mt-1 font-serif text-2xl">{l.title.replace(/^\d+\.\s*/, "")}</h2>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground">{l.body}</p>
            <div className="mt-4 rounded-xl border border-border bg-secondary/40 p-4 text-sm">
              <p className="mb-2 font-semibold">Remember:</p>
              <ul className="space-y-1.5">
                {l.key_points.map((k) => (
                  <li key={k} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                    <span>{k}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex items-center justify-between pt-4">
              <button
                type="button"
                onClick={() => (lessonIdx === 0 ? setPhase("intro") : setLessonIdx(lessonIdx - 1))}
                className="text-sm text-muted-foreground underline-offset-2 hover:underline"
              >
                <ArrowLeft className="mr-1 inline size-3" /> Back
              </button>
              {lessonIdx < mod.lessons.length - 1 ? (
                <Button onClick={() => setLessonIdx(lessonIdx + 1)}>
                  Next lesson <ArrowRight className="ml-1 size-4" />
                </Button>
              ) : (
                <Button onClick={() => setPhase("quiz")}>
                  Start the quiz <ArrowRight className="ml-1 size-4" />
                </Button>
              )}
            </div>
          </Card>
        );
      })()}

      {phase === "quiz" && (
        <Card>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Quick check · {answered}/{questions.length} answered · need {mod.pass_threshold} right to pass
          </p>
          <div className="mt-4 space-y-6">
            {questions.map((q, i) => (
              <div key={q.id} className="space-y-2">
                <p className="font-medium">
                  <span className="text-primary">{i + 1}.</span> {q.scenario}
                </p>
                <div className="grid gap-2">
                  {q.choices.map((c, ci) => {
                    const selected = answers[q.id] === ci;
                    return (
                      <button
                        key={ci}
                        type="button"
                        onClick={() => setAnswers({ ...answers, [q.id]: ci })}
                        className={`rounded-lg border p-3 text-left text-sm transition ${
                          selected ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                        }`}
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between pt-4">
            <button
              type="button"
              onClick={() => setPhase("lesson")}
              className="text-sm text-muted-foreground underline-offset-2 hover:underline"
            >
              <ArrowLeft className="mr-1 inline size-3" /> Back to lessons
            </button>
            <Button onClick={submitQuiz} disabled={busy} size="lg">
              {busy && <Loader2 className="mr-2 size-4 animate-spin" />}
              Submit answers
            </Button>
          </div>
        </Card>
      )}

      {phase === "results" && result && (
        <Card>
          <div
            className={`rounded-xl p-5 ${
              result.passed
                ? "bg-emerald-500/10 border border-emerald-500/30"
                : "bg-amber-500/10 border border-amber-500/30"
            }`}
          >
            <p className="text-xs font-bold uppercase tracking-widest">
              {result.passed ? "Passed" : "Not yet"}
            </p>
            <p className="font-serif text-3xl">
              {result.score} <span className="text-lg text-muted-foreground">/ {result.total}</span>
            </p>
            <p className="mt-1 text-sm">
              {result.passed
                ? "You're cleared for Companion-tier jobs. Nice work."
                : `You need ${mod.pass_threshold} right. Review the feedback below and try again — you can retake as many times as you need.`}
            </p>
          </div>
          <ol className="mt-4 space-y-4">
            {questions.map((q, i) => {
              const r = result.results.find((x) => x.id === q.id)!;
              const chosen = answers[q.id];
              return (
                <li key={q.id} className="rounded-xl border border-border p-4">
                  <div className="flex items-start gap-2">
                    {r.correct ? (
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                    ) : (
                      <XCircle className="mt-0.5 size-4 shrink-0 text-amber-700" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium">
                        {i + 1}. {q.scenario}
                      </p>
                      <p className="mt-1 text-sm">
                        <span className="text-muted-foreground">You picked:</span>{" "}
                        <span className={r.correct ? "text-emerald-700" : "text-amber-800"}>
                          {q.choices[chosen] ?? "—"}
                        </span>
                      </p>
                      {!r.correct && (
                        <p className="mt-0.5 text-sm">
                          <span className="text-muted-foreground">Correct:</span>{" "}
                          <span className="text-emerald-700">{q.choices[r.correct_index]}</span>
                        </p>
                      )}
                      <p className="mt-2 text-sm text-muted-foreground">{r.explanation}</p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
          <div className="flex justify-between pt-4">
            {result.passed ? (
              <>
                <span />
                <Button onClick={() => navigate({ to: "/provider" })}>Go to portal</Button>
              </>
            ) : (
              <>
                <Link to="/onboarding/provider" className="text-sm text-muted-foreground underline-offset-2 hover:underline">
                  <ArrowLeft className="mr-1 inline size-3" /> Onboarding
                </Link>
                <Button onClick={retry}>Try again</Button>
              </>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <section className="space-y-3 rounded-2xl border border-border bg-card p-5 lg:p-6">{children}</section>;
}
