import { useState } from "react";
import {
  BadgeCheck,
  ShieldCheck,
  FileCheck2,
  Repeat,
  MapPin,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";

export type VerificationStage =
  | "identity"
  | "background"
  | "credential"
  | "monitoring"
  | "arrival";

type StageMeta = {
  label: string;
  icon: LucideIcon;
  what: string;
  frequency: string;
  vendor: string;
};

const STAGES: Record<VerificationStage, StageMeta> = {
  identity: {
    label: "Identity Verified",
    icon: FileCheck2,
    what: "Government ID + liveness selfie were matched side-by-side.",
    frequency: "Once at signup, re-checked if info changes.",
    vendor: "Verified by Persona",
  },
  background: {
    label: "Background Checked",
    icon: ShieldCheck,
    what: "National criminal + sex offender registry, plus multi-state records.",
    frequency: "Before the first visit, refreshed every year.",
    vendor: "Verified by Checkr",
  },
  credential: {
    label: "License Verified",
    icon: BadgeCheck,
    what: "State license or certification checked against the issuing board.",
    frequency: "Confirmed active before each booking.",
    vendor: "State licensing registries",
  },
  monitoring: {
    label: "Monitored Monthly",
    icon: Repeat,
    what: "New charges, license changes, and registry updates re-checked automatically.",
    frequency: "Every 30 days for the life of the account.",
    vendor: "Verified by Checkr Continuous",
  },
  arrival: {
    label: "Verified on Arrival",
    icon: MapPin,
    what: "Live selfie matched to the verified ID, plus GPS confirmation at your address.",
    frequency: "At the start of every single visit.",
    vendor: "CareMatch on-visit verification",
  },
};

type Props = {
  stage: VerificationStage;
  date?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

/**
 * VerificationBadge — the hero trust component.
 * Tap to expand a plain-language explanation of the check.
 */
export function VerificationBadge({ stage, date, size = "md", className = "" }: Props) {
  const [open, setOpen] = useState(false);
  const meta = STAGES[stage];
  const Icon = meta.icon;

  const sizes = {
    sm: { pad: "px-3 py-1.5", icon: "size-4", text: "text-sm" },
    md: { pad: "px-4 py-2", icon: "size-5", text: "text-base" },
    lg: { pad: "px-5 py-3", icon: "size-6", text: "text-lg" },
  }[size];

  return (
    <div className={className}>
      <button
        type="button"
        aria-expanded={open}
        aria-label={`${meta.label}. Tap for details.`}
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 font-semibold text-primary hover:bg-primary/15 ${sizes.pad} ${sizes.text}`}
      >
        <Icon className={sizes.icon} aria-hidden />
        <span>{meta.label}</span>
        {date && <span className="opacity-70">· {date}</span>}
        <ChevronDown
          className={`size-4 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      {open && (
        <div className="mt-3 rounded-2xl border border-border bg-card p-5 shadow-soft">
          <p className="text-base font-semibold text-foreground">What we checked</p>
          <p className="mt-1 text-base text-muted-foreground">{meta.what}</p>
          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
            <div>
              <p className="font-semibold text-foreground">When</p>
              <p className="text-muted-foreground">{date ?? "On record"}</p>
            </div>
            <div>
              <p className="font-semibold text-foreground">How often</p>
              <p className="text-muted-foreground">{meta.frequency}</p>
            </div>
            <div>
              <p className="font-semibold text-foreground">Verified by</p>
              <p className="text-muted-foreground">{meta.vendor}</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            You can see this record anytime. We log every access.
          </p>
        </div>
      )}
    </div>
  );
}

export const VERIFICATION_STAGES: VerificationStage[] = [
  "identity",
  "background",
  "credential",
  "monitoring",
  "arrival",
];
