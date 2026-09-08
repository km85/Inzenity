# Inzenity Phase 2 Summary

Implemented **Phase 2: Registration, Events, Points & Leaderboard** on top of the existing Phase 1 codebase without rebuilding the application. Phase 1 features (profile, chapters, vehicle options, reminders, full i18n) remain intact.

---

## 1. Files Changed

### Backend
- `backend/main.py`
  - Added Phase 2 models: `Registration`, `PointTransaction`, `Reward`, `Redemption`, `CheckIn`, `AttendancePhoto`.
  - Added Phase 2 columns to existing models: `users.points_balance`, `events.points`, `events.qr_token`, `events.check_in_enabled`, `events.geo_*`, `merchandise.points`.
  - Added migrations for all new columns.
  - Added public registration, admin review/approval, event QR check-in, attendance photo upload, points transactions, rewards/redemptions, and leaderboard endpoints.

### Member App
- `public/index.html` – added registration form, Leaderboard drawer link, Leaderboard screen container.
- `public/app.js` – added registration flow, event check-in UI, points display, reward redemption, leaderboard screen, routing, and Phase 2 i18n keys.
- `public/styles.css` – added styles for registration, points/rewards, leaderboard, check-in section.
- `public/config.js` – updated `API_BASE_URL` to the current tunnel URL.

### Admin Portal
- `public/admin.html` – added QR display modal.
- `public/admin.js` – added tabs and CRUD for Registrations, Rewards, Point Transactions, Redemptions, Event check-ins, and a custom Leaderboard tab; added event QR action and custom approve/reject actions.

### Documentation
- `docs/Phase2_Summary.md` (this file)

### Backups (from earlier sessions)
- `backend/main.py.bak`
- `public/app.js.bak`
- `public/admin.js.bak`
- `public/styles.css.bak`
- `data/seed.json.bak`

---

## 2. Database Changes

### New Tables

| Table | Purpose |
|-------|---------|
| `registrations` | Pending member registrations waiting for admin review |
| `point_transactions` | Every point earned/deducted with source, description, timestamp |
| `rewards` | Redeemable rewards catalog (title, points, stock, active) |
| `redemptions` | Member redemption requests pending/admin approved |
| `check_ins` | Event attendance records (member, event, time, method, geo distance) |
| `attendance_photos` | Photo paths linked to a check-in |

### Modified Tables

| Table | New Columns |
|-------|-------------|
| `users` | `points_balance` (default 0) |
| `events` | `points`, `qr_token`, `check_in_enabled`, `check_in_start`, `check_in_end`, `geo_validation_enabled`, `geo_radius_meters`, `location_lat`, `location_lon` |
| `merchandise` | `points` (default 0) |

### Constraints
- `check_ins` has a unique constraint on `(event_id, user_id)` to prevent duplicate check-ins.

---

## 3. API Changes

### Public (no auth)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/register` | Submit a new member registration |
| GET | `/api/public/chapters` | List chapters for registration form |
| GET | `/api/public/vehicle-options` | List models, powertrains, years, t-shirt sizes |

### Member (requires member session)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/me/points` | Current balance + transaction history |
| GET | `/api/me/check-ins` | Member's event check-ins |
| GET | `/api/me/redemptions` | Member's redemption requests |
| POST | `/api/redemptions` | Request a reward redemption |
| POST | `/api/events/{id}/rsvp` | RSVP to an event |
| POST | `/api/events/{id}/check-in` | QR/geo check-in (awards event points) |
| POST | `/api/check-ins/{id}/photos` | Upload up to 3 attendance photos |
| GET | `/api/leaderboard` | Leaderboard for monthly/quarterly/yearly periods |

### Admin (requires admin session)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/PUT/DELETE | `/api/registrations` / `/{id}` | Review, approve, reject, edit registrations |
| GET/POST | `/api/point-transactions` | Add/deduct points manually |
| GET/POST/PUT/DELETE | `/api/rewards` / `/{id}` | Manage reward catalog |
| GET/PUT/DELETE | `/api/redemptions` / `/{id}` | Approve/reject redemptions |
| GET | `/api/events/{id}/check-ins` | Attendance list for an event |

---

## 4. New User Flows

### A. New Member Self-Registration
1. On the login screen, tap **"Daftar sekarang / Register now"**.
2. Fill in personal data, vehicle data, STNK/payment proof uploads (optional), location pin (optional), username, and password.
3. Submit. The registration is stored with `status = pending`.
4. Admin opens **Admin → Registrations** tab, reviews details, and clicks **Approve** or **Reject**.
5. On approval, a member user and vehicle record are created automatically. The new member can log in immediately.

### B. Event QR Check-In
1. Admin creates/edits an event and enables **Check-In** + sets event **Points**.
2. Admin opens the event in the admin portal and clicks **Show QR** to display the event QR.
3. Member RSVPs as **Going**.
4. At the event, member opens **Events → event detail → Check In**, enters the QR token, and submits.
5. System records attendance and awards points in a single transaction.
6. Member can optionally upload 2–3 attendance photos.

### C. Points & Redemption
1. Members earn points from events (or admin can add manual/bonus/merchandise/partner transactions).
2. Member opens **My Zenix → Points** to see balance and history.
3. Admin configures **Rewards** (title, description, points required, stock, active).
4. Member taps **Redeem** on a reward. A `pending` redemption is created.
5. Admin opens **Redemptions** tab and clicks **Approve**. Points are deducted and a redemption transaction is recorded.

### D. Leaderboard
1. Member opens **Leaderboard** from the side drawer.
2. Selects period (Monthly / Quarterly / Yearly) and date anchor.
3. Taps **Load**. Top 3 ranks are highlighted.

---

## 5. Test Scenarios Performed

| # | Scenario | Result |
|---|----------|--------|
| 1 | Admin login and create event with `points=100`, `checkInEnabled=true` | ✅ Event created with unique `qrToken` |
| 2 | Member RSVP "Going" to the event | ✅ RSVP recorded |
| 3 | Member check-in with correct QR token | ✅ Check-in recorded, 100 points awarded |
| 4 | Duplicate check-in attempt | ✅ Blocked with 409 error |
| 5 | Member views points balance and history | ✅ Balance 100, transaction source/description visible |
| 6 | Public registration submission | ✅ Registration pending |
| 7 | Admin approves registration | ✅ New user and vehicle created, member can login |
| 8 | Admin creates reward (50 points) | ✅ Reward listed |
| 9 | Member redeems reward | ✅ Pending redemption created |
| 10 | Admin approves redemption | ✅ 50 points deducted, transaction history updated |
| 11 | Leaderboard monthly query | ✅ Rank, member, chapter, points returned; rank #1 visible |

---

## 6. Known Limitations

- **QR generation uses an external QR API** (`api.qrserver.com`) for the admin display. If the device has no internet or the service is down, the QR image will not render, but the numeric token is shown and can be entered manually.
- **Geolocation validation is implemented server-side but not yet exposed in the member UI.** The QR flow is primary. Enabling `geoValidationEnabled` and using `method: "geo"` via API will work.
- **Location pin in registration** accepts free-text lat/lon; no map picker UI yet.
- **STNK and payment proof images** are saved as base64-decoded PNGs on disk; no retention/cleanup policy is configured yet.
- **Push notifications** for reminders or check-in are not implemented.
- **Merchandise/purchases points** are not automatically awarded; admin can manually create `source: merchandise` or `source: partner` transactions.
- **Cloudflare quick tunnels are temporary**; the URL changes when the tunnel process restarts. For a stable demo a named tunnel or domain is recommended.
- **Phase 3 is not started.**

---

## 7. Current Demo Links

> These links are from the currently running quick tunnel. They expire when the tunnel is restarted.

- **Member App:** https://adelaide-sustainability-trustee-compaq.trycloudflare.com/
- **Admin Login:** https://adelaide-sustainability-trustee-compaq.trycloudflare.com/admin-login.html
- **APK v11:** https://adelaide-sustainability-trustee-compaq.trycloudflare.com/Inzenity-v11.apk

### Demo Accounts
- Members: `raka / member123`, `dina / member123`, `bimo / member123`
- Admin: `admin / admin123`
