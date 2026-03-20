# Innova Zenix Community App MVP

Lightweight local MVP for an Innova Zenix community app with a mobile-first member experience and a simple admin dashboard.

## Stack

This project uses plain HTML, CSS, JavaScript, and a small PowerShell TCP-based local web server. It stays dependency-free and is easy to run on a Windows machine with PowerShell.

## Features

- Username and password login for members
- Username and password login for admins
- Events list and event detail
- RSVP with Going / Maybe / Not Going
- Announcements list
- Vendor directory with WhatsApp links
- Admin dashboard for users management
- Admin CRUD for events
- Admin CRUD for announcements
- Admin CRUD for vendors
- Seeded sample data with one-click reset

## Project Structure

- `server.ps1`: local HTTP server and JSON API
- `start.ps1`: convenience launcher
- `data/seed.json`: seed data
- `data/db.json`: local working data store, created on first run
- `public/index.html`: member app
- `public/admin.html`: admin dashboard
- `public/admin-login.html`: admin login page
- `public/app.js`: member app logic
- `public/admin.js`: admin logic
- `public/admin-login.js`: admin login logic
- `public/styles.css`: shared styles

## Local Setup

Requirements:

- Windows PowerShell available in PATH

Open PowerShell in this folder:

```powershell
cd C:\Users\LENOVO\Documents\Codex
```

Reset the working data to the demo seed if needed:

```powershell
Copy-Item .\data\seed.json .\data\db.json -Force
```

Start the server:

```powershell
.\start.ps1
```

Open these URLs in a browser:

- Member app: `http://localhost:8080/`
- Admin dashboard: `http://localhost:8080/admin`

Stop the server with `Ctrl+C` in the PowerShell window running it.

## Demo Login

Member demo accounts:

- `raka / member123`
- `dina / member123`
- `bimo / member123`
- `nadya / member123`

Admin demo account:

- `admin / admin123`

The member landing page includes quick demo buttons for seeded member accounts.

## Notes

- Data is stored locally in `data/db.json`.
- Use the `Reset Seed Data` button in admin to restore the original sample content.
- This MVP intentionally excludes payment, chat, marketplace features, car profiles, and analytics.
