import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  AlertTriangle,
  Phone,
  LifeBuoy,
  MessageCircle,
  CalendarClock,
  ShieldAlert,
  Loader2,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { RouteErrorBoundary } from "@/components/carematch";
import { createSupportTicket } from "@/lib/support.functions";

export const Route = createFileRoute("/_authenticated/senior/help")({
  component: SeniorHelp,
  errorComponent: RouteErrorBoundary,
});

function SeniorHelp() {
  const create = useServerFn(createSupportTicket);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const send = useMutation({
    mutationFn: () =>
      create({
        data: { subject: subject.trim(), body: body.trim(), portal: "senior" },
      }),
    onSuccess: () => {
      toast.success("Sent — we'll be in touch");
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
          <p className="text-xs font-bold uppercase tracking-widest">Help & safety</p>
        </div>
        <h1 className="mt-1 font-serif text-3xl">How can we help?</h1>
        <p className="mt-1 text-muted-foreground">
          One tap for emergencies, or send us a message and a real person will read it.
        </p>
      </div>

      {/* Emergency 911 */}
      <a
        href="tel:911"
        className="flex items-center gap-4 rounded-3xl border-2 border-destructive/40 bg-destructive/5 p-5 transition hover:bg-destructive/10"
      >
        <span className="grid size-14 place-items-center rounded-full bg-destructive text-destructive-foreground">
          <AlertTriangle className="size-7" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-serif text-xl">Call 911</p>
          <p className="text-sm text-muted-foreground">
            For a medical or safety emergency, right now.
          </p>
        </div>
        <Phone className="size-5 text-destructive" aria-hidden />
      </a>

      {/* Quick actions */}
      <section className="space-y-3">
        <h2 className="font-serif text-xl">Quick actions</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            to="/senior/visits"
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 hover:bg-secondary/40"
          >
            <CalendarClock className="size-5 text-primary" />
            <div>
              <p className="font-medium">Change a visit</p>
              <p className="text-xs text-muted-foreground">Reschedule or cancel</p>
            </div>
          </Link>
          <Link
            to="/senior/messages"
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 hover:bg-secondary/40"
          >
            <MessageCircle className="size-5 text-primary" />
            <div>
              <p className="font-medium">Message caregiver</p>
              <p className="text-xs text-muted-foreground">Chat with your visits</p>
            </div>
          </Link>
          <Link
            to="/senior/people"
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 hover:bg-secondary/40"
          >
            <ShieldAlert className="size-5 text-primary" />
            <div>
              <p className="font-medium">Report a concern</p>
              <p className="text-xs text-muted-foreground">About a caregiver or visit</p>
            </div>
          </Link>
          <Link
            to="/senior/profile"
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 hover:bg-secondary/40"
          >
            <LifeBuoy className="size-5 text-primary" />
            <div>
              <p className="font-medium">Account & settings</p>
              <p className="text-xs text-muted-foreground">Text size, family, more</p>
            </div>
          </Link>
        </div>
      </section>

      {/* Send us a message */}
      <section className="surface-card space-y-3 p-5">
        <div>
          <h2 className="font-serif text-xl">Send us a message</h2>
          <p className="text-sm text-muted-foreground">
            We usually reply within a few hours.
          </p>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (subject.trim().length >= 3 && body.trim().length >= 3) send.mutate();
          }}
          className="space-y-3"
        >
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              What's it about?
            </label>
            <input
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Change my Tuesday visit"
              className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-base"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              How can we help?
            </label>
            <textarea
              required
              rows={5}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Tell us what you need…"
              className="w-full resize-none rounded-2xl border border-input bg-background px-4 py-3 text-base"
            />
          </div>
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
