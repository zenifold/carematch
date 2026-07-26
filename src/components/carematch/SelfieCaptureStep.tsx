import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Check, Loader2, RotateCcw, VideoOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { uploadDocumentIntent, finalizeDocument } from "@/lib/provider-identity.functions";

/** Live-camera selfie with a lightweight face-present heuristic. */
export function SelfieCaptureStep({ onDone }: { onDone: (r: { storage_path: string }) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [ready, setReady] = useState(false);
  const [denied, setDenied] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [hasFace, setHasFace] = useState<boolean | null>(null);
  const intentFn = useServerFn(uploadDocumentIntent);
  const finalizeFn = useServerFn(finalizeDocument);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 720 } },
          audio: false,
        });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setReady(true);
      } catch {
        setDenied(true);
      }
    })();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const capture = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const w = video.videoWidth || 640;
    const h = video.videoHeight || 640;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(video, 0, 0, w, h);

    // Face-present check via FaceDetector (Chromium) with graceful fallback.
    let faceOk: boolean | null = null;
    try {
      const FD: any = (globalThis as any).FaceDetector;
      if (FD) {
        const det = new FD({ fastMode: true });
        const faces = await det.detect(canvas);
        faceOk = faces.length > 0;
      }
    } catch { /* ignore */ }
    setHasFace(faceOk);

    const url = canvas.toDataURL("image/jpeg", 0.9);
    setPreview(url);
  }, []);

  const retake = () => { setPreview(null); setHasFace(null); };

  const submit = useCallback(async () => {
    if (!preview) return;
    setBusy(true);
    try {
      const blob: Blob = await (await fetch(preview)).blob();
      const intent = await intentFn({ data: { kind: "selfie_liveness", mime_type: "image/jpeg" } });
      const up = await fetch(intent.signed_url, {
        method: "PUT",
        headers: { "Content-Type": "image/jpeg" },
        body: blob,
      });
      if (!up.ok) throw new Error(`Upload failed (${up.status})`);
      await finalizeFn({
        data: {
          kind: "selfie_liveness",
          storage_path: intent.storage_path,
          mime_type: "image/jpeg",
          byte_size: blob.size,
          capture_metadata: { has_face: hasFace, captured_at: new Date().toISOString() },
        },
      });
      onDone({ storage_path: intent.storage_path });
    } catch (e: any) {
      toast.error(e?.message ?? "Upload failed");
    } finally {
      setBusy(false);
    }
  }, [preview, hasFace, intentFn, finalizeFn, onDone]);

  if (denied) {
    return (
      <div className="rounded-lg border p-6 text-center">
        <VideoOff className="mx-auto size-8 text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">
          Camera access denied. Enable camera permission in your browser and reload, or upload a photo of yourself
          from the alternate option below.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xl font-semibold">Take a selfie</h3>
        <p className="text-muted-foreground mt-1">
          Center your face in the circle, remove sunglasses and hats, and make sure the room is well lit.
        </p>
      </div>

      <div className="relative aspect-square w-full overflow-hidden rounded-full border-4 border-primary/20 bg-black">
        {!preview ? (
          <video ref={videoRef} playsInline muted className="h-full w-full scale-x-[-1] object-cover" />
        ) : (
          <img src={preview} alt="selfie preview" className="h-full w-full object-cover" />
        )}
      </div>
      <canvas ref={canvasRef} hidden />

      {preview && hasFace === false && (
        <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-800">
          We couldn't detect a face. You can retake or continue — a human reviewer will double check.
        </div>
      )}

      <div className="flex gap-2">
        {!preview ? (
          <Button className="flex-1" disabled={!ready} onClick={capture}>
            {!ready ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Camera className="mr-2 size-4" />}
            Capture
          </Button>
        ) : (
          <>
            <Button variant="outline" onClick={retake}><RotateCcw className="mr-2 size-4" /> Retake</Button>
            <Button className="flex-1" onClick={submit} disabled={busy}>
              {busy ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Check className="mr-2 size-4" />}
              Use this selfie
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
