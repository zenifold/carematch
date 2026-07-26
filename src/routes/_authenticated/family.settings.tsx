import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, ShieldCheck, UserPlus } from "lucide-react";
import { toast } from "sonner";

import {
  EmptyState,
  PageSkeleton,
  RouteErrorBoundary,
  PermissionBanner,
  RequestChangeDialog,
  OutgoingRequestsList,
} from "@/components/carematch";
import { FamilySeniorInvites } from "@/components/carematch/FamilySeniorInvites";
import {
  getFamilyNotificationPrefs,
  getSeniorEditPermission,
  listMyLinkedSeniors,
  updateFamilyNotificationPrefs,
} from "@/lib/family.functions";

export const Route = createFileRoute("/_authenticated/family/settings")({
  component: FamilySettings,
  errorComponent: RouteErrorBoundary,
});

type Perm = "view" | "modify" | "financial";

const permissionRows: { id: Perm; label: string; desc: string }[] = [
  { id: "view", label: "View only", desc: "See visits, care plan, and budget." },
  { id: "modify", label: "Book & modify", desc: "Request changes — the senior approves each one." },
  {
    id: "financial",
    label: "Full financial",
    desc: "Manage payment methods and see all transactions.",
  },
];

function initialsOf(name: string | null) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function FamilySettings() {
  const fetchLinks = useServerFn(listMyLinkedSeniors);
  const fetchPerm = useServerFn(getSeniorEditPermission);
  const fetchNotifPrefs = useServerFn(getFamilyNotificationPrefs);
  const saveNotifPrefs = useServerFn(updateFamilyNotificationPrefs);
  const linksQ = useQuery({
    queryKey: ["family", "links"],
    queryFn: () => fetchLinks(),
  });

  const primary = linksQ.data?.[0];
  const permQ = useQuery({
    queryKey: ["family", "perm", primary?.senior_id ?? ""],
    enabled: !!primary,
    queryFn: () => fetchPerm({ data: { senior_id: primary!.senior_id } }),
  });
  const canEdit = permQ.data?.can_edit ?? false;

  const notifQ = useQuery({
    queryKey: ["family", "notification-prefs"],
    queryFn: () => fetchNotifPrefs(),
  });
  const [notif, setNotif] = useState({ sms: true, email: true, push: false });
  useEffect(() => {
    if (notifQ.data) setNotif(notifQ.data);
  }, [notifQ.data]);
  const saveNotif = (next: typeof notif) => {
    setNotif(next);
    saveNotifPrefs({ data: next }).catch(() => {
      toast.error("Couldn't save notification settings");
    });
  };

  const [reqPerm, setReqPerm] = useState<Perm | null>(null);

  if (linksQ.isPending) {
    return <PageSkeleton title="settings" cards={2} />;
  }

  const links = linksQ.data ?? [];

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          Senior-granted access
        </p>
        <h1 className="mt-1 font-serif text-3xl lg:text-4xl">Settings & permissions</h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Every family link below was approved by the senior. They can revoke access at any time.
        </p>
      </div>

      {primary && !canEdit && (
        <PermissionBanner seniorName={primary.full_name} action="request permission changes" />
      )}

      {/* Invite a senior to sign up */}
      <FamilySeniorInvites />

      {/* Linked seniors */}
      <section className="surface-card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-5">
          <div>
            <h2 className="font-serif text-2xl">Your family circle</h2>
            <p className="text-sm text-muted-foreground">
              Seniors you can view and help coordinate.
            </p>
          </div>
          <Link
            to="/family/join"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft hover:bg-primary/90"
          >
            <UserPlus className="size-4" />
            Redeem an invite
          </Link>
        </div>

        {links.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={<UserPlus className="size-6" />}
              title="No linked seniors yet"
              description="Ask your loved one to generate an invite code from their CareMatch account, then redeem it here."
              action={
                <Link
                  to="/family/join"
                  className="inline-flex min-h-12 items-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-soft hover:bg-primary/90"
                >
                  Enter invite code
                </Link>
              }
            />
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {links.map((l) => (
              <li key={l.senior_id} className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid size-12 place-items-center rounded-2xl bg-sage-100 font-serif text-lg text-sage-700">
                      {initialsOf(l.full_name)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{l.full_name ?? "Senior"}</p>
                      {l.city && <p className="text-sm text-muted-foreground">{l.city}</p>}
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <ShieldCheck className="size-3.5 text-primary" />
                        Approved ·{" "}
                        {permissionRows.find((p) => p.id === l.permission)?.label ?? l.permission}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  {permissionRows.map((p) => {
                    const active = l.permission === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        disabled={active}
                        onClick={() => setReqPerm(p.id)}
                        className={`rounded-2xl border p-3 text-left text-sm transition ${
                          active
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/40"
                        } disabled:cursor-default`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">{p.label}</span>
                          {active && <Check className="size-4 text-primary" />}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{p.desc}</p>
                        {!active && (
                          <p className="mt-2 text-[11px] font-semibold uppercase tracking-widest text-primary">
                            Request this
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {primary && <OutgoingRequestsList seniorId={primary.senior_id} />}

      {primary && reqPerm && (
        <RequestChangeDialog
          open={!!reqPerm}
          onOpenChange={(v) => !v && setReqPerm(null)}
          seniorId={primary.senior_id}
          seniorName={primary.full_name}
          kind="permission"
          title="Request permission change"
          summary={
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Change to</p>
              <p className="mt-1 font-serif text-lg">
                {permissionRows.find((p) => p.id === reqPerm)?.label}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                {permissionRows.find((p) => p.id === reqPerm)?.desc}
              </p>
            </div>
          }
          payload={{ permission: reqPerm }}
        />
      )}

      {/* Notifications */}
      <section className="surface-card p-5 lg:p-6">
        <h2 className="font-serif text-2xl">Notifications</h2>
        <p className="text-sm text-muted-foreground">How CareMatch reaches you.</p>
        <ul className="mt-4 space-y-2">
          {(
            [
              ["sms", "SMS"],
              ["email", "Email"],
              ["push", "Push"],
            ] as const
          ).map(([k, label]) => (
            <li
              key={k}
              className="flex items-center justify-between rounded-2xl border border-border bg-secondary/40 p-4"
            >
              <span className="font-medium">{label}</span>
              <button
                onClick={() => saveNotif({ ...notif, [k]: !notif[k] })}
                aria-pressed={notif[k]}
                className={`relative h-6 w-11 rounded-full transition ${
                  notif[k] ? "bg-primary" : "bg-muted"
                }`}
              >
                <span
                  className={`absolute top-0.5 size-5 rounded-full bg-background transition-all ${
                    notif[k] ? "left-5" : "left-0.5"
                  }`}
                />
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
