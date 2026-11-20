"""Django settings for the ImprintSites AI Python backend.

All configuration comes from environment variables (optionally loaded from backend/.env, which is gitignored).
See backend/.env.example for the full list.
"""

import os
import secrets
from pathlib import Path
from urllib.parse import parse_qsl, unquote, urlsplit

from django.core.exceptions import ImproperlyConfigured

BASE_DIR = Path(__file__).resolve().parent.parent
REPO_ROOT = BASE_DIR.parent


def _load_dotenv(path: Path) -> None:
    """Minimal KEY=VALUE loader. Real environment variables always win over the file."""
    if not path.is_file():
        return
    for raw in path.read_text(encoding="utf-8-sig").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


_load_dotenv(BASE_DIR / ".env")


def env(name: str, default: str = "") -> str:
    return os.environ.get(name, default).strip()


DEBUG = env("DJANGO_DEBUG") == "1"

# Django signing is not used by this service (sessions are the Worker's legacy sessions), so a per-process
# key is acceptable in development. Outside DEBUG a real key is mandatory: no silent fallback (audit finding #10).
SECRET_KEY = env("DJANGO_SECRET_KEY") or (secrets.token_urlsafe(50) if DEBUG else "")
if not SECRET_KEY:
    raise ImproperlyConfigured("DJANGO_SECRET_KEY must be set when DJANGO_DEBUG is not 1.")

ALLOWED_HOSTS = [h.strip() for h in env("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1").split(",") if h.strip()]

INSTALLED_APPS = [
    "rest_framework",
    "imprint",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "imprint.middleware.ApiHeadersMiddleware",
]

ROOT_URLCONF = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"
APPEND_SLASH = False
TEMPLATES: list = []


def _database(url: str) -> dict:
    parts = urlsplit(url)
    if parts.scheme not in ("postgres", "postgresql"):
        raise ImproperlyConfigured("DATABASE_URL must be a postgresql:// URL.")
    host = parts.hostname or ""
    return {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": unquote(parts.path.lstrip("/")),
        "USER": unquote(parts.username or ""),
        "PASSWORD": unquote(parts.password or ""),
        "HOST": host,
        "PORT": str(parts.port or 5432),
        "OPTIONS": dict(parse_qsl(parts.query)),  # e.g. sslmode=require&channel_binding=require
        "CONN_MAX_AGE": 0 if "-pooler" in host else 60,
        "CONN_HEALTH_CHECKS": True,
        # Neon's pooled endpoint is PgBouncer in transaction mode, which cannot hold server-side cursors.
        "DISABLE_SERVER_SIDE_CURSORS": "-pooler" in host,
        "TEST": {"NAME": env("DATABASE_TEST_NAME") or None},
    }


DATABASE_URL = env("DATABASE_URL")
# Without DATABASE_URL the service still starts: /healthz and /api/config work, /readyz reports "not ready",
# and database-backed tests are skipped with a clear reason.
DATABASES = {"default": _database(DATABASE_URL) if DATABASE_URL else {"ENGINE": "django.db.backends.dummy"}}

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
USE_TZ = True
TIME_ZONE = "UTC"
LANGUAGE_CODE = "en"

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": ["imprint.auth.LegacySessionAuthentication"],
    "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.AllowAny"],
    "DEFAULT_RENDERER_CLASSES": ["rest_framework.renderers.JSONRenderer"],
    "DEFAULT_PARSER_CLASSES": ["rest_framework.parsers.JSONParser"],
    "EXCEPTION_HANDLER": "imprint.errors.exception_handler",
    "UNAUTHENTICATED_USER": None,
}

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {"console": {"class": "logging.StreamHandler"}},
    "root": {"handlers": ["console"], "level": "INFO"},
}

# ── Product settings shared with the Worker (same variable names as wrangler.jsonc / Worker secrets) ──
CONTRACTS_DIR = REPO_ROOT / "contracts"
APP_NAME = env("APP_NAME", "ImprintSites AI")
PUBLIC_BASE_URL = env("PUBLIC_BASE_URL")
PAYMENTS_MODE = "live" if env("PAYMENTS_MODE") == "live" else "test"
ADMIN_EMAILS = [e.strip().lower() for e in env("ADMIN_EMAILS").split(",") if e.strip()]
DODO_CONFIGURED = all(env(k) for k in ("DODO_API_KEY", "DODO_WEBHOOK_SECRET", "DODO_PRODUCT_PERSONAL", "DODO_PRODUCT_BUSINESS", "DODO_PRODUCT_ECOMMERCE"))
GOOGLE_ENABLED = bool(env("GOOGLE_CLIENT_ID") and env("GOOGLE_CLIENT_SECRET"))
EMAIL_CONFIGURED = bool(env("RESEND_API_KEY") and env("EMAIL_FROM"))
# Workers AI over its REST API (https://developers.cloudflare.com/workers-ai/get-started/rest-api/).
CLOUDFLARE_ACCOUNT_ID = env("CLOUDFLARE_ACCOUNT_ID")
CLOUDFLARE_AI_API_TOKEN = env("CLOUDFLARE_AI_API_TOKEN")
AI_MODEL = env("AI_MODEL", "@cf/meta/llama-3.3-70b-instruct-fp8-fast")
AI_CONFIGURED = bool(CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_AI_API_TOKEN)
# Media bytes are still stored and served by the Worker during the migration.
MEDIA_STORAGE = env("MEDIA_STORAGE", "d1")
