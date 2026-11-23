# WORK IN PROGRESS — Android native validation pending

This branch preserves the approved INZENITY work for review.

| Component | Source |
| --- | --- |
| Public Website V1 | The static site in website/ includes the homepage, support and policy pages, branding assets and font licenses. Serve that directory as its own website root. |
| Admin Dashboard V2 | public/admin-login.html, public/admin.html and public/admin-v2/ use the existing FastAPI backend. |
| Member V2 | public/ contains the browser member entry. member-www/ supplies the packaged Capacitor member entry with its disconnected staging configuration. |
| Backend | backend/main.py includes the two approved fixes for user password-field exclusion and single stock allocation during order processing. |

The source seed contains empty collections. Tests create disposable users and temporary databases. Keep operational data and local uploads outside the checkout used for publication.

## APK comparison

The comparison candidate has SHA-256 `60ea59783ec6daf9f79c4ecea237d0a7225fa7c28146f040b95874003088955f`. Its Capacitor config and 11 authored member web files matched commit `1af5e26`. Phase 4A updates the source after that comparison. Capacitor supplies the remaining two empty Cordova shims during Android sync. Both web entry points contain the Android 11 DOM fixes for login reset, merchant error display and member tool navigation. Native rebuild equivalence is still open.

## Source checks

Set INZENITY_REVIEW_CHECKOUT to the absolute repository path. Install verification/requirements.txt in an isolated Python environment. From the repository root run:

```sh
python -m pytest verification/test_integration.py verification/test_member.py
node verification/dom-regression.cjs member-www
node verification/test-config.cjs
```

Run the original backend suite separately from backend/ with the backend directory on PYTHONPATH. These suites use disposable databases.

## Outstanding Android validation

1. Build a fresh debug APK using Gradle 8.14.3, JDK 21, Node 24, the locked Capacitor dependencies and Android SDK 36. Record its SHA-256. The prior wrapper download failed before compilation.
2. On Android 11 with WebView 83, install that APK, cold launch to login, open and close registration, check disconnected sign-in feedback and relaunch. Capture the WebView version and logs for uncaught JavaScript errors.
3. Repeat the same checks with the same APK on a newer Android version. A prior Android 15 installation was recorded, but launch remained unverified.

Keep the staging API disconnected for this checkpoint. Phase 3 acceptance remains open.
