from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver
from .models import AttendanceRecord, Student

@receiver([post_save, post_delete], sender=AttendanceRecord)
def refresh_attendance(sender, instance, **kwargs):
    """Keep Student.attendance (%) in sync with the daily attendance records."""
    records = AttendanceRecord.objects.filter(student_id=instance.student_id)
    total = records.count()
    if total:
        pct = round(100 * records.filter(present=True).count() / total)
        Student.objects.filter(pk=instance.student_id).update(attendance=pct)


# ---------- in-app notifications ----------
from django.contrib.auth.models import User
from django.db.models import Q
from .models import Announcement, Assignment, Fee, Notification, Result, Submission

def notify(users, title, body="", kind="info"):
    Notification.objects.bulk_create([Notification(user=u, title=title, body=body, kind=kind) for u in users])

def _family_of(student):  # the student's own login plus any parent logins
    return User.objects.filter(profile__student=student)

@receiver(post_save, sender=Announcement)
def _notice(sender, instance, created, **kw):
    if created:
        notify(User.objects.filter(Q(profile__isnull=False) | Q(is_superuser=True)).distinct(), instance.title, instance.body, "notice")

@receiver(post_save, sender=Assignment)
def _assignment(sender, instance, created, **kw):
    if created:
        notify(User.objects.filter(profile__student__course=instance.course).distinct(), f"New assignment: {instance.title}", f"Due {instance.due_date}", "assignment")

@receiver(post_save, sender=Submission)
def _graded(sender, instance, created, **kw):
    if not created and instance.grade is not None:
        notify(_family_of(instance.student), f"Graded: {instance.assignment.title}", f"Score {instance.grade}/100. {instance.feedback}".strip(), "grade")

@receiver(post_save, sender=Fee)
def _fee(sender, instance, created, **kw):
    if created and instance.status == "pending":
        notify(_family_of(instance.student), f"Fee of ₹{instance.amount:,} is due", f"Due on {instance.due_date}", "fee")

@receiver(post_save, sender=Result)
def _result(sender, instance, created, **kw):
    if created:
        notify(_family_of(instance.student), f"New result: {instance.subject}", f"{instance.exam}: {instance.score}%", "result")


from .models import LeaveRequest, Message

@receiver(post_save, sender=LeaveRequest)
def _leave(sender, instance, created, **kw):
    if created:
        staff = User.objects.filter(Q(profile__role__in=("admin", "teacher")) | Q(is_superuser=True)).distinct()
        notify(staff, f"Leave request: {instance.student.name}", f"{instance.from_date} to {instance.to_date}. {instance.reason}", "leave")
    elif instance.status != "pending":
        notify(_family_of(instance.student), f"Leave {instance.status}", f"{instance.from_date} to {instance.to_date}. {instance.note}".strip(), "leave")

@receiver(post_save, sender=Message)
def _message(sender, instance, created, **kw):
    if created:
        notify([instance.recipient], f"New message from {instance.sender.get_full_name() or instance.sender.username}", instance.body[:120], "message")
