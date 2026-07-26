import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  LifeBuoy,
  Phone,
  AlertTriangle,
  ShieldAlert,
  BookOpen,
  DollarSign,
  CalendarClock,
  MessageCircle,
  Loader2,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { RouteErrorBoundary } from "@/components/carematch";
import { createSupportTicket } from "@/lib/support.functions";

export const Route = createFileRoute("/_authenticated/provider/help")({
  component: ProviderHelp,
  errorComponent: RouteErrorBoundary,
});

const OPS_TEL = "18002273628";
const OPS_DISPLAY = "1 (800) 227-3628";

function ProviderHelp() {
  const create = useServerFn(createSupportTicket);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const send = useMutation({
    mutationFn: () =>
      create({
        data: { subject: subject.trim(), body: body.trim(), portal: "provider" },
      }),
    onSuccess: () => {
      toast.success("Sent — Ops will follow up");
      setSubject("");
      setBody("");
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Could not send"),
  });

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-primary">
          <LifeBuoy className="size-5" />
          <p className="text-xs font-bold uppercase tracking-widest">
            Support & safety
          </p>
        </div>
        <h1 className="mt-1 font-serif text-2xl lg:text-3xl">Provider help</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Reach Ops any time — emergencies, payment questions, or safety
          concerns during a visit.
        </p>
      </div>

      <a
        href="tel:911"
        className="flex items-center gap-4 rounded-3xl border-2 border-destructive/40 bg-destructive/5 p-5 hover:bg-destructive/10"
      >
        <span className="grid size-12 place-items-center rounded-full bg-destructive text-destructive-foreground">
          <AlertTriangle className="size-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-serif text-lg">Call 911</p>
          <p className="text-sm text-muted-foreground">
            Medical or safety emergency during a visit.
          </p>
        </div>
        <Phone className="size-5 text-destructive" aria-hidden />
      </a>

      <a
        href={`tel:${OPS_TEL}`}
        className="flex items-center gap-4 rounded-3xl border-2 border-primary/40 bg-primary/5 p-5 hover:bg-primary/10"
      >
        <span className="grid size-12 place-items-center rounded-full bg-primary text-primary-foreground">
          <Phone className="size-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-serif text-lg">Call Ops</p>
          <p className="text-sm text-muted-foreground">
            {OPS_DISPLAY} · real dispatcher, 24/7.
          </p>
        </div>
      </a>

      <section className="space-y-3">
        <h2 className="font-serif text-xl">Quick links</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            to="/provider/earnings"
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 hover:bg-secondary/40"
          >
            <DollarSign className="size-5 text-primary" />
            <div>
              <p className="font-medium">Payments & payouts</p>
              <p className="text-xs text-muted-foreground">
                Statements, taxes, deposit issues
              </p>
            </div>
          </Link>
          <Link
            to="/provider/schedule"
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 hover:bg-secondary/40"
          >
            <CalendarClock className="size-5 text-primary" />
            <div>
              <p className="font-medium">Availability</p>
              <p className="text-xs text-muted-foreground">
                Time off, weekly hours
              </p>
            </div>
          </Link>
          <Link
            to="/provider/messages"
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 hover:bg-secondary/40"
          >
            <MessageCircle className="size-5 text-primary" />
            <div>
              <p className="font-medium">Client messages</p>
              <p className="text-xs text-muted-foreground">
                Chat about a visit
              </p>
            </div>
          </Link>
          <Link
            to="/provider/grow"
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 hover:bg-secondary/40"
          >
            <BookOpen className="size-5 text-primary" />
            <div>
              <p className="font-medium">Training & tier</p>
              <p className="text-xs text-muted-foreground">
                Modules, badges, earnings tier
              </p>
            </div>
          </Link>
        </div>
      </section>

      <section className="rounded-3xl border border-amber-500/30 bg-amber-500/5 p-5">
        <div className="flex items-center gap-2 text-amber-700">
          <ShieldAlert className="size-5" />
          <p className="font-serif text-lg">Report a concern</p>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Something happened on a visit — a fall, unsafe environment, a client
          in crisis. File it below and Ops sees it within minutes.
        </p>
        <Link
          to="/provider/messages"
          className="mt-3 inline-flex rounded-full border border-amber-500/50 bg-background px-4 py-2 text-sm font-semibold hover:bg-amber-500/10"
        >
          File an incident
        </Link>
      </section>

      <section className="surface-card space-y-3 p-5">
        <div>
          <h2 className="font-serif text-xl">Send Ops a message</h2>
          <p className="text-sm text-muted-foreground">
            We usually reply within a few hours.
          </p>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (subject.trim().length >= 3 && body.trim().length >= 3)
              send.mutate();
          }}
          className="space-y-3"
        >
          <input
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="What's it about?"
            className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-base"
          />
          <textarea
            required
            rows={5}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Tell us what you need…"
            className="w-full resize-none rounded-2xl border border-input bg-background px-4 py-3 text-base"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={send.isPending}
              className="inline-flex min-h-12 items-center gap-2 rounded-full bg-primary px-5 text-base font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {send.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
              Send message
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
