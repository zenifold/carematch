#!/usr/bin/env node
/**
 * Seeds the demo and colleague-test accounts on the Supabase project.
 *
 * Two sets of accounts, both on the reserved `companioncare.test` domain:
 *
 *   demo-*      populated with a few weeks of history, for showing the product
 *   test-*       empty, for colleagues to click through onboarding themselves
 *
 * `.test` is reserved by RFC 2606, so none of these addresses can ever receive
 * mail or collide with a real signup. That single domain is also the marker the
 * whole seed is identified by: `--reset` deletes every user on it, and the
 * foreign keys cascade the data away with them. Nothing else needs a flag
 * column, and nothing outside the domain is ever touched.
 *
 * The script is idempotent and safe to re-run. Re-running also *refreshes* the
 * demo history, because every date is computed relative to the run time — a
 * demo seeded two months ago would otherwise show "upcoming" visits in the
 * past.
 *
 *   node scripts/seed-demo.mjs            migrate + seed + verify
 *   node scripts/seed-demo.mjs --verify   verify logins only, change nothing
 *   node scripts/seed-demo.mjs --reset    delete every seeded account and its data
 *
 * Needs SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (read from .env if not
 * already in the environment). The service-role key bypasses RLS, which is why
 * this is a local operator script and not a server function.
 */

import { readFileSync } from "node:fs";

const SEED_DOMAIN = "companioncare.test";
const PASSWORD = "CompanionCare123!";
/** Matches src/lib/stripe/client.server.ts, which reads PLATFORM_FEE_BPS. */
const PLATFORM_FEE_BPS = 1500;

// ---------------------------------------------------------------- environment

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
    /* no .env — fall through to the error below */
  }
  return null;
}

const SUPABASE_URL = loadEnv("SUPABASE_URL");
const SERVICE_KEY = loadEnv("SUPABASE_SERVICE_ROLE_KEY");
const ANON_KEY = loadEnv("SUPABASE_PUBLISHABLE_KEY") ?? loadEnv("VITE_SUPABASE_PUBLISHABLE_KEY");

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (env or .env).");
  process.exit(1);
}

const HEADERS = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  "Content-Type": "application/json",
};

// --------------------------------------------------------------- http helpers

async function call(path, { method = "GET", body, headers } = {}) {
  const res = await fetch(`${SUPABASE_URL}${path}`, {
    method,
    headers: { ...HEADERS, ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`${method} ${path} → ${res.status}: ${text.slice(0, 400)}`);
  }
  return text ? JSON.parse(text) : null;
}

/**
 * Insert rows, returning them. Chunked because PostgREST payloads have limits.
 *
 * PostgREST rejects a bulk insert whose objects don't all carry the same keys
 * ("All object keys must match"), so the key set is unioned across the batch and
 * gaps filled with null. That means an omitted column is written as NULL rather
 * than falling back to its database default — fine for everything seeded here,
 * where a missing value always means "not set".
 */
async function insert(table, rows) {
  const list = rows.filter(Boolean);
  if (list.length === 0) return [];
  const keys = [...new Set(list.flatMap(Object.keys))];
  for (const row of list) {
    for (const k of keys) if (!(k in row)) row[k] = null;
  }
  const out = [];
  for (let i = 0; i < list.length; i += 100) {
    out.push(
      ...(await call(`/rest/v1/${table}`, {
        method: "POST",
        body: list.slice(i, i + 100),
        headers: { Prefer: "return=representation" },
      })),
    );
  }
  return out;
}

async function upsert(table, rows, onConflict) {
  if (rows.length === 0) return [];
  return call(`/rest/v1/${table}?on_conflict=${onConflict}`, {
    method: "POST",
    body: rows,
    headers: { Prefer: "resolution=merge-duplicates,return=representation" },
  });
}

async function remove(table, query) {
  return call(`/rest/v1/${table}?${query}`, {
    method: "DELETE",
    headers: { Prefer: "return=minimal" },
  });
}

async function listAuthUsers() {
  const users = [];
  for (let page = 1; page <= 20; page += 1) {
    const body = await call(`/auth/v1/admin/users?page=${page}&per_page=200`);
    const batch = body.users ?? [];
    users.push(...batch);
    if (batch.length < 200) break;
  }
  return users;
}

// ------------------------------------------------------------------ time helpers

const NOW = new Date();

/** ISO timestamp `dayOffset` days from now, at a fixed wall-clock hour (UTC). */
function at(dayOffset, hour, minute = 0) {
  const d = new Date(NOW);
  d.setUTCDate(d.getUTCDate() + dayOffset);
  d.setUTCHours(hour, minute, 0, 0);
  return d.toISOString();
}

function plusHours(iso, hours) {
  return new Date(new Date(iso).getTime() + hours * 3600_000).toISOString();
}

function plusMinutes(iso, minutes) {
  return new Date(new Date(iso).getTime() + minutes * 60_000).toISOString();
}

// ------------------------------------------------------------------- the cast

/**
 * `from` lists the addresses a account may currently be under, so the rename is
 * idempotent: on the first run it finds the old carematch address, on later runs
 * it finds the new one and leaves it alone.
 */
const DEMO = [
  {
    key: "senior",
    from: ["senior@carematch.test"],
    email: `demo-senior@${SEED_DOMAIN}`,
    role: "senior",
    name: "Marta Alvarez",
    city: "Richmond, VA",
    budget: 80000,
  },
  {
    key: "family",
    from: ["family@carematch.test"],
    email: `demo-family@${SEED_DOMAIN}`,
    role: "family",
    name: "Dana Alvarez",
    city: "Richmond, VA",
  },
  {
    key: "caregiver",
    from: ["caregiver@carematch.test"],
    email: `demo-caregiver@${SEED_DOMAIN}`,
    role: "provider",
    name: "Andrea Rivera",
    city: "Richmond, VA",
  },
  {
    key: "admin",
    from: ["admin@carematch.test"],
    email: `demo-admin@${SEED_DOMAIN}`,
    role: "admin",
    name: "CompanionCare Admin",
    city: "Remote",
  },

  {
    key: "eleanor",
    from: ["eleanor.vance@carematch.test"],
    email: `eleanor.vance@${SEED_DOMAIN}`,
    role: "senior",
    name: "Eleanor Vance",
    city: "Alexandria, VA",
    budget: 150000,
  },
  {
    key: "james",
    from: ["james.vance@carematch.test"],
    email: `james.vance@${SEED_DOMAIN}`,
    role: "family",
    name: "James Vance",
    city: "Arlington, VA",
  },
  {
    key: "sophie",
    from: ["sophie.vance@carematch.test"],
    email: `sophie.vance@${SEED_DOMAIN}`,
    role: "family",
    name: "Sophie Vance",
    city: "Arlington, VA",
  },
  {
    key: "robert",
    from: ["robert.chen@carematch.test"],
    email: `robert.chen@${SEED_DOMAIN}`,
    role: "senior",
    name: "Robert Chen",
    city: "Virginia Beach, VA",
    budget: 40000,
  },

  {
    key: "priya",
    from: ["priya.shah@carematch.demo"],
    email: `priya.shah@${SEED_DOMAIN}`,
    role: "provider",
    name: "Priya Shah",
    city: "Alexandria, VA",
  },
  {
    key: "marcus",
    from: ["marcus.chen@carematch.demo"],
    email: `marcus.chen@${SEED_DOMAIN}`,
    role: "provider",
    name: "Marcus Chen",
    city: "Virginia Beach, VA",
  },
  {
    key: "nia",
    from: ["nia.okafor@carematch.demo"],
    email: `nia.okafor@${SEED_DOMAIN}`,
    role: "provider",
    name: "Nia Okafor",
    city: "Richmond, VA",
  },
  {
    key: "luisa",
    from: ["luisa.fernandez@carematch.demo"],
    email: `luisa.fernandez@${SEED_DOMAIN}`,
    role: "provider",
    name: "Luisa Fernandez",
    city: "Norfolk, VA",
  },
  {
    key: "diego",
    from: ["diego.martinez@carematch.test"],
    email: `diego.martinez@${SEED_DOMAIN}`,
    role: "provider",
    name: "Diego Martinez",
    city: "Roanoke, VA",
  },
];

/**
 * Deliberately bare: no profile city, no budget, no onboarded_at, no bookings.
 * A colleague signing in here sees the same first-run experience a real new user
 * would, which is the thing that actually needs testing.
 */
const TEST = [
  { key: "t-senior", email: `test-senior@${SEED_DOMAIN}`, role: "senior", name: "Test Senior" },
  { key: "t-family", email: `test-family@${SEED_DOMAIN}`, role: "family", name: "Test Family" },
  {
    key: "t-caregiver",
    email: `test-caregiver@${SEED_DOMAIN}`,
    role: "provider",
    name: "Test Caregiver",
  },
  { key: "t-staff", email: `test-staff@${SEED_DOMAIN}`, role: "admin", name: "Test Staff" },
];

const ALL = [...DEMO, ...TEST];

// ------------------------------------------------------------ provider profiles

const PROVIDER_PROFILES = {
  caregiver: {
    tier: "silver",
    rate: 2600,
    years: 8,
    headline: "Warm, dependable weekday helper",
    bio: "CNA-trained with 8 years supporting older adults through companionship, errands, and light personal care. Same friendly face, every visit.",
    specialties: ["companionship", "errands", "meal-prep", "light-housekeeping"],
    languages: ["English", "Spanish"],
    area: "Richmond, VA",
    serviceTier: 2,
  },
  nia: {
    tier: "silver",
    rate: 2800,
    years: 6,
    headline: "Companion and rides, Richmond metro",
    bio: "Warm companion who loves crosswords and long walks. Reliable for weekly check-ins and rides to appointments.",
    specialties: ["companionship", "transportation", "errands"],
    languages: ["English"],
    area: "Richmond, VA",
    serviceTier: 2,
  },
  priya: {
    tier: "gold",
    rate: 4200,
    years: 9,
    headline: "Personal care with a decade of dementia experience",
    bio: "CNA with a decade of dementia-care experience. Calm, unhurried, and used to working alongside families.",
    specialties: ["personal-care", "medication-reminders", "dementia-care"],
    languages: ["English", "Hindi"],
    area: "Alexandria, VA",
    serviceTier: 3,
  },
  marcus: {
    tier: "silver",
    rate: 3000,
    years: 4,
    headline: "Rides to appointments and companionship",
    bio: "Patient driver and companion for medical appointments. Knows every clinic between Virginia Beach and Norfolk.",
    specialties: ["companionship", "transportation", "errands"],
    languages: ["English", "Mandarin"],
    area: "Virginia Beach, VA",
    serviceTier: 2,
  },
  luisa: {
    tier: "gold",
    rate: 4400,
    years: 12,
    headline: "Bilingual post-op recovery caregiver",
    bio: "Bilingual caregiver specializing in post-hospital recovery. Twelve years of getting people back on their feet at home.",
    specialties: ["personal-care", "post-op-recovery", "meal-prep"],
    languages: ["English", "Spanish"],
    area: "Norfolk, VA",
    serviceTier: 3,
  },
  diego: {
    tier: "bronze",
    rate: 2200,
    years: 1,
    headline: "New to CompanionCare, eager to help",
    bio: "Former hospital volunteer transitioning to home care. Patient, punctual, and a great listener.",
    specialties: ["companionship"],
    languages: ["English"],
    area: "Roanoke, VA",
    serviceTier: 1,
  },
};

// -------------------------------------------------------------- booking script

/**
 * The visit history. Past entries carry a rating and a visit row; future ones
 * don't. Rates sit inside the bands published in src/lib/pricing-tiers.ts, and
 * service_type uses that file's display names because the app renders the
 * column verbatim.
 */
const BOOKINGS = [
  // Marta Alvarez — the flagship senior. Four weeks of a settled weekly rhythm.
  {
    senior: "senior",
    provider: "caregiver",
    day: -26,
    hour: 14,
    svc: "Companionship & check-ins",
    hrs: 2,
    rate: 2600,
    status: "completed",
    rating: 5,
    comment: "Andrea is easy to talk to. The afternoon went quickly.",
    providerNotes:
      "Walked to the corner and back, then cards. Marta mentioned her knee was stiff on the stairs.",
    plan: [
      ["Afternoon walk", true],
      ["Card game", true],
      ["Water the plants", true],
    ],
  },
  {
    senior: "senior",
    provider: "caregiver",
    day: -22,
    hour: 10,
    svc: "House cleaning & laundry",
    hrs: 3,
    rate: 3200,
    status: "completed",
    rating: 5,
    comment: "The kitchen looks better than it has in months.",
    providerNotes: "Full kitchen and bathroom, two loads of laundry folded and put away.",
    plan: [
      ["Kitchen", true],
      ["Bathroom", true],
      ["Laundry", true],
      ["Change bedding", true],
    ],
  },
  {
    senior: "senior",
    provider: "nia",
    day: -19,
    hour: 9,
    svc: "Rides to appointments",
    hrs: 2,
    rate: 2800,
    status: "completed",
    rating: 4,
    comment: "On time and patient in the waiting room.",
    providerNotes: "Cardiology follow-up at 9:30. Waited through the appointment, home by 11:15.",
    plan: [
      ["Drive to clinic", true],
      ["Wait through appointment", true],
      ["Drive home", true],
    ],
  },
  {
    senior: "senior",
    provider: "caregiver",
    day: -15,
    hour: 14,
    svc: "Companionship & check-ins",
    hrs: 2,
    rate: 2600,
    status: "completed",
    rating: 5,
    comment: "We got through half the photo album.",
    providerNotes: "Sorted photographs and labelled the back of each one. Good spirits.",
    plan: [
      ["Sort photographs", true],
      ["Afternoon tea", true],
    ],
  },
  {
    senior: "senior",
    provider: "caregiver",
    day: -12,
    hour: 16,
    svc: "Meal prep & light cooking",
    hrs: 2,
    rate: 2800,
    status: "completed",
    rating: 5,
    comment: "Four dinners in the freezer. Wonderful.",
    providerNotes:
      "Batch-cooked four portions, labelled and frozen. Fridge cleared of anything past date.",
    plan: [
      ["Batch cook 4 meals", true],
      ["Label and freeze", true],
      ["Clear out fridge", true],
    ],
  },
  {
    senior: "senior",
    provider: "caregiver",
    day: -10,
    hour: 14,
    svc: "Companionship & check-ins",
    hrs: 2,
    rate: 2600,
    status: "cancelled",
    notes: "Marta had a cold and asked to skip this week.",
  },
  {
    senior: "senior",
    provider: "caregiver",
    day: -8,
    hour: 10,
    svc: "House cleaning & laundry",
    hrs: 3,
    rate: 3200,
    status: "completed",
    rating: 4,
    comment: "Good visit. Ran a little short on time for the windows.",
    providerNotes:
      "Kitchen, bathroom, floors throughout. Did not get to the windows — flagged for next time.",
    plan: [
      ["Kitchen", true],
      ["Bathroom", true],
      ["Floors", true],
      ["Windows", false],
    ],
  },
  {
    senior: "senior",
    provider: "caregiver",
    day: -5,
    hour: 14,
    svc: "Companionship & check-ins",
    hrs: 2,
    rate: 2600,
    status: "completed",
    rating: 5,
    comment: "Back to normal and glad of the company.",
    providerNotes: "Cold has cleared. Walked to the park. Reminded her about Thursday's refill.",
    plan: [
      ["Afternoon walk", true],
      ["Medication reminder", true],
      ["Tidy living room", true],
    ],
  },
  {
    senior: "senior",
    provider: "caregiver",
    day: 2,
    hour: 14,
    svc: "Companionship & check-ins",
    hrs: 2,
    rate: 2600,
    status: "confirmed",
    notes: "Weekly afternoon visit.",
  },
  {
    senior: "senior",
    provider: "caregiver",
    day: 5,
    hour: 10,
    svc: "House cleaning & laundry",
    hrs: 3,
    rate: 3200,
    status: "confirmed",
    notes: "Please start with the windows this time.",
  },
  {
    senior: "senior",
    provider: "nia",
    day: 9,
    hour: 9,
    svc: "Rides to appointments",
    hrs: 2,
    rate: 2800,
    status: "requested",
    notes: "Orthopaedics, 9:45. Needs a ride both ways.",
  },

  // Eleanor Vance — higher-needs senior, personal care several times a week.
  {
    senior: "eleanor",
    provider: "priya",
    day: -20,
    hour: 8,
    svc: "Personal care (CNA / HHA)",
    hrs: 3,
    rate: 4200,
    status: "completed",
    rating: 5,
    comment: "Priya is unhurried, which matters a great deal.",
    providerNotes: "Morning routine, shower with the chair, dressed and downstairs by 9:30.",
    plan: [
      ["Morning routine", true],
      ["Shower", true],
      ["Dress", true],
      ["Breakfast", true],
    ],
  },
  {
    senior: "eleanor",
    provider: "priya",
    day: -13,
    hour: 8,
    svc: "Personal care (CNA / HHA)",
    hrs: 3,
    rate: 4200,
    status: "completed",
    rating: 5,
    comment: "No complaints at all.",
    providerNotes: "Same routine. Steadier on the stairs than a fortnight ago.",
    plan: [
      ["Morning routine", true],
      ["Shower", true],
      ["Dress", true],
      ["Light tidy", true],
    ],
  },
  {
    senior: "eleanor",
    provider: "luisa",
    day: -9,
    hour: 15,
    svc: "Meal prep & light cooking",
    hrs: 2,
    rate: 4400,
    status: "completed",
    rating: 5,
    comment: "Luisa cooks the way my mother did.",
    providerNotes:
      "Three meals prepared, low-sodium as requested. Went through the week's menu with James.",
    plan: [
      ["Plan the week's meals", true],
      ["Cook 3 portions", true],
      ["Dishes", true],
    ],
  },
  {
    senior: "eleanor",
    provider: "priya",
    day: -6,
    hour: 8,
    svc: "Personal care (CNA / HHA)",
    hrs: 3,
    rate: 4200,
    status: "completed",
    rating: 4,
    comment: "Fine visit. A slow morning on my end.",
    providerNotes: "Slower start than usual, more tired. Mentioned it to James at pickup.",
    plan: [
      ["Morning routine", true],
      ["Shower", true],
      ["Dress", true],
    ],
  },
  {
    senior: "eleanor",
    provider: "priya",
    day: 1,
    hour: 8,
    svc: "Personal care (CNA / HHA)",
    hrs: 3,
    rate: 4200,
    status: "confirmed",
    notes: "Standing Tuesday morning.",
  },
  {
    senior: "eleanor",
    provider: "luisa",
    day: 4,
    hour: 15,
    svc: "Meal prep & light cooking",
    hrs: 2,
    rate: 4400,
    status: "confirmed",
    notes: "Low-sodium again please.",
  },

  // Robert Chen — lighter user, mostly rides and errands.
  {
    senior: "robert",
    provider: "marcus",
    day: -24,
    hour: 11,
    svc: "Errands & grocery runs",
    hrs: 2,
    rate: 2400,
    status: "completed",
    rating: 5,
    comment: "Got everything on the list.",
    providerNotes: "Grocery run and pharmacy pickup. Receipt left on the counter.",
    plan: [
      ["Groceries", true],
      ["Pharmacy", true],
      ["Put shopping away", true],
    ],
  },
  {
    senior: "robert",
    provider: "marcus",
    day: -17,
    hour: 11,
    svc: "Rides to appointments",
    hrs: 2,
    rate: 3000,
    status: "completed",
    rating: 5,
    comment: "Marcus knows the way better than I do.",
    providerNotes: "Dental appointment. Straightforward, home by 1.",
    plan: [
      ["Drive to dentist", true],
      ["Wait", true],
      ["Drive home", true],
    ],
  },
  {
    senior: "robert",
    provider: "marcus",
    day: -7,
    hour: 11,
    svc: "Errands & grocery runs",
    hrs: 2,
    rate: 2400,
    status: "completed",
    rating: 4,
    comment: "One item out of stock, otherwise good.",
    providerNotes:
      "Groceries done. Store was out of his usual bread, substituted and checked first.",
    plan: [
      ["Groceries", true],
      ["Pharmacy", true],
    ],
  },
  {
    senior: "robert",
    provider: "diego",
    day: 3,
    hour: 13,
    svc: "Companionship & check-ins",
    hrs: 2,
    rate: 2200,
    status: "requested",
    notes: "First visit with a new helper — would like a short introduction call.",
  },
  {
    senior: "robert",
    provider: "marcus",
    day: 7,
    hour: 11,
    svc: "Errands & grocery runs",
    hrs: 2,
    rate: 2400,
    status: "confirmed",
    notes: "Weekly shop.",
  },
];

// ------------------------------------------------------------------ operations

function fmtMoney(cents) {
  return `$${(cents / 100).toFixed(2)}`;
}

async function resolveIds() {
  const users = await listAuthUsers();
  const byEmail = new Map(users.map((u) => [u.email.toLowerCase(), u]));
  const ids = {};
  const missing = [];
  for (const spec of ALL) {
    const found =
      byEmail.get(spec.email.toLowerCase()) ??
      (spec.from ?? []).map((e) => byEmail.get(e.toLowerCase())).find(Boolean);
    if (found) ids[spec.key] = found.id;
    else missing.push(spec);
  }
  return { ids, missing, byEmail };
}

/** Renames the existing accounts onto the seed domain and resets their password. */
async function migrateAccounts() {
  const { ids, missing, byEmail } = await resolveIds();
  let renamed = 0;
  let created = 0;

  for (const spec of ALL) {
    const id = ids[spec.key];
    if (!id) continue;
    const current = [...byEmail.values()].find((u) => u.id === id);
    const needsRename = current.email.toLowerCase() !== spec.email.toLowerCase();
    await call(`/auth/v1/admin/users/${id}`, {
      method: "PUT",
      body: {
        email: spec.email,
        email_confirm: true,
        password: PASSWORD,
        user_metadata: { full_name: spec.name, role: spec.role, seed: "companioncare-demo" },
      },
    });
    if (needsRename) {
      renamed += 1;
      console.log(`  renamed  ${current.email}  ->  ${spec.email}`);
    }
  }

  for (const spec of missing) {
    const body = await call("/auth/v1/admin/users", {
      method: "POST",
      body: {
        email: spec.email,
        password: PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: spec.name, role: spec.role, seed: "companioncare-demo" },
      },
    });
    ids[spec.key] = body.id;
    created += 1;
    console.log(`  created  ${spec.email}`);
  }

  // The signup trigger caps requested roles at senior/family/provider, and never
  // writes profiles.role at all, so both are set explicitly here.
  await upsert(
    "user_roles",
    ALL.map((s) => ({ user_id: ids[s.key], role: s.role })),
    "user_id,role",
  );
  for (const spec of ALL) {
    const extraRoles = await call(
      `/rest/v1/user_roles?user_id=eq.${ids[spec.key]}&role=neq.${spec.role}&select=role`,
    );
    if (extraRoles.length > 0) {
      await remove("user_roles", `user_id=eq.${ids[spec.key]}&role=neq.${spec.role}`);
    }
  }

  await upsert(
    "profiles",
    DEMO.map((s) => ({
      id: ids[s.key],
      full_name: s.name,
      role: s.role,
      city: s.city ?? null,
      monthly_budget_cents: s.budget ?? null,
      onboarded_at: at(-45, 12),
      phone: null,
      deleted_at: null,
      suspended_at: null,
      suspended_reason: null,
    })),
    "id",
  );
  await upsert(
    "profiles",
    TEST.map((s) => ({
      id: ids[s.key],
      full_name: s.name,
      role: s.role,
      city: null,
      monthly_budget_cents: null,
      onboarded_at: null,
      phone: null,
      deleted_at: null,
      suspended_at: null,
      suspended_reason: null,
    })),
    "id",
  );

  console.log(`  ${renamed} renamed, ${created} created, ${ALL.length} accounts on ${SEED_DOMAIN}`);
  return ids;
}

/** Removes every data row belonging to a seeded account, in FK order. */
async function clearSeedData(ids) {
  const list = Object.values(ids);
  const inList = `(${list.join(",")})`;
  const bookings = await call(
    `/rest/v1/bookings?or=(senior_id.in.${inList},provider_id.in.${inList})&select=id`,
  );
  const bookingIds = bookings.map((b) => b.id);

  await remove("payment_ledger", `provider_id=in.${inList}`);
  if (bookingIds.length > 0) {
    await remove("visits", `booking_id=in.(${bookingIds.join(",")})`);
    await remove("bookings", `id=in.(${bookingIds.join(",")})`);
  }
  await remove("messages", `sender_id=in.${inList}`);
  await remove("conversations", `or=(participant_a.in.${inList},participant_b.in.${inList})`);
  await remove("notifications", `user_id=in.${inList}`);
  await remove("support_tickets", `requester_id=in.${inList}`);
  // The rating trigger opens a coaching task when a provider's rolling average
  // slips, so these accumulate across runs if left alone.
  await remove("cs_tasks", `target_user_id=in.${inList}`);
  await remove("family_links", `senior_id=in.${inList}`);
  await remove("verifications", `provider_id=in.${inList}`);
  await remove("senior_preferences", `user_id=in.${inList}`);
  console.log(`  cleared ${bookingIds.length} bookings and their dependents`);
}

async function seedProviders(ids) {
  const rows = Object.entries(PROVIDER_PROFILES).map(([key, p]) => ({
    id: ids[key],
    tier: p.tier,
    hourly_rate_cents: p.rate,
    headline: p.headline,
    bio: p.bio,
    specialties: p.specialties,
    languages: p.languages,
    service_area: p.area,
    service_tier: p.serviceTier,
    years_experience: p.years,
    is_active: true,
    onboarding_step: 5,
    verification_state: key === "diego" ? "provisional" : "verified",
    acknowledged_serious_at: at(-40, 12),
    last_onboarding_activity_at: at(-40, 12),
  }));

  // The empty caregiver test account gets the row the onboarding flow would
  // create on its first step — step 0, inactive, unverified. Without it the
  // provider portal has nothing to read; with it, the colleague lands in
  // onboarding, which is the state worth testing.
  rows.push({
    id: ids["t-caregiver"],
    tier: "bronze",
    hourly_rate_cents: 0,
    headline: null,
    bio: null,
    specialties: [],
    languages: [],
    service_area: null,
    service_tier: 1,
    years_experience: null,
    is_active: false,
    onboarding_step: 0,
    verification_state: "pending",
    acknowledged_serious_at: null,
    last_onboarding_activity_at: null,
  });

  await upsert("providers", rows, "id");

  const verifications = [];
  for (const key of Object.keys(PROVIDER_PROFILES)) {
    verifications.push(
      {
        provider_id: ids[key],
        kind: "id_check",
        status: "passed",
        vendor: "manual",
        verified_on: at(-38, 12).slice(0, 10),
        expires_on: at(327, 12).slice(0, 10),
      },
      {
        provider_id: ids[key],
        kind: "background_check",
        // Diego is mid-check on purpose: the admin trust queue needs an open item.
        status: key === "diego" ? "pending" : "passed",
        vendor: "manual",
        verified_on: key === "diego" ? null : at(-37, 12).slice(0, 10),
        expires_on: key === "diego" ? null : at(328, 12).slice(0, 10),
      },
    );
  }
  verifications.push(
    {
      provider_id: ids.priya,
      kind: "license_check",
      status: "passed",
      vendor: "manual",
      verified_on: at(-36, 12).slice(0, 10),
      expires_on: at(200, 12).slice(0, 10),
    },
    {
      provider_id: ids.luisa,
      kind: "license_check",
      status: "passed",
      vendor: "manual",
      verified_on: at(-36, 12).slice(0, 10),
      expires_on: at(180, 12).slice(0, 10),
    },
    {
      provider_id: ids.caregiver,
      kind: "references",
      status: "passed",
      vendor: "manual",
      verified_on: at(-35, 12).slice(0, 10),
      expires_on: null,
    },
    {
      provider_id: ids.marcus,
      kind: "insurance",
      status: "passed",
      vendor: "manual",
      verified_on: at(-35, 12).slice(0, 10),
      expires_on: at(150, 12).slice(0, 10),
    },
  );
  await insert("verifications", verifications);
  console.log(`  ${rows.length} provider profiles, ${verifications.length} verification records`);
}

/** The app's coarse rating tiers (see rateVisit in src/lib/bookings.functions.ts). */
function ratingTier(num) {
  if (num >= 4) return "great";
  if (num === 3) return "okay";
  return "bad";
}

async function seedBookings(ids) {
  const bookingRows = BOOKINGS.map((b) => {
    const scheduled = at(b.day, b.hour);
    const paid = b.status === "completed";
    return {
      senior_id: ids[b.senior],
      provider_id: ids[b.provider],
      scheduled_at: scheduled,
      duration_minutes: b.hrs * 60,
      service_type: b.svc,
      status: b.status,
      hourly_rate_cents: b.rate,
      notes: b.notes ?? null,
      payment_status: paid ? "paid" : "unpaid",
      paid_at: paid ? plusHours(scheduled, b.hrs + 1) : null,
      paid_by: paid ? ids[b.senior] : null,
      // Booked about a week ahead, but never in the future.
      created_at: at(Math.min(b.day - 6, -1), 19),
      // A reminder can only have gone out if its send time has already passed.
      reminder_sent_at: b.day <= 1 && b.status !== "requested" ? at(b.day - 1, 18) : null,
    };
  });

  const created = await insert("bookings", bookingRows);

  // Match rows back by their natural key rather than trusting the insert to come
  // back in request order. Compared as instants, not strings: Postgres returns
  // `+00:00` where Date#toISOString writes `.000Z`.
  const specOf = new Map(
    created.map((row) => [
      row.id,
      BOOKINGS.find(
        (b) =>
          ids[b.senior] === row.senior_id &&
          ids[b.provider] === row.provider_id &&
          Date.parse(at(b.day, b.hour)) === Date.parse(row.scheduled_at),
      ),
    ]),
  );
  const unmatched = [...specOf.values()].filter((s) => !s).length;
  if (unmatched > 0) throw new Error(`${unmatched} inserted bookings could not be matched back`);

  const visitRows = [];
  const ledgerRows = [];
  created.forEach((row, i) => {
    const spec = specOf.get(row.id);
    if (!spec || spec.status !== "completed") return;
    const checkIn = plusMinutes(row.scheduled_at, i % 3 === 0 ? 4 : -2);
    const checkOut = plusMinutes(checkIn, spec.hrs * 60 + (i % 2 === 0 ? 6 : -3));
    visitRows.push({
      booking_id: row.id,
      checked_in_at: checkIn,
      checked_out_at: checkOut,
      provider_notes: spec.providerNotes,
      checkout_summary_text: spec.providerNotes,
      senior_rating: ratingTier(spec.rating),
      senior_rating_num: spec.rating,
      senior_comment: spec.comment,
      rated_at: plusHours(checkOut, 3),
      plan_items: (spec.plan ?? []).map(([label, done]) => ({ label, done })),
      created_at: checkIn,
    });

    const total = spec.hrs * spec.rate;
    const fee = Math.round((total * PLATFORM_FEE_BPS) / 10_000);
    const posted = plusHours(checkOut, 2);
    ledgerRows.push(
      {
        booking_id: row.id,
        senior_id: row.senior_id,
        provider_id: row.provider_id,
        entry_type: "charge",
        amount_cents: total,
        currency: "usd",
        status: "posted",
        posted_at: posted,
        memo: `${spec.svc} — ${spec.hrs}h at ${fmtMoney(spec.rate)}/hr`,
        created_at: posted,
      },
      {
        booking_id: row.id,
        senior_id: row.senior_id,
        provider_id: row.provider_id,
        entry_type: "platform_fee",
        amount_cents: fee,
        currency: "usd",
        status: "posted",
        posted_at: posted,
        memo: `Platform fee (${PLATFORM_FEE_BPS / 100}%)`,
        created_at: posted,
      },
      {
        booking_id: row.id,
        senior_id: row.senior_id,
        provider_id: row.provider_id,
        entry_type: "provider_payout",
        amount_cents: total - fee,
        currency: "usd",
        status: "posted",
        posted_at: plusHours(posted, 46),
        memo: "Weekly payout",
        created_at: posted,
      },
    );
  });

  const visits = await insert("visits", visitRows);

  // visits.booking_id is what payment_ledger.visit_id should point at; match
  // them back up rather than assuming another parallel ordering.
  const visitByBooking = new Map(visits.map((v) => [v.booking_id, v.id]));
  for (const row of ledgerRows) row.visit_id = visitByBooking.get(row.booking_id) ?? null;

  // One refund so the billing screens have a non-happy-path row to render.
  const refunded = created.find((r) => r.status === "cancelled");
  if (refunded) {
    const posted = at(-10, 15);
    ledgerRows.push({
      booking_id: refunded.id,
      senior_id: refunded.senior_id,
      provider_id: refunded.provider_id,
      entry_type: "refund",
      amount_cents: 2600,
      currency: "usd",
      status: "posted",
      posted_at: posted,
      visit_id: null,
      memo: "Cancelled more than 24h ahead — full refund",
      created_at: posted,
    });
  }

  await insert("payment_ledger", ledgerRows);
  console.log(
    `  ${created.length} bookings, ${visits.length} completed visits, ${ledgerRows.length} ledger entries`,
  );
  return created;
}

async function seedRelationships(ids) {
  await insert("family_links", [
    {
      senior_id: ids.senior,
      family_id: ids.family,
      permission: "financial",
      approved: true,
      created_at: at(-44, 12),
    },
    {
      senior_id: ids.eleanor,
      family_id: ids.james,
      permission: "financial",
      approved: true,
      created_at: at(-43, 12),
    },
    {
      senior_id: ids.eleanor,
      family_id: ids.sophie,
      permission: "view",
      approved: true,
      created_at: at(-43, 12),
    },
    // Pending on purpose: the senior portal needs an approval request to show.
    {
      senior_id: ids.robert,
      family_id: ids.sophie,
      permission: "view",
      approved: false,
      created_at: at(-2, 9),
    },
  ]);

  await upsert(
    "senior_preferences",
    [
      {
        user_id: ids.senior,
        text_size: "large",
        high_contrast: false,
        reduce_motion: false,
        notify_before_visit: true,
        call_for_changes: true,
        family_can_see: true,
        family_can_edit: true,
        care_needs: ["companionship", "light-housekeeping", "meal-prep"],
        extras_monthly_budget_cents: 15000,
        timezone: "America/New_York",
      },
      {
        user_id: ids.eleanor,
        text_size: "large",
        high_contrast: true,
        reduce_motion: true,
        notify_before_visit: true,
        call_for_changes: true,
        family_can_see: true,
        family_can_edit: true,
        care_needs: ["personal-care", "meal-prep", "medication-reminders"],
        extras_monthly_budget_cents: 30000,
        timezone: "America/New_York",
      },
      {
        user_id: ids.robert,
        text_size: "normal",
        high_contrast: false,
        reduce_motion: false,
        notify_before_visit: true,
        call_for_changes: false,
        family_can_see: false,
        family_can_edit: false,
        care_needs: ["errands", "transportation"],
        extras_monthly_budget_cents: 8000,
        timezone: "America/New_York",
      },
    ],
    "user_id",
  );
  console.log("  4 family links, 3 senior preference sets");
}

async function seedThreads(ids) {
  const threads = [
    {
      a: ids.senior,
      b: ids.caregiver,
      messages: [
        [
          ids.caregiver,
          -9,
          18,
          "Hi Marta — you sounded a bit hoarse on Tuesday. Are you feeling alright for Thursday?",
        ],
        [
          ids.senior,
          -9,
          19,
          "A bit of a cold. I think I'd rather skip this week if that's alright.",
        ],
        [
          ids.caregiver,
          -9,
          19,
          "Of course. I've cancelled Thursday, no charge. Rest up and I'll see you the week after.",
        ],
        [ids.senior, -6, 11, "Feeling much better. Still on for tomorrow?"],
        [
          ids.caregiver,
          -6,
          12,
          "Yes, 2pm as usual. I'll bring the photo boxes down from the shelf while I'm there.",
        ],
        [ids.senior, -5, 17, "Thank you for today. The walk did me good."],
      ],
    },
    {
      a: ids.family,
      b: ids.caregiver,
      messages: [
        [
          ids.family,
          -8,
          20,
          "Hi Andrea — Dana here, Marta's daughter. Thanks for cancelling last week without a fuss.",
        ],
        [
          ids.caregiver,
          -8,
          20,
          "Not at all. She's back to herself. One thing worth mentioning: the stairs seem harder than they were.",
        ],
        [ids.family, -7, 8, "That's useful to know. I'll look into a second handrail."],
      ],
    },
    {
      a: ids.eleanor,
      b: ids.priya,
      messages: [
        [
          ids.priya,
          -6,
          12,
          "Morning went a little slower today — nothing worrying, just more tired than usual. Mentioned it to James.",
        ],
        [ids.eleanor, -6, 16, "It was a slow morning. I slept badly, that's all."],
        [
          ids.priya,
          -1,
          9,
          "See you tomorrow at 8. I'll bring the shower chair cushion I mentioned.",
        ],
      ],
    },
    {
      a: ids.robert,
      b: ids.marcus,
      messages: [
        [
          ids.marcus,
          -7,
          12,
          "They were out of your usual bread — I got the seeded one instead. Receipt's on the counter.",
        ],
        [ids.robert, -7, 14, "That's fine. Thanks for checking."],
      ],
    },
  ];

  let messageCount = 0;
  for (const t of threads) {
    const last = t.messages[t.messages.length - 1];
    // conversations has CHECK (participant_a < participant_b) so a thread can
    // only exist once; the pair has to be sorted, not taken in narrative order.
    const [a, b] = [t.a, t.b].sort();
    const [conv] = await insert("conversations", [
      {
        participant_a: a,
        participant_b: b,
        last_message_at: at(last[1], last[2]),
        last_message_preview: last[3].slice(0, 120),
        created_at: at(t.messages[0][1], t.messages[0][2]),
      },
    ]);
    await insert(
      "messages",
      t.messages.map(([sender, day, hour, body], i) => ({
        conversation_id: conv.id,
        sender_id: sender,
        body,
        created_at: at(day, hour, i * 3),
        // Everything but the final message has been read.
        read_at: i === t.messages.length - 1 ? null : at(day, hour + 1, i * 3),
      })),
    );
    messageCount += t.messages.length;
  }
  console.log(`  ${threads.length} conversations, ${messageCount} messages`);
}

async function seedSupportAndNotifications(ids) {
  await insert("support_tickets", [
    {
      requester_id: ids.family,
      assignee_id: null,
      portal: "family",
      status: "open",
      priority: "normal",
      category: "billing",
      subject: "Can I be billed instead of my mother?",
      body: "Mum's card is on the account but I'd rather the visits came to me. Is there a way to switch who pays without changing anything else?",
      created_at: at(-2, 14),
      last_activity_at: at(-2, 14),
    },
    {
      requester_id: ids.caregiver,
      assignee_id: ids.admin,
      portal: "provider",
      status: "pending",
      priority: "high",
      category: "payouts",
      subject: "Payout for the 8th hasn't landed",
      body: "Two visits from last week show as posted in my ledger but the transfer isn't in my account yet. Account details haven't changed.",
      created_at: at(-4, 9),
      last_activity_at: at(-1, 11),
    },
    {
      requester_id: ids.eleanor,
      assignee_id: ids.admin,
      portal: "senior",
      status: "resolved",
      priority: "normal",
      category: "scheduling",
      subject: "Moving my Tuesday visit an hour later",
      body: "Tuesdays at eight are a little early for me now. Could we make it nine?",
      created_at: at(-11, 10),
      last_activity_at: at(-9, 15),
      resolved_at: at(-9, 15),
    },
    {
      requester_id: ids.robert,
      assignee_id: null,
      portal: "senior",
      status: "open",
      priority: "low",
      category: "account",
      subject: "Turning off text-message reminders",
      body: "I get the reminder twice, once by email and once by text. One is plenty.",
      created_at: at(-1, 16),
      last_activity_at: at(-1, 16),
    },
  ]);

  // Only the kinds nothing else produces. Inserting bookings, messages, and
  // verifications already fires trg_notify_booking_change,
  // trg_notify_new_message, and trg_notify_verification_change, so booking_request
  // and message notifications arrive on their own — adding them here would double
  // every one of them in the bell menu.
  const rows = await insert("notifications", [
    {
      user_id: ids.senior,
      kind: "visit_check_out",
      title: "Andrea finished today's visit",
      body: "Notes and a summary are on the visit.",
      link: "/senior/visits",
      created_at: at(-5, 16),
      read_at: at(-5, 17),
    },
    {
      user_id: ids.senior,
      kind: "booking_accepted",
      title: "Andrea confirmed Thursday at 2pm",
      body: "Companionship & check-ins, 2 hours.",
      link: "/senior/visits",
      created_at: at(-3, 10),
      read_at: null,
    },
    {
      user_id: ids.caregiver,
      kind: "payout_posted",
      title: "Weekly payout posted",
      body: "Covering four completed visits.",
      link: "/provider/earnings",
      created_at: at(-2, 6),
      read_at: at(-2, 8),
    },
    {
      user_id: ids.eleanor,
      kind: "visit_check_in",
      title: "Priya has arrived",
      body: "Checked in at 8:02am.",
      link: "/senior/visits",
      created_at: at(-6, 8),
      read_at: at(-6, 9),
    },
    {
      user_id: ids.james,
      kind: "system",
      title: "Eleanor's care summary is ready",
      body: "Four visits this month, all rated 4 or 5.",
      link: "/family/overview",
      created_at: at(-1, 7),
      read_at: null,
    },
    {
      user_id: ids.robert,
      kind: "booking_accepted",
      title: "Marcus confirmed next week's shop",
      body: "Errands & grocery runs, 2 hours.",
      link: "/senior/visits",
      created_at: at(-2, 12),
      read_at: null,
    },
  ]);
  console.log(
    `  4 support tickets, ${rows.length} notifications (plus the ones triggers generate)`,
  );
}

async function verifyLogins() {
  if (!ANON_KEY) {
    console.log("  skipped — no publishable key available to sign in with");
    return true;
  }
  let ok = 0;
  const failures = [];
  for (const spec of ALL) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { apikey: ANON_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ email: spec.email, password: PASSWORD }),
    });
    if (res.ok) ok += 1;
    else failures.push(`${spec.email}: ${res.status} ${(await res.text()).slice(0, 120)}`);
  }
  console.log(`  ${ok}/${ALL.length} logins succeeded`);
  for (const f of failures) console.log(`  FAILED  ${f}`);
  return failures.length === 0;
}

async function reportCounts(ids) {
  const list = `(${Object.values(ids).join(",")})`;
  // The select column is named per table because a few of these have no `id`
  // (senior_preferences is keyed on user_id), and PostgREST 400s on a missing one.
  const tables = [
    ["bookings", `or=(senior_id.in.${list},provider_id.in.${list})`, "id"],
    ["visits", `booking_id=not.is.null`, "id"],
    ["payment_ledger", `provider_id=in.${list}`, "id"],
    ["conversations", `or=(participant_a.in.${list},participant_b.in.${list})`, "id"],
    ["messages", `sender_id=in.${list}`, "id"],
    ["family_links", `senior_id=in.${list}`, "id"],
    ["senior_preferences", `user_id=in.${list}`, "user_id"],
    ["support_tickets", `requester_id=in.${list}`, "id"],
    ["notifications", `user_id=in.${list}`, "id"],
    ["verifications", `provider_id=in.${list}`, "id"],
    ["providers", `id=in.${list}`, "id"],
  ];
  const parts = [];
  for (const [table, filter, col] of tables) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}&select=${col}`, {
      headers: { ...HEADERS, Prefer: "count=exact", Range: "0-0" },
    });
    const range = res.headers.get("content-range") ?? "*/?";
    parts.push(`${table} ${range.split("/")[1]}`);
  }
  console.log(`  ${parts.join(", ")}`);
}

async function reset() {
  const users = await listAuthUsers();
  const seeded = users.filter((u) => u.email.toLowerCase().endsWith(`@${SEED_DOMAIN}`));
  if (seeded.length === 0) {
    console.log(`No accounts on ${SEED_DOMAIN} — nothing to remove.`);
    return;
  }
  console.log(`Deleting ${seeded.length} accounts on ${SEED_DOMAIN} (data cascades with them):`);
  for (const u of seeded) {
    await call(`/auth/v1/admin/users/${u.id}`, { method: "DELETE" });
    console.log(`  deleted  ${u.email}`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  console.log(`Supabase: ${SUPABASE_URL}\n`);

  if (args.includes("--reset")) {
    await reset();
    return;
  }

  if (args.includes("--verify")) {
    console.log("Verifying logins");
    const ok = await verifyLogins();
    process.exitCode = ok ? 0 : 1;
    return;
  }

  console.log("Accounts");
  const ids = await migrateAccounts();

  console.log("\nClearing previous seed data");
  await clearSeedData(ids);

  console.log("\nSeeding");
  await seedProviders(ids);
  await seedBookings(ids);
  await seedRelationships(ids);
  await seedThreads(ids);
  await seedSupportAndNotifications(ids);

  console.log("\nRow counts");
  await reportCounts(ids);

  console.log("\nVerifying logins");
  const ok = await verifyLogins();

  console.log(`\nPassword for every account: ${PASSWORD}`);
  process.exitCode = ok ? 0 : 1;
}

main().catch((err) => {
  console.error(`\n${err.message}`);
  process.exitCode = 1;
});
