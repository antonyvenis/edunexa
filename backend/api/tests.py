import json
import os
import re
from django.core import mail
from django.test import override_settings
from django.contrib.auth.models import User
from rest_framework.test import APITestCase
from datetime import date, timedelta
from unittest.mock import patch
from api.models import Notification, HostelAllocation, HostelRoom, BusRoute, TransportPass, LeaveRequest, Announcement, Book, BookLoan, ExamSchedule, Assignment, TimetableEntry, Submission, AttendanceRecord, Course, Fee, Profile, Result, Student
from api.risk import compute_risk

class RoleTests(APITestCase):
    def setUp(self):
        c = Course.objects.create(name="Physics", code="P1")
        self.s1 = Student.objects.create(name="A", email="a@x.edu", roll_no="R1", course=c)
        Student.objects.create(name="B", email="b@x.edu", roll_no="R2", course=c)
        User.objects.create_superuser("admin", password="pw12345678")
        Profile.objects.create(user=User.objects.create_user("stu", password="pw12345678"), role="student", student=self.s1)
        Profile.objects.create(user=User.objects.create_user("tea", password="pw12345678"), role="teacher")
        Profile.objects.create(user=User.objects.create_user("par", password="pw12345678"), role="parent", student=self.s1)
    def login(self, u):
        d = self.client.post("/api/token/", {"username": u, "password": "pw12345678"}).data
        self.client.credentials(HTTP_AUTHORIZATION="Bearer " + d["access"]); return d
    def test_requires_auth(self):
        self.assertEqual(self.client.get("/api/students/").status_code, 401)
    def test_login_returns_role(self):
        self.assertEqual(self.login("tea")["role"], "teacher")
    def test_admin_crud(self):
        self.login("admin")
        self.assertEqual(self.client.get("/api/students/").data.__len__(), 2)
        self.assertEqual(self.client.post("/api/courses/", {"name": "M", "code": "M1", "credits": 3}).status_code, 201)
    def test_teacher_cannot_edit_courses(self):
        self.login("tea")
        self.assertEqual(self.client.post("/api/courses/", {"name": "M", "code": "M1", "credits": 3}).status_code, 403)
    def test_student_sees_only_self_and_gets_pdf(self):
        self.login("stu")
        self.assertEqual(len(self.client.get("/api/students/").data), 1)
        self.assertEqual(self.client.get("/api/students/2/report-card/").status_code, 404)
        r = self.client.get(f"/api/students/{self.s1.id}/report-card/")
        self.assertEqual(r.status_code, 200); self.assertTrue(r.content.startswith(b"%PDF"))

    def test_attendance_auto_calculated(self):
        for d, p in [(0, True), (1, True), (2, False)]:
            AttendanceRecord.objects.create(student=self.s1, date=date.today() - timedelta(days=d), present=p)
        self.s1.refresh_from_db()
        self.assertEqual(self.s1.attendance, 67)
    def test_attendance_is_read_only_via_api(self):
        self.login("admin")
        self.client.patch(f"/api/students/{self.s1.id}/", {"attendance": 5}, format="json")
        self.s1.refresh_from_db()
        self.assertNotEqual(self.s1.attendance, 5)
    def test_swagger_docs_available(self):
        self.assertEqual(self.client.get("/api/schema/").status_code, 200)
        self.assertEqual(self.client.get("/api/docs/").status_code, 200)

    def test_fee_receipt_only_for_paid_and_own(self):
        paid = Fee.objects.create(student=self.s1, amount=1000, due_date=date.today(), status="paid")
        pending = Fee.objects.create(student=self.s1, amount=500, due_date=date.today())
        other = Fee.objects.create(student=Student.objects.get(roll_no="R2"), amount=900, due_date=date.today(), status="paid")
        self.login("stu")
        r = self.client.get(f"/api/fees/{paid.id}/receipt/")
        self.assertEqual(r.status_code, 200); self.assertTrue(r.content.startswith(b"%PDF"))
        self.assertEqual(self.client.get(f"/api/fees/{pending.id}/receipt/").status_code, 400)
        self.assertEqual(self.client.get(f"/api/fees/{other.id}/receipt/").status_code, 404)

    def test_risk_scoring_high_and_low(self):
        bad = Student.objects.create(name="Bad", email="bad@x.edu", roll_no="R9", attendance=55, marks=52)
        Result.objects.create(student=bad, exam="Quiz", subject="M", score=68)
        Result.objects.create(student=bad, exam="Mid", subject="M", score=58)
        Fee.objects.create(student=bad, amount=1000, due_date=date.today())
        r = compute_risk(bad)
        self.assertEqual((r["level"], r["score"]), ("High", 35 + 22 + 10 + 15))
        self.assertEqual(r["factors"], ["attendance", "marks", "trend", "fees"])
        good = Student.objects.create(name="Good", email="g@x.edu", roll_no="R8", attendance=95, marks=80)
        self.assertEqual(compute_risk(good)["level"], "Low")
    def test_risk_endpoints_are_staff_only(self):
        self.login("stu")
        self.assertEqual(self.client.get("/api/students/risk/").status_code, 403)
        self.assertEqual(self.client.get(f"/api/students/{self.s1.id}/advice/").status_code, 403)
        self.login("tea")
        r = self.client.get("/api/students/risk/")
        self.assertEqual(r.status_code, 200); self.assertEqual(len(r.data), 2)
    def test_advice_falls_back_to_rules_without_key(self):
        self.login("tea")
        with patch("api.views.ai_suggestion", return_value=None):
            d = self.client.get(f"/api/students/{self.s1.id}/advice/").data
        self.assertEqual(d["source"], "rules"); self.assertTrue(d["suggestion"])
    def test_advice_uses_claude_when_available(self):
        self.login("tea")
        with patch("api.views.ai_suggestion", return_value=("Call the parents.", "gemini")):
            d = self.client.get(f"/api/students/{self.s1.id}/advice/").data
        self.assertEqual((d["source"], d["suggestion"]), ("gemini", "Call the parents."))

    def test_parent_is_read_only_and_sees_only_child(self):
        Fee.objects.create(student=self.s1, amount=500, due_date=date.today(), status="paid")
        Fee.objects.create(student=Student.objects.get(roll_no="R2"), amount=900, due_date=date.today())
        self.login("par")
        self.assertEqual(len(self.client.get("/api/students/").data), 1)
        self.assertEqual(len(self.client.get("/api/fees/").data), 1)
        self.assertEqual(self.client.post("/api/results/", {"student": self.s1.id, "exam": "x", "subject": "y", "score": 90}).status_code, 403)
        self.assertEqual(self.client.get(f"/api/students/{self.s1.id}/report-card/").status_code, 200)
        self.assertEqual(self.client.get("/api/students/risk/").status_code, 403)
    def test_timetable_scoped_to_course_and_admin_only_write(self):
        other = Course.objects.create(name="Maths", code="M1")
        TimetableEntry.objects.create(course=self.s1.course, day=0, start="09:00", end="10:00", subject="Physics")
        TimetableEntry.objects.create(course=other, day=0, start="09:00", end="10:00", subject="Maths")
        self.login("stu")
        self.assertEqual([e["subject"] for e in self.client.get("/api/timetable/").data], ["Physics"])
        self.assertEqual(self.client.post("/api/timetable/", {}).status_code, 403)
    def test_student_submits_but_cannot_grade(self):
        a = Assignment.objects.create(course=self.s1.course, title="HW", due_date=date.today())
        self.login("stu")
        r = self.client.post("/api/submissions/", {"assignment": a.id, "student": 2, "answer": "done", "grade": 99}, format="json")
        self.assertEqual(r.status_code, 201)
        sub_ = Submission.objects.get()
        self.assertEqual((sub_.student_id, sub_.grade), (self.s1.id, None))
        self.client.patch(f"/api/submissions/{sub_.id}/", {"grade": 100}, format="json")
        sub_.refresh_from_db(); self.assertIsNone(sub_.grade)
        self.login("tea")
        self.client.patch(f"/api/submissions/{sub_.id}/", {"grade": 91, "feedback": "Good"}, format="json")
        sub_.refresh_from_db(); self.assertEqual(sub_.grade, 91)

    def test_library_limits_copies_fines_and_privacy(self):
        book = Book.objects.create(title="Clean Code", author="RCM", copies=1)
        self.login("admin")
        ok = self.client.post("/api/loans/", {"book": book.id, "student": self.s1.id, "issued_on": str(date.today() - timedelta(days=17)), "due_on": str(date.today() - timedelta(days=3))})
        self.assertEqual(ok.status_code, 201); self.assertEqual(ok.data["fine"], 15)
        again = self.client.post("/api/loans/", {"book": book.id, "student": 2, "issued_on": str(date.today()), "due_on": str(date.today())})
        self.assertEqual(again.status_code, 400)
        self.login("stu")
        self.assertEqual(len(self.client.get("/api/loans/").data), 1)
        self.assertEqual(self.client.get("/api/books/").data[0]["available"], 0)
    def test_hall_ticket_rules(self):
        ExamSchedule.objects.create(course=self.s1.course, exam="Sem", subject="Physics", date=date.today(), start="10:00", end="13:00", hall="Hall A")
        self.login("stu")
        r = self.client.get(f"/api/students/{self.s1.id}/hall-ticket/")
        self.assertEqual(r.status_code, 200); self.assertTrue(r.content.startswith(b"%PDF"))
        Fee.objects.create(student=self.s1, amount=500, due_date=date.today())
        blocked = self.client.get(f"/api/students/{self.s1.id}/hall-ticket/")
        self.assertEqual(blocked.status_code, 400); self.assertIn("fees pending", blocked.data["detail"])
        self.assertEqual(self.client.get("/api/students/eligibility/").data[0]["eligible"], False)
        self.assertEqual(self.client.get("/api/students/2/hall-ticket/").status_code, 404)
    def test_notifications_are_private_and_markable(self):
        Announcement.objects.create(title="Holiday", body="Campus closed Friday", date=date.today())
        self.login("stu")
        self.assertEqual(len(self.client.get("/api/notifications/").data), 1)
        self.assertEqual(self.client.post("/api/notifications/read-all/").status_code, 200)
        self.assertTrue(all(n["read"] for n in self.client.get("/api/notifications/").data))
        self.login("tea")
        self.assertEqual(len(self.client.get("/api/notifications/").data), 1)
        self.assertFalse(self.client.get("/api/notifications/").data[0]["read"])

    def test_leave_workflow_and_permissions(self):
        self.login("par")
        r = self.client.post("/api/leaves/", {"student": 2, "from_date": str(date.today()), "to_date": str(date.today()), "reason": "Wedding", "status": "approved"}, format="json")
        self.assertEqual(r.status_code, 201)
        leave = LeaveRequest.objects.get()
        self.assertEqual((leave.student_id, leave.status), (self.s1.id, "pending"))
        self.login("tea")
        self.client.patch(f"/api/leaves/{leave.id}/", {"status": "approved", "note": "OK"}, format="json")
        leave.refresh_from_db(); self.assertEqual(leave.status, "approved")
        self.login("stu")
        self.assertEqual(self.client.patch(f"/api/leaves/{leave.id}/", {"reason": "changed"}, format="json").status_code, 403)
        self.assertTrue(any("Leave approved" in n["title"] for n in self.client.get("/api/notifications/").data))
    def test_messages_only_with_staff_and_private(self):
        stu, tea, par = User.objects.get(username="stu"), User.objects.get(username="tea"), User.objects.get(username="par")
        self.login("par")
        self.assertEqual(self.client.post("/api/messages/", {"recipient": tea.id, "body": "Hello"}).status_code, 201)
        self.assertEqual(self.client.post("/api/messages/", {"recipient": stu.id, "body": "No"}).status_code, 403)
        self.assertEqual([c["role"] for c in self.client.get("/api/messages/contacts/").data].count("parent"), 0)
        self.login("admin")
        self.assertEqual(len(self.client.get("/api/messages/").data), 0)
        self.login("tea")
        self.assertEqual(len(self.client.get("/api/messages/").data), 1)
        self.client.post("/api/messages/mark-read/", {"with": par.id}, format="json")
        self.assertTrue(Notification.objects.filter(user=tea, kind="message").exists())
    def test_hostel_capacity_and_transport_privacy(self):
        room = HostelRoom.objects.create(block="A", number="1", capacity=1)
        self.login("admin")
        self.assertEqual(self.client.post("/api/hostelstay/", {"student": self.s1.id, "room": room.id, "joined_on": str(date.today())}).status_code, 201)
        self.assertEqual(self.client.post("/api/hostelstay/", {"student": 2, "room": room.id, "joined_on": str(date.today())}).status_code, 400)
        route = BusRoute.objects.create(name="R1", vehicle_no="X", driver="D", driver_phone="1", morning_time="07:00", evening_time="17:00", stops="A,B")
        TransportPass.objects.create(student=self.s1, route=route, stop="A")
        TransportPass.objects.create(student=Student.objects.get(roll_no="R2"), route=route, stop="B")
        self.login("stu")
        self.assertEqual(len(self.client.get("/api/buspasses/").data), 1)
        self.assertEqual(len(self.client.get("/api/hostelstay/").data), 1)
        self.assertEqual(self.client.get("/api/hostelrooms/").data[0]["occupied"], 1)
        self.assertEqual(self.client.post("/api/hostelstay/", {}).status_code, 403)

    def test_health_endpoint_is_public(self):
        self.assertEqual(self.client.get("/api/health/").data["status"], "ok")
        self.assertEqual(self.client.head("/api/health/").status_code, 200)

    def test_health_writes_heartbeat_at_most_every_six_hours(self):
        from django.utils import timezone
        from api.models import Heartbeat
        self.client.get("/api/health/")
        first = Heartbeat.objects.get().last_ping
        self.client.get("/api/health/")
        self.assertEqual(Heartbeat.objects.get().last_ping, first)
        Heartbeat.objects.update(last_ping=timezone.now() - timedelta(hours=7))
        self.client.get("/api/health/")
        self.assertGreater(Heartbeat.objects.get().last_ping, first - timedelta(hours=1))

    def test_admin_manages_accounts_and_nobody_else_can(self):
        self.login("tea")
        self.assertEqual(self.client.get("/api/users/").status_code, 403)
        self.login("admin")
        weak = self.client.post("/api/users/", {"username": "t2", "password": "123", "role": "teacher"}, format="json")
        self.assertEqual(weak.status_code, 400)
        no_student = self.client.post("/api/users/", {"username": "p2", "password": "Strong#Pass2026", "role": "parent"}, format="json")
        self.assertEqual(no_student.status_code, 400)
        ok = self.client.post("/api/users/", {"username": "teacher2", "password": "Strong#Pass2026", "role": "teacher", "first_name": "Ravi"}, format="json")
        self.assertEqual(ok.status_code, 201); self.assertEqual(ok.data["role"], "teacher")
        dup = self.client.post("/api/users/", {"username": "TEACHER2", "password": "Strong#Pass2026", "role": "teacher"}, format="json")
        self.assertEqual(dup.status_code, 400)
        parent = self.client.post("/api/users/", {"username": "parent2", "password": "Strong#Pass2026", "role": "parent", "student": self.s1.id}, format="json")
        self.assertEqual(parent.status_code, 201)
        self.assertEqual(self.client.post("/api/token/", {"username": "teacher2", "password": "Strong#Pass2026"}).data["role"], "teacher")
        self.assertEqual(self.client.delete(f"/api/users/{ok.data['id']}/").status_code, 204)
        me = User.objects.get(username="admin")
        self.assertEqual(self.client.delete(f"/api/users/{me.id}/").status_code, 403)
    def test_change_password(self):
        self.login("stu")
        self.assertEqual(self.client.post("/api/auth/change-password/", {"old_password": "wrong", "new_password": "Brand#New2026"}).status_code, 400)
        self.assertEqual(self.client.post("/api/auth/change-password/", {"old_password": "pw12345678", "new_password": "123"}).status_code, 400)
        self.assertEqual(self.client.post("/api/auth/change-password/", {"old_password": "pw12345678", "new_password": "Brand#New2026"}).status_code, 200)
        self.client.credentials()
        self.assertEqual(self.client.post("/api/token/", {"username": "stu", "password": "Brand#New2026"}).status_code, 200)
        self.assertEqual(self.client.post("/api/token/", {"username": "stu", "password": "pw12345678"}).status_code, 401)

    def test_register_requires_approval_then_login_by_email(self):
        from django.core.cache import cache
        cache.clear()
        body = {"first_name": "Meera", "last_name": "S", "email": "Meera@Example.com", "mobile": "98400 12345", "password": "Strong#Pass2026", "role": "parent", "roll_no": "r1"}
        r = self.client.post("/api/auth/register/", body, format="json")
        self.assertEqual(r.status_code, 201)
        u = User.objects.get(email="meera@example.com")
        self.assertFalse(u.is_active); self.assertEqual((u.profile.role, u.profile.student_id, u.profile.mobile), ("parent", self.s1.id, "9840012345"))
        pending = self.client.post("/api/token/", {"username": "meera@example.com", "password": "Strong#Pass2026"})
        self.assertEqual(pending.status_code, 401); self.assertIn("approval", pending.data["detail"])
        self.assertEqual(self.client.post("/api/token/", {"username": "meera@example.com", "password": "wrong"}).data["detail"].lower().count("approval"), 0)
        self.login("tea")
        self.assertEqual(self.client.post(f"/api/users/{u.id}/approve/").status_code, 403)
        self.login("admin")
        self.assertTrue(any(n["kind"] == "register" for n in self.client.get("/api/notifications/").data))
        self.assertEqual(self.client.post(f"/api/users/{u.id}/approve/").status_code, 200)
        self.client.credentials()
        ok = self.client.post("/api/token/", {"username": "MEERA@example.com", "password": "Strong#Pass2026"})
        self.assertEqual((ok.status_code, ok.data["role"]), (200, "parent"))
    def test_register_validation(self):
        from django.core.cache import cache
        cache.clear()
        base = {"first_name": "A", "email": "a@example.com", "mobile": "9840012345", "password": "Strong#Pass2026", "role": "teacher"}
        self.assertEqual(self.client.post("/api/auth/register/", {**base, "role": "superuser"}, format="json").status_code, 400)
        self.assertEqual(self.client.post("/api/auth/register/", {**base, "mobile": "12345"}, format="json").status_code, 400)
        self.assertEqual(self.client.post("/api/auth/register/", {**base, "password": "123"}, format="json").status_code, 400)
        self.assertEqual(self.client.post("/api/auth/register/", {**base, "role": "student"}, format="json").status_code, 400)
        self.assertEqual(self.client.post("/api/auth/register/", {**base, "role": "student", "roll_no": "NOPE"}, format="json").status_code, 400)
        self.assertEqual(self.client.post("/api/auth/register/", {**base, "role": "student", "roll_no": "R1"}, format="json").status_code, 400)  # R1 already has a student account
        ok = self.client.post("/api/auth/register/", base, format="json")
        self.assertEqual(ok.status_code, 201)
        self.assertEqual(self.client.post("/api/auth/register/", {**base, "email": "A@example.com"}, format="json").status_code, 400)
        admin_req = self.client.post("/api/auth/register/", {**base, "email": "boss@example.com", "role": "admin"}, format="json")
        self.assertEqual(admin_req.status_code, 201)
        self.assertFalse(User.objects.get(email="boss@example.com").is_active)
    def test_reject_only_pending_and_login_by_email_for_existing(self):
        from django.core.cache import cache
        cache.clear()
        self.client.post("/api/auth/register/", {"first_name": "B", "email": "b@example.com", "mobile": "9840012345", "password": "Strong#Pass2026", "role": "teacher"}, format="json")
        pend = User.objects.get(email="b@example.com")
        User.objects.filter(username="stu").update(email="arun@example.com")
        self.assertEqual(self.client.post("/api/token/", {"username": "arun@example.com", "password": "pw12345678"}).status_code, 200)
        self.login("admin")
        self.assertEqual(self.client.post(f"/api/users/{User.objects.get(username='stu').id}/reject/").status_code, 403)
        self.assertEqual(self.client.post(f"/api/users/{pend.id}/reject/").status_code, 200)
        self.assertFalse(User.objects.filter(email="b@example.com").exists())

    def test_jwt_refresh_rotation_and_logout(self):
        d = self.client.post("/api/token/", {"username": "stu", "password": "pw12345678"}).data
        r = self.client.post("/api/token/refresh/", {"refresh": d["refresh"]}, format="json")
        self.assertEqual(r.status_code, 200); self.assertIn("access", r.data)
        self.assertNotEqual(r.data["refresh"], d["refresh"])
        self.assertEqual(self.client.post("/api/token/refresh/", {"refresh": d["refresh"]}, format="json").status_code, 401)
        new = r.data["refresh"]
        self.assertEqual(self.client.post("/api/auth/logout/", {"refresh": new}, format="json").status_code, 200)
        self.assertEqual(self.client.post("/api/token/refresh/", {"refresh": new}, format="json").status_code, 401)
        self.assertEqual(self.client.post("/api/token/refresh/", {"refresh": "garbage"}, format="json").status_code, 401)
    @override_settings(EMAIL_VERIFICATION=True)
    def test_registration_email_otp_then_approval_emails(self):
        from django.core.cache import cache
        cache.clear(); mail.outbox.clear()
        body = {"first_name": "Otp", "email": "otp@example.com", "mobile": "9840012345", "password": "Strong#Pass2026", "role": "parent", "roll_no": "R1"}
        r = self.client.post("/api/auth/register/", body, format="json")
        self.assertEqual((r.status_code, r.data["verify"]), (201, True))
        self.assertEqual(len(mail.outbox), 1)
        code = re.search(r"\b(\d{6})\b", mail.outbox[0].subject).group(1)
        u = User.objects.get(email="otp@example.com")
        self.assertFalse(u.profile.email_verified)
        early = self.client.post("/api/token/", {"username": "otp@example.com", "password": "Strong#Pass2026"})
        self.assertEqual(early.status_code, 401); self.assertIn("verify your email", early.data["detail"].lower())
        self.login("admin")
        self.assertEqual(self.client.post(f"/api/users/{u.id}/approve/").status_code, 400)
        self.assertFalse(any(n["kind"] == "register" for n in self.client.get("/api/notifications/").data))
        self.client.credentials()
        wrong = "000000" if code != "000000" else "111111"
        w = self.client.post("/api/auth/verify-email/", {"email": "otp@example.com", "otp": wrong}, format="json")
        self.assertEqual(w.status_code, 400); self.assertIn("Wrong code", w.data["detail"])
        ok = self.client.post("/api/auth/verify-email/", {"email": "OTP@example.com", "otp": code}, format="json")
        self.assertEqual(ok.status_code, 200)
        self.assertEqual(len(mail.outbox), 2); self.assertIn("received", mail.outbox[1].subject.lower())
        self.login("admin")
        self.assertTrue(any(n["kind"] == "register" for n in self.client.get("/api/notifications/").data))
        self.assertEqual(self.client.post(f"/api/users/{u.id}/approve/").status_code, 200)
        self.assertIn("Congratulations", mail.outbox[-1].subject); self.assertEqual(mail.outbox[-1].to, ["otp@example.com"])
        self.client.credentials()
        t = self.client.post("/api/token/", {"username": "otp@example.com", "password": "Strong#Pass2026"})
        self.assertEqual(t.status_code, 200)
        self.client.credentials(HTTP_AUTHORIZATION="Bearer " + t.data["access"])
        self.assertTrue(any("Welcome to EduNexa" in n["title"] for n in self.client.get("/api/notifications/").data))
    @override_settings(EMAIL_VERIFICATION=True)
    def test_otp_lockout_expiry_and_resend(self):
        from datetime import timedelta
        from django.core.cache import cache
        from django.utils import timezone
        from api.models import EmailOTP
        cache.clear(); mail.outbox.clear()
        self.client.post("/api/auth/register/", {"first_name": "T", "email": "t@example.com", "mobile": "9840012345", "password": "Strong#Pass2026", "role": "teacher"}, format="json")
        code = re.search(r"\b(\d{6})\b", mail.outbox[0].subject).group(1)
        wrong = "000000" if code != "000000" else "111111"
        for _ in range(5):
            last = self.client.post("/api/auth/verify-email/", {"email": "t@example.com", "otp": wrong}, format="json")
        self.assertIn("Too many", last.data["detail"])
        self.assertIn("Too many", self.client.post("/api/auth/verify-email/", {"email": "t@example.com", "otp": code}, format="json").data["detail"])
        self.assertEqual(self.client.post("/api/auth/resend-otp/", {"email": "t@example.com"}, format="json").status_code, 429)
        EmailOTP.objects.update(sent_at=timezone.now() - timedelta(minutes=2))
        self.assertEqual(self.client.post("/api/auth/resend-otp/", {"email": "t@example.com"}, format="json").status_code, 200)
        self.assertEqual(len(mail.outbox), 2)
        new_code = re.search(r"\b(\d{6})\b", mail.outbox[1].subject).group(1)
        EmailOTP.objects.update(sent_at=timezone.now() - timedelta(minutes=11))
        self.assertIn("expired", self.client.post("/api/auth/verify-email/", {"email": "t@example.com", "otp": new_code}, format="json").data["detail"])
    def test_brevo_api_is_used_when_key_is_set(self):
        from unittest.mock import patch
        from api.emailer import send_email
        with patch.dict(os.environ, {"BREVO_API_KEY": "k"}), patch("api.emailer.urllib.request.urlopen") as op:
            self.assertTrue(send_email("a@b.com", "Hi", "text", "<p>x</p>"))
        req = op.call_args[0][0]
        self.assertEqual(req.full_url, "https://api.brevo.com/v3/smtp/email")
        self.assertEqual(json.loads(req.data)["to"], [{"email": "a@b.com"}]); self.assertEqual(req.get_header("Api-key"), "k")
        with patch.dict(os.environ, {"BREVO_API_KEY": "k"}), patch("api.emailer.urllib.request.urlopen", side_effect=OSError("down")):
            self.assertFalse(send_email("a@b.com", "Hi", "text"))

    def test_free_ai_providers_and_fallback(self):
        from unittest.mock import MagicMock, patch
        from api.advice import ai_suggestion
        risk = {"score": 67, "level": "High", "reasons": ["Attendance is 55%"], "factors": ["attendance"]}
        gem = MagicMock(); gem.read.return_value = json.dumps({"candidates": [{"content": {"parts": [{"text": "Talk to the family. "}]}}]}).encode()
        with patch.dict(os.environ, {"GEMINI_API_KEY": "k"}), patch("api.advice.urllib.request.urlopen", return_value=gem) as op:
            self.assertEqual(ai_suggestion(risk), ("Talk to the family.", "gemini"))
        req = op.call_args[0][0]
        self.assertIn("gemini-2.5-flash", req.full_url); self.assertEqual(req.get_header("X-goog-api-key"), "k")
        self.assertNotIn("Arun", req.data.decode())  # only anonymous numbers are sent
        oai = MagicMock(); oai.read.return_value = json.dumps({"choices": [{"message": {"content": "Call home."}}]}).encode()
        env = {"AI_BASE_URL": "https://example.test/v1", "AI_API_KEY": "k2", "AI_MODEL": "m", "AI_NAME": "groq"}
        with patch.dict(os.environ, env), patch("api.advice.urllib.request.urlopen", return_value=oai) as op2:
            self.assertEqual(ai_suggestion(risk), ("Call home.", "groq"))
        self.assertEqual(op2.call_args[0][0].full_url, "https://example.test/v1/chat/completions")
        with patch.dict(os.environ, {"GEMINI_API_KEY": "k"}), patch("api.advice.urllib.request.urlopen", side_effect=OSError("down")):
            self.assertIsNone(ai_suggestion(risk))
        with patch.dict(os.environ, {}, clear=True):
            self.assertIsNone(ai_suggestion(risk))
