import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, ShieldCheck, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { RouteErrorBoundary } from "@/components/carematch";
import { lookupFamilyInvite, redeemFamilyInvite } from "@/lib/invites.functions";

type Search = { code?: string };

export const Route = createFileRoute("/_authenticated/family/join")({
  component: FamilyJoin,
  errorComponent: RouteErrorBoundary,
  validateSearch: (search: Record<string, unknown>): Search => ({
    code: typeof search.code === "string" ? search.code : undefined,
  }),
});

function FamilyJoin() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { code: initial } = Route.useSearch();
  const [code, setCode] = useState(initial ?? "");
  const [previewCode, setPreviewCode] = useState<string | null>(null);

  const lookupFn = useServerFn(lookupFamilyInvite);
  const redeemFn = useServerFn(redeemFamilyInvite);

  const previewQ = useQuery({
    queryKey: ["invite-preview", previewCode],
    enabled: !!previewCode,
    queryFn: () => lookupFn({ data: { code: previewCode! } }),
    retry: false,
  });

  const redeemM = useMutation({
    mutationFn: (c: string) => redeemFn({ data: { code: c } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["family", "links"] });
      toast.success("You're now linked. Welcome to the family circle.");
      navigate({ to: "/family" });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Could not redeem invite"),
  });

  // Auto-preview when a code arrives in the URL, once the user is signed in.
  useEffect(() => {
    let cancel = false;
    if (!initial) return;
    supabase.auth.getUser().then(({ data }) => {
      if (!cancel && data.user) setPreviewCode(initial);
    });
    return () => {
      cancel = true;
    };
  }, [initial]);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          Join a family circle
        </p>
        <h1 className="mt-1 font-serif text-3xl lg:text-4xl">Redeem an invite</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter the code shared by your loved one to help coordinate their care.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const trimmed = code.trim();
          if (!trimmed) return;
          setPreviewCode(trimmed);
        }}
        className="surface-card space-y-4 p-6"
      >
        <label className="block">
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Invite code
          </span>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="XXXX-XXXX-XXXX"
            className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 font-mono text-lg tracking-widest outline-none focus:border-primary"
          />
        </label>
        <button
          type="submit"
          disabled={previewQ.isFetching}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-soft hover:bg-primary/90 disabled:opacity-60"
        >
          {previewQ.isFetching ? <Loader2 className="size-4 animate-spin" /> : null}
          Look up invite
        </button>
      </form>

      {previewQ.isError && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {previewQ.error instanceof Error ? previewQ.error.message : "Invalid invite"}
        </div>
      )}

      {previewQ.data && (
        <div className="surface-card space-y-4 p-6">
          <div className="flex items-center gap-3">
            <span className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
              <UserCheck className="size-5" />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-primary">
                Invite from
              </p>
              <p className="font-serif text-xl">
                {previewQ.data.senior_name ?? "A CompanionCare member"}
              </p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Permission level: <span className="font-semibold text-foreground">{previewQ.data.permission}</span> · expires{" "}
            {new Date(previewQ.data.expires_at).toLocaleDateString()}
          </p>
          <button
            type="button"
            disabled={redeemM.isPending}
            onClick={() => redeemM.mutate(previewCode!)}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-soft hover:bg-primary/90 disabled:opacity-60"
          >
            {redeemM.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ShieldCheck className="size-4" />
            )}
            Accept invite
          </button>
        </div>
      )}

      <p className="text-center text-xs text-muted-foreground">
        <Link to="/family" className="underline underline-offset-2">
          Back to family home
        </Link>
      </p>
    </div>
  );
}
