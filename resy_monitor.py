#!/usr/bin/env python3
"""
Resy Reservation Monitor
━━━━━━━━━━━━━━━━━━━━━━━
Polls for open slots and auto-books the moment one appears.
Sends a confirmation email when a reservation is made.

Runs locally (infinite loop) or in GitHub Actions (MAX_RUNTIME env var
limits each job to ~55s so the 1-minute cron gives near-continuous coverage).

━━━━━━━━━━━━━━━━━━━━━━━
SETUP:
  pip install requests

EMAIL (one-time, ~2 minutes):
  1. Enable 2-Step Verification on your Google account
  2. Go to myaccount.google.com/apppasswords
  3. Create an App Password for "Mail"
  4. Set env var:  export GMAIL_APP_PASSWORD="xxxx xxxx xxxx xxxx"
  Or store it in GitHub Actions secrets (see .github/workflows/resy-sniper.yml)

AUTH TOKEN (refresh when you get 401 errors):
  a. Go to resy.com → DevTools → Network → filter "api.resy"
  b. Click any request → Headers → copy "x-resy-auth-token"
  c. Update RESY_AUTH_TOKEN below or set the env var

RUN:  python3 resy_monitor.py
━━━━━━━━━━━━━━━━━━━━━━━
"""

import os
import smtplib
import time
import json
import sys
import requests
from datetime import datetime
from email.message import EmailMessage

# ═══════════════════════════════════════════════════════════════════
#  CONFIGURATION  (env vars override hardcoded values)
# ═══════════════════════════════════════════════════════════════════

AUTH_TOKEN = os.environ.get(
    "RESY_AUTH_TOKEN",
    "eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NiJ9.eyJleHAiOjE3ODIwMDc3OTUsInVpZCI6MzE1NDg4NjMsImd0IjoiY29uc3VtZXIiLCJncyI6W10sImxhbmciOiJlbi11cyIsImV4dHJhIjp7Imd1ZXN0X2lkIjoxMTIwNjY5NTl9fQ.AXgy7oYjMI9ZJbGVRTLOS4KrQGRjTcoVZgp62s3LWuuFrfIql84JLYIlgfJnwQlSKZYpz5em1dQVtVD31CJfwps2ATh2MNQOR5KDFz4_8KqqgjzSRSQZA3cp857WeF8WkHvIJ0wK-0c8Wj0403ihqLKZIKuiZHDsSk8CmK1luEdg1UsB",
)

# ── Target restaurant ──────────────────────────────────────────────
VENUE_ID      = 73589             # Theodora, Fort Greene, Brooklyn
TARGET_DATE   = "2026-05-17"
PARTY_SIZE    = 2

# Book any slot whose start time falls within this window (24-hr)
WINDOW_START  = (19, 0)           # 7:00 PM
WINDOW_END    = (22, 0)           # 10:00 PM

# ── Behaviour ─────────────────────────────────────────────────────
POLL_INTERVAL = 30                # seconds between checks when running locally
DRY_RUN       = False

# When set (by GitHub Actions), the script exits after this many seconds
# so the next cron job can pick up cleanly.
MAX_RUNTIME   = int(os.environ.get("MAX_RUNTIME", "0"))   # 0 = no limit

# ── Email ─────────────────────────────────────────────────────────
NOTIFY_EMAIL       = "jacobschorr99@gmail.com"
GMAIL_USER         = os.environ.get("GMAIL_USER", "jacobschorr99@gmail.com")
GMAIL_APP_PASSWORD = os.environ.get("GMAIL_APP_PASSWORD", "")

# ═══════════════════════════════════════════════════════════════════

API_KEY = "VbWk7s3L4KiK5fzlO7JD3Q5EYolJI7n5"   # Resy public web key (updated May 2026)

BASE_HEADERS = {
    "Authorization":     f'ResyAPI api_key="{API_KEY}"',
    "x-resy-auth-token": AUTH_TOKEN,
    "User-Agent":        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    "Origin":            "https://resy.com",
    "Referer":           "https://resy.com/",
    "Accept":            "application/json, text/plain, */*",
    "Cache-Control":     "no-cache",
}
JSON_HEADERS = {**BASE_HEADERS, "Content-Type": "application/json"}
FORM_HEADERS = {**BASE_HEADERS, "Content-Type": "application/x-www-form-urlencoded"}


# ───────────────────────────────────────────────────────────────────
#  Step 0: validate config
# ───────────────────────────────────────────────────────────────────

def validate_config():
    if not AUTH_TOKEN or AUTH_TOKEN == "YOUR_RESY_AUTH_TOKEN_HERE":
        print("❌  AUTH_TOKEN is not set.")
        print("    See the instructions at the top of this file.")
        sys.exit(1)


# ───────────────────────────────────────────────────────────────────
#  Step 1: resolve venue ID
# ───────────────────────────────────────────────────────────────────

def resolve_venue_id():
    print(f"  Venue ID: {VENUE_ID}")
    return VENUE_ID


# ───────────────────────────────────────────────────────────────────
#  Step 2: get saved payment method
# ───────────────────────────────────────────────────────────────────

def get_payment_method():
    """Return (id, display_name). Falls back to (None, 'none') when the
    payment-methods endpoint is WAF-blocked (happens in non-browser contexts).
    Bookings succeed without it for no-deposit venues."""
    try:
        resp = requests.get(
            "https://api.resy.com/2/user/payment_methods",
            headers=BASE_HEADERS, timeout=15,
        )
        resp.raise_for_status()
        if "application/json" not in resp.headers.get("Content-Type", ""):
            raise ValueError("Non-JSON response from payment_methods endpoint")
        methods = resp.json().get("payment_methods", [])
        if not methods:
            print("⚠️  No saved payment methods found — booking without one.")
            return None, "none"
        m = methods[0]
        return m["id"], m.get("display", str(m["id"]))
    except Exception as exc:
        print(f"⚠️  Payment method fetch failed ({exc}) — booking without one.")
        return None, "none"


# ───────────────────────────────────────────────────────────────────
#  Step 3: find available slots
# ───────────────────────────────────────────────────────────────────

def find_slots(venue_id):
    """/4/find requires JSON body + time_filter since early 2026."""
    time_filter = f"{WINDOW_START[0]:02d}:{WINDOW_START[1]:02d}"
    payload = {
        "lat":         0,
        "long":        0,
        "day":         TARGET_DATE,
        "party_size":  PARTY_SIZE,
        "venue_id":    venue_id,
        "time_filter": time_filter,
    }
    resp = requests.post(
        "https://api.resy.com/4/find",
        json=payload, headers=JSON_HEADERS, timeout=15,
    )
    if not resp.ok:
        raise requests.HTTPError(
            f"{resp.status_code}: {resp.text[:400]}", response=resp
        )
    venues = resp.json().get("results", {}).get("venues", [])
    return venues[0].get("slots", []) if venues else []


# ───────────────────────────────────────────────────────────────────
#  Step 4: filter by time window
# ───────────────────────────────────────────────────────────────────

def in_window(slot):
    start_str = slot.get("date", {}).get("start", "")
    if not start_str:
        return False
    try:
        start     = datetime.strptime(start_str, "%Y-%m-%d %H:%M:%S")
        slot_min  = start.hour * 60 + start.minute
        open_min  = WINDOW_START[0] * 60 + WINDOW_START[1]
        close_min = WINDOW_END[0]   * 60 + WINDOW_END[1]
        return open_min <= slot_min <= close_min
    except ValueError:
        return False


# ───────────────────────────────────────────────────────────────────
#  Step 5: book the slot
# ───────────────────────────────────────────────────────────────────

def book_slot(config_token, payment_id):
    """Two-step: GET /3/details for a book_token, then POST /3/book."""
    detail = requests.get(
        "https://api.resy.com/3/details",
        params={"config_id": config_token, "day": TARGET_DATE, "party_size": PARTY_SIZE},
        headers=BASE_HEADERS, timeout=15,
    )
    detail.raise_for_status()
    book_token = detail.json().get("book_token", {}).get("value")
    if not book_token:
        raise RuntimeError(f"No book_token in details response: {detail.json()}")

    book_data = {
        "book_token": book_token,
        "source_id":  "resy.com-venue-details",
    }
    if payment_id is not None:
        book_data["struct_payment_method"] = json.dumps({"id": payment_id})

    booking = requests.post(
        "https://api.resy.com/3/book",
        data=book_data,
        headers=FORM_HEADERS, timeout=15,
    )
    booking.raise_for_status()
    return booking.json()


# ───────────────────────────────────────────────────────────────────
#  Step 6: send confirmation email
# ───────────────────────────────────────────────────────────────────

def send_booking_email(start_time, end_time, table_type, reservation_id):
    if not GMAIL_APP_PASSWORD:
        print("⚠️  GMAIL_APP_PASSWORD not set — skipping email.")
        print("    Set it via: export GMAIL_APP_PASSWORD='xxxx xxxx xxxx xxxx'")
        return

    subject = f"✅ Theodora booked! {TARGET_DATE} {start_time.split()[1][:5]}"
    body = (
        f"Your Resy reservation at Theodora was confirmed.\n\n"
        f"  Date:       {TARGET_DATE}\n"
        f"  Time:       {start_time} → {end_time}\n"
        f"  Table type: {table_type}\n"
        f"  Party size: {PARTY_SIZE}\n"
        f"  Resy ID:    {reservation_id}\n\n"
        f"Check your Resy app for full details.\n"
    )

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"]    = GMAIL_USER
    msg["To"]      = NOTIFY_EMAIL
    msg.set_content(body)

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=15) as smtp:
            smtp.login(GMAIL_USER, GMAIL_APP_PASSWORD)
            smtp.send_message(msg)
        print(f"  ✉️  Confirmation email sent to {NOTIFY_EMAIL}")
    except Exception as exc:
        print(f"  ⚠️  Email failed: {exc}")


# ───────────────────────────────────────────────────────────────────
#  Notifications (terminal + macOS banner)
# ───────────────────────────────────────────────────────────────────

def notify(title, message):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"  {message}")
    print(f"{'='*60}\n")
    for _ in range(3):
        sys.stdout.write('\a')
        sys.stdout.flush()
        time.sleep(0.2)
    try:
        from plyer import notification
        notification.notify(title=title, message=message, timeout=15)
    except Exception:
        pass


# ───────────────────────────────────────────────────────────────────
#  Main polling loop
# ───────────────────────────────────────────────────────────────────

def main():
    validate_config()

    w_start = f"{WINDOW_START[0]}:{WINDOW_START[1]:02d}"
    w_end   = f"{WINDOW_END[0]}:{WINDOW_END[1]:02d}"

    print("=" * 60)
    print("  Resy Reservation Monitor — Theodora")
    print(f"  Date:   {TARGET_DATE}  •  Party: {PARTY_SIZE}")
    print(f"  Window: {w_start} – {w_end}")
    print(f"  Poll:   every {POLL_INTERVAL}s")
    if MAX_RUNTIME:
        print(f"  Max runtime: {MAX_RUNTIME}s (GitHub Actions mode)")
    if DRY_RUN:
        print("  ⚠️  DRY RUN — will detect slots but NOT book")
    print(f"  Ctrl+C to stop")
    print("=" * 60 + "\n")

    venue_id = resolve_venue_id()

    if DRY_RUN:
        payment_id      = None
        payment_display = "N/A (dry run)"
    else:
        print("Fetching payment method...")
        payment_id, payment_display = get_payment_method()
        print(f"  ✓ Payment: {payment_display}\n")

    start_ts = time.time()
    attempt  = 0

    while True:
        # Respect MAX_RUNTIME so GitHub Actions jobs exit cleanly
        if MAX_RUNTIME and (time.time() - start_ts) >= MAX_RUNTIME:
            print(f"[{datetime.now():%H:%M:%S}] Max runtime reached — exiting for next cron job.")
            sys.exit(0)

        attempt += 1
        now = datetime.now().strftime("%H:%M:%S")

        try:
            all_slots  = find_slots(venue_id)
            good_slots = [s for s in all_slots if in_window(s)]

            if good_slots:
                slot         = good_slots[0]
                start_time   = slot["date"]["start"]
                end_time     = slot["date"].get("end", "")
                config_token = slot["config"]["token"]
                table_type   = slot["config"].get("type", "Table")

                notify("Slot found!", f"{table_type}  {start_time} → {end_time}")

                if DRY_RUN:
                    print("  DRY RUN — skipping /3/book call.")
                    print(f"  Would have booked: {start_time}")
                    sys.exit(0)

                notify("Booking now...", f"{start_time}")
                result  = book_slot(config_token, payment_id)
                res_id  = result.get("reservation_id") or result.get("resy_token") or "?"
                notify("Reservation confirmed!", f"ID: {res_id}  {start_time}")
                print(json.dumps(result, indent=2))

                send_booking_email(start_time, end_time, table_type, res_id)
                sys.exit(0)

            else:
                all_times = [s["date"]["start"].split(" ")[1][:5]
                             for s in all_slots] if all_slots else []
                other = f"  (other times: {', '.join(all_times)})" if all_times else ""
                print(f"[{now}] #{attempt:>4}  No slots in window.{other}")

        except requests.HTTPError as exc:
            status = exc.response.status_code
            if status in (401, 419):
                print(f"[{now}] ⚠️  {status} Unauthorized — auth token expired.")
                print("       Update RESY_AUTH_TOKEN (GitHub secret or hardcoded value).")
            else:
                print(f"[{now}] HTTP {status}: {exc.response.text[:300]}")

        except requests.ConnectionError:
            print(f"[{now}] Network error — retrying in {POLL_INTERVAL}s")

        except Exception as exc:
            print(f"[{now}] Error: {exc}")

        time.sleep(POLL_INTERVAL)


if __name__ == "__main__":
    main()
