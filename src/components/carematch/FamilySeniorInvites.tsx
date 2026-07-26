import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Copy, Loader2, Mail, RotateCcw, ShieldCheck, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import {
  createSeniorInvite,
  listMySeniorInvites,
  revokeSeniorInvite,
} from "@/lib/senior-invites.functions";

type Perm = "view" | "modify" | "financial";

const permLabels: Record<Perm, string> = {
  view: "View only",
  modify: "Book & modify",
  financial: "Full financial",
};

function inviteLink(code: string) {
  if (typeof window === "undefined") return `/senior/join?code=${code}`;
  return `${window.location.origin}/senior/join?code=${code}`;
}

export function FamilySeniorInvites() {
  const qc = useQueryClient();
  const listFn = useServerFn(listMySeniorInvites);
  const createFn = useServerFn(createSeniorInvite);
  const revokeFn = useServerFn(revokeSeniorInvite);

  const [seniorName, setSeniorName] = useState("");
  const [seniorEmail, setSeniorEmail] = useState("");
  const [relationship, setRelationship] = useState("");
  const [permission, setPermission] = useState<Perm>("modify");

  const invitesQ = useQuery({
    queryKey: ["family", "senior-invites"],
    queryFn: () => listFn(),
  });

  const createM = useMutation({
    mutationFn: (input: {
      senior_name?: string;
      senior_email?: string;
      relationship?: string;
      permission: Perm;
    }) => createFn({ data: input }),
    onSuccess: (invite) => {
      qc.invalidateQueries({ queryKey: ["family", "senior-invites"] });
      const link = inviteLink(invite.code);
      void navigator.clipboard?.writeText(link).catch(() => {});
      toast.success("Invite created — link copied to clipboard.");
      setSeniorName("");
      setSeniorEmail("");
      setRelationship("");
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Could not create invite"),
  });

  const revokeM = useMutation({
    mutationFn: (id: string) => revokeFn({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["family", "senior-invites"] });
      toast.success("Invite revoked");
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Could not revoke invite"),
  });

  const invites = invitesQ.data ?? [];
  const active = invites.filter((i) => !i.redeemed_at && !i.revoked_at);
  const past = invites.filter((i) => i.redeemed_at || i.revoked_at);

  return (
    <section className="surface-card overflow-hidden">
      <div className="border-b border-border p-5">
        <div className="flex items-center gap-2 text-primary">
          <UserPlus className="size-5" />
          <p className="text-xs font-bold uppercase tracking-widest">Invite your senior</p>
        </div>
        <h2 className="mt-1 font-serif text-2xl">Set up their account</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Share a code with your loved one so they can create their CareMatch account. You'll be
          linked automatically the moment they sign up.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          createM.mutate({
            senior_name: seniorName.trim() || undefined,
            senior_email: seniorEmail.trim() || undefined,
            relationship: relationship.trim() || undefined,
            permission,
          });
        }}
        className="grid gap-3 p-5 sm:grid-cols-2"
      >
        <label className="sm:col-span-1">
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Their name
          </span>
          <input
            value={seniorName}
            onChange={(e) => setSeniorName(e.target.value)}
            placeholder="e.g. Mom, or Marta Alvarez"
            className="mt-1.5 w-full rounded-full border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
          />
        </label>
        <label className="sm:col-span-1">
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Relationship
          </span>
          <input
            value={relationship}
            onChange={(e) => setRelationship(e.target.value)}
            placeholder="Mother, father, aunt…"
            className="mt-1.5 w-full rounded-full border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
          />
        </label>
        <label className="sm:col-span-2">
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Their email (optional)
          </span>
          <div className="relative mt-1.5">
            <Mail className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={seniorEmail}
              onChange={(e) => setSeniorEmail(e.target.value)}
              type="email"
              placeholder="mom@email.com"
              className="w-full rounded-full border border-border bg-background py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary"
            />
          </div>
        </label>
        <label className="sm:col-span-1">
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Your permission
          </span>
          <select
            value={permission}
            onChange={(e) => setPermission(e.target.value as Perm)}
            className="mt-1.5 w-full rounded-full border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
          >
            <option value="view">View only</option>
            <option value="modify">Book & modify</option>
            <option value="financial">Full financial</option>
          </select>
        </label>
        <div className="flex items-end sm:col-span-1">
          <button
            type="submit"
            disabled={createM.isPending}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft hover:bg-primary/90 disabled:opacity-60"
          >
            {createM.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <UserPlus className="size-4" />
            )}
            Generate invite
          </button>
        </div>
      </form>

      {invitesQ.isPending ? (
        <div className="border-t border-border p-5 text-sm text-muted-foreground">
          Loading invites…
        </div>
      ) : active.length === 0 && past.length === 0 ? (
        <div className="border-t border-border p-5 text-sm text-muted-foreground">
          No invites yet. Generate one above and share the link or code with your senior.
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
                    <p className="font-mono text-lg font-semibold tracking-wider">{inv.code}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {inv.senior_name ? `For ${inv.senior_name} · ` : ""}
                      {permLabels[inv.permission as Perm] ?? inv.permission} · expires in{" "}
                      {daysLeft} day{daysLeft === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
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
                <p className="font-mono text-sm tracking-wider">{inv.code}</p>
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
