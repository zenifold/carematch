import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Check, X, Sparkles, ShoppingBag, Clock, Receipt, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import {
  listVisitExtras,
  addVisitExtra,
  setVisitExtraStatus,
  deleteVisitExtra,
  type VisitExtra,
  type VisitExtraKind,
} from "@/lib/visit-extras.functions";

type Role = "provider" | "senior" | "family";

const KIND_META: Record<VisitExtraKind, { label: string; icon: typeof ShoppingBag; hint: string }> = {
  errand_stop: { label: "Errand stop", icon: ShoppingBag, hint: "A quick pickup on the way — groceries, pharmacy, etc." },
  extra_time: { label: "Extra time", icon: Clock, hint: "Time beyond the scheduled visit." },
  reimbursement: { label: "Reimbursement", icon: Receipt, hint: "Out-of-pocket cost (attach receipt in note)." },
  other: { label: "Other", icon: MoreHorizontal, hint: "Anything else." },
};

const money = (cents: number) =>
  (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });

export function VisitExtras({ bookingId, role }: { bookingId: string; role: Role }) {
  const qc = useQueryClient();
  const listFn = useServerFn(listVisitExtras);
  const addFn = useServerFn(addVisitExtra);
  const statusFn = useServerFn(setVisitExtraStatus);
  const delFn = useServerFn(deleteVisitExtra);

  const q = useQuery({
    queryKey: ["visit-extras", bookingId],
    queryFn: () => listFn({ data: { booking_id: bookingId } }),
  });

  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<VisitExtraKind>("errand_stop");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const invalidate = () => qc.invalidateQueries({ queryKey: ["visit-extras", bookingId] });

  const add = useMutation({
    mutationFn: () =>
      addFn({
        data: {
          booking_id: bookingId,
          kind,
          amount_cents: Math.round(Number(amount || "0") * 100),
          note: note || null,
        },
      }),
    onSuccess: (row) => {
      invalidate();
      setOpen(false);
      setAmount("");
      setNote("");
      setKind("errand_stop");
      toast.success(
        row.status === "auto_approved"
          ? "Added — covered by the monthly extras budget."
          : "Added — waiting on approval.",
      );
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not add"),
  });

  const setStatus = useMutation({
    mutationFn: (v: { id: string; status: "approved" | "declined" }) =>
      statusFn({ data: v }),
    onSuccess: () => {
      invalidate();
      toast.success("Updated.");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Update failed"),
  });

  const remove = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => {
      invalidate();
      toast.success("Removed.");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Remove failed"),
  });

  const extras = q.data ?? [];

  return (
    <div className="surface-card p-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-lg">Extras added to this visit</h2>
          <p className="text-sm text-muted-foreground">
            {role === "provider"
              ? "Log grocery stops, extra time, or reimbursements so you're paid fairly."
              : "Small favors added during the visit. Approve any that need your OK."}
          </p>
        </div>
        {role === "provider" && (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex items-center gap-1 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="size-4" /> Add to visit
          </button>
        )}
      </div>

      {open && role === "provider" && (
        <div className="mt-4 rounded-2xl border border-border bg-secondary/30 p-4 space-y-3">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Type</label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {(Object.keys(KIND_META) as VisitExtraKind[]).map((k) => {
                const M = KIND_META[k];
                const active = kind === k;
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setKind(k)}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm ${
                      active ? "border-primary bg-primary/10 text-primary font-semibold" : "border-input bg-card"
                    }`}
                  >
                    <M.icon className="size-4" /> {M.label}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{KIND_META[kind].hint}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Amount ($)</label>
              <input
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 6.50"
                className="mt-2 w-full rounded-xl border border-input bg-card px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Note (optional)</label>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. milk, bread, bananas"
                className="mt-2 w-full rounded-xl border border-input bg-card px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => add.mutate()}
              disabled={add.isPending || !amount || Number(amount) <= 0}
              className="inline-flex items-center gap-1 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              <Check className="size-4" /> Save
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full border border-input px-4 py-2 text-sm hover:bg-secondary"
            >
              Cancel
            </button>
            <span className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Sparkles className="size-3" /> Under the monthly extras budget = auto-approved.
            </span>
          </div>
        </div>
      )}

      {q.isPending ? (
        <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
      ) : extras.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">Nothing added yet.</p>
      ) : (
        <ul className="mt-4 divide-y divide-border">
          {extras.map((x) => (
            <ExtraRow
              key={x.id}
              extra={x}
              role={role}
              onApprove={() => setStatus.mutate({ id: x.id, status: "approved" })}
              onDecline={() => setStatus.mutate({ id: x.id, status: "declined" })}
              onRemove={() => remove.mutate(x.id)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function ExtraRow({
  extra,
  role,
  onApprove,
  onDecline,
  onRemove,
}: {
  extra: VisitExtra;
  role: Role;
  onApprove: () => void;
  onDecline: () => void;
  onRemove: () => void;
}) {
  const M = KIND_META[extra.kind];
  const badge =
    extra.status === "auto_approved"
      ? { label: "Auto-approved", cls: "bg-success/15 text-success" }
      : extra.status === "approved"
      ? { label: "Approved", cls: "bg-success/15 text-success" }
      : extra.status === "declined"
      ? { label: "Declined", cls: "bg-muted text-muted-foreground line-through" }
      : { label: "Pending", cls: "bg-accent/20 text-accent-foreground" };

  return (
    <li className="flex flex-wrap items-center gap-3 py-3">
      <span className="grid size-9 place-items-center rounded-full bg-primary/10 text-primary">
        <M.icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">
          {M.label} · {money(extra.amount_cents)}
        </p>
        {extra.note && <p className="truncate text-xs text-muted-foreground">{extra.note}</p>}
      </div>
      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${badge.cls}`}>{badge.label}</span>
      {role === "senior" && extra.status === "pending" && (
        <div className="flex gap-1">
          <button
            type="button"
            onClick={onApprove}
            className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground"
          >
            <Check className="size-3" /> Approve
          </button>
          <button
            type="button"
            onClick={onDecline}
            className="inline-flex items-center gap-1 rounded-full border border-input px-3 py-1 text-xs hover:bg-secondary"
          >
            <X className="size-3" /> Decline
          </button>
        </div>
      )}
      {role === "provider" && extra.status === "pending" && (
        <button
          type="button"
          onClick={onRemove}
          className="rounded-full border border-input px-3 py-1 text-xs hover:bg-secondary"
        >
          Remove
        </button>
      )}
    </li>
  );
}
