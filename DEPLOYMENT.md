# EduNexa deployment guide (free tiers)

Order: GitHub, Supabase (database), Render (backend), Vercel (frontend), then the optional extras (uptime, email, AI). Allow about 45 minutes the first time. Provider screens change a little, so button names below may differ slightly.

## 0. Before you start
- A GitHub account and a Google account (for Supabase sign-in and the optional Gemini key).
- Keep a private text file to note down: Supabase URI, Render URL, Vercel URLs, your SECRET_KEY. Never put these in the code or in a screenshot.
- Make a SECRET_KEY: `python -c "import secrets; print(secrets.token_urlsafe(50))"`

## 1. GitHub
1. Create an empty repository named `edunexa` (public is fine, and needed for the optional keep-alive workflow).
2. In the project folder:
```
git init
git add .
git commit -m "EduNexa"
git branch -M main
git remote add origin https://github.com/<your-username>/edunexa.git
git push -u origin main
```
3. Open the Actions tab. The CI workflow should turn green.
4. Check that no `.env` file and no `db.sqlite3` were uploaded (the included `.gitignore` prevents this).

## 2. Supabase (PostgreSQL)
1. supabase.com, New project. Choose a database password with only letters and numbers (no `@ # / :`), so nothing needs URL-encoding. Pick the region closest to you.
2. When the project is ready, click **Connect**.
3. Choose **Session pooler** (port 5432) and copy the URI. It looks like `postgresql://postgres.<ref>:[YOUR-PASSWORD]@aws-0-<region>.pooler.supabase.com:5432/postgres`.
4. Replace `[YOUR-PASSWORD]` with your password. This is your `DATABASE_URL`.
Use the Session pooler because Render cannot reach the direct connection (IPv6 only). Do not use the transaction pooler (port 6543) for migrations.

## 3. Render (backend)
1. render.com, New, **Web Service**, connect your GitHub repo.
2. **Root Directory** `backend`, **Runtime** Python 3, **Instance type** Free.
3. **Build Command**: `pip install -r requirements.txt && python manage.py collectstatic --noinput`
4. **Start Command**: `sh entrypoint.sh`
5. Environment variables (minimum):

| Key | Value |
|---|---|
| `PYTHON_VERSION` | `3.12.7` |
| `DATABASE_URL` | the Supabase Session pooler URI |
| `SECRET_KEY` | the long random text from step 0 |
| `DEBUG` | `0` |
| `SEED_DEMO` | `1` (first deploy only) |
| `CORS_ALLOWED_ORIGINS` | add after step 4: your Vercel URL, no trailing slash |
| `FRONTEND_URL` | add after step 4: the same Vercel URL |

6. Create the service and wait for "Live". The start script runs the migrations and loads the demo data.
7. Test in the browser (use your service name):
   - `https://<name>.onrender.com/api/health/` shows `{"status":"ok", ...}`
   - `https://<name>.onrender.com/api/docs/` shows Swagger
8. Optional: in Render Settings set the **Health Check Path** to `/api/health/`.
On the free plan the first request after a sleep takes about a minute (UptimeRobot in step 6 prevents that).

## 4. Vercel (frontend)
Make two projects from the same repo.

**A. Public demo (for your resume)**
1. vercel.com, Add New, Project, import `edunexa`.
2. **Root Directory** `frontend`. Framework Vite is detected. Do NOT add `VITE_API_URL`.
3. Optional: add `VITE_GITHUB_URL` (your repo link).
4. Deploy. Open `<demo-url>/tour`. This is the link for recruiters.

**B. Real app (your own use)**
1. Add New, Project, the same repo again with a different project name.
2. **Root Directory** `frontend`.
3. Environment variables: `VITE_API_URL` = `https://<name>.onrender.com/api` (it must end with `/api`), optional `VITE_DEMO_URL` = the demo project's URL, optional `VITE_GITHUB_URL`.
4. Deploy. Remember: a changed environment variable only takes effect after a **Redeploy**.

Now go back to Render and set `CORS_ALLOWED_ORIGINS` and `FRONTEND_URL` to the real app's Vercel URL (for example `https://edunexa-app.vercel.app`, no `/` at the end). Render redeploys by itself.

## 5. First login and security (do this immediately)
1. Open the real app and sign in as `admin` / `admin123` (type it, the role buttons are hidden in real mode).
2. Click your name at the top right, **Change password**, and set a strong one.
3. On Render set `SEED_DEMO` to `0`.
4. Open **Users**: edit or delete the demo accounts (`teacher`, `student`, `parent`) or give them new passwords. Create your real accounts there.

## 6. Keep it awake (UptimeRobot)
1. uptimerobot.com, Add New Monitor, type HTTP(s), URL `https://<name>.onrender.com/api/health/`, interval 5 minutes.
2. The health endpoint also writes a heartbeat row every few hours so a free Supabase project keeps seeing activity.
3. Optional backup: in GitHub, Settings, Secrets and variables, Actions, Variables, add `HEALTH_URL` with the same URL, then run the "Keep backend awake" workflow once.

## 7. Email OTP and approval emails (optional, Brevo)
1. brevo.com, free account. SMTP & API, create an **API key**. Add your own email as a **Sender** and verify it from your inbox.
2. On Render add `BREVO_API_KEY` and `EMAIL_FROM` (the verified sender). Redeploy.
3. Registration now asks for a 6 digit email code, and approved users get a congratulations email. Without these keys the OTP step is skipped.
4. Test with a second email address of yours: register, read the code, approve it as admin, check the congratulations email. Look in spam too, because a free single sender can land there.

## 8. Free AI suggestions (optional, Gemini)
1. aistudio.google.com, Get API key.
2. On Render add `GEMINI_API_KEY`. Without it the app shows rule-based suggestions.
3. Test: Students, click a Risk badge, Get suggestion. It should say "Suggested by Gemini AI".

## 9. Final test list
- Demo site: `/tour` works, role buttons work, the OTP in demo mode is `123456`.
- Real site: login with email and password, a wrong password shows an error, the dashboard loads.
- Register a test account, verify it, approve it on Users, sign in with it.
- Download a report card PDF and a fee receipt.
- On your phone: the layout works and the bottom menu scrolls.
- In the GitHub README replace `YOUR-USERNAME`, `YOUR-DEMO`, `YOUR-API` with your real names.

## Troubleshooting
| What you see | Likely cause and fix |
|---|---|
| Login says wrong password but the password is right | `VITE_API_URL` points to the wrong place or has no `/api`. Fix it and redeploy Vercel |
| Browser console shows a CORS error | `CORS_ALLOWED_ORIGINS` on Render must be exactly the Vercel URL, no trailing slash |
| Role buttons visible on the real site | `VITE_API_URL` is not set on that Vercel project, or you did not redeploy |
| Render log: `Network is unreachable` or a database connection error | Use the Supabase Session pooler URI, not the direct connection |
| Render log: `Set a real SECRET_KEY when DEBUG=0` | Add the `SECRET_KEY` variable |
| Render build fails on `psycopg2` | Set `PYTHON_VERSION` to `3.12.7` |
| Everything is slow after some idle time | The free Render service sleeps. Add the UptimeRobot monitor |
| Registration says it could not send the email | Check `BREVO_API_KEY` and that `EMAIL_FROM` is a verified sender |
| 404 when refreshing a page on Vercel | Check that the Root Directory is `frontend` (the rewrite file is included) |
| Data disappears after a redeploy | `DATABASE_URL` is missing, so SQLite is being used. Set the Supabase URI |
