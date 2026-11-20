import json

import pytest
from django.test import Client, override_settings

from imprint.models import Entitlement, GenerationJob, ProjectMember, PublishedSite, SiteVersion, SystemSetting
from tests.conftest import now_ms, rid, valid_doc

API = "/api/projects/{}"


def client(token: str | None = None) -> Client:
    c = Client()
    if token:
        c.cookies["is_session"] = token
    return c


def test_snapshot_reads_cannot_be_enabled_outside_debug():
    import os
    import subprocess
    import sys
    env = {**os.environ, "DJANGO_DEBUG": "0", "ALLOW_SNAPSHOT_READS": "1", "DJANGO_SECRET_KEY": "x" * 50}
    r = subprocess.run([sys.executable, "-c", "import django, os; os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings'); django.setup()"],
                       env=env, capture_output=True, text=True, cwd=str(__import__("pathlib").Path(__file__).resolve().parents[1]))
    assert r.returncode != 0 and "only allowed with DJANGO_DEBUG=1" in r.stderr


def test_healthz_needs_no_database():
    r = Client().get("/healthz")
    assert r.status_code == 200 and r.json()["ok"] is True
    assert r.headers["x-served-by"] == "python"


@pytest.mark.django_db
def test_readyz_reports_database_migrations_and_contracts():
    r = Client().get("/readyz")
    assert r.status_code == 200, r.json()
    assert r.json()["checks"] == {"database": "ok", "migrations": "ok", "contracts": "ok"}
    assert r.json()["dataset"] == "disposable" and r.json()["authority"] == "snapshot"  # pytest uses test_*


@pytest.mark.django_db
def test_unknown_api_route_is_json_404():
    r = Client().get("/api/nope")
    assert r.status_code == 404 and r.json() == {"error": "Not found"}


@pytest.mark.django_db
def test_config_shape_and_settings():
    SystemSetting.objects.create(key="hosting_fee_amount", value="4", updated_at=now_ms())
    SystemSetting.objects.create(key="hosting_fee_status", value="announced", updated_at=now_ms())
    r = Client().get("/api/config").json()
    assert [p["priceCents"] for p in r["prices"]] == [2000, 3000, 10000]
    assert r["hosting"]["amount"] == "4" and r["hosting"]["status"] == "announced"
    assert r["ai"]["perProjectLimit"] == 20 and r["payments"] == {"provider": "dodo", "configured": False, "mode": "test"}


@pytest.mark.django_db
class TestProjectRead:
    def test_requires_a_session(self, make_user, make_project):
        p = make_project(make_user())
        r = client().get(API.format(p.id))
        assert r.status_code == 401
        assert r.json() == {"error": "Please sign in to continue.", "code": "unauthenticated"}
        assert "WWW-Authenticate" not in r.headers

    def test_rejects_unknown_expired_and_oversized_tokens(self, make_user, make_project, login):
        u = make_user()
        p = make_project(u)
        expired = login(u, expires_in_ms=-1000)
        for token in ["not-a-session", expired, "x" * 101]:
            assert client(token).get(API.format(p.id)).status_code == 401

    def test_suspended_user_is_signed_out(self, make_user, make_project, login):
        u = make_user(status="suspended")
        assert client(login(u)).get(API.format(make_project(u).id)).status_code == 401

    def test_owner_reads_the_project_in_the_worker_shape(self, make_user, make_project, login):
        u = make_user()
        p = make_project(u, content_rights_ack_at=now_ms())
        r = client(login(u)).get(API.format(p.id))
        assert r.status_code == 200
        assert r.headers["cache-control"] == "no-store" and r.headers["x-content-type-options"] == "nosniff"
        body = r.json()
        assert set(body) == {"project", "intake", "doc", "publish", "entitlement", "versions", "ai", "payments"}
        assert body["project"] == {
            "id": p.id, "name": "Test project", "type": "business", "slug": p.slug, "templateId": "b-savanna",
            "status": "preview_ready", "revision": 3, "isDemo": False, "createdAt": p.created_at, "updatedAt": p.updated_at,
            "price": 3000, "contentRightsAck": True, "aiReviewAck": False,
        }
        assert body["intake"] == {"step": 2, "answers": {"businessName": "Kijani", "currency": "UGX"}, "completedAt": None}
        assert body["doc"] == valid_doc()
        assert body["publish"] is None and body["entitlement"] is None and body["versions"] == 0
        assert body["ai"] == {"available": False, "used": 0, "limit": 20}
        assert body["payments"] == {"configured": False, "mode": "test"}

    def test_members_can_read_and_strangers_get_404(self, make_user, make_project, login):
        owner, member, stranger = make_user(), make_user(), make_user()
        p = make_project(owner)
        ProjectMember.objects.create(project=p, user=member, role="editor", created_at=now_ms())
        assert client(login(member)).get(API.format(p.id)).status_code == 200
        r = client(login(stranger)).get(API.format(p.id))
        assert r.status_code == 404 and r.json() == {"error": "Project not found.", "code": "not_found"}

    def test_admins_do_not_bypass_ownership_on_this_route(self, make_user, make_project, login):
        p = make_project(make_user())
        assert client(login(make_user(role="admin"))).get(API.format(p.id)).status_code == 404

    def test_deleted_and_malformed_ids_are_404(self, make_user, make_project, login):
        u = make_user()
        token = login(u)
        gone = make_project(u, deleted_at=now_ms())
        assert client(token).get(API.format(gone.id)).status_code == 404
        assert client(token).get(API.format("prj_SHORT")).json()["code"] == "not_found"

    def test_invalid_stored_draft_is_served_as_null(self, make_user, make_project, login):
        u = make_user()
        doc = valid_doc()
        doc["pages"][0]["slug"] = "start"  # no home page
        p = make_project(u, draft=doc)
        assert client(login(u)).get(API.format(p.id)).json()["doc"] is None

    def test_publication_versions_and_ai_usage(self, make_user, make_project, login):
        u = make_user()
        p = make_project(u)
        t = now_ms()
        v1 = SiteVersion.objects.create(id=rid("ver"), project=p, version=1, doc_json="{}", created_at=t)
        v2 = SiteVersion.objects.create(id=rid("ver"), project=p, version=2, doc_json="{}", created_at=t + 1)
        PublishedSite.objects.create(project=p, slug=p.slug, current_version=v2, status="live", first_published_at=t, last_published_at=t + 1)
        GenerationJob.objects.create(id=rid("job"), project=p, user_id=u.id, kind="ai_copy", status="succeeded", created_at=t)
        GenerationJob.objects.create(id=rid("job"), project=p, user_id=u.id, kind="ai_copy", status="failed", created_at=t)
        GenerationJob.objects.create(id=rid("job"), project=p, user_id=u.id, kind="deterministic", status="succeeded", created_at=t)
        SystemSetting.objects.create(key="ai_generations_per_project", value="5", updated_at=t)
        with override_settings(PUBLIC_BASE_URL="https://sites.example/"):
            body = client(login(u)).get(API.format(p.id)).json()
        assert body["publish"] == {"status": "live", "version": 2, "versionId": v2.id, "firstPublishedAt": t,
                                   "lastPublishedAt": t + 1, "url": f"https://sites.example/s/{p.slug}/"}
        assert body["versions"] == 2 and v1.id
        assert body["ai"]["used"] == 1 and body["ai"]["limit"] == 5

    def test_test_mode_grants_do_not_count_in_live_mode(self, make_user, make_project, login):
        u = make_user()
        p = make_project(u)
        Entitlement.objects.create(id=rid("ent"), project=p, user=u, site_type="business", source="payment_test", status="active", created_at=now_ms())
        token = login(u)
        assert client(token).get(API.format(p.id)).json()["entitlement"] == {"source": "payment_test"}
        with override_settings(PAYMENTS_MODE="live"):
            assert client(token).get(API.format(p.id)).json()["entitlement"] == {"source": "payment_test", "invalidInThisMode": True}

    def test_revoked_grants_are_ignored(self, make_user, make_project, login):
        u = make_user()
        p = make_project(u)
        Entitlement.objects.create(id=rid("ent"), project=p, user=u, site_type="business", source="admin_demo", status="revoked", created_at=now_ms())
        assert client(login(u)).get(API.format(p.id)).json()["entitlement"] is None

    def test_snapshot_reads_fail_closed_unless_allowed(self, make_user, make_project, login):
        u = make_user()
        token = login(u)
        p = make_project(u)
        with override_settings(ALLOW_SNAPSHOT_READS=False):
            r = client(token).get(API.format(p.id))
            assert r.status_code == 503 and r.json()["code"] == "snapshot_not_authoritative"
            assert client().get(API.format(p.id)).status_code == 503  # refused before any session lookup
        assert client(token).get(API.format(p.id)).status_code == 200

    def test_only_get_is_served(self, make_user, make_project, login):
        u = make_user()
        r = client(login(u)).generic("PUT", API.format(make_project(u).id), json.dumps({}), content_type="application/json")
        assert r.status_code == 405
