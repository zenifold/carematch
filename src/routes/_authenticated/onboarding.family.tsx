import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Sparkles, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RouteErrorBoundary } from "@/components/carematch";
import { redeemFamilyInvite } from "@/lib/invites.functions";

export const Route = createFileRoute("/_authenticated/onboarding/family")({
  component: FamilyOnboarding,
  errorComponent: RouteErrorBoundary,
});

function FamilyOnboarding() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const redeemFn = useServerFn(redeemFamilyInvite);

  const markOnboarded = async () => {
    const { data: u } = await supabase.auth.getUser();
    if (u.user) {
      await supabase
        .from("profiles")
        .update({ onboarded_at: new Date().toISOString() })
        .eq("id", u.user.id);
    }
  };

  const redeemM = useMutation({
    mutationFn: (c: string) => redeemFn({ data: { code: c } }),
    onSuccess: async () => {
      await markOnboarded();
      toast.success("You're now linked. Welcome!");
      navigate({ to: "/family", replace: true });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Invalid code"),
  });

  const skip = async () => {
    setBusy(true);
    await markOnboarded();
    navigate({ to: "/family", replace: true });
  };

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2 text-primary">
          <Sparkles className="size-5" />
          <p className="text-xs font-bold uppercase tracking-widest">Welcome to CareMatch</p>
        </div>
        <h1 className="mt-2 font-serif text-3xl lg:text-4xl">Join a family circle</h1>
        <p className="mt-2 text-muted-foreground">
          Enter the invite code your loved one shared with you. They generate it from their
          CareMatch account.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!code.trim()) return;
          redeemM.mutate(code.trim().toUpperCase());
        }}
        className="surface-card space-y-4 p-6"
      >
        <Label htmlFor="code" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Invite code
        </Label>
        <Input
          id="code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="XXXX-XXXX-XXXX"
          className="font-mono text-lg tracking-widest"
        />
        <Button type="submit" size="lg" disabled={redeemM.isPending} className="w-full sm:w-auto">
          {redeemM.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <UserCheck className="mr-2 size-4" />}
          Accept invite
        </Button>
      </form>

      <div className="rounded-2xl border border-border bg-secondary/40 p-5">
        <p className="text-sm font-semibold">Don't have a code yet?</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Ask your loved one to open CareMatch → People and generate a family invite. You can
          also skip for now and add one later from{" "}
          <Link to="/family/join" className="text-primary underline">
            family settings
          </Link>
          .
        </p>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={skip}
          disabled={busy}
          className="text-sm text-muted-foreground underline-offset-2 hover:underline"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
