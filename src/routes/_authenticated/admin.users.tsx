import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";
import { checkIsAdmin } from "@/lib/admin.functions";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Search,
  Users,
  UserPlus,
  ShieldCheck,
  ShieldOff,
  KeyRound,
  Mail,
  X,
  Circle,
  CheckCircle2,
  UserCog,
  Copy,
} from "lucide-react";
import { toast } from "sonner";
import {
  listAdminUsers,
  addUserRole,
  removeUserRole,
  suspendUser,
  reactivateUser,
  sendPasswordReset,
  createAdminUser,
  type AdminUserRow,
} from "@/lib/admin-users.functions";
import { startImpersonation, type ImpersonationStart } from "@/lib/impersonation.functions";
import { exportUserData } from "@/lib/admin-ops.functions";

import { PageSkeleton, EmptyState, ErrorState, RouteErrorBoundary } from "@/components/carematch";

export const Route = createFileRoute("/_authenticated/admin/users")({
  component: UsersPage,
  errorComponent: RouteErrorBoundary,
  validateSearch: (search: Record<string, unknown>) =>
    z.object({ q: z.string().optional() }).parse(search),
  beforeLoad: async () => {
    // Admin-only page (user/role management, impersonation, GDPR export) —
    // other staff roles pass the parent /admin gate but not this one.
    const { isAdmin } = await checkIsAdmin();
    if (!isAdmin) throw redirect({ to: "/admin" });
  },
});

const ALL_ROLES = [
  "senior",
  "family",
  "provider",
  "admin",
  "staff",
  "support",
  "finance",
  "success",
  "trust_safety",
] as const;
type AppRole = (typeof ALL_ROLES)[number];

const roleTone: Record<AppRole, string> = {
  senior: "bg-primary/10 text-primary",
  family: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  provider: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  admin: "bg-destructive/10 text-destructive",
  staff: "bg-secondary text-foreground",
  support: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
  finance: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
  success: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
  trust_safety: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
};

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function UsersPage() {
  const { q: initialQuery } = Route.useSearch();
  const listFn = useServerFn(listAdminUsers);
  const [status, setStatus] = useState<"all" | "active" | "suspended" | "deleted">("all");
  const [roleFilter, setRoleFilter] = useState<AppRole | "">("");
  const [query, setQuery] = useState(initialQuery ?? "");
  const [selected, setSelected] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const q = useQuery({
    queryKey: ["admin", "users", status, roleFilter],
    queryFn: () => listFn({ data: { status, role: roleFilter || null, search: null, limit: 200 } }),
  });

  const filtered = useMemo(() => {
    const all = q.data ?? [];
    if (!query.trim()) return all;
    const needle = query.trim().toLowerCase();
    return all.filter(
      (u) =>
        (u.email ?? "").toLowerCase().includes(needle) ||
        (u.full_name ?? "").toLowerCase().includes(needle) ||
        (u.city ?? "").toLowerCase().includes(needle),
    );
  }, [q.data, query]);

  const selectedUser =
    filtered.find((u) => u.id === selected) ?? q.data?.find((u) => u.id === selected) ?? null;

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Console</p>
          <h1 className="font-serif text-2xl lg:text-3xl">Users</h1>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <UserPlus className="size-4" /> New user
        </button>
      </header>

      <section className="rounded-2xl border border-border bg-card">
        <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
          <div className="flex flex-1 min-w-[220px] items-center gap-2 rounded-lg border border-input bg-background px-3 py-1.5">
            <Search className="size-4 text-muted-foreground" />
            <input
              placeholder="Search name, email, city…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as AppRole | "")}
            className="rounded-lg border border-input bg-background px-2 py-1.5 text-sm"
          >
            <option value="">All roles</option>
            {ALL_ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as typeof status)}
            className="rounded-lg border border-input bg-background px-2 py-1.5 text-sm"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="deleted">Deleted</option>
          </select>
          <span className="text-xs text-muted-foreground">
            {filtered.length} of {q.data?.length ?? 0}
          </span>
        </div>

        {q.isPending ? (
          <div className="p-4">
            <PageSkeleton title="users" cards={4} />
          </div>
        ) : q.isError ? (
          <ErrorState error={q.error} onRetry={() => q.refetch()} />
        ) : filtered.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={<Users className="size-6" />}
              title="No users"
              description="Try changing the filters."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">User</th>
                  <th className="px-3 py-2 text-left font-medium">Email</th>
                  <th className="px-3 py-2 text-left font-medium">Roles</th>
                  <th className="px-3 py-2 text-left font-medium">Status</th>
                  <th className="px-3 py-2 text-left font-medium">Last sign-in</th>
                  <th className="px-3 py-2 text-left font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr
                    key={u.id}
                    onClick={() => setSelected(u.id)}
                    className="cursor-pointer border-t border-border hover:bg-secondary/40"
                  >
                    <td className="px-3 py-2 font-medium">{u.full_name ?? "Unnamed"}</td>
                    <td className="px-3 py-2 text-muted-foreground">{u.email ?? "—"}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1">
                        {u.roles.length === 0 ? (
                          <span className="text-xs text-muted-foreground">none</span>
                        ) : (
                          u.roles.map((r) => (
                            <span
                              key={r}
                              className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${roleTone[r as AppRole] ?? "bg-secondary"}`}
                            >
                              {r}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      {u.deleted_at ? (
                        <span className="text-xs text-muted-foreground">Deleted</span>
                      ) : u.suspended_at ? (
                        <span className="inline-flex items-center gap-1 text-xs text-destructive">
                          <Circle className="size-2 fill-current" /> Suspended
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="size-3" /> Active
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {fmtDate(u.last_sign_in_at)}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{fmtDate(u.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedUser && <UserDrawer user={selectedUser} onClose={() => setSelected(null)} />}
      {showCreate && <CreateUserDialog onClose={() => setShowCreate(false)} />}
    </div>
  );
}

function UserDrawer({ user, onClose }: { user: AdminUserRow; onClose: () => void }) {
  const qc = useQueryClient();
  const addRole = useServerFn(addUserRole);
  const removeRole = useServerFn(removeUserRole);
  const suspend = useServerFn(suspendUser);
  const reactivate = useServerFn(reactivateUser);
  const reset = useServerFn(sendPasswordReset);
  const impersonate = useServerFn(startImpersonation);
  const [impResult, setImpResult] = useState<ImpersonationStart | null>(null);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin", "users"] });

  const addRoleM = useMutation({
    mutationFn: (role: AppRole) => addRole({ data: { user_id: user.id, role } }),
    onSuccess: () => {
      toast.success("Role added");
      invalidate();
    },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });
  const removeRoleM = useMutation({
    mutationFn: (role: AppRole) => removeRole({ data: { user_id: user.id, role } }),
    onSuccess: () => {
      toast.success("Role removed");
      invalidate();
    },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });
  const suspendM = useMutation({
    mutationFn: (reason: string) => suspend({ data: { user_id: user.id, reason } }),
    onSuccess: () => {
      toast.success("User suspended");
      invalidate();
      onClose();
    },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });
  const reactivateM = useMutation({
    mutationFn: () => reactivate({ data: { user_id: user.id } }),
    onSuccess: () => {
      toast.success("User reactivated");
      invalidate();
    },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });
  const resetM = useMutation({
    mutationFn: () => reset({ data: { user_id: user.id } }),
    onSuccess: () => toast.success("Password reset sent"),
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });
  const imperM = useMutation({
    mutationFn: (reason: string) =>
      impersonate({ data: { user_id: user.id, reason, minutes: 30 } }),
    onSuccess: (r) => {
      setImpResult(r);
      toast.success("Impersonation session started");
    },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  const missingRoles = ALL_ROLES.filter((r) => !user.roles.includes(r));

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={onClose}>
      <aside
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-full max-w-lg flex-col overflow-y-auto bg-background shadow-2xl"
      >
        <header className="sticky top-0 flex items-start justify-between gap-3 border-b border-border bg-background/95 p-4 backdrop-blur">
          <div>
            <h2 className="font-serif text-xl">{user.full_name ?? "Unnamed"}</h2>
            <p className="text-sm text-muted-foreground">{user.email ?? "—"}</p>
          </div>
          <button
            onClick={onClose}
            className="grid size-8 place-items-center rounded-lg hover:bg-secondary"
          >
            <X className="size-4" />
          </button>
        </header>

        <div className="space-y-5 p-4">
          <section>
            <p className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">Status</p>
            {user.suspended_at ? (
              <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm">
                <p className="font-medium text-destructive">
                  Suspended {fmtDate(user.suspended_at)}
                </p>
                {user.suspended_reason && (
                  <p className="text-muted-foreground">{user.suspended_reason}</p>
                )}
                <button
                  onClick={() => reactivateM.mutate()}
                  disabled={reactivateM.isPending}
                  className="mt-2 inline-flex items-center gap-2 rounded-lg border border-input bg-card px-3 py-1.5 text-xs font-medium hover:bg-secondary"
                >
                  <ShieldCheck className="size-3" /> Reactivate
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => resetM.mutate()}
                  disabled={resetM.isPending}
                  className="inline-flex items-center gap-2 rounded-lg border border-input bg-card px-3 py-1.5 text-xs font-medium hover:bg-secondary"
                >
                  <KeyRound className="size-3" /> Send password reset
                </button>
                <button
                  onClick={() => {
                    const reason = window.prompt("Reason for suspension?");
                    if (reason && reason.trim()) suspendM.mutate(reason.trim());
                  }}
                  disabled={suspendM.isPending}
                  className="inline-flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10"
                >
                  <ShieldOff className="size-3" /> Suspend
                </button>
                <button
                  onClick={() => {
                    const reason = window.prompt(
                      "Reason for impersonation? (audit-logged — 30-minute magic link will be generated)",
                    );
                    if (reason && reason.trim()) imperM.mutate(reason.trim());
                  }}
                  disabled={imperM.isPending}
                  className="inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-100 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200"
                >
                  <UserCog className="size-3" /> View as user
                </button>
                <ExportUserDataButton userId={user.id} />
              </div>
            )}
            {impResult && (
              <ImpersonationResult result={impResult} onDone={() => setImpResult(null)} />
            )}
          </section>

          <section>
            <p className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">Roles</p>
            <div className="mb-2 flex flex-wrap gap-1">
              {user.roles.length === 0 && (
                <span className="text-xs text-muted-foreground">No roles assigned</span>
              )}
              {user.roles.map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    if (window.confirm(`Remove ${r} role?`)) removeRoleM.mutate(r as AppRole);
                  }}
                  className={`group inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-semibold uppercase ${roleTone[r as AppRole] ?? "bg-secondary"}`}
                >
                  {r} <X className="size-3 opacity-40 group-hover:opacity-100" />
                </button>
              ))}
            </div>
            {missingRoles.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {missingRoles.map((r) => (
                  <button
                    key={r}
                    onClick={() => addRoleM.mutate(r)}
                    className="rounded border border-dashed border-input px-2 py-0.5 text-[11px] font-medium uppercase text-muted-foreground hover:bg-secondary hover:text-foreground"
                  >
                    + {r}
                  </button>
                ))}
              </div>
            )}
          </section>

          <section>
            <p className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">Details</p>
            <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
              <dt className="text-muted-foreground">City</dt>
              <dd>{user.city ?? "—"}</dd>
              <dt className="text-muted-foreground">Email verified</dt>
              <dd>{user.email_confirmed_at ? "Yes" : "No"}</dd>
              <dt className="text-muted-foreground">Last sign-in</dt>
              <dd>{fmtDate(user.last_sign_in_at)}</dd>
              <dt className="text-muted-foreground">Created</dt>
              <dd>{fmtDate(user.created_at)}</dd>
              <dt className="text-muted-foreground">User ID</dt>
              <dd className="truncate font-mono text-xs">{user.id}</dd>
            </dl>
          </section>
        </div>
      </aside>
    </div>
  );
}

function CreateUserDialog({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const create = useServerFn(createAdminUser);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<AppRole>("senior");
  const [sendInvite, setSendInvite] = useState(true);

  const m = useMutation({
    mutationFn: () => create({ data: { email, full_name: name, role, send_invite: sendInvite } }),
    onSuccess: () => {
      toast.success(sendInvite ? "Invite sent" : "User created");
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      onClose();
    },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          m.mutate();
        }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md space-y-4 rounded-2xl bg-background p-5 shadow-2xl"
      >
        <header className="flex items-center justify-between">
          <h2 className="font-serif text-lg">Create user</h2>
          <button
            type="button"
            onClick={onClose}
            className="grid size-8 place-items-center rounded-lg hover:bg-secondary"
          >
            <X className="size-4" />
          </button>
        </header>

        <div className="space-y-2">
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Full name
          </label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Email
          </label>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Primary role
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as AppRole)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          >
            {ALL_ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={sendInvite}
            onChange={(e) => setSendInvite(e.target.checked)}
          />
          <span className="inline-flex items-center gap-1">
            <Mail className="size-3.5" /> Send invite email
          </span>
        </label>

        <button
          type="submit"
          disabled={m.isPending}
          className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {m.isPending ? "Creating…" : sendInvite ? "Send invite" : "Create user"}
        </button>
      </form>
    </div>
  );
}

function ImpersonationResult({
  result,
  onDone,
}: {
  result: ImpersonationStart;
  onDone: () => void;
}) {
  return (
    <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs dark:border-amber-900/40 dark:bg-amber-950/30">
      <p className="font-medium text-amber-900 dark:text-amber-100">
        Impersonation session for {result.target_name ?? result.target_email ?? "user"}
      </p>
      <p className="mt-1 text-amber-800 dark:text-amber-200">
        Expires {new Date(result.expires_at).toLocaleTimeString()} · logged to audit trail.
      </p>
      {result.magic_link ? (
        <div className="mt-2 space-y-2">
          <p className="text-amber-800 dark:text-amber-200">
            Open this one-time link in an incognito window to sign in as the user. Do not share.
          </p>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={result.magic_link}
              className="w-full truncate rounded border border-amber-300 bg-white px-2 py-1 font-mono text-[10px] text-foreground"
            />
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(result.magic_link!);
                toast.success("Link copied");
              }}
              className="inline-flex items-center gap-1 rounded border border-amber-300 bg-white px-2 py-1 text-[10px] font-medium text-amber-900 hover:bg-amber-100"
            >
              <Copy className="size-3" /> Copy
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-2 text-amber-800 dark:text-amber-200">
          No email on file — magic link could not be generated. Session record was still created.
        </p>
      )}
      <button
        type="button"
        onClick={onDone}
        className="mt-2 rounded border border-amber-300 bg-white px-2 py-1 text-[10px] font-medium text-amber-900 hover:bg-amber-100"
      >
        Dismiss
      </button>
    </div>
  );
}

function ExportUserDataButton({ userId }: { userId: string }) {
  const fn = useServerFn(exportUserData);
  const m = useMutation({
    mutationFn: () => fn({ data: { user_id: userId } }),
    onSuccess: (bundle) => {
      const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `user-${userId}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Export downloaded");
    },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });
  return (
    <button
      onClick={() => m.mutate()}
      disabled={m.isPending}
      className="inline-flex items-center gap-2 rounded-lg border border-input bg-card px-3 py-1.5 text-xs font-medium hover:bg-secondary"
    >
      GDPR export
    </button>
  );
}
