import { useState, type ReactNode } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { createChangeRequest, type ChangeRequestKind, type ChangeRequestPayload } from "@/lib/change-requests.functions";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  seniorId: string;
  seniorName?: string | null;
  kind: ChangeRequestKind;
  title: string;
  summary: ReactNode; // shows before → after
  payload: ChangeRequestPayload;
  targetId?: string | null;
};

export function RequestChangeDialog({
  open,
  onOpenChange,
  seniorId,
  seniorName,
  kind,
  title,
  summary,
  payload,
  targetId,
}: Props) {
  const [reason, setReason] = useState("");
  const queryClient = useQueryClient();
  const create = useServerFn(createChangeRequest);
  const mut = useMutation({
    mutationFn: () =>
      create({
        data: {
          senior_id: seniorId,
          kind,
          payload,
          reason: reason.trim(),
          target_id: targetId ?? null,
          // biome-ignore lint: discriminated union
        } as never,
      }),
    onSuccess: () => {
      toast.success(`Sent to ${seniorName ?? "your senior"} for approval.`);
      queryClient.invalidateQueries({ queryKey: ["family", "requests"] });
      setReason("");
      onOpenChange(false);
    },
    onError: (e: unknown) => toast.error((e as Error).message ?? "Couldn't send request"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {seniorName ?? "Your senior"} will approve or decline this change.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="rounded-2xl bg-secondary/50 p-4 text-sm">{summary}</div>
          <label className="block text-sm font-semibold">
            Why are you asking?
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Give a short reason so they can decide."
              className="mt-1 w-full rounded-xl border border-input bg-background p-3 text-sm"
            />
          </label>
          <p className="text-xs text-muted-foreground">{reason.length}/500</p>
        </div>
        <DialogFooter>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-secondary"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={reason.trim().length === 0 || mut.isPending}
            onClick={() => mut.mutate()}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-soft hover:bg-primary/90 disabled:opacity-50"
          >
            <Send className="size-4" />
            {mut.isPending ? "Sending…" : "Send request"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
