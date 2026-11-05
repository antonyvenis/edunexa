from django.db import models

class Course(models.Model):
    name = models.CharField(max_length=120)
    code = models.CharField(max_length=12, unique=True)
    credits = models.PositiveSmallIntegerField(default=3)
    def __str__(self): return self.name

class Student(models.Model):
    name = models.CharField(max_length=120)
    email = models.EmailField(unique=True)
    roll_no = models.CharField(max_length=20, unique=True)
    course = models.ForeignKey(Course, null=True, on_delete=models.SET_NULL, related_name="students")
    year = models.PositiveSmallIntegerField(default=1)
    attendance = models.PositiveSmallIntegerField(default=100)
    marks = models.PositiveSmallIntegerField(default=0)
    def __str__(self): return self.name

class Teacher(models.Model):
    name = models.CharField(max_length=120)
    email = models.EmailField(unique=True)
    subject = models.CharField(max_length=80)
    phone = models.CharField(max_length=20, blank=True)

class Fee(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="fees")
    amount = models.PositiveIntegerField()
    due_date = models.DateField()
    status = models.CharField(max_length=10, choices=[("paid", "Paid"), ("pending", "Pending")], default="pending")

class Result(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="results")
    exam = models.CharField(max_length=60)
    subject = models.CharField(max_length=80)
    score = models.PositiveSmallIntegerField()

class Announcement(models.Model):
    title = models.CharField(max_length=140)
    body = models.TextField()
    date = models.DateField()

class AttendanceRecord(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="records")
    date = models.DateField()
    present = models.BooleanField(default=True)
    class Meta:
        unique_together = ("student", "date")

class Profile(models.Model):
    ROLES = [("admin", "Admin"), ("teacher", "Teacher"), ("student", "Student"), ("parent", "Parent")]  # parent: read-only view of their child (profile.student)
    user = models.OneToOneField("auth.User", on_delete=models.CASCADE, related_name="profile")
    role = models.CharField(max_length=10, choices=ROLES, default="student")
    student = models.ForeignKey(Student, null=True, blank=True, on_delete=models.SET_NULL)
    mobile = models.CharField(max_length=16, blank=True)
    email_verified = models.BooleanField(default=True)  # False only while a self-registered email is waiting for its OTP
    def __str__(self): return f"{self.user.username} ({self.role})"


class TimetableEntry(models.Model):
    DAYS = [(0, "Monday"), (1, "Tuesday"), (2, "Wednesday"), (3, "Thursday"), (4, "Friday"), (5, "Saturday")]
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="timetable")
    day = models.PositiveSmallIntegerField(choices=DAYS)
    start = models.TimeField()
    end = models.TimeField()
    subject = models.CharField(max_length=80)
    teacher = models.CharField(max_length=80, blank=True)
    room = models.CharField(max_length=30, blank=True)

class Assignment(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="assignments")
    title = models.CharField(max_length=140)
    description = models.TextField(blank=True)
    due_date = models.DateField()

class Submission(models.Model):
    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE, related_name="submissions")
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="submissions")
    answer = models.TextField()
    submitted_at = models.DateTimeField(auto_now=True)
    grade = models.PositiveSmallIntegerField(null=True, blank=True)
    feedback = models.CharField(max_length=200, blank=True)
    class Meta:
        unique_together = ("assignment", "student")


class Book(models.Model):
    title = models.CharField(max_length=160)
    author = models.CharField(max_length=120)
    copies = models.PositiveSmallIntegerField(default=1)
    @property
    def available(self):
        return self.copies - self.loans.filter(returned_on__isnull=True).count()

class BookLoan(models.Model):
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name="loans")
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="loans")
    issued_on = models.DateField()
    due_on = models.DateField()
    returned_on = models.DateField(null=True, blank=True)

class ExamSchedule(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="exam_schedule")
    exam = models.CharField(max_length=60)
    subject = models.CharField(max_length=80)
    date = models.DateField()
    start = models.TimeField()
    end = models.TimeField()
    hall = models.CharField(max_length=40)

class Notification(models.Model):
    user = models.ForeignKey("auth.User", on_delete=models.CASCADE, related_name="notifications")
    title = models.CharField(max_length=140)
    body = models.CharField(max_length=240, blank=True)
    kind = models.CharField(max_length=20, default="info")
    created_at = models.DateTimeField(auto_now_add=True)
    read = models.BooleanField(default=False)
    class Meta:
        ordering = ["-created_at", "-id"]


class LeaveRequest(models.Model):
    STATUS = [("pending", "Pending"), ("approved", "Approved"), ("rejected", "Rejected")]
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="leaves")
    from_date = models.DateField()
    to_date = models.DateField()
    reason = models.CharField(max_length=200)
    status = models.CharField(max_length=10, choices=STATUS, default="pending")
    note = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        ordering = ["-created_at", "-id"]

class Message(models.Model):
    sender = models.ForeignKey("auth.User", on_delete=models.CASCADE, related_name="sent_messages")
    recipient = models.ForeignKey("auth.User", on_delete=models.CASCADE, related_name="received_messages")
    body = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    read = models.BooleanField(default=False)
    class Meta:
        ordering = ["created_at", "id"]

class BusRoute(models.Model):
    name = models.CharField(max_length=80)
    vehicle_no = models.CharField(max_length=20)
    driver = models.CharField(max_length=80)
    driver_phone = models.CharField(max_length=20)
    morning_time = models.TimeField()
    evening_time = models.TimeField()
    stops = models.TextField(help_text="Comma separated stops, in order")

class TransportPass(models.Model):
    student = models.OneToOneField(Student, on_delete=models.CASCADE, related_name="bus_pass")
    route = models.ForeignKey(BusRoute, on_delete=models.CASCADE, related_name="passes")
    stop = models.CharField(max_length=80)

class HostelRoom(models.Model):
    block = models.CharField(max_length=20)
    number = models.CharField(max_length=10)
    capacity = models.PositiveSmallIntegerField(default=2)
    @property
    def occupied(self):
        return self.allocations.count()
    class Meta:
        unique_together = ("block", "number")

class HostelAllocation(models.Model):
    student = models.OneToOneField(Student, on_delete=models.CASCADE, related_name="hostel")
    room = models.ForeignKey(HostelRoom, on_delete=models.CASCADE, related_name="allocations")
    joined_on = models.DateField()


class Heartbeat(models.Model):
    """Single row updated by /api/health/ so a free Supabase project always sees real database writes."""
    last_ping = models.DateTimeField()


class EmailOTP(models.Model):
    user = models.OneToOneField("auth.User", on_delete=models.CASCADE, related_name="email_otp")
    code_hash = models.CharField(max_length=64)
    sent_at = models.DateTimeField()
    attempts = models.PositiveSmallIntegerField(default=0)
