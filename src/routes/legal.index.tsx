import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/legal/")({
  head: () => ({
    meta: [
      { title: "Legal & Policies — CareMatch" },
      { name: "description", content: "CareMatch legal policies: contractor status, scope of practice, and state availability." },
      { property: "og:title", content: "Legal & Policies — CareMatch" },
      { property: "og:description", content: "Contractor status, scope of practice, and state availability." },
    ],
  }),
  component: LegalIndex,
});

const DOCS = [
  { to: "/legal/independent-contractors", title: "Independent contractor policy", desc: "How our Marketplace providers work with CareMatch." },
  { to: "/legal/scope-of-practice", title: "Scope of practice", desc: "What Marketplace vs licensed partner caregivers can and can't do." },
  { to: "/legal/state-availability", title: "Where CareMatch operates", desc: "States and regions currently served." },
] as const;

function LegalIndex() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Legal & policies</h1>
      <p className="mt-3 text-muted-foreground">The rules of the road, in plain language.</p>
      <ul className="mt-8 divide-y divide-border rounded-lg border border-border">
        {DOCS.map((d) => (
          <li key={d.to}>
            <Link to={d.to} className="block px-5 py-4 hover:bg-muted/50 transition">
              <div className="font-medium">{d.title}</div>
              <div className="text-sm text-muted-foreground mt-1">{d.desc}</div>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
