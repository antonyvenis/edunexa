from datetime import date, timedelta
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from api.models import BusRoute, HostelAllocation, HostelRoom, LeaveRequest, Message, TransportPass, Book, BookLoan, ExamSchedule, Notification, Assignment, Submission, TimetableEntry, Profile, Announcement, AttendanceRecord, Course, Fee, Result, Student, Teacher

class Command(BaseCommand):
    help = "Load demo data"
    def handle(self, *a, **o):
        courses = [Course.objects.get_or_create(code=c, defaults={"name": n, "credits": cr})[0]
                   for c, n, cr in [("MAT101", "B.Sc Mathematics", 4), ("CSE201", "Computer Science", 4), ("PHY110", "Physics", 3)]]
        for i, (n, att, mk) in enumerate([("Arun Kumar", 92, 81), ("Divya Lakshmi", 88, 90), ("Karthik Raja", 71, 64), ("Meena Sundar", 95, 77), ("Priya Nair", 55, 52)]):
            s, _ = Student.objects.get_or_create(roll_no=f"R{2400+i}", defaults=dict(
                name=n, email=f"{n.split()[0].lower()}@college.edu", course=courses[i % 3], year=i % 3 + 1, attendance=att, marks=mk))
            Fee.objects.get_or_create(student=s, due_date=date.today() + timedelta(days=10), defaults=dict(amount=45000, status="pending" if i in (2, 4) else "paid"))
            subj = courses[i % 3].name
            Result.objects.get_or_create(student=s, exam="Quiz", subject=subj, defaults=dict(score=mk + (10 if i in (2, 4) else -5)))
            Result.objects.get_or_create(student=s, exam="Midterm", subject=subj, defaults=dict(score=mk))
            for d in range(20):  # 20 days of history; % is auto-calculated by a signal
                AttendanceRecord.objects.get_or_create(student=s, date=date.today() - timedelta(days=d), defaults=dict(present=d < round(att / 5)))
        Teacher.objects.get_or_create(email="ravi@college.edu", defaults=dict(name="Dr. Ravi Shankar", subject="Mathematics", phone="9840012345"))
        Announcement.objects.get_or_create(title="Semester exams begin", defaults=dict(body="Hall tickets available from the office.", date=date.today()))
        subjects = [["Calculus", "Algebra", "Statistics"], ["Algorithms", "Databases", "Web Dev"], ["Optics", "Mechanics", "Thermodynamics"]]
        teachers = ["Dr. Ravi Shankar", "Prof. Anitha Menon", "Dr. Vikram Iyer"]
        slots = [(0, "09:00", "10:00"), (1, "10:00", "11:00"), (2, "09:00", "10:00"), (3, "11:00", "12:00"), (4, "10:00", "11:00")]
        for ci, c in enumerate(courses):
            for k, (day, start, end) in enumerate(slots):
                TimetableEntry.objects.get_or_create(course=c, day=day, start=start, defaults=dict(
                    end=end, subject=subjects[ci][k % 3], teacher=teachers[ci], room=f"R-{101 + ci * 10 + k}"))
        for ci, (title, desc, days) in enumerate([("Calculus problem set 3", "Solve questions 1-10 from chapter 4.", 7),
                                                  ("Build a REST API", "Create a CRUD API with authentication.", 15),
                                                  ("Optics lab report", "Write up the lens experiment.", -6)]):
            a, _ = Assignment.objects.get_or_create(course=courses[ci], title=title, defaults=dict(description=desc, due_date=date.today() + timedelta(days=days)))
            s0 = Student.objects.filter(course=courses[ci]).first()
            if ci < 2 and s0:
                Submission.objects.get_or_create(assignment=a, student=s0, defaults=dict(answer="Submitted: link to my work", grade=88 if ci == 0 else None))
        for title, author, copies in [("Introduction to Algorithms", "T. Cormen", 3), ("Clean Code", "Robert C. Martin", 2), ("Calculus", "James Stewart", 2),
                                      ("Fundamentals of Physics", "Halliday & Resnick", 1), ("Python Crash Course", "Eric Matthes", 2)]:
            Book.objects.get_or_create(title=title, defaults=dict(author=author, copies=copies))
        studs = list(Student.objects.order_by("id"))
        for bi, si, issued, due in [(1, 1, -16, -2), (3, 0, -6, 8), (4, 4, -25, -11)]:
            BookLoan.objects.get_or_create(book=Book.objects.get(title=["", "Introduction to Algorithms", "Clean Code", "Calculus", "Fundamentals of Physics"][bi]),
                                           student=studs[si], defaults=dict(issued_on=date.today() + timedelta(days=issued), due_on=date.today() + timedelta(days=due)))
        for ci, c in enumerate(courses):
            for k, d in enumerate((15, 17)):
                ExamSchedule.objects.get_or_create(course=c, subject=subjects[ci][k], defaults=dict(
                    exam="Semester", date=date.today() + timedelta(days=d), start="10:00", end="13:00", hall=f"Hall {'ABC'[ci]}"))
        for name, role, student in [("admin", "admin", None), ("teacher", "teacher", None), ("student", "student", Student.objects.first()), ("parent", "parent", Student.objects.first())]:
            u, _ = User.objects.get_or_create(username=name, defaults={"is_superuser": role == "admin", "is_staff": role == "admin"})
            u.first_name, u.last_name = {"admin": ("Admin", ""), "teacher": ("Anitha", "Menon"), "student": ("Arun", "Kumar"), "parent": ("Suresh", "Kumar")}[name]
            u.email = f"{name}@edunexa.demo"
            u.set_password(name + "123"); u.save()
            Profile.objects.update_or_create(user=u, defaults={"role": role, "student": student, "mobile": "9840012345"})
        studs = list(Student.objects.order_by("id"))
        LeaveRequest.objects.get_or_create(student=studs[0], from_date=date.today() + timedelta(days=3), defaults=dict(to_date=date.today() + timedelta(days=4), reason="Family function"))
        LeaveRequest.objects.get_or_create(student=studs[1], from_date=date.today() - timedelta(days=5), defaults=dict(to_date=date.today() - timedelta(days=4), reason="Fever", status="approved", note="Get well soon"))
        parent, teacher = User.objects.get(username="parent"), User.objects.get(username="teacher")
        if not Message.objects.exists():
            Message.objects.create(sender=teacher, recipient=parent, body="Hello, Arun is doing well. Please make sure he submits the calculus assignment this week.")
            Message.objects.create(sender=parent, recipient=teacher, body="Thank you, madam. I will remind him.")
        for name, veh, drv, ph, stops in [("Route A - Anna Nagar", "TN 09 AB 1234", "Murugan", "9840011111", "Anna Nagar, Koyambedu, Vadapalani, Campus"),
                                          ("Route B - Tambaram", "TN 11 CD 5678", "Selvam", "9840022222", "Tambaram, Chromepet, Guindy, Campus")]:
            BusRoute.objects.get_or_create(name=name, defaults=dict(vehicle_no=veh, driver=drv, driver_phone=ph, morning_time="07:30", evening_time="17:00", stops=stops))
        routes = list(BusRoute.objects.order_by("id"))
        for st, rt, stop in [(studs[0], routes[0], "Koyambedu"), (studs[1], routes[1], "Chromepet")]:
            TransportPass.objects.get_or_create(student=st, defaults=dict(route=rt, stop=stop))
        for blk, num, cap in [("A", "101", 2), ("A", "102", 3), ("B", "201", 2)]:
            HostelRoom.objects.get_or_create(block=blk, number=num, defaults=dict(capacity=cap))
        r101, r201 = HostelRoom.objects.get(block="A", number="101"), HostelRoom.objects.get(block="B", number="201")
        for st, rm in [(studs[0], r101), (studs[2], r101), (studs[1], r201)]:
            HostelAllocation.objects.get_or_create(student=st, defaults=dict(room=rm, joined_on=date.today() - timedelta(days=120)))
        for u in User.objects.all():
            Notification.objects.get_or_create(user=u, title="Welcome to EduNexa", defaults=dict(body="Your account is ready.", kind="info"))
        self.stdout.write("Seeded demo data. Logins: admin/admin123, teacher/teacher123, student/student123, parent/parent123")
