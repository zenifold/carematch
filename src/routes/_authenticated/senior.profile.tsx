import { useEffect, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Eye, Users, User, LogOut, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSeniorPreferences, type TextSize } from "@/hooks/use-senior-preferences";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/senior/profile")({
  component: SeniorProfile,
});

type ProfileFields = {
  full_name: string;
  phone: string;
  city: string;
};

function SeniorProfile() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { prefs, setPref } = useSeniorPreferences();
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("full_name, phone, city, avatar_url")
        .eq("id", u.user.id)
        .maybeSingle();
      return { ...data, email: u.user.email, id: u.user.id };
    },
  });

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  };

  return (
    <div>
      <h1 className="font-serif text-3xl">Profile & settings</h1>
      <p className="mt-2 text-lg text-muted-foreground">
        Update your info anytime — changes save automatically.
      </p>

      {profile?.id && (
        <BasicsCard
          userId={profile.id}
          initial={{
            full_name: profile.full_name ?? "",
            phone: profile.phone ?? "",
            city: profile.city ?? "",
          }}
          email={profile.email ?? ""}
          onSaved={() => qc.invalidateQueries({ queryKey: ["profile"] })}
        />
      )}

      <Section icon={Eye} title="Accessibility">
        <div>
          <p className="text-base font-semibold">Text size</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {(["normal", "large", "xlarge"] as TextSize[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setPref("textSize", s)}
                className={`min-h-14 rounded-2xl border-2 px-3 py-3 text-base font-semibold ${
                  prefs.textSize === s
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-input bg-card"
                }`}
              >
                {s === "normal" ? "Normal" : s === "large" ? "Large" : "Extra"}
              </button>
            ))}
          </div>
        </div>
        <Toggle
          label="High contrast"
          checked={prefs.highContrast}
          onChange={(v) => setPref("highContrast", v)}
        />
        <Toggle
          label="Reduce motion"
          checked={prefs.reduceMotion}
          onChange={(v) => setPref("reduceMotion", v)}
        />
      </Section>

      <Section icon={Bell} title="Notifications">
        <Toggle
          label="Text me before every visit"
          checked={prefs.notifyBeforeVisit}
          onChange={(v) => setPref("notifyBeforeVisit", v)}
        />
        <Toggle
          label="Call me for any schedule change"
          checked={prefs.callForChanges}
          onChange={(v) => setPref("callForChanges", v)}
        />
      </Section>

      <Section icon={Users} title="Family sharing">
        <Toggle
          label="Family can see my visits"
          checked={prefs.familyCanSee}
          onChange={(v) => setPref("familyCanSee", v)}
        />
        <Toggle
          label="Family can make changes for me"
          checked={prefs.familyCanEdit}
          onChange={(v) => setPref("familyCanEdit", v)}
        />
        <p className="text-sm text-muted-foreground">
          You control this — not them. "See" lets family view your schedule.
          "Make changes" lets them book, cancel, or update your care plan on
          your behalf. Both are off unless you turn them on.
        </p>
      </Section>

      <button
        type="button"
        onClick={signOut}
        className="mt-8 inline-flex min-h-14 items-center gap-2 rounded-full border-2 border-input px-6 text-base font-semibold text-foreground hover:bg-secondary"
      >
        <LogOut className="size-5" /> Sign out
      </button>
    </div>
  );
}

function BasicsCard({
  userId,
  initial,
  email,
  onSaved,
}: {
  userId: string;
  initial: ProfileFields;
  email: string;
  onSaved: () => void;
}) {
  const [fields, setFields] = useState<ProfileFields>(initial);
  const [saving, setSaving] = useState<keyof ProfileFields | null>(null);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const initialRef = useRef(initial);

  const scheduleSave = (key: keyof ProfileFields, value: string) => {
    if (timers.current[key]) clearTimeout(timers.current[key]);
    timers.current[key] = setTimeout(async () => {
      if (initialRef.current[key] === value) return;
      setSaving(key);
      const patch: { full_name?: string | null; phone?: string | null; city?: string | null } = {
        [key]: value.trim() || null,
      };
      const { error } = await supabase.from("profiles").update(patch).eq("id", userId);
      setSaving(null);
      if (error) {
        toast.error(`Couldn't save ${labelFor(key)}. Try again.`);
        return;
      }
      initialRef.current = { ...initialRef.current, [key]: value };
      toast.success(`${labelFor(key)} saved`);
      onSaved();
    }, 700);
  };

  useEffect(() => {
    const t = timers.current;
    return () => {
      Object.values(t).forEach(clearTimeout);
    };
  }, []);

  const onChange = (key: keyof ProfileFields) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setFields((f) => ({ ...f, [key]: v }));
    scheduleSave(key, v);
  };

  return (
    <Section icon={User} title="Basics">
      <Field
        label="Full name"
        value={fields.full_name}
        onChange={onChange("full_name")}
        saving={saving === "full_name"}
        placeholder="Your name"
      />
      <Field
        label="Phone"
        type="tel"
        value={fields.phone}
        onChange={onChange("phone")}
        saving={saving === "phone"}
        placeholder="(555) 555-5555"
      />
      <Field
        label="City"
        value={fields.city}
        onChange={onChange("city")}
        saving={saving === "city"}
        placeholder="Where you live"
        icon={<MapPin className="size-4 text-muted-foreground" />}
      />
      <div>
        <p className="text-sm text-muted-foreground">Email</p>
        <p className="mt-1 text-base font-semibold">{email || "—"}</p>
      </div>
    </Section>
  );
}

function labelFor(k: keyof ProfileFields) {
  return k === "full_name" ? "Name" : k === "phone" ? "Phone" : "City";
}

function Field({
  label,
  value,
  onChange,
  saving,
  placeholder,
  type = "text",
  icon,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  saving: boolean;
  placeholder?: string;
  type?: string;
  icon?: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="flex items-center justify-between text-sm font-semibold text-muted-foreground">
        <span className="flex items-center gap-1.5">
          {icon}
          {label}
        </span>
        {saving && <span className="text-xs text-primary">Saving…</span>}
      </span>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="mt-1.5 block h-12 w-full rounded-2xl border-2 border-input bg-card px-4 text-base font-medium outline-none focus:border-primary"
      />
    </label>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof User;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-6 rounded-3xl border border-border bg-card p-6 shadow-soft">
      <div className="flex items-center gap-2">
        <Icon className="size-5 text-primary" />
        <h2 className="font-serif text-2xl">{title}</h2>
      </div>
      <div className="mt-4 grid gap-4">{children}</div>
    </section>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4"
    >
      <span className="truncate text-left text-lg">{label}</span>
      <span
        className={`relative inline-block h-8 w-14 shrink-0 rounded-full transition-colors ${
          checked ? "bg-primary" : "bg-secondary"
        }`}
      >
        <span
          className={`absolute top-1 size-6 rounded-full bg-card shadow-soft transition-transform ${
            checked ? "translate-x-7" : "translate-x-1"
          }`}
        />
      </span>
    </button>
  );
}
