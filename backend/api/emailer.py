import json
import logging
import os
import urllib.request
from html import escape
from django.conf import settings
from django.core.mail import send_mail

log = logging.getLogger(__name__)

def render(name, lines, cta=None):
    """Return (plain text, html) for a simple branded email."""
    text = "\n\n".join([f"Hi {name},"] + lines + ([f"{cta[0]}: {cta[1]}"] if cta else []) + ["EduNexa, One Platform. Every Institution."])
    body = "".join(f'<p style="margin:0 0 14px;line-height:1.55">{escape(l)}</p>' for l in lines)
    button = f'<p><a href="{escape(cta[1])}" style="display:inline-block;background:#4f46e5;color:#fff;padding:12px 22px;border-radius:10px;text-decoration:none;font-weight:600">{escape(cta[0])}</a></p>' if cta else ""
    local = any(h in settings.FRONTEND_URL for h in ("localhost", "127.0.0.1"))
    logo = '' if local else f'<img src="{settings.FRONTEND_URL}/logo-email.png" width="44" height="44" alt="" style="vertical-align:middle;border-radius:10px;margin-right:10px">'
    html = (f'<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:24px;color:#1f1d3a">'
            f'<h2 style="color:#4f46e5;margin:0 0 18px">{logo}EduNexa</h2><p style="margin:0 0 14px">Hi {escape(name)},</p>{body}{button}'
            f'<p style="color:#6b6a85;font-size:13px;margin-top:28px">One Platform. Every Institution.</p></div>')
    return text, html

def send_email(to, subject, text, html=None):
    """Send through the Brevo HTTP API when BREVO_API_KEY is set (works on Render free), else Django's configured backend. Never raises."""
    key = os.getenv("BREVO_API_KEY")
    if key:
        payload = {"sender": {"name": "EduNexa", "email": settings.EMAIL_FROM}, "to": [{"email": to}], "subject": subject, "textContent": text}
        if html:
            payload["htmlContent"] = html
        req = urllib.request.Request("https://api.brevo.com/v3/smtp/email", data=json.dumps(payload).encode(), method="POST",
                                     headers={"api-key": key, "content-type": "application/json", "accept": "application/json"})
        try:
            urllib.request.urlopen(req, timeout=15).read()
            return True
        except Exception:
            log.exception("Brevo email to %s failed", to)
            return False
    try:
        send_mail(subject, text, settings.EMAIL_FROM, [to], html_message=html)
        return True
    except Exception:
        log.exception("Email to %s failed", to)
        return False
