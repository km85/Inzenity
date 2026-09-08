# Inzenity Phase 1 — Core Member & Vehicle Experience

## Status
✅ Implemented and tested on local backend (`http://localhost:8001`).

### Live Demo URLs (via Cloudflare quick tunnel)
- **Member app:** https://hitting-cashiers-tomato-friday.trycloudflare.com/
- **Admin login:** https://hitting-cashiers-tomato-friday.trycloudflare.com/admin-login.html
- **Admin dashboard:** https://hitting-cashiers-tomato-friday.trycloudflare.com/admin.html
- **APK download:** https://hitting-cashiers-tomato-friday.trycloudflare.com/Inzenity-v10.apk

> **Note:** Buka `admin-login.html` dulu untuk login. Setelah login, otomatis redirect ke `admin.html`. Kalau langsung buka `admin.html` tanpa login admin, akan di-redirect ke halaman login.

Demo accounts:
- Member: `raka / member123`, `dina / member123`, `bimo / member123`
- Admin: `admin / admin123`

> ⚠️ These URLs are temporary quick tunnels with no uptime guarantee. They will expire when the `cloudflared` process stops.

---

## Files Changed

### Backend
| File | Change |
|------|--------|
| `backend/main.py` | Added Phase 1 models (Chapter, Vehicle, VehicleModel, VehiclePowertrain, VehicleYear), extended `User` with profile/i18n fields, added DB migration, reference-data seeding, new API endpoints, and updated reset endpoint. |

### Member App
| File | Change |
|------|--------|
| `public/app.js` | Refactored "My Zenix" into Person + Car sections, added chapter/vehicle-option selects, maintenance/STNK reminders, bilingual dictionary (ID/EN), profile load/save, error/empty states, and language selector. |
| `public/styles.css` | Added `.form-grid`, `.reminder-banner`, `.table-thumb`/`.preview-thumb`, select arrow, and responsive rules. |
| `public/config.js` | Updated to point to the new quick tunnel URL for this demo session. |

### Admin Portal
| File | Change |
|------|--------|
| `public/admin.js` | Added Chapter, Vehicle Model, Vehicle Year, and Powertrain tabs; user form extended with chapter assignment and new profile fields; generic form now supports `<input type="file">` (base64) for chapter logos. |

### Data / Seed
| File | Change |
|------|--------|
| `data/seed.json` | Not modified. Reference data (chapters, vehicle options) is auto-seeded on startup. |

### Backups Created
| File | Note |
|------|------|
| `backend/main.py.bak` | Pre-Phase 1 backend |
| `public/app.js.bak` | Pre-Phase 1 member app |
| `public/admin.js.bak` | Pre-Phase 1 admin portal |
| `public/styles.css.bak` | Pre-Phase 1 styles |
| `data/seed.json.bak` | Pre-Phase 1 seed data |

---

## Database Changes

### Existing `users` table — columns added (nullable, migration-safe)
- `email` (String)
- `address` (Text)
- `postal_code` (String)
- `social_media` (String)
- `tshirt_size` (String)
- `chapter_id` (Integer, FK → `chapters.id`)
- `language` (String, default `"id"`)
- `member_number` (String, auto-filled as `IZ-XXXX`)

### New tables
- `chapters` — id, name (unique), logo (path), created_at
- `vehicles` — one-to-one with user; stores nickname, plate, model, powertrain, year, color, STNK expiry, maintenance dates/KMs, reminder settings
- `vehicle_models` — code, label, sort_order
- `vehicle_powertrains` — code, label
- `vehicle_years` — year, sort_order

### Migration behavior
On startup the app runs `Base.metadata.create_all()` and then a lightweight migration that:
1. Adds the new columns to existing `users` if they are missing.
2. Fills empty `language` with `"id"` and empty `member_number` with `IZ-{id:04d}`.
3. Seeds default chapters and vehicle options if the tables are empty.

### Reset endpoint
`/api/reset` now also clears `vehicles`, `chapters`, `vehicle_models`, `vehicle_powertrains`, and `vehicle_years`, then reseeds everything.

---

## API Changes

### New endpoints
| Method | Endpoint | Access | Purpose |
|--------|----------|--------|---------|
| GET    | `/api/profile` | member | Full profile + vehicle + chapter + reminders |
| PUT    | `/api/profile` | member | Update Person + Vehicle in one call |
| PUT    | `/api/me/language` | member | Update language preference |
| GET    | `/api/chapters` | any | List chapters |
| POST   | `/api/chapters` | admin | Create chapter (accepts base64 logo) |
| GET    | `/api/chapters/{id}` | any | Chapter detail |
| PUT    | `/api/chapters/{id}` | admin | Update chapter / logo |
| DELETE | `/api/chapters/{id}` | admin | Delete chapter and unlink members |
| GET    | `/api/vehicle-options` | any | Lists models, powertrains, years, T-shirt sizes, reminder options |
| GET/POST/PUT/DELETE | `/api/vehicle-models` | admin | CRUD for vehicle models |
| GET/POST/PUT/DELETE | `/api/vehicle-years` | admin | CRUD for vehicle years |
| GET/POST/PUT/DELETE | `/api/vehicle-powertrains` | admin | CRUD for powertrains |

### Updated endpoints
| Endpoint | Change |
|----------|--------|
| `/api/auth/login` | Returns extended user object (email, chapter, language, member number, etc.) |
| `/api/auth/me` | Returns extended user object |
| `/api/users` | Returns extended fields + `chapter` name and `chapterId` |
| `/api/users/{id}` | Returns extended fields |
| POST/PUT `/api/users` | Accepts new profile fields + `chapterId` |
| `/api/reset` | Clears new tables and reseeds reference data |

---

## Features Completed

### 1. Member Profile (simplified to 2 sections)
**Person**
- Full name
- Member number (read-only, auto-generated)
- Email
- Phone / WhatsApp
- Address
- Postal code
- Social media
- T-shirt size
- Chapter (dropdown from centrally managed chapters)

**Car / My Vehicle**
- Car nickname
- Plate number
- Model (G/V/Q)
- Powertrain (Gasoline/Hybrid)
- Year (2023/2024/2025)
- Color
- STNK expiry date
- Last maintenance
- Next maintenance
- Service mileage interval (last/next KM)

### 2. Chapter Management (admin)
- Admin can create, edit, delete chapters
- Admin can upload chapter logo (saved to `public/uploads/chapters/{id}.png`)
- Admin can assign members to chapters via the Users tab
- Members can only select from managed chapters (no free-text)

### 3. Vehicle Options
- Stored in DB tables: `vehicle_models`, `vehicle_powertrains`, `vehicle_years`
- Admin can add/edit/delete options via new dashboard tabs
- Member app reads options from `/api/vehicle-options`

### 4. Maintenance Reminder
- Member sets last/next maintenance date and optional KM interval
- Reminder timing: 1 month / 2 weeks / 1 week before next maintenance
- Reminders shown on My Vehicle page
- Architecture ready for push notifications (currently computed on demand)

### 5. STNK Reminder
- STNK expiry date in My Vehicle
- Configurable reminder timing before expiry
- Reminders shown on My Vehicle page

### 6. Language Setting
- Initial languages: Bahasa Indonesia, English
- Stored per user in DB
- UI label dictionary in `app.js`; easy to add more languages
- Login/admin pages remain English (language switch happens inside the app)

---

## Manual Testing Steps

1. **Start the backend**
   ```bash
   cd /root/.openclaw/workspace/Inzenity/backend
   source venv/bin/activate
   uvicorn main:app --host 0.0.0.0 --port 8001
   ```

2. **Member login**
   - Open `http://localhost:8001/`
   - Login as `raka / member123`

3. **My Zenix profile**
   - Tap **My Zenix** in bottom nav
   - Fill Person section (email, address, chapter, T-shirt size, language)
   - Fill Car section (model, powertrain, year, plate, STNK expiry, maintenance dates/KM, reminders)
   - Save changes

4. **Verify persistence**
   - Refresh page and login again
   - Open My Zenix → previously saved data should load

5. **Reminders**
   - Set next maintenance date within the reminder window
   - A maintenance reminder banner should appear on My Zenix

6. **Language switch**
   - Change language in the Person form and save
   - Labels should switch between Bahasa Indonesia and English

7. **Admin portal**
   - Open `http://localhost:8001/admin.html`
   - Login as `admin / admin123`
   - Go to **Chapters** → Add a chapter with a logo
   - Go to **Users** → Edit a member → assign to a chapter, set T-shirt size/email
   - Go to **Vehicle Models/Years/Powertrains** → add a new option
   - Return to member app → new chapter/option should be selectable

8. **Reset data**
   - In admin, click **Reset Seed Data**
   - All demo data is restored; reference chapters/options are reseeded

---

## Known Limitations

1. **APK not rebuilt**  
   The web files are updated, but the Android APK (`Inzenity-v*.apk`) still contains the previous web bundle. Rebuild the APK with:
   ```bash
   cd /root/.openclaw/workspace/Inzenity
   npx cap sync android
   cd android && ./gradlew assembleDebug
   ```
   Also update `public/config.js` with the actual backend URL if it differs from the Cloudflare tunnel.

2. **Push notifications not wired**  
   Reminder computation is ready, but no push-notification provider (FCM, OneSignal, etc.) is integrated yet.

3. **Login/admin pages are English-only**  
   The language switch is inside the member app. Login and admin labels are not yet translated.

4. **Profile photos are local only**  
   Car photo and avatar are stored in `localStorage` per device, not synced to the server. This preserves existing behavior.

5. **No self-registration flow yet**  
   Phase 1 focuses on existing member profile. New member self-registration is Phase 2.

6. **iOS not tested**  
   Only the Android/Capacitor path is present in the workspace.

---

## Next Step
Phase 2 is not started. When you're ready, the next scope is: member self-registration, event QR check-in, points, redemptions, and leaderboard.
