import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type Address = {
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  postal: string;
  country: string;
  from: string; // YYYY-MM
  to?: string | null;
};

const EMPTY: Address = { line1: "", line2: "", city: "", state: "", postal: "", country: "US", from: "", to: "" };

function monthsBetween(from: string, to: string) {
  if (!/^\d{4}-\d{2}$/.test(from) || !/^\d{4}-\d{2}$/.test(to)) return 0;
  const [fy, fm] = from.split("-").map(Number);
  const [ty, tm] = to.split("-").map(Number);
  return (ty - fy) * 12 + (tm - fm);
}

function todayYYYYMM() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function AddressHistoryStep({
  initialCurrent,
  initialHistory,
  onChange,
}: {
  initialCurrent: Address | null;
  initialHistory: Address[];
  onChange: (current: Address, history: Address[]) => void;
}) {
  const [current, setCurrent] = useState<Address>(initialCurrent ?? { ...EMPTY, to: null });
  const [history, setHistory] = useState<Address[]>(initialHistory);

  const monthsCovered = useMemo(() => {
    let total = 0;
    if (current.from) total += monthsBetween(current.from, todayYYYYMM());
    for (const h of history) {
      if (h.from && h.to) total += Math.max(0, monthsBetween(h.from, h.to));
    }
    return total;
  }, [current, history]);

  const targetMonths = 7 * 12;
  const pct = Math.min(100, Math.round((monthsCovered / targetMonths) * 100));

  const patch = (setter: any, addr: Address, field: keyof Address, value: string) =>
    setter({ ...addr, [field]: value });

  const update = () => onChange(current, history);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold">Where have you lived?</h3>
        <p className="text-muted-foreground mt-1">
          We need your address history for the last 7 years. Add your current address, then any prior addresses to fill the gap.
        </p>
      </div>

      <div className="rounded-md border p-4 space-y-3">
        <p className="font-medium">Current address</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2"><Label>Street</Label><Input value={current.line1} onChange={(e) => setCurrent({ ...current, line1: e.target.value })} onBlur={update} /></div>
          <div className="sm:col-span-2"><Label>Apt / unit (optional)</Label><Input value={current.line2 ?? ""} onChange={(e) => setCurrent({ ...current, line2: e.target.value })} onBlur={update} /></div>
          <div><Label>City</Label><Input value={current.city} onChange={(e) => setCurrent({ ...current, city: e.target.value })} onBlur={update} /></div>
          <div><Label>State</Label><Input value={current.state} maxLength={2} onChange={(e) => setCurrent({ ...current, state: e.target.value.toUpperCase() })} onBlur={update} /></div>
          <div><Label>ZIP</Label><Input value={current.postal} onChange={(e) => setCurrent({ ...current, postal: e.target.value })} onBlur={update} /></div>
          <div><Label>Moved in (YYYY-MM)</Label><Input value={current.from} placeholder="2022-04" onChange={(e) => patch(setCurrent, current, "from", e.target.value)} onBlur={update} /></div>
        </div>
      </div>

      {history.map((h, i) => (
        <div key={i} className="rounded-md border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-medium">Prior address #{i + 1}</p>
            <Button variant="ghost" size="sm" onClick={() => { const next = history.filter((_, j) => j !== i); setHistory(next); onChange(current, next); }}>
              <Trash2 className="size-4" />
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2"><Label>Street</Label><Input value={h.line1} onChange={(e) => { const next = [...history]; next[i] = { ...h, line1: e.target.value }; setHistory(next); }} onBlur={update} /></div>
            <div><Label>City</Label><Input value={h.city} onChange={(e) => { const next = [...history]; next[i] = { ...h, city: e.target.value }; setHistory(next); }} onBlur={update} /></div>
            <div><Label>State</Label><Input value={h.state} maxLength={2} onChange={(e) => { const next = [...history]; next[i] = { ...h, state: e.target.value.toUpperCase() }; setHistory(next); }} onBlur={update} /></div>
            <div><Label>ZIP</Label><Input value={h.postal} onChange={(e) => { const next = [...history]; next[i] = { ...h, postal: e.target.value }; setHistory(next); }} onBlur={update} /></div>
            <div><Label>From (YYYY-MM)</Label><Input value={h.from} onChange={(e) => { const next = [...history]; next[i] = { ...h, from: e.target.value }; setHistory(next); }} onBlur={update} /></div>
            <div><Label>To (YYYY-MM)</Label><Input value={h.to ?? ""} onChange={(e) => { const next = [...history]; next[i] = { ...h, to: e.target.value }; setHistory(next); }} onBlur={update} /></div>
          </div>
        </div>
      ))}

      <Button variant="outline" onClick={() => { const next = [...history, { ...EMPTY }]; setHistory(next); onChange(current, next); }}>
        <Plus className="mr-2 size-4" /> Add a prior address
      </Button>

      <div className="rounded-md border p-4">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span>7-year coverage</span>
          <span className="font-medium">{Math.floor(monthsCovered / 12)}y {monthsCovered % 12}m of 7y</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
        </div>
        {pct < 100 && <p className="mt-2 text-xs text-muted-foreground">Add more prior addresses to cover 7 years.</p>}
      </div>
    </div>
  );
}
