import { useNavigate } from "@tanstack/react-router";
import { UserCog, Check } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { ROLE_HOME, ROLE_LABEL, type AppRole } from "@/hooks/use-user-roles";

type Props = {
  roles: AppRole[];
  active: AppRole;
  className?: string;
};

/**
 * RoleSwitcher — always-visible dropdown when the account has multiple roles.
 * Renders nothing for single-role users to reduce clutter for seniors.
 */
export function RoleSwitcher({ roles, active, className = "" }: Props) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [open]);

  if (roles.length <= 1) return null;

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex min-h-12 items-center gap-2 rounded-full border border-input bg-card px-4 py-2 text-base font-medium hover:bg-secondary"
      >
        <UserCog className="size-5 text-primary" />
        {ROLE_LABEL[active]}
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-2 w-64 overflow-hidden rounded-2xl border border-border bg-card shadow-lifted"
        >
          {roles.map((r) => (
            <button
              key={r}
              role="menuitem"
              onClick={() => {
                setOpen(false);
                navigate({ to: ROLE_HOME[r] });
              }}
              className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left text-base hover:bg-secondary"
            >
              <span>{ROLE_LABEL[r]}</span>
              {r === active && <Check className="size-5 text-primary" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
