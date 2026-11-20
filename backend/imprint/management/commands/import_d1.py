"""Copy the read-path tables from a local D1 database file into PostgreSQL.

    python manage.py import_d1 [--sqlite PATH] [--dry-run] [--yes]

The target tables are replaced in one transaction, and the copy is verified by comparing a row count and a
SHA-256 checksum per table between source and target before committing. Any mismatch rolls back.
Only local SQLite files are read (Wrangler's .wrangler/state). This never touches production D1.
"""

import hashlib
import json
import sqlite3
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import connection, models, transaction

from imprint.contracts import draft_doc
from imprint.models import READ_PATH_MODELS, Project

BATCH = 500


def columns(model) -> list[str]:
    return [f.column for f in model._meta.local_concrete_fields if getattr(f, "column", None)
            and not isinstance(f, models.CompositePrimaryKey)]


def table_digest(rows) -> tuple[int, str]:
    h = hashlib.sha256()
    n = 0
    for row in sorted(rows, key=repr):
        h.update(json.dumps(list(row), ensure_ascii=False, separators=(",", ":")).encode("utf-8"))
        h.update(b"\n")
        n += 1
    return n, h.hexdigest()


def find_local_d1() -> Path:
    root = settings.REPO_ROOT / ".wrangler" / "state" / "v3" / "d1" / "miniflare-D1DatabaseObject"
    candidates = []
    for f in root.glob("*.sqlite"):
        try:
            with sqlite3.connect(f"file:{f.as_posix()}?mode=ro", uri=True) as c:
                if c.execute("SELECT 1 FROM sqlite_master WHERE type='table' AND name='projects'").fetchone():
                    candidates.append(f)
        except sqlite3.Error:
            continue
    if not candidates:
        raise CommandError(f"No local D1 database found under {root}. Run `npm run db:migrate:local` (or the Worker locally) first, or pass --sqlite.")
    return max(candidates, key=lambda p: p.stat().st_mtime)


class Command(BaseCommand):
    help = "Replace the PostgreSQL read-path tables with a verified copy of a local D1 (SQLite) database."

    def add_arguments(self, parser):
        parser.add_argument("--sqlite", help="Path to the D1 .sqlite file (default: newest local Wrangler D1 database).")
        parser.add_argument("--dry-run", action="store_true", help="Report what would be copied without writing.")
        parser.add_argument("--yes", action="store_true", help="Confirm replacing the target tables (required unless --dry-run).")

    def handle(self, *args, **opts):
        path = Path(opts["sqlite"]) if opts["sqlite"] else find_local_d1()
        if not path.is_file():
            raise CommandError(f"SQLite file not found: {path}")
        db = connection.settings_dict
        self.stdout.write(f"Source: {path}")
        self.stdout.write(f"Target: {db.get('HOST')}/{db.get('NAME')}")
        if not opts["dry_run"] and not opts["yes"]:
            raise CommandError("This replaces the target tables. Re-run with --yes to confirm, or use --dry-run.")

        src = sqlite3.connect(f"file:{path.as_posix()}?mode=ro", uri=True)
        try:
            source = {}
            for model in READ_PATH_MODELS:
                table, cols = model._meta.db_table, columns(model)
                try:
                    source[table] = (cols, src.execute(f"SELECT {', '.join(cols)} FROM {table}").fetchall())
                except sqlite3.Error as e:
                    raise CommandError(f"Cannot read {table} from {path.name}: {e}") from e
        finally:
            src.close()

        draft_col = source["projects"][0].index("draft_json")
        invalid = sum(1 for r in source["projects"][1] if r[draft_col] and draft_doc(r[draft_col]) is None)

        if opts["dry_run"]:
            for table, (_, rows) in source.items():
                self.stdout.write(f"  {table:<18} {len(rows):>7} rows")
            self.stdout.write(f"Drafts failing the SiteDoc contract: {invalid} (served as doc: null, like the Worker)")
            return

        tables = [m._meta.db_table for m in READ_PATH_MODELS]
        with transaction.atomic(), connection.cursor() as cur:
            cur.execute("TRUNCATE " + ", ".join(connection.ops.quote_name(t) for t in tables))
            for table, (cols, rows) in source.items():
                sql = f"INSERT INTO {connection.ops.quote_name(table)} ({', '.join(cols)}) VALUES ({', '.join(['%s'] * len(cols))})"
                for i in range(0, len(rows), BATCH):
                    cur.executemany(sql, rows[i:i + BATCH])
            cur.execute("SET CONSTRAINTS ALL IMMEDIATE")  # surface foreign key problems before verifying
            problems = []
            for table, (cols, rows) in source.items():
                cur.execute(f"SELECT {', '.join(cols)} FROM {connection.ops.quote_name(table)}")
                want, got = table_digest(rows), table_digest(cur.fetchall())
                status = "ok" if want == got else "MISMATCH"
                if want != got:
                    problems.append(table)
                self.stdout.write(f"  {table:<18} {got[0]:>7} rows  sha256 {got[1][:12]}  {status}")
            if problems:
                raise CommandError(f"Verification failed for {', '.join(problems)}; nothing was changed.")
        self.stdout.write(self.style.SUCCESS(
            f"Imported and verified {sum(len(r) for _, r in source.values())} rows. "
            f"Projects: {Project.objects.count()}. Drafts failing the SiteDoc contract: {invalid}."
        ))
