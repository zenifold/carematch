import { useCallback, useRef, useState } from "react";
import { Camera, RotateCcw, Check, Loader2, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { uploadDocumentIntent, finalizeDocument } from "@/lib/provider-identity.functions";

type Kind = "id_front" | "id_back" | "selfie_liveness" | "selfie_with_id" | "proof_of_address" | "ssn_card" | "passport";

type Quality = { ok: boolean; blur: number; brightness: number; reason?: string };

/** Downsamples to ~640px, returns Laplacian variance (blur) and mean brightness. */
async function measureQuality(file: File): Promise<Quality> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = url;
    });
    const targetW = 640;
    const scale = Math.min(1, targetW / img.width);
    const w = Math.round(img.width * scale);
    const h = Math.round(img.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0, w, h);
    const { data } = ctx.getImageData(0, 0, w, h);
    // Grayscale + Laplacian variance
    const gray = new Float32Array(w * h);
    let sumB = 0;
    for (let i = 0, p = 0; i < data.length; i += 4, p++) {
      const g = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      gray[p] = g;
      sumB += g;
    }
    const brightness = sumB / (w * h);
    // Laplacian 3x3
    let sum = 0, sum2 = 0, n = 0;
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i = y * w + x;
        const v = -gray[i - w] - gray[i - 1] + 4 * gray[i] - gray[i + 1] - gray[i + w];
        sum += v;
        sum2 += v * v;
        n++;
      }
    }
    const mean = sum / n;
    const variance = sum2 / n - mean * mean;
    let reason: string | undefined;
    if (variance < 40) reason = "Image looks blurry — hold steady and try again.";
    else if (brightness < 40) reason = "Too dark — move to a well-lit spot.";
    else if (brightness > 230) reason = "Overexposed — avoid direct glare on the ID.";
    return { ok: !reason, blur: Math.round(variance), brightness: Math.round(brightness), reason };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function IDCaptureStep({
  kind,
  title,
  hint,
  captureFacing = "environment",
  onDone,
}: {
  kind: Kind;
  title: string;
  hint: string;
  captureFacing?: "environment" | "user";
  onDone: (result: { storage_path: string; capture_metadata: Record<string, any> }) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [quality, setQuality] = useState<Quality | null>(null);
  const [busy, setBusy] = useState(false);
  const intentFn = useServerFn(uploadDocumentIntent);
  const finalizeFn = useServerFn(finalizeDocument);

  const onFile = useCallback(async (f: File) => {
    setFile(f);
    setPreview(URL.createObjectURL(f));
    try {
      const q = await measureQuality(f);
      setQuality(q);
    } catch {
      setQuality({ ok: true, blur: 0, brightness: 0 });
    }
  }, []);

  const submit = useCallback(async () => {
    if (!file) return;
    setBusy(true);
    try {
      const intent = await intentFn({ data: { kind, mime_type: file.type || "image/jpeg" } });
      // Upload to signed URL
      const up = await fetch(intent.signed_url, {
        method: "PUT",
        headers: { "Content-Type": file.type || "image/jpeg" },
        body: file,
      });
      if (!up.ok) throw new Error(`Upload failed (${up.status})`);
      await finalizeFn({
        data: {
          kind,
          storage_path: intent.storage_path,
          mime_type: file.type,
          byte_size: file.size,
          capture_metadata: {
            blur: quality?.blur ?? null,
            brightness: quality?.brightness ?? null,
          },
        },
      });
      onDone({ storage_path: intent.storage_path, capture_metadata: quality ?? {} });
    } catch (e: any) {
      toast.error(e?.message ?? "Upload failed");
    } finally {
      setBusy(false);
    }
  }, [file, kind, quality, intentFn, finalizeFn, onDone]);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xl font-semibold">{title}</h3>
        <p className="text-muted-foreground mt-1">{hint}</p>
      </div>

      {preview ? (
        <div className="space-y-3">
          <div className="overflow-hidden rounded-lg border bg-muted">
            <img src={preview} alt="preview" className="max-h-[420px] w-full object-contain" />
          </div>
          {quality && !quality.ok && (
            <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
              {quality.reason}
            </div>
          )}
          {quality && quality.ok && (
            <div className="flex items-center gap-2 text-sm text-emerald-700">
              <Check className="size-4" /> Looks good.
            </div>
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { setFile(null); setPreview(null); setQuality(null); inputRef.current?.click(); }}>
              <RotateCcw className="mr-2 size-4" /> Retake
            </Button>
            <Button onClick={submit} disabled={busy || (quality ? !quality.ok : false)}>
              {busy ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Check className="mr-2 size-4" />}
              Use this photo
            </Button>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border-2 border-dashed p-8 text-center">
          <ImagePlus className="mx-auto size-10 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">Tap to open your camera or choose a photo.</p>
          <Button className="mt-4" onClick={() => inputRef.current?.click()}>
            <Camera className="mr-2 size-4" /> Take photo
          </Button>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture={captureFacing}
        hidden
        onChange={(e) => { const f = e.target.files?.[0]; if (f) void onFile(f); }}
      />
    </div>
  );
}
