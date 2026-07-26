import { useEffect, useRef, useState } from "react";
import { ScrollText, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { recordConsent } from "@/lib/provider-identity.functions";
import type { ConsentDoc } from "@/lib/provider-consent-content";

export function DisclosureSignStep({
  doc,
  signerHint,
  onSigned,
}: {
  doc: ConsentDoc;
  signerHint?: string;
  onSigned: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const [signature, setSignature] = useState(signerHint ?? "");
  const [busy, setBusy] = useState(false);
  const recordFn = useServerFn(recordConsent);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 8) setScrolled(true);
    };
    el.addEventListener("scroll", onScroll);
    // If short enough that no scrolling is possible, auto-mark.
    if (el.scrollHeight <= el.clientHeight + 8) setScrolled(true);
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const canSign = scrolled && signature.trim().length >= 2;

  const sign = async () => {
    if (!canSign) return;
    setBusy(true);
    try {
      await recordFn({
        data: {
          kind: doc.kind,
          document_version: doc.version,
          signed_full_name: signature.trim(),
          state: doc.state ?? null,
        },
      });
      onSigned();
    } catch (e: any) {
      toast.error(e?.message ?? "Could not record signature");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2">
        <ScrollText className="mt-1 size-5 text-primary" />
        <div>
          <h3 className="text-xl font-semibold">{doc.title}</h3>
          <p className="text-xs text-muted-foreground">Version {doc.version}</p>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="max-h-72 overflow-y-auto whitespace-pre-wrap rounded-md border bg-muted/30 p-4 text-sm leading-6"
      >
        {doc.text}
      </div>

      {!scrolled && (
        <p className="text-xs text-muted-foreground">Scroll to the bottom to continue.</p>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium">Type your full legal name to sign</label>
        <Input
          value={signature}
          onChange={(e) => setSignature(e.target.value)}
          placeholder="Your legal name"
          disabled={!scrolled}
        />
      </div>

      <Button onClick={sign} disabled={!canSign || busy} className="w-full">
        {busy ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Check className="mr-2 size-4" />}
        Sign & continue
      </Button>
    </div>
  );
}
