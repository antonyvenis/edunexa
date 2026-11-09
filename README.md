<p align="center">
  <img src="screenshots/banner.png" alt="EduNexa: Smart School & College Management System" width="100%">
</p>

<p align="center"><img src="branding/logo.png" alt="EduNexa logo" width="110"></p>

<h1 align="center">EduNexa</h1>
<p align="center"><b>Smart School &amp; College Management System</b><br><i>One Platform. Every Institution.</i></p>

<p align="center">
  <img alt="React" src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white">
  <img alt="Vite" src="https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white">
  <img alt="Django" src="https://img.shields.io/badge/Django-5-092E20?logo=django&logoColor=white">
  <img alt="DRF" src="https://img.shields.io/badge/Django%20REST-API-A30000">
  <img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white">
  <img alt="JWT" src="https://img.shields.io/badge/Auth-JWT%20%2B%20refresh-000000?logo=jsonwebtokens&logoColor=white">
  <img alt="Docker" src="https://img.shields.io/badge/Docker-compose-2496ED?logo=docker&logoColor=white">
  <img alt="Tests" src="https://img.shields.io/badge/API%20tests-33%20passing-brightgreen">
  <img alt="CI" src="https://github.com/antonyvenis/edunexa/actions/workflows/ci.yml/badge.svg">
</p>

<p align="center">
  <a href="https://https://edunexa-demo.vercel.app/tour"><b>Live demo and guided tour</b></a> ·
  <a href="https://YOUR-API.onrender.com/api/docs/"><b>API docs (Swagger)</b></a> ·
  <a href="#quick-start"><b>Run it locally</b></a>
</p>

> **For recruiters:** open the live demo and press **Start the guided tour**. It walks through eight screens in about two minutes. No sign-up is needed, and everything you click stays in your own browser.

---

## Contents
[Why EduNexa](#why-edunexa) · [Try it in 30 seconds](#try-it-in-30-seconds) · [Features](#features) · [Screenshots](#screenshots) · [Roles and permissions](#roles-and-permissions) · [How it works](#how-it-works) · [Tech stack](#tech-stack) · [Security](#security-highlights) · [Quick start](#quick-start) · [Configuration](#configuration) · [API](#api-overview) · [Tests](#tests) · [Deployment](#deployment) · [Project structure](#project-structure) · [Roadmap](#roadmap)

## Why EduNexa
Schools and colleges often run attendance, marks, fees, library and parent communication in separate tools. EduNexa puts them in **one role-aware web app**: admins run the institution, teachers mark attendance and grade work, students see only their own records, and parents follow their child's progress. Every permission is enforced **on the server**, not just hidden in the UI.

## Try it in 30 seconds
The public demo needs no backend. Pick a role on the login page:

| Role | What to try |
|---|---|
| **Admin** | Dashboard charts, at-risk students, approve registrations, create accounts, export Excel |
| **Teacher** | Mark attendance, grade assignments, publish marks, read-only students and courses |
| **Student** | Own results, fees and receipts, report card PDF, hall ticket, assignments, leave requests |
| **Parent** | Read-only view of one child, messages with teachers, leave requests for the child |

Demo logins (also used by the seed command): `admin / admin123` · `teacher / teacher123` · `student / student123` · `parent / parent123`. In the demo the registration OTP is **123456**.

## Features
**Academics:** attendance with automatic percentages · assignments with submission and grading · exam results and marks · timetable · exam schedule and **hall tickets**.
**Money:** fees with PDF receipts · pending-fee tracking · Excel export on every table.
**Campus life:** library with availability and late fines · hostel rooms with capacity checks · transport routes and bus passes · notices · leave requests with approval.
**People:** private parent-teacher messaging · in-app notifications with an unread badge · admin-managed accounts.
**Smart extras:** explainable **at-risk student score** with plain-language reasons and suggested actions (optional free AI suggestions through Gemini) · PDF report cards.
**Experience:** animated, fully responsive UI (phone to desktop) · dark mode · toasts · skeleton loaders · public recruiter tour.

## Screenshots
<p align="center"><img src="screenshots/04-dashboard-light.png" alt="Admin dashboard" width="92%"></p>

<table>
<tr>
<td width="50%"><img src="screenshots/05-dashboard-dark.png" alt="Dark mode"><br><sub><b>Dark mode.</b> Theme follows the system and is remembered.</sub></td>
<td width="50%"><img src="screenshots/06-students-risk.png" alt="Students with risk badges"><br><sub><b>Students.</b> Search, filters, risk badges, report cards, Excel export.</sub></td>
</tr>
<tr>
<td><img src="screenshots/07-risk-explained.png" alt="Risk explained"><br><sub><b>Explainable risk score.</b> Attendance, marks, score trend and fees, with suggested actions.</sub></td>
<td><img src="screenshots/11-hall-tickets.png" alt="Hall ticket eligibility"><br><sub><b>Hall tickets.</b> Blocked until fees are clear and attendance is at least 75%.</sub></td>
</tr>
<tr>
<td><img src="screenshots/09-grading.png" alt="Grading"><br><sub><b>Grading.</b> Teachers grade; students can never grade themselves.</sub></td>
<td><img src="screenshots/16-messages.png" alt="Parent teacher messages"><br><sub><b>Parent-teacher chat.</b> Private, and parents and students cannot message each other.</sub></td>
</tr>
<tr>
<td><img src="screenshots/10-fees.png" alt="Fees"><br><sub><b>Fees.</b> Paid fees give a PDF receipt.</sub></td>
<td><img src="screenshots/12-library.png" alt="Library"><br><sub><b>Library.</b> Live availability, issue, return and automatic fines.</sub></td>
</tr>
<tr>
<td><img src="screenshots/13-timetable.png" alt="Timetable"><br><sub><b>Timetable.</b> Weekly schedule per course.</sub></td>
<td><img src="screenshots/14-transport.png" alt="Transport"><br><sub><b>Transport.</b> Routes, stops, driver contact, bus passes.</sub></td>
</tr>
<tr>
<td><img src="screenshots/15-hostel.png" alt="Hostel"><br><sub><b>Hostel.</b> Occupancy bars, allocate and vacate, full rooms are rejected.</sub></td>
<td><img src="screenshots/08-attendance.png" alt="Attendance"><br><sub><b>Attendance.</b> Daily marking updates every student percentage.</sub></td>
</tr>
</table>

**Sign-up and recruiter tour**

<table>
<tr>
<td width="33%"><img src="screenshots/02-register-roles.png" alt="Register"><br><sub><b>Register.</b> Role cards, mobile number, roll-number check, password meter.</sub></td>
<td width="33%"><img src="screenshots/03-email-otp.png" alt="Email OTP"><br><sub><b>Email OTP.</b> 6 digit code, resend timer, attempt limit.</sub></td>
<td width="33%"><img src="screenshots/26-admin-approves-registration.png" alt="Admin approval"><br><sub><b>Admin approval.</b> Verified requests wait for an admin.</sub></td>
</tr>
<tr>
<td><img src="screenshots/17-recruiter-tour.png" alt="Recruiter page"><br><sub><b>Recruiter page.</b> Features, stack and one-click roles.</sub></td>
<td><img src="screenshots/18-guided-tour.png" alt="Guided tour"><br><sub><b>Guided tour.</b> Eight steps through the product.</sub></td>
<td><img src="screenshots/25-swagger-api-docs.png" alt="Swagger"><br><sub><b>Swagger / OpenAPI.</b> Every endpoint documented.</sub></td>
</tr>
</table>

**Mobile**

<p align="center">
  <img src="screenshots/20-mobile-dashboard.png" alt="Mobile dashboard" width="21%">
  <img src="screenshots/21-mobile-dashboard-dark.png" alt="Mobile dark" width="21%">
  <img src="screenshots/22-mobile-students.png" alt="Mobile students" width="21%">
  <img src="screenshots/23-mobile-chat.png" alt="Mobile chat" width="21%">
</p>

**Generated PDFs** (ReportLab on the server, jsPDF in the browser demo)

<p align="center">
  <img src="screenshots/pdf-report-card.png" alt="Report card" width="30%">
  <img src="screenshots/pdf-fee-receipt.png" alt="Fee receipt" width="30%">
  <img src="screenshots/pdf-hall-ticket.png" alt="Hall ticket" width="30%">
</p>

## Roles and permissions
| Area | Admin | Teacher | Student | Parent |
|---|:---:|:---:|:---:|:---:|
| Dashboard and analytics | full | full | personal | child |
| Students, courses, teachers | manage | view | own profile | child |
| Attendance | mark | mark | n/a | n/a |
| Assignments | manage | create and grade | submit own work | view |
| Exam results and marks | manage | manage | own | child |
| Fees and receipts | manage | n/a | own | child |
| Library, hostel, transport | manage | view | own loans, room, bus | child |
| Hall tickets | any student | view schedule | own | child |
| Leave requests | decide | decide | request | request for child |
| Messages | staff, students and parents | staff, students and parents | staff only | staff only |
| User accounts and approvals | yes | no | no | no |

Students and parents are linked to a student record, so every query is filtered to that student on the server.

## How it works
```mermaid
flowchart LR
  B["Browser<br/>React + Vite + Framer Motion"] -- "JWT (access + refresh)" --> A["Django REST API"]
  A --> D[("PostgreSQL")]
  A -- "HTTP email API" --> M["Transactional email"]
  A --> P["PDF engine<br/>ReportLab"]
  U["UptimeRobot"] -- "GET /api/health/" --> A
  S["Swagger UI<br/>/api/docs/"] -.-> A
```

**Registration and approval**
```mermaid
sequenceDiagram
  participant V as Visitor
  participant API as Django API
  participant Mail as Email API
  participant Admin as Admin
  V->>API: Register (role, email, mobile, roll number)
  API->>Mail: 6 digit code (valid 10 minutes)
  V->>API: Verify code
  API-->>Admin: In-app notification: new registration
  API->>Mail: "We received your registration"
  Admin->>API: Approve
  API->>Mail: "Congratulations, your account is approved"
  V->>API: Sign in with email and password
```

## Tech stack
| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, React Router, Framer Motion, Recharts, Lucide icons, Axios, jsPDF, write-excel-file |
| Backend | Django 5, Django REST Framework, SimpleJWT (with token blacklist), drf-spectacular (OpenAPI), ReportLab, Whitenoise, Gunicorn |
| Database | PostgreSQL (SQLite fallback for local development) |
| DevOps | Docker and Docker Compose, GitHub Actions CI, UptimeRobot health checks |
| Email | Brevo HTTP API (works on hosts that block SMTP), console backend for development |
| Optional AI | Google Gemini free tier (Google AI Studio key), or any OpenAI-compatible provider such as Groq or OpenRouter, for teacher suggestions on at-risk students. A rule-based fallback is always available |

## Security highlights
- **JWT** access tokens (30 min) with **rotating, blacklisted refresh tokens** (7 days). The client refreshes silently and sign-out revokes the refresh token on the server.
- **Role-based access control on every endpoint.** Students and parents only ever receive their own child's records.
- **No self-assigned privileges.** Public sign-up creates an inactive account that needs an **email OTP** and then **admin approval**, so nobody can make themselves admin.
- OTP codes are stored as keyed hashes, expire after 10 minutes, allow 5 attempts, and resend only once a minute. Sign-up and OTP endpoints are **rate limited**.
- Password rules (length, common and numeric passwords), unique emails, mobile number validation.
- Server-side business rules: students cannot grade themselves, leave requests cannot approve themselves, full hostel rooms and unavailable books are rejected, hall tickets are blocked for unpaid fees or low attendance.
- The AI provider receives only anonymous numbers (no names or contact details) because free tiers may use prompts to improve the provider's products. The API key stays on the server.

## Quick start
### 1. Frontend only (demo mode, no backend)
```bash
cd frontend
npm install
npm run dev          # http://localhost:5173
```
Without `VITE_API_URL` the app runs as a browser-only demo with one-click role logins.

### 2. Full stack
```bash
cd backend
python -m venv .venv && source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py seed            # demo data and the four demo accounts
python manage.py runserver       # http://localhost:8000  (docs at /api/docs/)
```
Then create `frontend/.env` with `VITE_API_URL=http://localhost:8000/api` and restart `npm run dev`.
To test the email OTP locally run the backend with `EMAIL_VERIFICATION=1`: the code is printed in the server log.

### 3. Docker (PostgreSQL + API + web)
```bash
docker compose up --build
```
Web `http://localhost:3000` · API `http://localhost:8000/api` · Django admin `http://localhost:8000/admin`

## Configuration
**Backend** (environment variables)

| Variable | Purpose |
|---|---|
| `SECRET_KEY` | Required when `DEBUG=0` |
| `DEBUG` | `1` for development, `0` in production |
| `DATABASE_URL` | PostgreSQL URL, falls back to SQLite |
| `ALLOWED_HOSTS` | Comma separated hosts |
| `CORS_ALLOWED_ORIGINS` | Your frontend URL(s), comma separated |
| `FRONTEND_URL` | Used for the sign-in link in emails |
| `BREVO_API_KEY`, `EMAIL_FROM` | Turns on email OTP and sends mail through Brevo |
| `EMAIL_VERIFICATION` | Set `1` to force the OTP step without a provider (development) |
| `SEED_DEMO` | `1` loads demo data on start (Docker and Render), set `0` for real use |
| `GEMINI_API_KEY`, `GEMINI_MODEL` | Optional free AI suggestions (key from Google AI Studio, no card needed). `GEMINI_MODEL` takes a comma separated list that is tried in order |
| `AI_BASE_URL`, `AI_API_KEY`, `AI_MODEL`, `AI_NAME` | Optional alternative: any OpenAI-compatible provider (Groq, OpenRouter, Mistral ...) |

**Frontend** (`frontend/.env`)

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Backend URL ending with `/api`. Leave empty for demo mode |
| `VITE_SHOW_DEMO_LOGINS` | `true` keeps the demo role buttons visible in real mode |
| `VITE_DEMO_URL` | Public demo site, linked from the real app's tour page |
| `VITE_GITHUB_URL` | Repository link shown on the tour page |

## API overview
Interactive docs: **`/api/docs/`** (OpenAPI schema at `/api/schema/`).

| Group | Endpoints |
|---|---|
| Auth | `POST /api/token/` (email or username) · `/api/token/refresh/` · `/api/auth/register/` · `/api/auth/verify-email/` · `/api/auth/resend-otp/` · `/api/auth/logout/` · `/api/auth/change-password/` |
| Health | `GET /api/health/` (public, touches the database) |
| Students | `/api/students/` plus `report-card`, `hall-ticket`, `risk`, `advice`, `eligibility` |
| Academics | `courses` · `teachers` · `attendance` · `timetable` · `assignments` · `submissions` · `results` · `examschedule` |
| Money | `fees` (plus `receipt`) |
| Campus | `books` · `loans` · `hostelrooms` · `hostelstay` · `busroutes` · `buspasses` · `announcements` · `leaves` |
| People | `messages` (plus `contacts`, `mark-read`) · `notifications` (plus `read`, `read-all`) · `users` (plus `approve`, `reject`) |

## Tests
```bash
cd backend && python manage.py test --parallel 4
```
**34 automated API tests** cover role permissions and data isolation, JWT rotation and logout, registration with OTP, approval emails, lockout and expiry, leave and assignment rules, library fines, hostel capacity, hall ticket eligibility, messaging privacy, notifications, PDFs and the health endpoint. GitHub Actions runs them against PostgreSQL and builds the frontend on every push.

## Deployment
The full step-by-step guide with a troubleshooting table is in **[DEPLOYMENT.md](DEPLOYMENT.md)**. Short version, all on free tiers (check each provider's current limits):

1. **Database (Supabase):** Connect, **Session pooler** URI (port 5432), because Render cannot use the IPv6-only direct connection. URL-encode special characters in the password.
2. **Backend (Render web service):** root directory `backend`, build `pip install -r requirements.txt && python manage.py collectstatic --noinput`, start `sh entrypoint.sh`. Set `DATABASE_URL`, `SECRET_KEY`, `DEBUG=0`, `SEED_DEMO=1` for the first deploy only, `CORS_ALLOWED_ORIGINS`, `FRONTEND_URL`, `BREVO_API_KEY`, `EMAIL_FROM`.
3. **Email (Brevo):** create an API key and verify a sender address. Render free services block SMTP, which is why mail goes through an HTTP API.
4. **Frontend (Vercel):** root directory `frontend`, framework Vite, `VITE_API_URL=https://YOUR-API.onrender.com/api`, then redeploy.
5. **Keep it awake (UptimeRobot):** HTTP monitor on `https://YOUR-API.onrender.com/api/health/` every 5 minutes. The endpoint runs a real query and writes a heartbeat row at least every 6 hours, so a free Supabase project keeps seeing activity. `.github/workflows/keep-alive.yml` is an optional backup (set the `HEALTH_URL` repository variable).

**Two Vercel projects from one repo:** a **public demo** (no environment variables, safe for recruiters) and a **real app** (with `VITE_API_URL`). Put the real app's URL in `CORS_ALLOWED_ORIGINS` and set `VITE_DEMO_URL` on it.

**Go-live checklist**
1. Open `/admin/`, sign in as `admin / admin123` and set a strong password (or create your own admin and remove the demo users).
2. Set `SEED_DEMO=0`.
3. Create real accounts on the **Users** page, or let people register and approve them.
4. Confirm `CORS_ALLOWED_ORIGINS` and `VITE_API_URL` are correct.
5. Add the UptimeRobot monitor.

## Project structure
```
edunexa/
├── backend/
│   ├── config/            settings, urls, wsgi
│   ├── api/
│   │   ├── models.py      students, fees, library, hostel, transport, notifications, OTP ...
│   │   ├── views.py       role-aware viewsets, auth, registration, health
│   │   ├── serializers.py validation rules
│   │   ├── risk.py        explainable at-risk score
│   │   ├── advice.py      rule-based and free-AI (Gemini) suggestions
│   │   ├── otp.py         email OTP (hashed, expiring, limited)
│   │   ├── emailer.py     Brevo API or Django email backend
│   │   ├── reports.py     PDF report cards, receipts, hall tickets
│   │   ├── signals.py     notifications and attendance percentages
│   │   ├── tests.py       34 API tests
│   │   └── management/commands/seed.py
│   ├── Dockerfile · entrypoint.sh · requirements.txt
├── frontend/
│   ├── src/App.jsx        all pages and components
│   ├── src/api.js         API client, JWT refresh, offline demo engine
│   └── src/styles.css     theme tokens, responsive layout, animations
├── .github/workflows/     ci.yml, keep-alive.yml
├── docker-compose.yml
├── branding/              logo (original and transparent)
├── screenshots/ · samples/ (sample PDFs and Excel export)
└── RESUME.md              ready-to-use resume bullets
```

## Roadmap
- Online fee payments (Razorpay test mode)
- SMS or WhatsApp alerts for absences and fee dues
- Timetable clash detection and substitute teachers
- Multi-institution support (one deployment, many schools)
- Progressive web app with offline attendance

---
<p align="center">Built with React, Django and a lot of care. Feedback and ideas are welcome.</p>
