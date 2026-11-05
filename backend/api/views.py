from django.db import connection
from django.http import HttpResponse
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db.models import Q
from rest_framework import mixins, viewsets
from rest_framework.exceptions import AuthenticationFailed, PermissionDenied
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from django.conf import settings
from rest_framework.decorators import action, api_view, authentication_classes, permission_classes
from rest_framework.permissions import SAFE_METHODS, AllowAny, BasePermission
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.response import Response
from .exams import check_eligibility
from .models import ExamSchedule, Fee, LeaveRequest, Message, Notification, Student, Submission
from .advice import ai_suggestion, rule_suggestion
from .risk import compute_risk
from .reports import build_hall_ticket, build_receipt, build_report_card
from .emailer import render, send_email
from .otp import can_resend, check_otp, issue_otp
from .signals import notify
from .serializers import RegisterSerializer, UserAdminSerializer, MessageSerializer, NotificationSerializer, display_name, make_serializer

def role_of(u):
    if u.is_superuser: return "admin"
    p = getattr(u, "profile", None)
    return p.role if p else None

class RolePermission(BasePermission):
    """Everyone with a role can read; only write_roles can create/update/delete."""
    def has_permission(self, request, view):
        role = role_of(request.user) if request.user.is_authenticated else None
        if role is None: return False
        return request.method in SAFE_METHODS or role in view.write_roles

def make_viewset(model, write=("admin",), own=None, serializer=None):
    def get_queryset(self):
        qs, u = model.objects.all().order_by("id"), self.request.user
        if own and role_of(u) in ("student", "parent"):  # students and parents only see the child's records
            stu = u.profile.student
            return qs.filter(**{own: (stu.course_id if own == "course" and stu else u.profile.student_id)})
        return qs
    return type(model.__name__ + "ViewSet", (viewsets.ModelViewSet,), {
        "serializer_class": serializer or make_serializer(model), "permission_classes": [RolePermission],
        "write_roles": write, "get_queryset": get_queryset})

class StaffOnly(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and role_of(request.user) in ("admin", "teacher")

class StudentViewSet(make_viewset(Student, own="id")):
    @extend_schema(summary="Hall ticket eligibility (own child/self for students and parents)", responses=OpenApiTypes.OBJECT)
    @action(detail=False)
    def eligibility(self, request):
        return Response([check_eligibility(s) for s in self.get_queryset().prefetch_related("fees")])

    @extend_schema(summary="Download hall ticket PDF (only if fees are clear and attendance >= 75%)", responses={(200, "application/pdf"): OpenApiTypes.BINARY})
    @action(detail=True, url_path="hall-ticket")
    def hall_ticket(self, request, pk=None):
        s = self.get_object()
        e = check_eligibility(s)
        if not e["eligible"]:
            return Response({"detail": "Hall ticket blocked: " + "; ".join(e["reasons"])}, status=400)
        exams = ExamSchedule.objects.filter(course=s.course).order_by("date", "start")
        return HttpResponse(build_hall_ticket(s, exams), content_type="application/pdf",
                            headers={"Content-Disposition": f'attachment; filename="hall-ticket-{s.roll_no}.pdf"'})

    @extend_schema(summary="Risk scores for all students (staff only)", responses=OpenApiTypes.OBJECT)
    @action(detail=False, permission_classes=[StaffOnly])
    def risk(self, request):
        qs = self.get_queryset().select_related("course").prefetch_related("results", "fees")
        return Response([compute_risk(s) for s in qs])

    @extend_schema(summary="Suggested actions for a student (free AI if configured, else rule-based)", responses=OpenApiTypes.OBJECT)
    @action(detail=True, permission_classes=[StaffOnly])
    def advice(self, request, pk=None):
        r = compute_risk(self.get_object())
        text, source = ai_suggestion(r) or (rule_suggestion(r), "rules")
        return Response({"suggestion": text, "source": source, "risk": r})

    @extend_schema(summary="Download PDF report card", responses={(200, "application/pdf"): OpenApiTypes.BINARY})
    @action(detail=True, url_path="report-card")
    def report_card(self, request, pk=None):
        s = self.get_object()
        return HttpResponse(build_report_card(s), content_type="application/pdf",
                            headers={"Content-Disposition": f'attachment; filename="report-card-{s.roll_no}.pdf"'})

class FeeViewSet(make_viewset(Fee, own="student")):
    @extend_schema(summary="Download PDF receipt for a paid fee", responses={(200, "application/pdf"): OpenApiTypes.BINARY})
    @action(detail=True)
    def receipt(self, request, pk=None):
        f = self.get_object()
        if f.status != "paid":
            return Response({"detail": "Receipt is available only for paid fees."}, status=400)
        return HttpResponse(build_receipt(f), content_type="application/pdf",
                            headers={"Content-Disposition": f'attachment; filename="receipt-EDU-{f.id:05d}.pdf"'})

class SubmissionViewSet(make_viewset(Submission, write=("admin", "teacher", "student"), own="student")):
    """Students submit/resubmit their own work but can never set a grade; staff grade."""
    def perform_create(self, serializer):
        if role_of(self.request.user) == "student":
            serializer.save(student_id=self.request.user.profile.student_id, grade=None, feedback="")
        else:
            serializer.save()
    def perform_update(self, serializer):
        if role_of(self.request.user) == "student":
            i = serializer.instance
            serializer.save(student_id=i.student_id, grade=i.grade, feedback=i.feedback)
        else:
            serializer.save()

class EduTokenSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        ident = (attrs.get("username") or "").strip()
        user = (User.objects.filter(email__iexact=ident) if "@" in ident else User.objects.filter(username__iexact=ident)).first()
        if user:  # sign in with email or username
            attrs["username"] = user.username
            if not user.is_active and user.check_password(attrs.get("password", "")):
                p = getattr(user, "profile", None)
                if p and not p.email_verified:
                    raise AuthenticationFailed("Please verify your email first. Check your inbox for the 6-digit code.", code="unverified")
                raise AuthenticationFailed("Your registration is waiting for admin approval.", code="pending")
        data = super().validate(attrs)
        p = getattr(self.user, "profile", None)
        data.update(uid=self.user.id, role=role_of(self.user), name=self.user.get_full_name() or self.user.username,
                    student=p.student_id if p else None)
        return data

class EduTokenView(TokenObtainPairView):
    serializer_class = EduTokenSerializer


class HasRole(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and role_of(request.user) is not None

class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    """Each user only ever sees their own notifications."""
    serializer_class = NotificationSerializer
    permission_classes = [HasRole]
    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)
    @action(detail=True, methods=["post"])
    def read(self, request, pk=None):
        n = self.get_object(); n.read = True; n.save(update_fields=["read"])
        return Response({"ok": True})
    @action(detail=False, methods=["post"], url_path="read-all")
    def read_all(self, request):
        self.get_queryset().update(read=True)
        return Response({"ok": True})


class LeaveViewSet(make_viewset(LeaveRequest, write=("admin", "teacher", "student", "parent"), own="student")):
    """Students and parents request leave and can edit or withdraw it while pending; only staff decide."""
    def _kid(self):
        return role_of(self.request.user) in ("student", "parent")
    def perform_create(self, serializer):
        if self._kid():
            serializer.save(student_id=self.request.user.profile.student_id, status="pending", note="")
        else:
            serializer.save()
    def perform_update(self, serializer):
        i = serializer.instance
        if self._kid():
            if i.status != "pending":
                raise PermissionDenied("A decided leave request cannot be edited.")
            serializer.save(student_id=i.student_id, status="pending", note="")
        else:
            serializer.save()
    def perform_destroy(self, instance):
        if self._kid() and instance.status != "pending":
            raise PermissionDenied("A decided leave request cannot be withdrawn.")
        instance.delete()

STAFF = ("admin", "teacher")

def can_message(a, b):
    """Parent-teacher style messaging: at least one side must be staff, so parents and students never DM each other."""
    ra, rb = role_of(a), role_of(b)
    return a.id != b.id and ra is not None and rb is not None and (ra in STAFF or rb in STAFF)

class MessageViewSet(mixins.ListModelMixin, mixins.CreateModelMixin, viewsets.GenericViewSet):
    serializer_class = MessageSerializer
    permission_classes = [HasRole]
    def get_queryset(self):
        u = self.request.user
        return Message.objects.filter(Q(sender=u) | Q(recipient=u)).select_related("sender", "recipient")
    def perform_create(self, serializer):
        if not can_message(self.request.user, serializer.validated_data["recipient"]):
            raise PermissionDenied("You cannot message this user.")
        serializer.save(sender=self.request.user)
    @extend_schema(summary="People the current user is allowed to message", responses=OpenApiTypes.OBJECT)
    @action(detail=False)
    def contacts(self, request):
        return Response([{"id": u.id, "name": display_name(u), "role": role_of(u)} for u in User.objects.exclude(id=request.user.id) if can_message(request.user, u)])
    @extend_schema(summary="Mark a conversation as read", request=OpenApiTypes.OBJECT, responses=OpenApiTypes.OBJECT)
    @action(detail=False, methods=["post"], url_path="mark-read")
    def mark_read(self, request):
        self.get_queryset().filter(sender_id=request.data.get("with"), recipient=request.user).update(read=True)
        return Response({"ok": True})


@extend_schema(exclude=True)
@api_view(["GET", "HEAD"])  # UptimeRobot may probe with HEAD
@authentication_classes([])
@permission_classes([AllowAny])
def health(request):
    """Public ping for UptimeRobot. Every call runs a real table query, and at least once every 6 hours it also writes
    a row, so a free Supabase project keeps seeing genuine database activity."""
    from datetime import timedelta
    from django.utils import timezone
    from .models import Course, Heartbeat
    courses = Course.objects.count()
    beat, created = Heartbeat.objects.get_or_create(id=1, defaults={"last_ping": timezone.now()})
    if not created and timezone.now() - beat.last_ping > timedelta(hours=6):
        beat.last_ping = timezone.now()
        beat.save(update_fields=["last_ping"])
    return Response({"status": "ok", "courses": courses})


class AdminOnly(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and role_of(request.user) == "admin"

class UserAdminViewSet(mixins.ListModelMixin, mixins.CreateModelMixin, mixins.UpdateModelMixin, mixins.DestroyModelMixin, viewsets.GenericViewSet):
    """Only admins create accounts. There is no public sign-up."""
    serializer_class = UserAdminSerializer
    permission_classes = [AdminOnly]
    queryset = User.objects.all().order_by("id").select_related("profile")
    def perform_destroy(self, user):
        if user == self.request.user or user.is_superuser:
            raise PermissionDenied("You cannot delete this account.")
        user.delete()
    @extend_schema(summary="Approve a pending registration", request=None, responses=OpenApiTypes.OBJECT)
    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        user = self.get_object()
        if not getattr(getattr(user, "profile", None), "email_verified", True):
            return Response({"detail": "This email address has not been verified yet."}, status=400)
        user.is_active = True
        user.save(update_fields=["is_active"])
        notify([user], "Welcome to EduNexa", "Your account has been approved. Take a look around.", "info")
        if user.email:
            text, html = render(display_name(user), ["Congratulations! Your EduNexa account has been approved.", f"You can now sign in with {user.email} and the password you chose."], ("Sign in to EduNexa", f"{settings.FRONTEND_URL}/login"))
            send_email(user.email, "Congratulations! Your EduNexa account is approved", text, html)
        return Response({"ok": True})
    @extend_schema(summary="Reject (delete) a pending registration", request=None, responses=OpenApiTypes.OBJECT)
    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        user = self.get_object()
        if user.is_active:
            raise PermissionDenied("Only pending requests can be rejected.")
        if user.email:
            text, html = render(display_name(user), ["Thank you for registering with EduNexa.", "Unfortunately your registration could not be approved. Please contact your institution if you think this is a mistake."])
            send_email(user.email, "Update on your EduNexa registration", text, html)
        user.delete()
        return Response({"ok": True})

@extend_schema(request=OpenApiTypes.OBJECT, responses=OpenApiTypes.OBJECT, summary="Change your own password")
@api_view(["POST"])
def change_password(request):
    old, new = request.data.get("old_password", ""), request.data.get("new_password", "")
    if not request.user.check_password(old):
        return Response({"detail": "Current password is wrong."}, status=400)
    try:
        validate_password(new, request.user)
    except DjangoValidationError as e:
        return Response({"detail": " ".join(e.messages)}, status=400)
    request.user.set_password(new)
    request.user.save()
    return Response({"ok": True})


def _announce_registration(user):
    """Tell the admins about a verified registration and confirm to the user that it is waiting for approval."""
    admins = User.objects.filter(Q(profile__role="admin", is_active=True) | Q(is_superuser=True, is_active=True)).distinct()
    notify(admins, f"New registration: {display_name(user)}", f"{user.profile.role} · {user.profile.mobile} · {user.email}", "register")
    text, html = render(display_name(user), ["We have received your registration for EduNexa.", "An admin will review it soon. You will get another email as soon as your account is approved."])
    send_email(user.email, "We received your EduNexa registration", text, html)

def _send_otp(user):
    code = issue_otp(user)
    text, html = render(display_name(user), [f"Your EduNexa verification code is {code}.", "It expires in 10 minutes. If you did not try to register, you can ignore this email."])
    return send_email(user.email, f"{code} is your EduNexa verification code", text, html)

def _unverified(email):
    return User.objects.filter(email__iexact=(email or "").strip(), is_active=False, profile__email_verified=False).first()

class RegisterView(APIView):
    """Public sign-up. With an email provider configured the user must first verify an OTP, then an admin must approve the account."""
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "register"
    @extend_schema(request=RegisterSerializer, responses=OpenApiTypes.OBJECT, summary="Request an account (email OTP, then admin approval)")
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        if settings.EMAIL_VERIFICATION:
            if not _send_otp(user):
                user.delete()
                return Response({"detail": "We could not send the verification email. Please try again in a few minutes."}, status=503)
            return Response({"detail": "We sent a 6-digit code to your email.", "verify": True, "email": user.email}, status=201)
        _announce_registration(user)
        return Response({"detail": "Registration received. An admin will review and approve your account.", "verify": False}, status=201)

class VerifyEmailView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "otp"
    @extend_schema(request=OpenApiTypes.OBJECT, responses=OpenApiTypes.OBJECT, summary="Verify the email OTP sent during registration")
    def post(self, request):
        user = _unverified(request.data.get("email"))
        if user is None:
            return Response({"detail": "There is no pending verification for this email."}, status=400)
        ok, message = check_otp(user, str(request.data.get("otp") or "").strip())
        if not ok:
            return Response({"detail": message}, status=400)
        user.profile.email_verified = True
        user.profile.save(update_fields=["email_verified"])
        _announce_registration(user)
        return Response({"detail": "Email verified. An admin will review your account."})

class ResendOtpView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "otp"
    @extend_schema(request=OpenApiTypes.OBJECT, responses=OpenApiTypes.OBJECT, summary="Send a new email OTP (once a minute)")
    def post(self, request):
        user = _unverified(request.data.get("email"))
        if user is None:
            return Response({"detail": "There is no pending verification for this email."}, status=400)
        if not can_resend(user):
            return Response({"detail": "Please wait a minute before asking for another code."}, status=429)
        if not _send_otp(user):
            return Response({"detail": "We could not send the email. Please try again shortly."}, status=503)
        return Response({"detail": "A new code has been sent."})

@extend_schema(request=OpenApiTypes.OBJECT, responses=OpenApiTypes.OBJECT, summary="Sign out: blacklist the refresh token")
@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
def logout(request):
    try:
        RefreshToken(request.data.get("refresh", "")).blacklist()
    except TokenError:
        pass
    return Response({"ok": True})
