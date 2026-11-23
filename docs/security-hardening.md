# Phase 4A security migration

This checkpoint applies to the FastAPI service, its browser clients and the authored Capacitor client. The public website and branding assets retain their approved design. The APK from Phase 3 predates these changes.

## Before enabling network access

1. Use a new synthetic SQLite database for staging. For any legacy migration rehearsal, stop all old writers, take a restricted backup of SQLite (including its journal/WAL) and both upload stores, and test restoring the backup offline. Retire the old PowerShell JSON service. Do not import its JSON or expose it through a static server.
2. Set `INZENITY_DB_URL` to the intended SQLite file and `INZENITY_PRIVATE_DIR` to a persistent service-owned directory outside **every** web root. Give the service account exclusive access. Only route `website/` as the public club site. Forward private and API requests to FastAPI and disable proxy caching. Remove previous static aliases for both `/uploads/` and `/public/uploads/`.
3. Run the first startup offline with one worker. It moves legacy registration, attendance and payment files, retaining their record URLs. Name collisions or unusual filesystem entries stop startup for operator review. Rows without a document grant cannot serve an orphan file. Rehearse replacement, deletion and restart. Previous public copies, proxy caches and backups require separate removal or restricted retention.
4. The one-time migration hashes existing user and registration passwords, invalidates unusable credentials and revokes every old session. New and edited passwords use individually salted Argon2id (19 MiB, two iterations, one lane). The SQLite migration marker prevents double hashing. Bootstrap seed accounts accept offline-generated Argon2id hashes only. Rotate any password ever exposed in Git, old seeds, backups or logs. Hashing a known password does not invalidate it. Review SQLite free pages, WALs and snapshots under the backup retention policy. Never place these artifacts in Git.
5. Preserve `identity_floors`, `security_versions` and `payment_verifications` in backups. New account IDs advance past existing accounts and historical references. Historic ownership that had already become ambiguous before the upgrade must be reconciled offline before using legacy data.
6. Terminate HTTPS at a trusted proxy or at Uvicorn. If using a proxy, bind the backend to a private interface and trust forwarded scheme headers only from that proxy. Set `INZENITY_CORS_ORIGINS` to an explicit comma-separated list of approved HTTPS origins; leave it empty for same-origin web use. Browser sessions use Secure, HttpOnly, SameSite=Lax cookies and expire after eight hours. Native clients explicitly request a token, held in session storage. Restrict staging access and rate-limit login and anonymous registration at the ingress. Account for the 17 MiB JSON request cap and 4 MiB decoded image limit.
7. On a fresh staging database, create only disposable users. Exercise admin, member and seller login, rejected origins, private documents, checkout, payment review, refund and re-registration through the actual TLS proxy. Never configure an origin or real credentials in the disconnected APK.

## Order processing

| Action | Result |
| --- | --- |
| Member places an order | Validates whole quantities and spends available points in the same transaction as the order |
| Member submits a raster receipt | Records `payment_submitted` and leaves earned points at zero |
| Admin or the assigned seller confirms funds in the bank | Enters the unique settlement reference and marks the order `paid`; the ledger records the award once |
| Staff moves a paid order to `processing` | Allocates the entire quantity or rejects the transition. Variant-free preorders require an inventory variant belonging to that product |
| Staff ships and completes an order | Advances only from the immediately preceding state |
| Member or staff cancels before verification | Returns spent points once |
| Staff refunds a paid or processing order | Restores spent points, reverses earned points and returns allocated, unshipped stock in one transaction. An unavailable points balance requires reconciliation |

Settlement verification is manual. Staff must match the beneficiary, amount and reference to the bank record. A receipt image alone is insufficient. Legacy paid, processing or shipped orders lack the new verification record. Reconcile their bank records, ledger entries and inventory offline before advancing them. Retain audit history and never fabricate settlement references. Shipped returns need a separate operational review.

## Verification

Use a disposable Python environment, Node, OpenSSL and Chromium or Google Chrome. From the repo root:

```sh
python -m pip install -r verification/requirements.txt
export INZENITY_REVIEW_CHECKOUT="$PWD"
export PYTHONPATH="$PWD/backend:$PWD/verification"
python -m pytest -q backend/tests verification
node verification/dom-regression.cjs member-www
node verification/test-config.cjs
```

The browser suite uses a temporary TLS certificate and a loopback-only server. Rendering tests exercise the shipped templates with literal markup and quotation marks. The SQLite concurrency tests use separate HTTP requests and a shared file-backed database. The synthetic tests do not exercise external banking, a deployed proxy, Android WebView or a real device.

Android acceptance still requires a fresh Gradle 8.14.3 debug build, Android 11 with WebView 83, and a newer Android runtime. See the [development checkpoint](development-checkpoint.md).
