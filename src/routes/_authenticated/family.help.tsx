import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  AlertTriangle,
  Phone,
  LifeBuoy,
  MessageCircle,
  Wallet,
  ClipboardList,
  Loader2,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { RouteErrorBoundary } from "@/components/carematch";
import { createSupportTicket } from "@/lib/support.functions";

export const Route = createFileRoute("/_authenticated/family/help")({
  component: FamilyHelp,
  errorComponent: RouteErrorBoundary,
});

const CONCIERGE_TEL = "18002273628";
const CONCIERGE_DISPLAY = "1 (800) 227-3628";

function FamilyHelp() {
  const create = useServerFn(createSupportTicket);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const send = useMutation({
    mutationFn: () =>
      create({ data: { subject: subject.trim(), body: body.trim(), portal: "family" } }),
    onSuccess: () => {
      toast.success("Sent — we'll be in touch shortly");
      setSubject("");
      setBody("");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not send"),
  });

  const canSend = subject.trim().length > 2 && body.trim().length > 5 && !send.isPending;

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          We're here for you
        </p>
        <h1 className="mt-1 font-serif text-3xl lg:text-4xl">Help &amp; concierge</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Human concierge for billing, care plan, and escalation. Emergencies always call 911 first.
        </p>
      </header>

      <section className="surface-card p-5 lg:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              Concierge line
            </p>
            <a
              href={`tel:${CONCIERGE_TEL}`}
              className="mt-1 block font-serif text-3xl text-primary hover:underline"
            >
              {CONCIERGE_DISPLAY}
            </a>
            <p className="mt-1 text-sm text-muted-foreground">
              7 days · 7am–10pm local time. After-hours pages an on-call coordinator for urgent
              issues.
            </p>
          </div>
          <a
            href={`tel:${CONCIERGE_TEL}`}
            className="inline-flex min-h-14 items-center gap-2 rounded-full bg-primary px-6 text-base font-semibold text-primary-foreground shadow-soft hover:bg-primary/90"
          >
            <Phone className="size-5" /> Call now
          </a>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <QuickLink
          to="/family/budget"
          icon={<Wallet className="size-5" />}
          title="Billing question"
          body="Refunds, invoices, statements."
        />
        <QuickLink
          to="/family/care-plan"
          icon={<ClipboardList className="size-5" />}
          title="Update care plan"
          body="Meds, allergies, home info, preferences."
        />
        <QuickLink
          to="/family/messages"
          icon={<MessageCircle className="size-5" />}
          title="Message a caregiver"
          body="Send a note to the current care team."
        />
        <QuickLink
          to="/family/visits"
          icon={<AlertTriangle className="size-5" />}
          title="Flag a visit concern"
          body="Report an issue about a recent visit."
        />
      </section>

      <section className="surface-card p-5 lg:p-6">
        <div className="flex items-start gap-3">
          <LifeBuoy className="mt-1 size-5 text-primary" />
          <div className="flex-1">
            <h2 className="font-serif text-2xl">Send us a message</h2>
            <p className="text-sm text-muted-foreground">
              We reply within 1 business day. For anything urgent, please call.
            </p>
            <div className="mt-4 space-y-3">
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Subject"
                className="w-full rounded-xl border border-input bg-background px-4 py-3 text-base"
              />
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={5}
                placeholder="Tell us what's going on…"
                className="w-full rounded-xl border border-input bg-background px-4 py-3 text-base"
              />
              <button
                onClick={() => send.mutate()}
                disabled={!canSend}
                className="inline-flex min-h-12 items-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-soft hover:bg-primary/90 disabled:opacity-50"
              >
                {send.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
                Send message
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function QuickLink({
  to,
  icon,
  title,
  body,
}: {
  to: string;
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <Link to={to} className="surface-card flex gap-3 p-4 hover:shadow-soft">
      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </span>
      <div>
        <p className="font-semibold">{title}</p>
        <p className="text-sm text-muted-foreground">{body}</p>
      </div>
    </Link>
  );
}
