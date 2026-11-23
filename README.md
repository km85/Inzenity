# INZENITY

The public club website lives in `website/`. FastAPI serves the member website, admin dashboard and seller portal from `public/`. Capacitor packages the member client from `member-www/`.

## Local development

Install Python 3.11 or later and the backend dependencies with `python -m pip install -r backend/requirements.txt`. On Windows, set `INZENITY_TLS_CERT` and `INZENITY_TLS_KEY` to files for your trusted local HTTPS certificate, then run `.\start.ps1`. The launcher uses FastAPI on loopback port 8080. Open `https://localhost:8080/` for members or `https://localhost:8080/admin-login.html` for administrators.

The checked-in seed is empty. Tests create disposable accounts in temporary databases. Keep operational SQLite files, certificates and uploads outside the checkout. The legacy PowerShell JSON database is retired.

[Security migration and verification](docs/security-hardening.md) · [Android validation checkpoint](docs/development-checkpoint.md)
