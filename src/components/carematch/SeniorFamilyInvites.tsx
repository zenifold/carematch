import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Copy, Loader2, Mail, RotateCcw, ShieldCheck, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import {
  createFamilyInvite,
  listMyFamilyInvites,
  revokeFamilyInvite,
} from "@/lib/invites.functions";

type Perm = "view" | "modify" | "financial";

const permLabels: Record<Perm, string> = {
  view: "View only",
  modify: "Book & modify",
  financial: "Full financial",
};

function formatCode(code: string) {
  return code;
}

function inviteLink(code: string) {
  if (typeof window === "undefined") return `/family/join?code=${code}`;
  return `${window.location.origin}/family/join?code=${code}`;
}

export function SeniorFamilyInvites() {
  const qc = useQueryClient();
  const listFn = useServerFn(listMyFamilyInvites);
  const createFn = useServerFn(createFamilyInvite);
  const revokeFn = useServerFn(revokeFamilyInvite);

  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState<Perm>("view");

  const invitesQ = useQuery({
    queryKey: ["senior", "family-invites"],
    queryFn: () => listFn(),
  });

  const createM = useMutation({
    mutationFn: (input: { email?: string; permission: Perm }) => createFn({ data: input }),
    onSuccess: (invite) => {
      qc.invalidateQueries({ queryKey: ["senior", "family-invites"] });
      const link = inviteLink(invite.code);
      void navigator.clipboard?.writeText(link).catch(() => {});
      toast.success("Invite created — link copied to clipboard.");
      setEmail("");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Could not create invite"),
  });

  const revokeM = useMutation({
    mutationFn: (id: string) => revokeFn({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["senior", "family-invites"] });
      toast.success("Invite revoked");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Could not revoke invite"),
  });

  const invites = invitesQ.data ?? [];
  const active = invites.filter((i) => !i.redeemed_at && !i.revoked_at);
  const past = invites.filter((i) => i.redeemed_at || i.revoked_at);

  return (
    <section className="surface-card mt-10 overflow-hidden">
      <div className="border-b border-border p-5">
        <div className="flex items-center gap-2 text-primary">
          <UserPlus className="size-5" />
          <p className="text-xs font-bold uppercase tracking-widest">Family circle</p>
        </div>
        <h2 className="mt-1 font-serif text-2xl">Invite a family member</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Share a code so a family member can see your visits and help coordinate care. You control
          what they can do.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          createM.mutate({ email: email.trim() || undefined, permission });
        }}
        className="grid gap-3 p-5 sm:grid-cols-[minmax(0,1fr)_auto_auto]"
      >
        <label className="relative">
          <Mail className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="family@email.com (optional)"
            className="w-full rounded-full border border-border bg-background py-3 pl-10 pr-4 text-sm outline-none focus:border-primary"
          />
        </label>
        <select
          value={permission}
          onChange={(e) => setPermission(e.target.value as Perm)}
          className="rounded-full border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
        >
          <option value="view">View only</option>
          <option value="modify">Book & modify</option>
          <option value="financial">Full financial</option>
        </select>
        <button
          type="submit"
          disabled={createM.isPending}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-soft hover:bg-primary/90 disabled:opacity-60"
        >
          {createM.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <UserPlus className="size-4" />
          )}
          Generate invite
        </button>
      </form>

      {invitesQ.isPending ? (
        <div className="border-t border-border p-5 text-sm text-muted-foreground">
          Loading invites…
        </div>
      ) : active.length === 0 && past.length === 0 ? (
        <div className="border-t border-border p-5 text-sm text-muted-foreground">
          No invites yet. Generate one above and share the link or code.
        </div>
      ) : (
        <ul className="divide-y divide-border border-t border-border">
          {active.map((inv) => {
            const expires = new Date(inv.expires_at);
            const daysLeft = Math.max(
              0,
              Math.ceil((expires.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
            );
            const link = inviteLink(inv.code);
            return (
              <li key={inv.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-mono text-lg font-semibold tracking-wider">
                      {formatCode(inv.code)}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {inv.email ? `For ${inv.email} · ` : ""}
                      {permLabels[inv.permission as Perm] ?? inv.permission} · expires in {daysLeft}{" "}
                      day{daysLeft === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        void navigator.clipboard?.writeText(link);
                        toast.success("Invite link copied");
                      }}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-2 text-xs font-semibold hover:border-primary/40"
                    >
                      <Copy className="size-3.5" /> Copy link
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        void navigator.clipboard?.writeText(inv.code);
                        toast.success("Code copied");
                      }}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-2 text-xs font-semibold hover:border-primary/40"
                    >
                      <Copy className="size-3.5" /> Copy code
                    </button>
                    <button
                      type="button"
                      onClick={() => revokeM.mutate(inv.id)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-2 text-xs font-semibold text-destructive hover:border-destructive/40"
                    >
                      <Trash2 className="size-3.5" /> Revoke
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
          {past.map((inv) => (
            <li key={inv.id} className="flex items-center justify-between p-5 opacity-70">
              <div>
                <p className="font-mono text-sm tracking-wider">{formatCode(inv.code)}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {inv.redeemed_at ? (
                    <>
                      <ShieldCheck className="mr-1 inline size-3.5 text-primary" />
                      Redeemed {new Date(inv.redeemed_at).toLocaleDateString()}
                    </>
                  ) : (
                    <>
                      <RotateCcw className="mr-1 inline size-3.5" />
                      Revoked
                    </>
                  )}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
