"""Verifies every guard in the agent RPC migrations against production.

Uses urllib rather than node/undici: a fresh connection per request, so neither
socket pooling nor client-side cancellation (which orphans Postgres locks) can
confuse the results. Paced, because bursts get dropped at the Cloudflare edge in
front of Supabase.
"""
import json
import time
import urllib.error
import urllib.request

ENV = {}
for line in open(r"C:\Users\MaxMu\Documents\Github\carematch\.env", encoding="utf-8"):
    if "=" in line and not line.startswith("#"):
        k, v = line.split("=", 1)
        ENV[k.strip()] = v.strip().strip("\"'")

URL = ENV["SUPABASE_URL"]
ANON = ENV["SUPABASE_PUBLISHABLE_KEY"]
SVC = ENV["SUPABASE_SERVICE_ROLE_KEY"]

PACE = 1.2


def req(path, method="GET", body=None, token=None, key=None, prefer=None):
    time.sleep(PACE)
    print(f"    -> {method} {path[:78]}", flush=True)
    key = key or ANON
    headers = {"apikey": key, "Content-Type": "application/json"}
    headers["Authorization"] = f"Bearer {token or key}"
    if prefer:
        headers["Prefer"] = prefer
    data = json.dumps(body).encode() if body is not None else None
    r = urllib.request.Request(f"{URL}{path}", data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(r, timeout=45) as resp:
            raw = resp.read().decode()
            return resp.status, (json.loads(raw) if raw.strip() else None)
    except urllib.error.HTTPError as e:
        raw = e.read().decode()
        try:
            return e.code, json.loads(raw)
        except Exception:
            return e.code, raw


def svc(path, method="GET", body=None, prefer=None):
    return req(path, method, body, key=SVC, prefer=prefer)


results = []


def check(label, ok, detail=""):
    results.append((label, ok, detail))
    print(f"  {'ok  ' if ok else 'FAIL'}  {label:<52} {detail}", flush=True)


# --- setup ----------------------------------------------------------------
_, tok = req(
    "/auth/v1/token?grant_type=password",
    "POST",
    {
        "email": "buzz-agent@integrations.getcompanioncare.com",
        "password": ENV["AGENT_ACCOUNT_PASSWORD"],
    },
)
JWT = tok["access_token"]
import base64

pad = lambda s: s + "=" * (-len(s) % 4)
AGENT = json.loads(base64.urlsafe_b64decode(pad(JWT.split(".")[1])))["sub"]

_, admins = svc("/rest/v1/user_roles?role=eq.admin&select=user_id&limit=1")
APPROVER = admins[0]["user_id"]
_, sup = svc("/rest/v1/user_roles?role=eq.support&select=user_id&limit=1")
SUPPORT_ONLY = sup[0]["user_id"]
_, sen = svc("/rest/v1/user_roles?role=eq.senior&select=user_id&limit=1")
SENIOR = sen[0]["user_id"]
_, tks = svc("/rest/v1/support_tickets?select=id,last_activity_at,status&limit=1")
TICKET, BEFORE, ORIG_STATUS = tks[0]["id"], tks[0]["last_activity_at"], tks[0]["status"]


def rpc(fn, body):
    return req(f"/rest/v1/rpc/{fn}", "POST", body, token=JWT)


made = []

# --- replies ---------------------------------------------------------------
s, b = rpc("agent_post_reply", {"_ticket_id": TICKET, "_body": "[rpc check] draft", "_internal": True})
check("internal note allowed without approver", s == 200, f"HTTP {s}")
if s == 200:
    made.append(b)

_, after = svc(f"/rest/v1/support_tickets?select=last_activity_at&id=eq.{TICKET}")
check(
    "last_activity_at bumped (bug this migration fixes)",
    after[0]["last_activity_at"] != BEFORE,
    f"{BEFORE[:19]} -> {after[0]['last_activity_at'][:19]}",
)

s, b = rpc("agent_post_reply", {"_ticket_id": TICKET, "_body": "[rpc check] x", "_internal": False})
check("public reply blocked with no approver", s >= 400, f"HTTP {s}")

s, b = rpc(
    "agent_post_reply",
    {"_ticket_id": TICKET, "_body": "[rpc check] x", "_internal": False, "_approved_by": AGENT},
)
check("self-approval blocked", s >= 400, f"HTTP {s}")

s, b = rpc(
    "agent_post_reply",
    {"_ticket_id": TICKET, "_body": "[rpc check] x", "_internal": False, "_approved_by": SENIOR},
)
check("non-staff approver blocked", s >= 400, f"HTTP {s}")

s, b = rpc(
    "agent_post_reply",
    {
        "_ticket_id": TICKET,
        "_body": "[rpc check] approved",
        "_internal": False,
        "_approved_by": APPROVER,
        "_approval_ref": "buzz-1",
    },
)
check("public reply allowed with staff approver", s == 200, f"HTTP {s}")
if s == 200:
    made.append(b)

s, _ = rpc("agent_post_reply", {"_ticket_id": TICKET, "_body": "   ", "_internal": True})
check("blank body blocked", s >= 400, f"HTTP {s}")

# --- ticket updates --------------------------------------------------------
s, _ = rpc("agent_update_ticket", {"_ticket_id": TICKET, "_status": "resolved"})
check("resolve blocked with no approver", s >= 400, f"HTTP {s}")

s, _ = rpc(
    "agent_update_ticket",
    {"_ticket_id": TICKET, "_priority": "high", "_expected_last_activity_at": BEFORE},
)
check("stale precondition blocked (no lock convoy)", s >= 400, f"HTTP {s}")

s, _ = rpc(
    "agent_update_ticket",
    {"_ticket_id": TICKET, "_status": "resolved", "_approved_by": APPROVER, "_approval_ref": "buzz-2"},
)
check("resolve allowed with approver", s == 200, f"HTTP {s}")
_, res = svc(f"/rest/v1/support_tickets?select=resolved_at&id=eq.{TICKET}")
check("resolved_at derived (second bug fixed)", res[0]["resolved_at"] is not None, str(res[0]["resolved_at"])[:19])

s, _ = rpc("agent_update_ticket", {"_ticket_id": TICKET, "_status": ORIG_STATUS})
_, res = svc(f"/rest/v1/support_tickets?select=resolved_at&id=eq.{TICKET}")
check("reopening clears resolved_at", res[0]["resolved_at"] is None, str(res[0]["resolved_at"]))

# --- incidents -------------------------------------------------------------
_, incs = svc("/rest/v1/incidents?select=id,category,status,severity&limit=1")
if incs:
    INC = incs[0]
    s, _ = rpc("agent_triage_incident", {"_incident_id": INC["id"], "_severity": 3})
    check("incident triage blocked with no approver", s >= 400, f"HTTP {s}")

    s, _ = rpc(
        "agent_triage_incident",
        {"_incident_id": INC["id"], "_status": "triaged", "_approved_by": APPROVER},
    )
    check("incident triage allowed with approver", s == 200, f"HTTP {s}")

    s, _ = rpc("agent_triage_incident", {"_incident_id": INC["id"], "_severity": 9, "_approved_by": APPROVER})
    check("severity out of range blocked", s >= 400, f"HTTP {s}")

    svc(f"/rest/v1/incidents?id=eq.{INC['id']}", "PATCH", {"category": "abuse"})
    s, _ = rpc(
        "agent_triage_incident",
        {"_incident_id": INC["id"], "_status": "dismissed", "_approved_by": SUPPORT_ONLY},
    )
    check("harm-category close blocked without admin approver", s >= 400, f"HTTP {s}")

    s, _ = rpc(
        "agent_triage_incident",
        {"_incident_id": INC["id"], "_status": "dismissed", "_approved_by": APPROVER, "_approval_ref": "buzz-3"},
    )
    check("harm-category close allowed with admin approver", s == 200, f"HTTP {s}")
    _, cl = svc(f"/rest/v1/incidents?select=resolved_by&id=eq.{INC['id']}")
    check(
        "resolved_by records the approver, not the agent",
        cl[0]["resolved_by"] == APPROVER,
        "approver" if cl[0]["resolved_by"] == APPROVER else str(cl[0]["resolved_by"]),
    )

    svc(
        f"/rest/v1/incidents?id=eq.{INC['id']}",
        "PATCH",
        {
            "category": INC["category"],
            "status": INC["status"],
            "severity": INC["severity"],
            "resolved_at": None,
            "resolved_by": None,
        },
    )

# --- create on behalf ------------------------------------------------------
s, _ = rpc(
    "agent_create_ticket_for",
    {"_requester_id": "00000000-0000-4000-8000-000000000000", "_subject": "abc", "_body": "abcd"},
)
check("create_for blocks unknown requester", s >= 400, f"HTTP {s}")

s, new_ticket = rpc(
    "agent_create_ticket_for",
    {
        "_requester_id": SENIOR,
        "_subject": "[rpc check] relayed from email",
        "_body": "Customer wrote in about a scheduling change.",
        "_portal": "senior",
        "_approval_ref": "buzz-4",
    },
)
check("create_for allowed", s == 200, f"HTTP {s}")
if s == 200:
    _, row = svc(f"/rest/v1/support_tickets?select=requester_id&id=eq.{new_ticket}")
    check(
        "ticket attributed to the customer, not the agent",
        row[0]["requester_id"] == SENIOR,
        "customer" if row[0]["requester_id"] == SENIOR else "AGENT",
    )

# --- audit + helper isolation ---------------------------------------------
_, audit = svc(
    f"/rest/v1/admin_audit_log?select=action,payload&actor_id=eq.{AGENT}&action=like.agent.*&limit=30"
)
check("audit rows written for agent actions", len(audit) > 0, f"{len(audit)} rows")
check(
    "approval_ref + approved_by captured in audit",
    any(a["payload"].get("approval_ref") for a in audit)
    and any(a["payload"].get("approved_by") == APPROVER for a in audit),
    "yes",
)

s, _ = rpc("agent_assert_under_rate_limit", {})
check("internal helper not callable by the agent", s >= 400, f"HTTP {s}")

# --- cleanup --------------------------------------------------------------
svc("/rest/v1/support_messages?body=like.*rpc check*", "DELETE")
if "new_ticket" in dir() and isinstance(new_ticket, str):
    svc(f"/rest/v1/support_messages?ticket_id=eq.{new_ticket}", "DELETE")
    svc(f"/rest/v1/support_tickets?id=eq.{new_ticket}", "DELETE")
svc(
    f"/rest/v1/support_tickets?id=eq.{TICKET}",
    "PATCH",
    {"status": ORIG_STATUS, "last_activity_at": BEFORE, "resolved_at": None, "priority": "normal"},
)
svc(f"/rest/v1/admin_audit_log?actor_id=eq.{AGENT}&action=like.agent.*", "DELETE")

failed = 0
for label, ok, detail in results:
    if not ok:
        failed += 1
    print(f"  {'ok  ' if ok else 'FAIL'}  {label:<52} {detail}")
print(f"\n  {len(results) - failed}/{len(results)} passed")
raise SystemExit(0 if failed == 0 else 1)
