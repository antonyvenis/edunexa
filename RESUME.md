# Resume copy for EduNexa

**EduNexa – Smart School & College Management System** | React.js, Django REST Framework, PostgreSQL, Docker
- Built a full-stack institution platform with JWT authentication and role-based access control for Admin, Teacher, Student and Parent users, enforced server-side on every API endpoint.
- Developed modules for attendance, exam marks, fees, notices and an analytics dashboard (Recharts) with animated, fully responsive UI using Framer Motion.
- Generated downloadable PDF report cards with ReportLab, with per-student access restrictions.
- Containerised the app (Django, React/Nginx, PostgreSQL) with Docker Compose; wrote API tests covering authentication and role permissions.
- Documented the REST API with OpenAPI/Swagger (drf-spectacular) and set up a GitHub Actions CI pipeline running Django tests on PostgreSQL and the React build on every push.
- Implemented signal-driven attendance percentage calculation from daily records, keeping the field read-only in the API.
- Built fee receipt PDFs, Excel export, dark mode and toast notifications; designed a responsive, animated UI (Framer Motion, Recharts) with collapsible sidebar and mobile bottom navigation.
- Built an explainable at-risk student scoring engine (attendance, marks, score trend, fees) with staff-only API endpoints, a dashboard risk card, and optional free-tier AI (Gemini) suggestions with a rule-based fallback (anonymised inputs, key kept server-side).
- Added timetable, assignment submission and grading workflows and a read-only parent portal, with server-side rules preventing students from grading themselves or viewing other students' data.
- Implemented a library module (availability checks, automatic fines), rule-based exam hall ticket PDFs (fees and attendance eligibility) and signal-driven in-app notifications, each with per-user data isolation covered by tests.
- Built leave-approval workflow, a private parent-teacher messaging system and transport and hostel management modules (capacity checks, per-user data isolation), backed by 22 automated API tests.
- Built admin-managed user accounts (no public sign-up), password rules and self-service password change; verified the full stack end to end against a real backend with browser tests.
- Implemented email or username login and a self-service registration flow with role selection, mobile validation, roll-number verification, rate limiting and admin approval, so nobody can give themselves admin access.
- Secured the API with JWT access and rotating, blacklisted refresh tokens (silent refresh in the client), email OTP verification with expiry, attempt limits and resend cooldown, and transactional emails for approval, delivered through an HTTP email API; added a public recruiter preview page with a guided product tour.
- Deployed frontend on Vercel and backend on Render.

**Short pitch:** "EduNexa is a multi-role school and college management system. Admins manage students, fees and courses, teachers mark attendance and publish marks, and students see only their own results and download report cards."
