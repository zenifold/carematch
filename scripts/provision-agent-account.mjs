#!/usr/bin/env node
/**
 * Provisions the machine account that external agents (Buzz) use to read and
 * write support tickets.
 *
 * The point of doing it this way: RLS already encodes exactly the permission
 * model we want. `admin`/`support`/`staff` can SELECT every ticket, UPDATE status
 * and assignment, read internal notes, and post replies. So an agent holding a
 * normal Supabase session for an account with the `support` role needs no bespoke
 * API — it calls /rest/v1 directly, and Postgres enforces the boundary.
 *
 * What it deliberately does NOT get:
 *
 *   - the service-role key, which bypasses RLS entirely and would expose every
 *     senior's care notes and every payment row to a prompt-injected agent
 *   - the `admin` role, which would let it write to trust-and-safety `incidents`
 *   - INSERT on support_tickets beyond its own (RLS pins requester_id to
 *     auth.uid(), so it cannot file tickets as a customer — see docs for the RPC
 *     that would be needed if that is ever wanted)
 *
 *   node scripts/provision-agent-account.mjs           create or update, then verify
 *   node scripts/provision-agent-account.mjs --verify   verify only, change nothing
 *   node scripts/provision-agent-account.mjs --revoke   disable the account
 *
 * Needs SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and AGENT_ACCOUNT_PASSWORD
 * (read from .env if not already in the environment). AGENT_ACCOUNT_PASSWORD is
 * not hardcoded for the same reason DEMO_PASSWORD isn't: this repo is public.
 */

import { readFileSync } from "node:fs";

/**
 * Not on companioncare.test on purpose. That domain is the demo seed's marker,
 * and `seed-demo.mjs --reset` deletes every account on it — which would silently
 * take the integration down. A subdomain of the real domain also makes it obvious
 * in the audit log who acted.
 */
const AGENT_EMAIL = "buzz-agent@integrations.getcompanioncare.com";
const AGENT_NAME = "Buzz AI Agent";
const AGENT_ROLE = "support";

function loadEnv(key) {
  if (process.env[key]) return process.env[key];
  try {
    const line = readFileSync(new URL("../.env", import.meta.url), "utf8")
      .split(/\r?\n/)
      .find((l) => l.startsWith(`${key}=`));
    if (line)
      return line
        .slice(key.length + 1)
        .trim()
        .replace(/^["']|["']$/g, "");
  } catch {
    /* no .env */
  }
  return null;
}

const SUPABASE_URL = loadEnv("SUPABASE_URL");
const SERVICE_KEY = loadEnv("SUPABASE_SERVICE_ROLE_KEY");
const ANON_KEY = loadEnv("SUPABASE_PUBLISHABLE_KEY") ?? loadEnv("VITE_SUPABASE_PUBLISHABLE_KEY");
const PASSWORD = loadEnv("AGENT_ACCOUNT_PASSWORD");

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (env or .env).");
  process.exit(1);
}

const H = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  "Content-Type": "application/json",
};

async function call(path, { method = "GET", body, headers } = {}) {
  const res = await fetch(`${SUPABASE_URL}${path}`, {
    method,
    headers: { ...H, ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${text.slice(0, 300)}`);
  return text ? JSON.parse(text) : null;
}

async function findAgent() {
  for (let page = 1; page <= 20; page += 1) {
    const body = await call(`/auth/v1/admin/users?page=${page}&per_page=200`);
    const batch = body.users ?? [];
    const hit = batch.find((u) => u.email?.toLowerCase() === AGENT_EMAIL.toLowerCase());
    if (hit) return hit;
    if (batch.length < 200) break;
  }
  return null;
}

/** Exercises the real RLS boundary with the agent's own JWT. */
async function verify() {
  if (!ANON_KEY) {
    console.error("  no publishable key available to sign in with");
    return false;
  }
  if (!PASSWORD) {
    console.error("  AGENT_ACCOUNT_PASSWORD not set — cannot sign in to verify");
    return false;
  }

  const tokenRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: ANON_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email: AGENT_EMAIL, password: PASSWORD }),
  });
  if (!tokenRes.ok) {
    console.error(`  FAIL  sign-in → ${tokenRes.status} ${(await tokenRes.text()).slice(0, 160)}`);
    return false;
  }
  const { access_token: jwt } = await tokenRes.json();
  const A = { apikey: ANON_KEY, Authorization: `Bearer ${jwt}` };

  const checks = [];
  const q = async (label, path, expect) => {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers: A });
    const ok = expect === "allowed" ? res.ok : !res.ok || (await res.clone().json()).length === 0;
    checks.push({
      label,
      ok,
      detail: `HTTP ${res.status}`,
      rows: res.ok ? (await res.json()).length : 0,
    });
  };

  await q("read support tickets", "support_tickets?select=id,subject,status&limit=100", "allowed");
  await q(
    "read ticket messages",
    "support_messages?select=id,ticket_id,internal&limit=100",
    "allowed",
  );

  // Must be denied: trust-and-safety incidents need admin/trust_safety, and the
  // whole point of scoping to `support` is that this returns nothing.
  const incRes = await fetch(`${SUPABASE_URL}/rest/v1/incidents?select=id&limit=5`, { headers: A });
  const incRows = incRes.ok ? (await incRes.json()).length : -1;
  checks.push({
    label: "incidents NOT readable",
    ok: incRows === 0,
    detail: incRes.ok ? `HTTP 200 with ${incRows} rows` : `HTTP ${incRes.status}`,
    rows: Math.max(incRows, 0),
  });

  // Must be denied: care notes and payment rows are the blast radius we're avoiding.
  const payRes = await fetch(`${SUPABASE_URL}/rest/v1/payment_ledger?select=id&limit=5`, {
    headers: A,
  });
  const payRows = payRes.ok ? (await payRes.json()).length : -1;
  checks.push({
    label: "payment_ledger NOT readable",
    ok: payRows === 0,
    detail: payRes.ok ? `HTTP 200 with ${payRows} rows` : `HTTP ${payRes.status}`,
    rows: Math.max(payRows, 0),
  });

  // Write path: flip a ticket's priority to itself. A no-op value change still
  // proves UPDATE passes RLS without disturbing the queue.
  const [ticket] = await fetch(
    `${SUPABASE_URL}/rest/v1/support_tickets?select=id,priority&limit=1`,
    {
      headers: A,
    },
  ).then((r) => (r.ok ? r.json() : []));
  if (!ticket) {
    checks.push({
      label: "update a ticket",
      ok: false,
      detail: "no ticket to test against",
      rows: 0,
    });
  } else {
    const upd = await fetch(`${SUPABASE_URL}/rest/v1/support_tickets?id=eq.${ticket.id}`, {
      method: "PATCH",
      headers: { ...A, "Content-Type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify({ priority: ticket.priority }),
    });
    checks.push({ label: "update a ticket", ok: upd.ok, detail: `HTTP ${upd.status}`, rows: 0 });

    const uid = JSON.parse(Buffer.from(jwt.split(".")[1], "base64").toString()).sub;
    const post = async (label, row, wantOk) => {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/support_messages`, {
        method: "POST",
        headers: { ...A, "Content-Type": "application/json", Prefer: "return=representation" },
        body: JSON.stringify([{ ticket_id: ticket.id, ...row }]),
      });
      checks.push({ label, ok: res.ok === wantOk, detail: `HTTP ${res.status}`, rows: 0 });
      if (!res.ok) return [];
      return (await res.json()).map((r) => r.id);
    };

    const created = [
      ...(await post(
        "post a public reply",
        { author_id: uid, body: "[provision check] agent reply", internal: false },
        true,
      )),
      ...(await post(
        "post an internal note",
        { author_id: uid, body: "[provision check] internal note", internal: true },
        true,
      )),
    ];
    // Must fail: the INSERT policy pins author_id to auth.uid(), so the agent
    // cannot put words in a customer's or colleague's mouth.
    await post(
      "cannot spoof another author",
      { author_id: "11111111-1111-1111-1111-111111111111", body: "spoofed", internal: false },
      false,
    );

    // Must be a no-op: `authenticated` has no DELETE grant on support_messages and
    // there is no DELETE policy, so an agent cannot erase support history. Note
    // PostgREST answers 204 either way — the assertion has to be that the row
    // survived, not that the request failed.
    if (created.length > 0) {
      await fetch(`${SUPABASE_URL}/rest/v1/support_messages?id=eq.${created[0]}`, {
        method: "DELETE",
        headers: A,
      });
      const still = await fetch(
        `${SUPABASE_URL}/rest/v1/support_messages?select=id&id=eq.${created[0]}`,
        { headers: A },
      ).then((r) => (r.ok ? r.json() : []));
      checks.push({
        label: "cannot delete history",
        ok: still.length === 1,
        detail: still.length === 1 ? "row survived" : "ROW WAS DELETED",
        rows: still.length,
      });
    }

    // Tidy up with the service role, which is the only identity that can.
    if (created.length > 0) {
      await call(`/rest/v1/support_messages?id=in.(${created.join(",")})`, {
        method: "DELETE",
        headers: { Prefer: "return=minimal" },
      });
    }
  }

  let failed = 0;
  for (const c of checks) {
    if (!c.ok) failed += 1;
    console.log(`  ${c.ok ? "ok  " : "FAIL"}  ${c.label.padEnd(30)} ${c.detail}`);
  }
  return failed === 0;
}

async function provision() {
  if (!PASSWORD) {
    console.error(
      "Missing AGENT_ACCOUNT_PASSWORD (env or .env).\n" +
        "Not hardcoded because this repo is public. Add AGENT_ACCOUNT_PASSWORD=<value>\n" +
        "to .env, then set the same value wherever Buzz reads its credentials.",
    );
    process.exit(1);
  }

  let agent = await findAgent();
  if (agent) {
    await call(`/auth/v1/admin/users/${agent.id}`, {
      method: "PUT",
      body: {
        password: PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: AGENT_NAME, kind: "integration", integration: "buzz" },
      },
    });
    console.log(`  updated  ${AGENT_EMAIL}`);
  } else {
    agent = await call("/auth/v1/admin/users", {
      method: "POST",
      body: {
        email: AGENT_EMAIL,
        password: PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: AGENT_NAME, kind: "integration", integration: "buzz" },
      },
    });
    console.log(`  created  ${AGENT_EMAIL}`);
  }

  // The signup trigger writes a profile and a default role; force both to what
  // this account should actually be.
  await call("/rest/v1/profiles?on_conflict=id", {
    method: "POST",
    body: [
      { id: agent.id, full_name: AGENT_NAME, role: AGENT_ROLE, city: null, onboarded_at: null },
    ],
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
  });
  await call("/rest/v1/user_roles?on_conflict=user_id,role", {
    method: "POST",
    body: [{ user_id: agent.id, role: AGENT_ROLE }],
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
  });
  // Strip anything else the trigger added, so the account holds exactly one role.
  await call(`/rest/v1/user_roles?user_id=eq.${agent.id}&role=neq.${AGENT_ROLE}`, {
    method: "DELETE",
    headers: { Prefer: "return=minimal" },
  });

  const roles = await call(`/rest/v1/user_roles?user_id=eq.${agent.id}&select=role`);
  console.log(`  roles    ${roles.map((r) => r.role).join(", ") || "(none)"}`);
  console.log(`  user id  ${agent.id}`);
  return agent.id;
}

/**
 * Removes the role rather than deleting the account. Support messages and audit
 * rows reference the agent's id; deleting the user would cascade or null those and
 * destroy the record of what the agent did.
 */
async function revoke() {
  const agent = await findAgent();
  if (!agent) {
    console.log(`  ${AGENT_EMAIL} does not exist — nothing to revoke.`);
    return;
  }
  await call(`/rest/v1/user_roles?user_id=eq.${agent.id}`, {
    method: "DELETE",
    headers: { Prefer: "return=minimal" },
  });
  // Rotate to a value nobody holds, so an already-issued password stops working.
  const random = `revoked-${Buffer.from(crypto.getRandomValues(new Uint8Array(24))).toString("hex")}`;
  await call(`/auth/v1/admin/users/${agent.id}`, { method: "PUT", body: { password: random } });
  console.log(`  revoked  ${AGENT_EMAIL} — role removed and password rotated`);
  console.log("  history preserved: the account still exists so its past writes stay attributable");
}

async function main() {
  const args = process.argv.slice(2);
  console.log(`Supabase: ${SUPABASE_URL}\n`);

  if (args.includes("--revoke")) {
    await revoke();
    return;
  }

  if (!args.includes("--verify")) {
    console.log("Provisioning");
    await provision();
    console.log();
  }

  console.log("Verifying the RLS boundary");
  const ok = await verify();
  console.log(
    ok
      ? "\nAgent account can read and write support tickets, and cannot reach incidents or billing."
      : "\nSome checks FAILED — see above.",
  );
  process.exitCode = ok ? 0 : 1;
}

main().catch((err) => {
  console.error(`\n${err.message}`);
  process.exitCode = 1;
});
