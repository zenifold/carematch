import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RouteErrorBoundary, PageSkeleton } from "@/components/carematch";
import { AddressHistoryStep, type Address } from "@/components/carematch/AddressHistoryStep";
import { DisclosureSignStep } from "@/components/carematch/DisclosureSignStep";
import { IDCaptureStep } from "@/components/carematch/IDCaptureStep";
import { SelfieCaptureStep } from "@/components/carematch/SelfieCaptureStep";
import {
  getMyIdentity,
  saveIdentityCore,
  saveIdentityAddresses,
  saveIdentitySSN,
  saveDriversLicense,
  submitIdentityForReview,
} from "@/lib/provider-identity.functions";
import { requiredConsents, type ConsentDoc } from "@/lib/provider-consent-content";

export const Route = createFileRoute("/_authenticated/onboarding/provider/identity")({
  component: IdentityFlow,
  errorComponent: RouteErrorBoundary,
});

type StepKey =
  | "why" | "name" | "addresses" | "contact"
  | "driver" | "consents" | "id" | "selfie" | "ssn" | "review";

function IdentityFlow() {
  const navigate = useNavigate();
  const getFn = useServerFn(getMyIdentity);
  const saveCoreFn = useServerFn(saveIdentityCore);
  const saveAddrFn = useServerFn(saveIdentityAddresses);
  const saveSSNFn = useServerFn(saveIdentitySSN);
  const saveDLFn = useServerFn(saveDriversLicense);
  const submitFn = useServerFn(submitIdentityForReview);

  const q = useQuery({ queryKey: ["provider", "identity"], queryFn: () => getFn() });

  const [step, setStep] = useState<StepKey>("why");
  const [busy, setBusy] = useState(false);

  // Local form buffers, seeded once from server data.
  const identity = q.data?.identity;
  const consents = q.data?.consents ?? [];

  const [first, setFirst] = useState("");
  const [middle, setMiddle] = useState("");
  const [last, setLast] = useState("");
  const [dob, setDob] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [current, setCurrent] = useState<Address | null>(null);
  const [history, setHistory] = useState<Address[]>([]);
  const [dlNumber, setDlNumber] = useState("");
  const [dlState, setDlState] = useState("");
  const [dlExpires, setDlExpires] = useState("");
  const [isDriver, setIsDriver] = useState<boolean | null>(null);
  const [ssn, setSsn] = useState("");
  const [consentIdx, setConsentIdx] = useState(0);
  const [seeded, setSeeded] = useState(false);

  // Seed once
  if (identity && !seeded) {
    setFirst(identity.legal_first_name ?? "");
    setMiddle(identity.legal_middle_name ?? "");
    setLast(identity.legal_last_name ?? "");
    setDob(identity.date_of_birth ?? "");
    setPhone(identity.phone ?? "");
    setEmail(identity.email ?? "");
    setCurrent((identity.current_address as Address | null) ?? null);
    setHistory((identity.address_history as Address[]) ?? []);
    setDlNumber(identity.drivers_license_number ?? "");
    setDlState(identity.drivers_license_state ?? "");
    setDlExpires(identity.drivers_license_expires_on ?? "");
    setIsDriver(identity.drivers_license_number ? true : null);
    setSeeded(true);
  }

  const stateCode = (current?.state ?? "").toUpperCase();
  const requiredDocs: ConsentDoc[] = useMemo(
    () => requiredConsents(stateCode || null, !!isDriver),
    [stateCode, isDriver],
  );
  const signedSet = useMemo(() => {
    const s = new Set<string>();
    for (const c of consents) s.add(`${c.kind}@${c.document_version}`);
    return s;
  }, [consents]);
  const remainingConsents = useMemo(
    () => requiredDocs.filter((d) => !signedSet.has(`${d.kind}@${d.version}`)),
    [requiredDocs, signedSet],
  );

  if (q.isLoading || !identity) return <PageSkeleton />;

  const go = (s: StepKey) => setStep(s);
  const signerHint = [first, middle, last].filter(Boolean).join(" ");

  const documents = q.data?.documents ?? [];
  const hasDoc = (k: string) => documents.some((d) => d.kind === k && (d.status === "uploaded" || d.status === "accepted"));

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <ShieldCheck className="size-4" />
        <span>Identity verification — encrypted end-to-end</span>
      </div>

      {step === "why" && (
        <div className="space-y-4">
          <h1 className="text-3xl font-bold">Let's verify your identity</h1>
          <p className="text-muted-foreground">
            To keep seniors safe, every caregiver on CareMatch goes through the same identity and background check.
            This takes about 8 minutes.
          </p>
          <ul className="space-y-2 text-sm">
            <li className="flex gap-2"><Check className="size-5 text-primary" /> Your Social Security number is never stored on our servers.</li>
            <li className="flex gap-2"><Check className="size-5 text-primary" /> Your ID photos are encrypted and only reviewers see them.</li>
            <li className="flex gap-2"><Check className="size-5 text-primary" /> You can pause and resume any time — your progress saves automatically.</li>
          </ul>
          <Button onClick={() => go("name")} className="w-full">
            Get started <ArrowRight className="ml-2 size-4" />
          </Button>
        </div>
      )}

      {step === "name" && (
        <StepShell title="Your legal name and date of birth" onBack={() => go("why")}>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><Label>First name (legal)</Label><Input value={first} onChange={(e) => setFirst(e.target.value)} /></div>
            <div><Label>Middle name (optional)</Label><Input value={middle} onChange={(e) => setMiddle(e.target.value)} /></div>
            <div className="sm:col-span-2"><Label>Last name (legal)</Label><Input value={last} onChange={(e) => setLast(e.target.value)} /></div>
            <div className="sm:col-span-2"><Label>Date of birth</Label><Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} /></div>
            <div className="sm:col-span-2"><Label>Mobile phone</Label><Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
            <div className="sm:col-span-2"><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          </div>
          <Button
            className="w-full"
            disabled={busy || !first || !last || !dob || !phone || !email}
            onClick={async () => {
              setBusy(true);
              try {
                await saveCoreFn({ data: { legal_first_name: first, legal_middle_name: middle || null, legal_last_name: last, date_of_birth: dob, phone, email, other_names_used: [] } });
                go("addresses");
              } catch (e: any) { toast.error(e?.message ?? "Save failed"); } finally { setBusy(false); }
            }}
          >
            {busy && <Loader2 className="mr-2 size-4 animate-spin" />} Continue <ArrowRight className="ml-2 size-4" />
          </Button>
        </StepShell>
      )}

      {step === "addresses" && (
        <StepShell title="Address history" onBack={() => go("name")}>
          <AddressHistoryStep
            initialCurrent={current}
            initialHistory={history}
            onChange={(c, h) => { setCurrent(c); setHistory(h); }}
          />
          <Button
            className="w-full mt-4"
            disabled={busy || !current?.line1 || !current?.city || !current?.state || !current?.postal || !current?.from}
            onClick={async () => {
              if (!current) return;
              setBusy(true);
              try {
                await saveAddrFn({ data: { current_address: current, address_history: history } });
                go("driver");
              } catch (e: any) { toast.error(e?.message ?? "Save failed"); } finally { setBusy(false); }
            }}
          >
            {busy && <Loader2 className="mr-2 size-4 animate-spin" />} Continue <ArrowRight className="ml-2 size-4" />
          </Button>
        </StepShell>
      )}

      {step === "driver" && (
        <StepShell title="Will you drive for CareMatch?" onBack={() => go("addresses")}>
          <p className="text-sm text-muted-foreground">
            If you'll do errand runs or transport, we also need to run a motor vehicle record.
          </p>
          <div className="grid gap-2">
            <Button variant={isDriver === true ? "default" : "outline"} onClick={() => setIsDriver(true)}>
              Yes, I'll drive
            </Button>
            <Button variant={isDriver === false ? "default" : "outline"} onClick={() => setIsDriver(false)}>
              No driving
            </Button>
          </div>
          {isDriver && (
            <div className="mt-2 grid gap-3">
              <div><Label>License number</Label><Input value={dlNumber} onChange={(e) => setDlNumber(e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>State</Label><Input maxLength={2} value={dlState} onChange={(e) => setDlState(e.target.value.toUpperCase())} /></div>
                <div><Label>Expires</Label><Input type="date" value={dlExpires} onChange={(e) => setDlExpires(e.target.value)} /></div>
              </div>
            </div>
          )}
          <Button
            className="w-full"
            disabled={busy || isDriver === null || (isDriver && (!dlNumber || !dlState || !dlExpires))}
            onClick={async () => {
              setBusy(true);
              try {
                if (isDriver) {
                  await saveDLFn({ data: { drivers_license_number: dlNumber, drivers_license_state: dlState, drivers_license_expires_on: dlExpires } });
                } else {
                  await saveDLFn({ data: { drivers_license_number: null, drivers_license_state: null, drivers_license_expires_on: null } });
                }
                setConsentIdx(0);
                go("consents");
              } catch (e: any) { toast.error(e?.message ?? "Save failed"); } finally { setBusy(false); }
            }}
          >
            {busy && <Loader2 className="mr-2 size-4 animate-spin" />} Continue <ArrowRight className="ml-2 size-4" />
          </Button>
        </StepShell>
      )}

      {step === "consents" && (
        <StepShell title={`Disclosures (${Math.min(consentIdx + 1, remainingConsents.length || 1)} of ${remainingConsents.length || 1})`} onBack={() => go("driver")}>
          {remainingConsents.length === 0 ? (
            <>
              <p className="text-sm">You've already signed every required disclosure.</p>
              <Button className="w-full" onClick={() => go("id")}>Continue <ArrowRight className="ml-2 size-4" /></Button>
            </>
          ) : consentIdx >= remainingConsents.length ? (
            <>
              <p className="text-sm">All disclosures signed. Thank you.</p>
              <Button className="w-full" onClick={() => go("id")}>Continue <ArrowRight className="ml-2 size-4" /></Button>
            </>
          ) : (
            <DisclosureSignStep
              doc={remainingConsents[consentIdx]}
              signerHint={signerHint}
              onSigned={() => {
                if (consentIdx + 1 >= remainingConsents.length) {
                  void q.refetch();
                  go("id");
                } else {
                  setConsentIdx(consentIdx + 1);
                }
              }}
            />
          )}
        </StepShell>
      )}

      {step === "id" && (
        <StepShell title="Photo of your government ID" onBack={() => go("consents")}>
          {!hasDoc("id_front") ? (
            <IDCaptureStep
              kind="id_front"
              title="Front of your ID"
              hint="Driver's license, state ID, or passport photo page. Lay it on a flat, dark surface."
              onDone={() => { void q.refetch(); }}
            />
          ) : !hasDoc("id_back") && !hasDoc("passport") ? (
            <IDCaptureStep
              kind="id_back"
              title="Back of your ID"
              hint="Skip this step and use the passport option below if you're using a passport."
              onDone={() => { void q.refetch(); }}
            />
          ) : (
            <>
              <p className="text-sm text-emerald-700 flex items-center gap-2"><CheckCircle2 className="size-4" /> ID captured.</p>
              <Button className="w-full" onClick={() => go("selfie")}>Continue <ArrowRight className="ml-2 size-4" /></Button>
            </>
          )}
        </StepShell>
      )}

      {step === "selfie" && (
        <StepShell title="Selfie" onBack={() => go("id")}>
          {!hasDoc("selfie_liveness") ? (
            <SelfieCaptureStep onDone={() => { void q.refetch(); }} />
          ) : (
            <>
              <p className="text-sm text-emerald-700 flex items-center gap-2"><CheckCircle2 className="size-4" /> Selfie captured.</p>
              <Button className="w-full" onClick={() => go("ssn")}>Continue <ArrowRight className="ml-2 size-4" /></Button>
            </>
          )}
        </StepShell>
      )}

      {step === "ssn" && (
        <StepShell title="Social Security number" onBack={() => go("selfie")}>
          <div className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
            We only keep the last 4 digits on our servers. The full number is sent directly to the background check
            provider at the time of the check and is never stored on CareMatch.
          </div>
          <div>
            <Label>SSN</Label>
            <Input value={ssn} onChange={(e) => setSsn(e.target.value)} placeholder="XXX-XX-XXXX" inputMode="numeric" autoComplete="off" />
          </div>
          <Button
            className="w-full"
            disabled={busy || !/^\d{3}-?\d{2}-?\d{4}$/.test(ssn)}
            onClick={async () => {
              setBusy(true);
              try { await saveSSNFn({ data: { ssn } }); setSsn(""); void q.refetch(); go("review"); }
              catch (e: any) { toast.error(e?.message ?? "Save failed"); }
              finally { setBusy(false); }
            }}
          >
            {busy && <Loader2 className="mr-2 size-4 animate-spin" />} Continue <ArrowRight className="ml-2 size-4" />
          </Button>
        </StepShell>
      )}

      {step === "review" && (
        <StepShell title="Review & submit" onBack={() => go("ssn")}>
          <ul className="space-y-2 text-sm">
            <ReviewItem label="Legal name" ok={!!(first && last)} value={`${first} ${middle ? middle + " " : ""}${last}`} />
            <ReviewItem label="Date of birth" ok={!!dob} value={dob} />
            <ReviewItem label="Address" ok={!!current?.line1} value={current ? `${current.line1}, ${current.city}, ${current.state} ${current.postal}` : ""} />
            <ReviewItem label="Contact" ok={!!(phone && email)} value={`${phone} • ${email}`} />
            <ReviewItem label="SSN" ok={!!identity.ssn_last4} value={identity.ssn_last4 ? `•••-••-${identity.ssn_last4}` : ""} />
            <ReviewItem label="ID photos" ok={hasDoc("id_front") && (hasDoc("id_back") || hasDoc("passport"))} value="" />
            <ReviewItem label="Selfie" ok={hasDoc("selfie_liveness")} value="" />
            <ReviewItem label="Disclosures signed" ok={remainingConsents.length === 0} value={`${consents.length} signed`} />
          </ul>
          <Button
            className="w-full"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await submitFn();
                toast.success("Submitted for review");
                navigate({ to: "/provider" });
              } catch (e: any) {
                toast.error(e?.message ?? "Please complete every step first");
              } finally { setBusy(false); }
            }}
          >
            {busy && <Loader2 className="mr-2 size-4 animate-spin" />} Submit for verification
          </Button>
          <Link to="/provider" className="block text-center text-sm text-muted-foreground">Save and finish later</Link>
        </StepShell>
      )}
    </div>
  );
}

function StepShell({ title, children, onBack }: { title: string; children: React.ReactNode; onBack?: () => void }) {
  return (
    <div className="space-y-4">
      {onBack && (
        <button onClick={onBack} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back
        </button>
      )}
      <h2 className="text-2xl font-semibold">{title}</h2>
      {children}
    </div>
  );
}

function ReviewItem({ label, ok, value }: { label: string; ok: boolean; value: string }) {
  return (
    <li className="flex items-start justify-between gap-3 rounded-md border p-3">
      <div>
        <p className="text-xs uppercase text-muted-foreground">{label}</p>
        <p className="font-medium">{value || (ok ? "Complete" : "Missing")}</p>
      </div>
      <span className={`mt-1 inline-flex size-6 shrink-0 items-center justify-center rounded-full ${ok ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
        {ok ? <Check className="size-4" /> : "!"}
      </span>
    </li>
  );
}
