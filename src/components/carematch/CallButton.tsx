import { Phone } from "lucide-react";

type Props = {
  phone?: string;
  label?: string;
  variant?: "floating" | "inline";
  className?: string;
};

/**
 * CallButton — persistent concierge call affordance.
 * Same corner every screen. Thumb-reachable, ≥56px target.
 */
export function CallButton({
  phone = "1-800-CAREMATCH",
  label = "Call Concierge",
  variant = "floating",
  className = "",
}: Props) {
  const href = `tel:${phone.replace(/[^0-9]/g, "")}`;

  if (variant === "inline") {
    return (
      <a
        href={href}
        aria-label={`Call concierge at ${phone}`}
        className={`inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-accent px-6 py-4 text-lg font-semibold text-accent-foreground shadow-soft hover:opacity-95 ${className}`}
      >
        <Phone className="size-6" />
        {label}
      </a>
    );
  }

  return (
    <a
      href={href}
      aria-label={`Call concierge at ${phone}`}
      className={`fixed bottom-5 right-5 z-50 inline-flex min-h-16 items-center gap-2 rounded-full bg-accent px-5 py-4 text-lg font-semibold text-accent-foreground shadow-lifted hover:opacity-95 ${className}`}
    >
      <Phone className="size-6" />
      <span className="hidden sm:inline">{label}</span>
    </a>
  );
}
