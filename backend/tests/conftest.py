import hashlib
import json
import secrets
import time

import pytest
from django.conf import settings

from imprint.models import Project, ProjectIntake, Session, User

FIXTURES = settings.CONTRACTS_DIR / "fixtures" / "sitedoc"


def pytest_collection_modifyitems(config, items):
    if settings.DATABASES["default"]["ENGINE"].endswith("dummy"):
        skip = pytest.mark.skip(reason="DATABASE_URL is not set; see backend/README.md")
        for item in items:
            if "django_db" in item.keywords:
                item.add_marker(skip)


def now_ms() -> int:
    return int(time.time() * 1000)


def rid(prefix: str) -> str:
    return f"{prefix}_{secrets.token_hex(8)}"


def valid_doc(name: str = "b-savanna") -> dict:
    return json.loads((FIXTURES / "valid" / f"{name}.json").read_text(encoding="utf-8"))


@pytest.fixture
def make_user(db):
    def make(email: str | None = None, status: str = "active", role: str = "customer") -> User:
        t = now_ms()
        return User.objects.create(id=rid("usr"), email=email or f"{rid('u')}@test.example", name="Test", role=role,
                                   status=status, email_verified=1, password_hash="pbkdf2$synthetic", created_at=t, updated_at=t)
    return make


@pytest.fixture
def login(db):
    """Creates a Worker-format session (sha256 of the cookie token) and returns the raw cookie token."""
    def make(user: User, expires_in_ms: int = 3_600_000) -> str:
        token = secrets.token_urlsafe(32)
        t = now_ms()
        Session.objects.create(id=hashlib.sha256(token.encode()).hexdigest(), user=user, created_at=t, expires_at=t + expires_in_ms)
        return token
    return make


@pytest.fixture
def make_project(db):
    def make(owner: User, site_type: str = "business", draft: dict | str | None = "default", **extra) -> Project:
        t = now_ms()
        if draft == "default":
            draft = valid_doc()
        p = Project.objects.create(
            id="prj_" + secrets.token_hex(8), owner=owner, site_type=site_type, name="Test project", slug=rid("site").replace("_", "-"),
            template_id="b-savanna", status="preview_ready", draft_json=json.dumps(draft) if isinstance(draft, dict) else draft,
            draft_revision=3, created_at=t, updated_at=t, **extra,
        )
        ProjectIntake.objects.create(project=p, step=2, data_json=json.dumps({"businessName": "Kijani", "currency": "UGX"}), updated_at=t)
        return p
    return make
