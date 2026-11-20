"""import_d1 against a synthetic SQLite database built from the real D1 migrations (migrations/*.sql)."""

import json
import sqlite3

import pytest
from django.conf import settings
from django.core.management import CommandError, call_command

from imprint.models import Project, ProjectMember, Session, SiteVersion, User
from tests.conftest import valid_doc

T = 1_763_000_000_000


@pytest.fixture
def d1_file(tmp_path):
    path = tmp_path / "d1.sqlite"
    db = sqlite3.connect(path)
    for sql in sorted((settings.REPO_ROOT / "migrations").glob("*.sql")):
        db.executescript(sql.read_text(encoding="utf-8"))
    db.execute("DELETE FROM system_settings")  # migrations seed settings; keep the test deterministic
    db.execute("INSERT INTO users (id, email, name, password_hash, email_verified, role, status, created_at, updated_at) VALUES ('usr_a', 'A@Test.example', 'Ama', 'pbkdf2$x', 1, 'customer', 'active', ?, ?)", (T, T))
    db.execute("INSERT INTO users (id, email, name, email_verified, role, status, created_at, updated_at) VALUES ('usr_b', 'b@test.example', 'Ben ☕', 0, 'customer', 'active', ?, ?)", (T, T))
    db.execute("INSERT INTO sessions (id, user_id, created_at, expires_at) VALUES ('ab12', 'usr_a', ?, ?)", (T, T + 1))
    db.execute("INSERT INTO projects (id, owner_id, site_type, name, slug, template_id, status, draft_json, draft_revision, created_at, updated_at) VALUES ('prj_aaaaaaaaaa1', 'usr_a', 'business', 'Café', 'cafe', 'b-savanna', 'published', ?, 4, ?, ?)", (json.dumps(valid_doc()), T, T))
    db.execute("INSERT INTO project_members (project_id, user_id, role, created_at) VALUES ('prj_aaaaaaaaaa1', 'usr_a', 'owner', ?), ('prj_aaaaaaaaaa1', 'usr_b', 'editor', ?)", (T, T))
    db.execute("INSERT INTO project_intake (project_id, step, data_json, updated_at) VALUES ('prj_aaaaaaaaaa1', 3, '{\"currency\":\"UGX\"}', ?)", (T,))
    db.execute("INSERT INTO site_versions (id, project_id, version, doc_json, created_at) VALUES ('ver_1', 'prj_aaaaaaaaaa1', 1, '{}', ?)", (T,))
    db.execute("INSERT INTO published_sites (project_id, slug, current_version_id, status, first_published_at, last_published_at) VALUES ('prj_aaaaaaaaaa1', 'cafe', 'ver_1', 'live', ?, ?)", (T, T))
    db.execute("INSERT INTO entitlements (id, project_id, user_id, site_type, source, status, created_at) VALUES ('ent_1', 'prj_aaaaaaaaaa1', 'usr_a', 'business', 'admin_demo', 'active', ?)", (T,))
    db.execute("INSERT INTO generation_jobs (id, project_id, user_id, kind, status, created_at) VALUES ('job_1', 'prj_aaaaaaaaaa1', 'usr_a', 'ai_copy', 'succeeded', ?)", (T,))
    db.execute("INSERT INTO system_settings (key, value, updated_at) VALUES ('hosting_fee_amount', '4', ?)", (T,))
    db.commit()
    db.close()
    return path


@pytest.mark.django_db(transaction=True)
def test_import_copies_and_verifies(d1_file, capsys):
    call_command("import_d1", sqlite=str(d1_file), yes=True)
    out = capsys.readouterr().out
    assert "MISMATCH" not in out and "Imported and verified" in out
    assert User.objects.count() == 2 and Session.objects.get().user_id == "usr_a"
    p = Project.objects.get()
    assert p.name == "Café" and json.loads(p.draft_json) == valid_doc() and p.draft_revision == 4
    assert ProjectMember.objects.filter(project=p).count() == 2
    assert SiteVersion.objects.get().project_id == p.id
    assert User.objects.get(id="usr_b").name == "Ben ☕"


@pytest.mark.django_db(transaction=True)
def test_import_is_repeatable(d1_file):
    call_command("import_d1", sqlite=str(d1_file), yes=True)
    call_command("import_d1", sqlite=str(d1_file), yes=True)
    assert Project.objects.count() == 1 and User.objects.count() == 2


@pytest.mark.django_db(transaction=True)
def test_import_requires_confirmation_and_dry_run_writes_nothing(d1_file):
    with pytest.raises(CommandError, match="--yes"):
        call_command("import_d1", sqlite=str(d1_file))
    call_command("import_d1", sqlite=str(d1_file), dry_run=True)
    assert Project.objects.count() == 0


def test_disposable_names():
    from imprint.views import is_disposable_database
    assert all(is_disposable_database(n) for n in ["test_neondb", "imprintsites_parity", "x_e2e", "a_disposable"])
    assert not any(is_disposable_database(n) for n in ["neondb", "imprintsites", "parity_main", "", "testdb"])


@pytest.mark.django_db(transaction=True)
def test_disposable_only_refuses_the_configured_database(d1_file, monkeypatch):
    from django.db import connection
    monkeypatch.setitem(connection.settings_dict, "NAME", "neondb")
    with pytest.raises(CommandError, match="Refusing"):
        call_command("import_d1", sqlite=str(d1_file), yes=True, disposable_only=True)


def test_missing_file_is_reported(tmp_path):
    with pytest.raises(CommandError, match="not found"):
        call_command("import_d1", sqlite=str(tmp_path / "missing.sqlite"), yes=True)
