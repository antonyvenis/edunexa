from rest_framework import serializers

def make_serializer(model):
    ro = ["attendance"] if model.__name__ == "Student" else []  # auto-calculated from daily records
    meta = type("Meta", (), {"model": model, "fields": "__all__", "read_only_fields": ro})
    return type(model.__name__ + "Serializer", (serializers.ModelSerializer,), {"Meta": meta})

from datetime import date
from .models import Book, BookLoan, Notification

class BookSerializer(serializers.ModelSerializer):
    available = serializers.IntegerField(read_only=True)
    class Meta:
        model = Book
        fields = "__all__"

class LoanSerializer(serializers.ModelSerializer):
    fine = serializers.SerializerMethodField()  # Rs. 5 per day late
    class Meta:
        model = BookLoan
        fields = "__all__"
    def get_fine(self, o):
        return max(0, ((o.returned_on or date.today()) - o.due_on).days) * 5
    def validate(self, attrs):
        if self.instance is None and attrs["book"].available <= 0:
            raise serializers.ValidationError("No copies of this book are available.")
        return attrs

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ("id", "title", "body", "kind", "created_at", "read")

from .models import HostelAllocation, HostelRoom, Message

def display_name(u):
    return u.get_full_name() or u.username

class HostelRoomSerializer(serializers.ModelSerializer):
    occupied = serializers.IntegerField(read_only=True)
    class Meta:
        model = HostelRoom
        fields = "__all__"

class AllocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = HostelAllocation
        fields = "__all__"
    def validate(self, attrs):
        if self.instance is None and attrs["room"].occupied >= attrs["room"].capacity:
            raise serializers.ValidationError("This room is already full.")
        return attrs

class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField()
    recipient_name = serializers.SerializerMethodField()
    class Meta:
        model = Message
        fields = ("id", "sender", "recipient", "sender_name", "recipient_name", "body", "created_at", "read")
        read_only_fields = ("sender", "created_at", "read")
    def get_sender_name(self, o):
        return display_name(o.sender)
    def get_recipient_name(self, o):
        return display_name(o.recipient)

from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from .models import Profile, Student

import re
from django.conf import settings

def clean_mobile(v):
    v = re.sub(r"[\s-]", "", v or "")
    if not re.fullmatch(r"\+?\d{10,14}", v):
        raise serializers.ValidationError({"mobile": "Enter a valid mobile number, for example 9840012345."})
    return v

KID_ROLES = ("student", "parent")

class UserAdminSerializer(serializers.Serializer):
    """Admin-only account management: a User plus its Profile (role and linked student)."""
    id = serializers.IntegerField(read_only=True)
    username = serializers.CharField(max_length=150)
    first_name = serializers.CharField(required=False, allow_blank=True, default="")
    last_name = serializers.CharField(required=False, allow_blank=True, default="")
    email = serializers.EmailField(required=False, allow_blank=True, default="")
    mobile = serializers.CharField(required=False, allow_blank=True, default="", max_length=16)
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    role = serializers.ChoiceField(choices=["admin", "teacher", "student", "parent"])
    student = serializers.PrimaryKeyRelatedField(queryset=Student.objects.all(), allow_null=True, required=False)

    def to_representation(self, u):
        p = getattr(u, "profile", None)
        return {"id": u.id, "username": u.username, "first_name": u.first_name, "last_name": u.last_name, "email": u.email,
                "mobile": p.mobile if p else "", "is_active": u.is_active, "email_verified": p.email_verified if p else True,
                "role": "admin" if u.is_superuser else (p.role if p else None), "student": p.student_id if p else None}

    def validate(self, a):
        role, student, password = a.get("role"), a.get("student"), a.get("password") or ""
        if self.instance is None and not password:
            raise serializers.ValidationError({"password": "Password is required."})
        if role in KID_ROLES and student is None and not (self.instance and getattr(self.instance, "profile", None) and self.instance.profile.student_id):
            raise serializers.ValidationError({"student": "Choose the student this account belongs to."})
        name = a.get("username")
        if name and User.objects.filter(username__iexact=name).exclude(pk=getattr(self.instance, "pk", None)).exists():
            raise serializers.ValidationError({"username": "This username is already taken."})
        if a.get("mobile"):
            a["mobile"] = clean_mobile(a["mobile"])
        mail = a.get("email")
        if mail and User.objects.filter(email__iexact=mail).exclude(pk=getattr(self.instance, "pk", None)).exists():
            raise serializers.ValidationError({"email": "This email is already used by another account."})
        if password:
            try:
                validate_password(password, self.instance)
            except DjangoValidationError as e:
                raise serializers.ValidationError({"password": list(e.messages)})
        return a

    def _profile(self, user, a):
        role = a["role"]
        student = a.get("student") if role in KID_ROLES else None
        if role in KID_ROLES and student is None:
            student = user.profile.student
        mobile = a["mobile"] if "mobile" in a else getattr(getattr(user, "profile", None), "mobile", "")
        Profile.objects.update_or_create(user=user, defaults={"role": role, "student": student, "mobile": mobile})

    def create(self, a):
        user = User.objects.create_user(a["username"], email=a.get("email", ""), password=a["password"], first_name=a.get("first_name", ""), last_name=a.get("last_name", ""))
        self._profile(user, a)
        return user

    def update(self, user, a):
        user.username = a.get("username", user.username)
        user.first_name = a.get("first_name", user.first_name)
        user.last_name = a.get("last_name", user.last_name)
        user.email = a.get("email", user.email)
        if a.get("password"):
            user.set_password(a["password"])
        user.save()
        self._profile(user, a)
        return user


class RegisterSerializer(serializers.Serializer):
    """Public sign-up. The account is created inactive and an admin must approve it."""
    first_name = serializers.CharField(max_length=60)
    last_name = serializers.CharField(max_length=60, required=False, allow_blank=True, default="")
    email = serializers.EmailField()
    mobile = serializers.CharField(max_length=20)
    password = serializers.CharField(write_only=True)
    role = serializers.ChoiceField(choices=["student", "teacher", "parent", "admin"])
    roll_no = serializers.CharField(required=False, allow_blank=True, default="")

    def validate_email(self, v):
        v = v.strip().lower()
        User.objects.filter(email__iexact=v, is_active=False, profile__email_verified=False).delete()  # abandoned, never verified
        if User.objects.filter(email__iexact=v).exists() or User.objects.filter(username__iexact=v).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return v

    def validate(self, a):
        a["mobile"] = clean_mobile(a["mobile"])
        if a["role"] in KID_ROLES:
            roll = (a.get("roll_no") or "").strip()
            if not roll:
                raise serializers.ValidationError({"roll_no": "Enter the roll number."})
            student = Student.objects.filter(roll_no__iexact=roll).first()
            if student is None:
                raise serializers.ValidationError({"roll_no": "No student found with this roll number."})
            if a["role"] == "student" and Profile.objects.filter(student=student, role="student").exists():
                raise serializers.ValidationError({"roll_no": "This student already has an account."})
            a["student_obj"] = student
        try:
            validate_password(a["password"], User(username=a["email"], email=a["email"], first_name=a["first_name"], last_name=a.get("last_name", "")))
        except DjangoValidationError as e:
            raise serializers.ValidationError({"password": list(e.messages)})
        return a

    def create(self, a):
        user = User.objects.create_user(a["email"], email=a["email"], password=a["password"], first_name=a["first_name"], last_name=a.get("last_name", ""), is_active=False)
        Profile.objects.create(user=user, role=a["role"], student=a.get("student_obj"), mobile=a["mobile"], email_verified=not settings.EMAIL_VERIFICATION)
        return user
