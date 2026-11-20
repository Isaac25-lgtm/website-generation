"""PostgreSQL models for the read path, mirroring the D1 tables in migrations/0001_initial.sql.

Table and column names, string ids and integer millisecond timestamps are kept exactly as in D1, so data
copies without transformation (see `manage.py import_d1`) and both implementations can be compared row by row.
Documents (draft_json, doc_json, data_json) stay as the original JSON text so byte-level checksums match.
Python is a read-only copy for now: the Worker remains the single writer for every domain.
"""

from django.db import models
from django.db.models import Q
from django.db.models.functions import Lower

SITE_TYPES = ("personal", "business", "ecommerce")


class User(models.Model):
    id = models.TextField(primary_key=True)
    email = models.TextField()
    name = models.TextField(default="")
    password_hash = models.TextField(null=True)  # legacy PBKDF2 format; null for Google-only accounts
    google_sub = models.TextField(null=True, unique=True)
    email_verified = models.IntegerField(default=0)
    role = models.TextField(default="customer")
    status = models.TextField(default="active")
    avatar_url = models.TextField(null=True)
    created_at = models.BigIntegerField()
    updated_at = models.BigIntegerField()

    class Meta:
        db_table = "users"
        constraints = [
            models.UniqueConstraint(Lower("email"), name="users_email_ci_unique"),  # D1: UNIQUE COLLATE NOCASE
            models.CheckConstraint(condition=Q(role__in=["customer", "admin"]), name="users_role_valid"),
            models.CheckConstraint(condition=Q(status__in=["active", "suspended", "deleted"]), name="users_status_valid"),
        ]


class Session(models.Model):
    id = models.TextField(primary_key=True)  # sha256(token) hex; the raw token is only in the is_session cookie
    user = models.ForeignKey(User, on_delete=models.CASCADE, db_column="user_id", related_name="sessions")
    created_at = models.BigIntegerField()
    expires_at = models.BigIntegerField()
    ip_hash = models.TextField(null=True)
    user_agent = models.TextField(null=True)

    class Meta:
        db_table = "sessions"


class Project(models.Model):
    id = models.TextField(primary_key=True)
    owner = models.ForeignKey(User, on_delete=models.PROTECT, db_column="owner_id", related_name="owned_projects")
    team_id = models.TextField(null=True)  # teams are not used yet
    site_type = models.TextField()
    name = models.TextField()
    slug = models.TextField(unique=True)
    template_id = models.TextField()
    status = models.TextField(default="draft")
    draft_json = models.TextField(null=True)
    draft_revision = models.IntegerField(default=0)
    is_demo = models.IntegerField(default=0)
    content_rights_ack_at = models.BigIntegerField(null=True)
    ai_review_ack_at = models.BigIntegerField(null=True)
    created_at = models.BigIntegerField()
    updated_at = models.BigIntegerField()
    deleted_at = models.BigIntegerField(null=True)

    class Meta:
        db_table = "projects"
        constraints = [
            models.CheckConstraint(condition=Q(site_type__in=SITE_TYPES), name="projects_site_type_valid"),
            models.CheckConstraint(
                condition=Q(status__in=["draft", "generating", "preview_ready", "payment_pending", "published", "suspended", "deleted"]),
                name="projects_status_valid",
            ),
        ]


class ProjectMember(models.Model):
    pk = models.CompositePrimaryKey("project_id", "user_id")
    project = models.ForeignKey(Project, on_delete=models.CASCADE, db_column="project_id", related_name="members")
    user = models.ForeignKey(User, on_delete=models.CASCADE, db_column="user_id", related_name="memberships")
    role = models.TextField()
    created_at = models.BigIntegerField()

    class Meta:
        db_table = "project_members"
        constraints = [models.CheckConstraint(condition=Q(role__in=["owner", "editor", "staff"]), name="members_role_valid")]


class ProjectIntake(models.Model):
    project = models.OneToOneField(Project, on_delete=models.CASCADE, primary_key=True, db_column="project_id", related_name="intake")
    step = models.IntegerField(default=0)
    data_json = models.TextField(default="{}")
    completed_at = models.BigIntegerField(null=True)
    updated_at = models.BigIntegerField()

    class Meta:
        db_table = "project_intake"


class SiteVersion(models.Model):
    id = models.TextField(primary_key=True)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, db_column="project_id", related_name="versions")
    version = models.IntegerField()
    doc_json = models.TextField()
    created_by = models.TextField(null=True)
    created_at = models.BigIntegerField()
    note = models.TextField(null=True)

    class Meta:
        db_table = "site_versions"
        constraints = [models.UniqueConstraint(fields=["project", "version"], name="site_versions_project_version_unique")]


class PublishedSite(models.Model):
    project = models.OneToOneField(Project, on_delete=models.CASCADE, primary_key=True, db_column="project_id", related_name="published")
    slug = models.TextField(unique=True)
    current_version = models.ForeignKey(SiteVersion, on_delete=models.PROTECT, null=True, db_column="current_version_id", related_name="+")
    status = models.TextField()
    first_published_at = models.BigIntegerField()
    last_published_at = models.BigIntegerField()

    class Meta:
        db_table = "published_sites"
        constraints = [models.CheckConstraint(condition=Q(status__in=["live", "unpublished", "suspended"]), name="published_status_valid")]


class Entitlement(models.Model):
    id = models.TextField(primary_key=True)
    project = models.ForeignKey(Project, on_delete=models.PROTECT, db_column="project_id", related_name="entitlements")
    user = models.ForeignKey(User, on_delete=models.PROTECT, db_column="user_id", related_name="entitlements")
    site_type = models.TextField()
    source = models.TextField()
    payment_id = models.TextField(null=True)
    granted_by = models.TextField(null=True)
    reason = models.TextField(null=True)
    status = models.TextField()
    created_at = models.BigIntegerField()
    revoked_at = models.BigIntegerField(null=True)

    class Meta:
        db_table = "entitlements"
        constraints = [
            models.CheckConstraint(condition=Q(source__in=["payment_live", "payment_test", "admin_demo"]), name="entitlements_source_valid"),
            models.CheckConstraint(condition=Q(status__in=["active", "revoked"]), name="entitlements_status_valid"),
        ]


class GenerationJob(models.Model):
    id = models.TextField(primary_key=True)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, db_column="project_id", related_name="generation_jobs")
    user_id = models.TextField()  # no foreign key in D1 either
    kind = models.TextField()
    status = models.TextField()
    provider = models.TextField(null=True)
    model = models.TextField(null=True)
    input_tokens = models.IntegerField(null=True)
    output_tokens = models.IntegerField(null=True)
    error = models.TextField(null=True)
    created_at = models.BigIntegerField()
    finished_at = models.BigIntegerField(null=True)

    class Meta:
        db_table = "generation_jobs"
        constraints = [
            models.CheckConstraint(condition=Q(kind__in=["deterministic", "ai_copy", "ai_refine", "rule_refine"]), name="jobs_kind_valid"),
            models.CheckConstraint(condition=Q(status__in=["running", "succeeded", "failed"]), name="jobs_status_valid"),
        ]


class SystemSetting(models.Model):
    key = models.TextField(primary_key=True)
    value = models.TextField()
    updated_by = models.TextField(null=True)
    updated_at = models.BigIntegerField()

    class Meta:
        db_table = "system_settings"


# Copy order for the importer. All foreign keys are DEFERRABLE INITIALLY DEFERRED in PostgreSQL, so order only
# affects readability; the checksum comparison covers every table.
READ_PATH_MODELS = [User, Session, Project, ProjectMember, ProjectIntake, SiteVersion, PublishedSite, Entitlement, GenerationJob, SystemSetting]
