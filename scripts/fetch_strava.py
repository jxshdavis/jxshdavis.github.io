"""
Fetches all Strava activities and writes assets/data/strava-activities.json.
Runs via GitHub Actions using a stored refresh token.
"""

import json
import os
import sys
from datetime import datetime, timezone

import requests

CLIENT_ID     = os.environ["STRAVA_CLIENT_ID"]
CLIENT_SECRET = os.environ["STRAVA_CLIENT_SECRET"]
REFRESH_TOKEN = os.environ["STRAVA_REFRESH_TOKEN"]
OUT_PATH      = "assets/data/strava-activities.json"

# ── Refresh access token ───────────────────────────────────────────────────────

resp = requests.post("https://www.strava.com/oauth/token", data={
    "client_id":     CLIENT_ID,
    "client_secret": CLIENT_SECRET,
    "refresh_token": REFRESH_TOKEN,
    "grant_type":    "refresh_token",
}, timeout=30)
resp.raise_for_status()
access_token = resp.json()["access_token"]
print("Access token refreshed.")

# ── Fetch all activities (paginated) ──────────────────────────────────────────

headers    = {"Authorization": f"Bearer {access_token}"}
activities = []
page       = 1

while True:
    r = requests.get(
        "https://www.strava.com/api/v3/athlete/activities",
        headers=headers,
        params={"per_page": 200, "page": page},
        timeout=30,
    )
    r.raise_for_status()
    batch = r.json()
    if not batch:
        break
    activities.extend(batch)
    print(f"  Page {page}: {len(batch)} activities")
    if len(batch) < 200:
        break
    page += 1

print(f"Total fetched: {len(activities)}")

# ── Extract relevant fields ───────────────────────────────────────────────────

def extract(a):
    out = {
        "id":               a["id"],
        "name":             a["name"],
        "sport_type":       a.get("sport_type") or a.get("type", "Unknown"),
        "start_date_local": a["start_date_local"],
        "distance":         a.get("distance", 0),
        "moving_time":      a.get("moving_time", 0),
        "elapsed_time":     a.get("elapsed_time", 0),
    }
    if a.get("average_heartrate"):
        out["average_heartrate"] = a["average_heartrate"]
    if a.get("max_heartrate"):
        out["max_heartrate"] = a["max_heartrate"]
    return out

output = {
    "last_updated": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    "activities":   [extract(a) for a in activities],
}

# ── Write output ──────────────────────────────────────────────────────────────

os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
with open(OUT_PATH, "w") as f:
    json.dump(output, f, indent=2)

print(f"Wrote {OUT_PATH} ({len(activities)} activities).")
