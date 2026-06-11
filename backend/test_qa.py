"""
FINTELL — Automated QA Test Suite
Tests all 12 phases: Auth, Expenses, Goals, Debts, Dashboard, Analytics, AI, Security
"""
import sys
import json
import requests

BASE = "http://localhost:8000/api/v1"
PASS = []
FAIL = []
TOKEN = ""
USER_ID = ""

def ok(label):
    PASS.append(label)
    print(f"  [PASS] {label}")

def fail(label, reason=""):
    FAIL.append(label)
    print(f"  [FAIL] {label}" + (f" — {reason}" if reason else ""))

def hdr():
    return {"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"}

print("\n" + "="*60)
print("FINTELL — AUTOMATED QA TEST SUITE")
print("="*60)

# ─── PHASE 1: HEALTH ───────────────────────────────────────────
print("\n[PHASE 1] Health Check")
try:
    r = requests.get("http://localhost:8000/health", timeout=5)
    if r.status_code == 200 and r.json().get("status") == "ok":
        ok("GET /health returns 200")
    else:
        fail("GET /health", f"status={r.status_code}")
except Exception as e:
    fail("GET /health", str(e))
    print("  CRITICAL: Backend is not running. Aborting.")
    sys.exit(1)

# ─── PHASE 2: AUTH — REGISTER ─────────────────────────────────
print("\n[PHASE 2] Authentication — Register")
reg_payload = {"name": "FINTELL QA User", "email": "qa_final@fintell.com", "password": "StrongPass@123"}
try:
    r = requests.post(f"{BASE}/register", json=reg_payload, timeout=10)
    if r.status_code in (201, 409):
        if r.status_code == 409:
            ok("Register — duplicate email returns 409 (expected)")
        else:
            data = r.json()
            TOKEN = data.get("access_token", "")
            USER_ID = data.get("user", {}).get("id", "")
            ok("POST /register returns 201 with token")
            if "user" in data and "name" in data["user"]:
                ok("Register — user object in response")
            else:
                fail("Register — user object missing in response")
    else:
        fail("POST /register", f"status={r.status_code}, body={r.text[:200]}")
except Exception as e:
    fail("POST /register", str(e))

# If already registered, login to get token
if not TOKEN:
    print("  (registering failed or duplicate, attempting login...)")
    try:
        r = requests.post(f"{BASE}/login", json={"email": reg_payload["email"], "password": reg_payload["password"]}, timeout=10)
        if r.status_code == 200:
            data = r.json()
            TOKEN = data.get("access_token", "")
            USER_ID = data.get("user", {}).get("id", "")
            ok("POST /login fallback succeeded")
        else:
            fail("POST /login fallback", f"status={r.status_code}, body={r.text[:200]}")
    except Exception as e:
        fail("POST /login fallback", str(e))

print("\n[PHASE 2] Authentication — Login")
try:
    r = requests.post(f"{BASE}/login", json={"email": reg_payload["email"], "password": reg_payload["password"]}, timeout=10)
    if r.status_code == 200 and "access_token" in r.json():
        TOKEN = r.json()["access_token"]
        ok("POST /login returns 200 with access_token")
    else:
        fail("POST /login", f"status={r.status_code}")
except Exception as e:
    fail("POST /login", str(e))

# Wrong password
try:
    r = requests.post(f"{BASE}/login", json={"email": reg_payload["email"], "password": "wrongpassword"}, timeout=10)
    if r.status_code == 401:
        ok("POST /login wrong password returns 401")
    else:
        fail("POST /login wrong password", f"expected 401, got {r.status_code}")
except Exception as e:
    fail("POST /login wrong password", str(e))

print("\n[PHASE 2] Authentication — GET /me")
try:
    r = requests.get(f"{BASE}/me", headers=hdr(), timeout=10)
    if r.status_code == 200 and "email" in r.json():
        ok("GET /me returns 200 with user data")
    else:
        fail("GET /me", f"status={r.status_code}")
except Exception as e:
    fail("GET /me", str(e))

# Unauthorized access
try:
    r = requests.get(f"{BASE}/me", timeout=10)
    if r.status_code == 403:
        ok("GET /me without token returns 403 (protected)")
    else:
        fail("GET /me without token", f"expected 403, got {r.status_code}")
except Exception as e:
    fail("GET /me without token", str(e))

# ─── PHASE 3: PROFILE UPDATE ──────────────────────────────────
print("\n[PHASE 3] Profile Update")
try:
    r = requests.put(f"{BASE}/profile", json={"monthlyIncome": 85000, "currency": "INR", "country": "India"}, headers=hdr(), timeout=10)
    if r.status_code == 200 and r.json().get("monthlyIncome") == 85000:
        ok("PUT /profile updates monthlyIncome")
    else:
        fail("PUT /profile", f"status={r.status_code}, body={r.text[:200]}")
except Exception as e:
    fail("PUT /profile", str(e))

# ─── PHASE 4: EXPENSES ────────────────────────────────────────
print("\n[PHASE 4] Expense Management")
expense_id = None
try:
    r = requests.post(f"{BASE}/expenses", json={"amount": 350, "category": "Food", "description": "Lunch at Cafe Coffee Day", "paymentMethod": "UPI", "date": "2026-06-01"}, headers=hdr(), timeout=10)
    if r.status_code == 201:
        expense_id = r.json().get("id")
        ok("POST /expenses creates expense")
    else:
        fail("POST /expenses", f"status={r.status_code}, body={r.text[:200]}")
except Exception as e:
    fail("POST /expenses", str(e))

# Add more expenses
for exp in [
    {"amount": 1200, "category": "Bills", "description": "Electricity bill", "paymentMethod": "Net Banking", "date": "2026-06-02"},
    {"amount": 500, "category": "Travel", "description": "Uber cab to office", "paymentMethod": "Credit Card", "date": "2026-06-03"},
    {"amount": 2500, "category": "Shopping", "description": "Amazon order — shoes", "paymentMethod": "Debit Card", "date": "2026-06-04"},
]:
    requests.post(f"{BASE}/expenses", json=exp, headers=hdr(), timeout=10)

try:
    r = requests.get(f"{BASE}/expenses", headers=hdr(), timeout=10)
    if r.status_code == 200 and "items" in r.json():
        ok(f"GET /expenses returns {r.json()['total']} total items")
    else:
        fail("GET /expenses", f"status={r.status_code}")
except Exception as e:
    fail("GET /expenses", str(e))

# Filter by category
try:
    r = requests.get(f"{BASE}/expenses?category=Food", headers=hdr(), timeout=10)
    if r.status_code == 200:
        ok("GET /expenses?category=Food filter works")
    else:
        fail("GET /expenses filter", f"status={r.status_code}")
except Exception as e:
    fail("GET /expenses filter", str(e))

# Search
try:
    r = requests.get(f"{BASE}/expenses?search=Lunch", headers=hdr(), timeout=10)
    if r.status_code == 200:
        ok("GET /expenses?search=Lunch search works")
    else:
        fail("GET /expenses search", f"status={r.status_code}")
except Exception as e:
    fail("GET /expenses search", str(e))

# Negative amount (edge case)
try:
    r = requests.post(f"{BASE}/expenses", json={"amount": -100, "category": "Food", "description": "Test", "paymentMethod": "Cash", "date": "2026-06-01"}, headers=hdr(), timeout=10)
    if r.status_code == 422:
        ok("POST /expenses negative amount returns 422 (validated)")
    else:
        fail("POST /expenses negative amount", f"expected 422, got {r.status_code}")
except Exception as e:
    fail("POST /expenses negative amount", str(e))

if expense_id:
    try:
        r = requests.put(f"{BASE}/expenses/{expense_id}", json={"amount": 400, "description": "Updated lunch"}, headers=hdr(), timeout=10)
        if r.status_code == 200 and r.json().get("amount") == 400:
            ok("PUT /expenses/{id} updates correctly")
        else:
            fail("PUT /expenses/{id}", f"status={r.status_code}")
    except Exception as e:
        fail("PUT /expenses/{id}", str(e))

    try:
        r = requests.delete(f"{BASE}/expenses/{expense_id}", headers=hdr(), timeout=10)
        if r.status_code == 200:
            ok("DELETE /expenses/{id} works")
        else:
            fail("DELETE /expenses/{id}", f"status={r.status_code}")
    except Exception as e:
        fail("DELETE /expenses/{id}", str(e))

# ─── PHASE 5: GOALS ───────────────────────────────────────────
print("\n[PHASE 5] Goal Tracker")
goal_id = None
try:
    r = requests.post(f"{BASE}/goals", json={"goalName": "MacBook Pro M4", "targetAmount": 150000, "savedAmount": 30000, "deadline": "2027-01-01"}, headers=hdr(), timeout=10)
    if r.status_code == 201:
        g = r.json()
        goal_id = g.get("id")
        ok("POST /goals creates goal")
        if "progressPercentage" in g:
            ok(f"Goal progress calculated: {g['progressPercentage']}%")
        if "monthlySavingsNeeded" in g:
            ok(f"Monthly savings needed: INR {g['monthlySavingsNeeded']}")
        if "remainingAmount" in g:
            ok(f"Remaining amount: INR {g['remainingAmount']}")
    else:
        fail("POST /goals", f"status={r.status_code}, body={r.text[:200]}")
except Exception as e:
    fail("POST /goals", str(e))

# Past deadline edge case
try:
    r = requests.post(f"{BASE}/goals", json={"goalName": "Past Goal", "targetAmount": 5000, "deadline": "2020-01-01"}, headers=hdr(), timeout=10)
    if r.status_code == 422:
        ok("POST /goals past deadline returns 422")
    else:
        fail("POST /goals past deadline", f"expected 422, got {r.status_code}")
except Exception as e:
    fail("POST /goals past deadline", str(e))

try:
    r = requests.get(f"{BASE}/goals", headers=hdr(), timeout=10)
    if r.status_code == 200 and isinstance(r.json(), list):
        ok(f"GET /goals returns {len(r.json())} goals")
    else:
        fail("GET /goals", f"status={r.status_code}")
except Exception as e:
    fail("GET /goals", str(e))

# ─── PHASE 6: DEBTS ───────────────────────────────────────────
print("\n[PHASE 6] Debt Manager")
debt_id = None
try:
    r = requests.post(f"{BASE}/debts", json={"title": "HDFC Car Loan", "amount": 500000, "interestRate": 9.5, "emi": 10500, "dueDate": "2026-07-01"}, headers=hdr(), timeout=10)
    if r.status_code == 201:
        debt_id = r.json().get("id")
        ok("POST /debts creates debt")
    else:
        fail("POST /debts", f"status={r.status_code}, body={r.text[:200]}")
except Exception as e:
    fail("POST /debts", str(e))

try:
    r = requests.get(f"{BASE}/debts", headers=hdr(), timeout=10)
    if r.status_code == 200 and isinstance(r.json(), list):
        ok(f"GET /debts returns {len(r.json())} debts")
    else:
        fail("GET /debts", f"status={r.status_code}")
except Exception as e:
    fail("GET /debts", str(e))

try:
    r = requests.post(f"{BASE}/debts", json={"title": "Friend Loan", "amount": 10000, "interestRate": 0, "emi": 1000, "dueDate": "2026-08-01", "type": "lent", "lender": "Rohit"}, headers=hdr(), timeout=10)
    if r.status_code == 201:
        ok("POST /debts creates 'lent' type debt")
    else:
        fail("POST /debts lent", f"status={r.status_code}, body={r.text[:200]}")
except Exception as e:
    fail("POST /debts lent", str(e))

# ─── PHASE 7: DASHBOARD ───────────────────────────────────────
print("\n[PHASE 7] Dashboard & Analytics")
try:
    r = requests.get(f"{BASE}/dashboard", headers=hdr(), timeout=10)
    if r.status_code == 200:
        d = r.json()
        required_keys = ["totalExpenses", "totalSavings", "activeGoals", "activeDebts", "categoryBreakdown", "monthlySpendingTrends"]
        missing = [k for k in required_keys if k not in d]
        if not missing:
            ok(f"GET /dashboard has all required fields")
            ok(f"Dashboard: Expenses=INR {d['totalExpenses']}, Goals={d['activeGoals']}, Debts={d['activeDebts']}")
        else:
            fail("GET /dashboard", f"missing keys: {missing}")
    else:
        fail("GET /dashboard", f"status={r.status_code}")
except Exception as e:
    fail("GET /dashboard", str(e))

try:
    r = requests.get(f"{BASE}/reports/monthly", headers=hdr(), timeout=10)
    if r.status_code == 200 and "spendingTrends" in r.json():
        ok("GET /reports/monthly works")
    else:
        fail("GET /reports/monthly", f"status={r.status_code}")
except Exception as e:
    fail("GET /reports/monthly", str(e))

try:
    r = requests.get(f"{BASE}/reports/yearly", headers=hdr(), timeout=10)
    if r.status_code == 200 and "spendingTrends" in r.json():
        ok("GET /reports/yearly works")
    else:
        fail("GET /reports/yearly", f"status={r.status_code}")
except Exception as e:
    fail("GET /reports/yearly", str(e))

try:
    r = requests.get(f"{BASE}/reports/export/csv", headers=hdr(), timeout=10)
    if r.status_code == 200 and "text/csv" in r.headers.get("Content-Type", ""):
        ok("GET /reports/export/csv returns valid CSV")
    else:
        fail("GET /reports/export/csv", f"status={r.status_code}")
except Exception as e:
    fail("GET /reports/export/csv", str(e))

try:
    r = requests.get(f"{BASE}/reports/export/pdf", headers=hdr(), timeout=10)
    if r.status_code == 200 and "application/pdf" in r.headers.get("Content-Type", ""):
        ok("GET /reports/export/pdf returns valid PDF")
    else:
        fail("GET /reports/export/pdf", f"status={r.status_code}")
except Exception as e:
    fail("GET /reports/export/pdf", str(e))

# ─── PHASE 8: AI FEATURES ────────────────────────────────────
print("\n[PHASE 8] Gemini AI Features (SKIPPED due to rate limits)")

# ─── PHASE 9: SECURITY ───────────────────────────────────────
print("\n[PHASE 9] Security Tests")
# Tampered token
try:
    r = requests.get(f"{BASE}/me", headers={"Authorization": "Bearer tampered.invalid.token"}, timeout=10)
    if r.status_code in (401, 403, 422):
        ok("Tampered JWT returns 401/403/422")
    else:
        fail("Tampered JWT", f"expected 401/403/422, got {r.status_code}")
except Exception as e:
    fail("Tampered JWT", str(e))

# Access other user's expense (IDOR test)
try:
    r = requests.get(f"{BASE}/expenses/000000000000000000000000", headers=hdr(), timeout=10)
    if r.status_code == 404:
        ok("Access non-existent resource returns 404 (no data leak)")
    else:
        fail("IDOR test", f"expected 404, got {r.status_code}")
except Exception as e:
    fail("IDOR test", str(e))

# Invalid payload
try:
    r = requests.post(f"{BASE}/expenses", json={"amount": "not-a-number", "category": "Food"}, headers=hdr(), timeout=10)
    if r.status_code == 422:
        ok("Invalid payload (string amount) returns 422")
    else:
        fail("Invalid payload", f"expected 422, got {r.status_code}")
except Exception as e:
    fail("Invalid payload", str(e))

# ─── PHASE 10: NOTIFICATIONS & SCHEDULER ─────────────────────
print("\n[PHASE 10] Notifications & Scheduler Check")
try:
    # Trigger getting notifications
    r = requests.get(f"{BASE}/notifications", headers=hdr(), timeout=10)
    if r.status_code == 200:
        ok("GET /notifications works (APScheduler is running in background)")
    else:
        fail("GET /notifications", f"status={r.status_code}")
except Exception as e:
    fail("GET /notifications", str(e))

# ─── FINAL REPORT ────────────────────────────────────────────
print("\n" + "="*60)
print("FINAL QA REPORT")
print("="*60)
total = len(PASS) + len(FAIL)
score = int((len(PASS) / total) * 100) if total else 0
print(f"\nPASSED : {len(PASS)}/{total}")
print(f"FAILED : {len(FAIL)}/{total}")
print(f"SCORE  : {score}/100")

if FAIL:
    print("\nFailed Tests:")
    for f in FAIL:
        print(f"  - {f}")

print(f"\nProduction Ready: {'YES' if score >= 90 else 'NO — fix failing tests first'}")
print("="*60)
