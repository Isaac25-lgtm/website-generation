import json
import re
from datetime import UTC, datetime

from django.conf import settings
from django.db import connection
from django.db.migrations.executor import MigrationExecutor
from django.db.models import Q
from django.http import JsonResponse
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from . import contracts
from .errors import ApiError, body
from .models import Entitlement, GenerationJob, Project, ProjectIntake, ProjectMember, PublishedSite, SiteVersion, SystemSetting

PROJECT_ID = re.compile(r"prj_[a-z0-9]{10,30}")
DISPOSABLE_DB = re.compile(r"^test_|_(parity|e2e|disposable)$")


def is_disposable_database(name: str) -> bool:
    """Databases the test suites may overwrite: pytest's test_* databases and names ending in _parity/_e2e/_disposable."""
    return bool(DISPOSABLE_DB.search(name or ""))
JS_NUMBER = re.compile(r"[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?")


def iso_now() -> str:
    return datetime.now(UTC).isoformat(timespec="milliseconds").replace("+00:00", "Z")


def js_number(value: str):
    """JavaScript Number(value) for the decimal strings stored in system_settings (NaN becomes null, as in JSON)."""
    s = value.strip()
    if s == "":
        return 0
    if not JS_NUMBER.fullmatch(s):
        return None
    f = float(s)
    return int(f) if f.is_integer() else f


def setting(key: str, fallback: str) -> str:
    row = SystemSetting.objects.filter(key=key).values_list("value", flat=True).first()
    return fallback if row is None else row


def base_url(request) -> str:
    return settings.PUBLIC_BASE_URL.rstrip("/") or f"{request.scheme}://{request.get_host()}"


def allowed_entitlement_sources() -> list[str]:
    # Test-mode grants never count in live mode (src/worker/lib/site.ts activeEntitlement).
    return ["payment_live", "admin_demo"] if settings.PAYMENTS_MODE == "live" else ["payment_live", "payment_test", "admin_demo"]


def api_not_found(request, *args, **kwargs):
    return JsonResponse(body("Not found"), status=404)


class HealthView(APIView):
    """Liveness: the process is up. Does not touch the database."""

    authentication_classes: list = []
    permission_classes: list = []

    def get(self, request):
        return Response({"ok": True, "service": "imprintsites-backend", "time": iso_now()})


class ReadyView(APIView):
    """Readiness: database reachable, migrations applied, contracts loadable. 503 until all pass."""

    authentication_classes: list = []
    permission_classes: list = []

    def get(self, request):
        checks: dict[str, str] = {}
        if settings.DATABASES["default"]["ENGINE"].endswith("dummy"):
            checks["database"] = "not_configured"
            checks["migrations"] = "unknown"
        else:
            try:
                with connection.cursor() as cur:
                    cur.execute("SELECT 1")
                checks["database"] = "ok"
                executor = MigrationExecutor(connection)
                pending = executor.migration_plan(executor.loader.graph.leaf_nodes())
                checks["migrations"] = "ok" if not pending else f"{len(pending)} pending"
            except Exception:  # noqa: BLE001 - readiness reports, never raises
                checks.setdefault("database", "unreachable")
                checks.setdefault("migrations", "unknown")
        try:
            contracts.sitedoc_validator()
            contracts.public_config()
            checks["contracts"] = "ok"
        except Exception:  # noqa: BLE001
            checks["contracts"] = "unreadable"
        ok = all(v == "ok" for v in checks.values())
        return Response({
            "ok": ok, "checks": checks, "time": iso_now(),
            # Lets test suites confirm they're talking to a server on a disposable database before replacing data.
            "dataset": "disposable" if is_disposable_database(settings.DATABASES["default"].get("NAME", "")) else "configured",
            "authority": settings.READ_PATH_AUTHORITY, "privateReads": settings.ALLOW_SNAPSHOT_READS,
        }, status=200 if ok else 503)


class ConfigView(APIView):
    """Public configuration, same shape as the Worker's GET /api/config.

    Capability flags describe what this Python service can do itself (for example, AI is "available" only when
    Workers AI REST credentials are configured here). Browser Run stays on the Worker.
    """

    authentication_classes: list = []
    permission_classes: list = []
    KEYS = ["hosting_fee_status", "hosting_fee_amount", "hosting_fee_amount_personal", "hosting_fee_amount_business",
            "hosting_fee_amount_ecommerce", "hosting_fee_currency", "hosting_fee_interval",
            "operator_display_name", "operator_status_note", "support_email", "ai_generations_per_project"]

    def get(self, request):
        s = dict(SystemSetting.objects.filter(key__in=self.KEYS).values_list("key", "value"))
        cfg = contracts.public_config()
        return Response({
            "appName": settings.APP_NAME,
            "prices": cfg["plans"],
            "payments": {"provider": "dodo", "configured": settings.DODO_CONFIGURED, "mode": settings.PAYMENTS_MODE},
            "ai": {"available": settings.AI_CONFIGURED, "perProjectLimit": js_number(s.get("ai_generations_per_project") or "20")},
            "google": {"enabled": settings.GOOGLE_ENABLED},
            "browserRun": {"bound": False},
            "email": {"configured": settings.EMAIL_CONFIGURED},
            "storage": settings.MEDIA_STORAGE,
            "hosting": {
                "status": s.get("hosting_fee_status") or "not_set", "amount": s.get("hosting_fee_amount") or "",
                "amounts": {t: s.get(f"hosting_fee_amount_{t}") or "" for t in ("personal", "business", "ecommerce")},
                "currency": s.get("hosting_fee_currency") or "", "interval": s.get("hosting_fee_interval") or "",
            },
            "operator": {
                "name": s.get("operator_display_name") or "Motion Imprints Technologies",
                "note": s.get("operator_status_note") or "", "supportEmail": s.get("support_email") or "",
            },
            "demos": cfg["demos"],
        })


class ProjectDetailView(APIView):
    """GET /api/projects/<id> with the Worker's response shape (src/worker/routes/projects.ts)."""

    permission_classes = [IsAuthenticated]

    def initial(self, request, *args, **kwargs):
        # Fail closed before touching sessions: snapshot data can be stale for logouts, suspensions and membership changes.
        if not settings.ALLOW_SNAPSHOT_READS:
            raise ApiError(503, "This service is reading a data snapshot and doesn't serve private data. Use the main API.", "snapshot_not_authoritative")
        super().initial(request, *args, **kwargs)

    def get(self, request, project_id: str):
        user = request.user
        if not PROJECT_ID.fullmatch(project_id):
            raise ApiError(404, "Project not found.", "not_found")
        member_of = ProjectMember.objects.filter(user_id=user.id).values("project_id")
        p = (Project.objects.filter(id=project_id, deleted_at__isnull=True)
             .filter(Q(owner_id=user.id) | Q(id__in=member_of)).first())
        if p is None:
            raise ApiError(404, "Project not found.", "not_found")

        intake = ProjectIntake.objects.filter(project_id=p.id).first()
        pub = PublishedSite.objects.select_related("current_version").filter(project_id=p.id).first()
        valid = (Entitlement.objects.filter(project_id=p.id, status="active", source__in=allowed_entitlement_sources())
                 .order_by("-created_at").first())
        latest = Entitlement.objects.filter(project_id=p.id, status="active").order_by("-created_at").first()
        versions = SiteVersion.objects.filter(project_id=p.id).count()
        ai_used = GenerationJob.objects.filter(project_id=p.id, kind__in=["ai_copy", "ai_refine"], status="succeeded").count()

        if valid:
            entitlement = {"source": valid.source}
        elif latest:
            entitlement = {"source": latest.source, "invalidInThisMode": True}
        else:
            entitlement = None

        publish = None
        if pub:
            cv = pub.current_version
            publish = {
                "status": pub.status, "version": cv.version if cv else None, "versionId": cv.id if cv else None,
                "firstPublishedAt": pub.first_published_at, "lastPublishedAt": pub.last_published_at,
                "url": f"{base_url(request)}/s/{p.slug}/",
            }

        return Response({
            "project": {
                "id": p.id, "name": p.name, "type": p.site_type, "slug": p.slug, "templateId": p.template_id,
                "status": p.status, "revision": p.draft_revision, "isDemo": bool(p.is_demo),
                "createdAt": p.created_at, "updatedAt": p.updated_at, "price": contracts.plan_price_cents(p.site_type),
                "contentRightsAck": bool(p.content_rights_ack_at), "aiReviewAck": bool(p.ai_review_ack_at),
            },
            "intake": ({"step": intake.step, "answers": contracts.strip_owner_photos(json.loads(intake.data_json or "{}")), "completedAt": intake.completed_at}
                       if intake else {"step": 0, "answers": {}}),
            "doc": contracts.draft_doc(p.draft_json),
            "publish": publish,
            "entitlement": entitlement,
            "versions": versions,
            "ai": {"available": settings.AI_CONFIGURED, "used": ai_used,
                   "limit": js_number(setting("ai_generations_per_project", "20"))},
            "payments": {"configured": settings.DODO_CONFIGURED, "mode": settings.PAYMENTS_MODE},
        })
