import secrets
from datetime import timedelta
from django.utils import timezone
from django.utils.crypto import constant_time_compare, salted_hmac
from .models import EmailOTP

TTL = timedelta(minutes=10)
RESEND_AFTER = timedelta(seconds=60)
MAX_ATTEMPTS = 5

def _hash(user, code):
    return salted_hmac("edunexa.otp", f"{user.pk}:{code}").hexdigest()

def issue_otp(user):
    """Create a fresh 6-digit code. Only a keyed hash is stored, never the code itself."""
    code = f"{secrets.randbelow(10 ** 6):06d}"
    EmailOTP.objects.update_or_create(user=user, defaults={"code_hash": _hash(user, code), "sent_at": timezone.now(), "attempts": 0})
    return code

def can_resend(user):
    otp = EmailOTP.objects.filter(user=user).first()
    return otp is None or timezone.now() - otp.sent_at >= RESEND_AFTER

def check_otp(user, code):
    otp = EmailOTP.objects.filter(user=user).first()
    if otp is None:
        return False, "There is no active code. Please request a new one."
    if timezone.now() - otp.sent_at > TTL:
        otp.delete()
        return False, "This code has expired. Please request a new one."
    if otp.attempts >= MAX_ATTEMPTS:
        return False, "Too many wrong attempts. Please request a new code."
    if constant_time_compare(otp.code_hash, _hash(user, code)):
        otp.delete()
        return True, ""
    otp.attempts += 1
    otp.save(update_fields=["attempts"])
    left = MAX_ATTEMPTS - otp.attempts
    return False, f"Wrong code. {left} attempt{'s' if left != 1 else ''} left." if left else "Too many wrong attempts. Please request a new code."
