"""Compatibility with the Worker's sessions (src/worker/lib/auth.ts).

The browser holds a random token in the `is_session` cookie; the database stores only sha256(token) as hex.
A session is valid while it exists, has not expired and its user is active. Python never issues sessions yet:
sign-in stays on the Worker until identity is migrated (handoff step 3).
"""

import hashlib
import time
from dataclasses import dataclass

from django.conf import settings
from rest_framework.authentication import BaseAuthentication

from .models import Session

SESSION_COOKIE = "is_session"


def now_ms() -> int:
    return int(time.time() * 1000)


@dataclass(frozen=True)
class SessionUser:
    id: str
    email: str
    name: str
    role: str
    email_verified: int
    status: str
    google_sub: str | None
    has_password: bool
    is_admin: bool
    is_authenticated: bool = True


def is_admin_email(email: str, verified: int) -> bool:
    return bool(verified) and email.lower() in settings.ADMIN_EMAILS


def load_user(token: str | None) -> SessionUser | None:
    if not token or len(token) > 100:
        return None
    session_id = hashlib.sha256(token.encode("utf-8")).hexdigest()
    row = Session.objects.select_related("user").filter(id=session_id).first()
    if row is None or row.expires_at < now_ms() or row.user.status != "active":
        return None
    u = row.user
    return SessionUser(
        id=u.id, email=u.email, name=u.name, role=u.role, email_verified=u.email_verified, status=u.status,
        google_sub=u.google_sub, has_password=u.password_hash is not None,
        is_admin=u.role == "admin" or is_admin_email(u.email, u.email_verified),
    )


class LegacySessionAuthentication(BaseAuthentication):
    def authenticate(self, request):
        user = load_user(request.COOKIES.get(SESSION_COOKIE))
        return (user, None) if user else None

    def authenticate_header(self, request):
        # Makes DRF answer 401 (not 403) for anonymous requests; the header itself is removed in errors.py
        # because the Worker does not send one.
        return "Session"
