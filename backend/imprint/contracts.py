"""Shared contracts generated from the TypeScript source (see tests/unit/contracts.test.ts and contracts/)."""

import json
from functools import cache

from django.conf import settings
from jsonschema import Draft202012Validator
from jsonschema.exceptions import best_match


def _read(name: str):
    return json.loads((settings.CONTRACTS_DIR / name).read_text(encoding="utf-8"))


@cache
def sitedoc_validator() -> Draft202012Validator:
    schema = _read("sitedoc.schema.json")
    Draft202012Validator.check_schema(schema)
    return Draft202012Validator(schema)


@cache
def public_config() -> dict:
    return _read("public-config.json")


def plan_price_cents(site_type: str) -> int:
    for plan in public_config()["plans"]:
        if plan["type"] == site_type:
            return plan["priceCents"]
    raise KeyError(site_type)


def validate_sitedoc(doc) -> tuple[bool, str | None]:
    """JSON Schema plus the cross-field rules parseSiteDoc() applies in src/shared/schema.ts.

    Note: JSON Schema counts string length in code points, Zod in UTF-16 units, so text containing emoji
    can be accepted here at a length Zod would reject. Documents written by the Worker are always valid in both.
    """
    error = best_match(sitedoc_validator().iter_errors(doc))
    if error is not None:
        path = ".".join(str(p) for p in error.absolute_path) or "document"
        return False, f"{path}: {error.message}"
    ids, slugs = set(), []
    for page in doc["pages"]:
        if page["id"] in ids:
            return False, f"Duplicate page id {page['id']}"
        ids.add(page["id"])
        slugs.append(page["slug"])
    if len(set(slugs)) != len(slugs):
        return False, "Two pages share the same URL slug"
    if "" not in slugs:
        return False, "The site needs a home page"
    return True, None


def draft_doc(text: str | None):
    """Mirror of draftDoc(): the stored draft if it is a valid SiteDoc, otherwise None."""
    if not text:
        return None
    try:
        doc = json.loads(text)
    except ValueError:
        return None
    ok, _ = validate_sitedoc(doc)
    return strip_owner_photos(doc) if ok else None


OWNER_PREFIX = "owner-"


def strip_owner_photos(value):
    """Mirror of stripOwnerPhotos(): owner-only stock photos never leave template previews."""
    drop = object()

    def walk(v):
        if isinstance(v, list):
            return [x for x in (walk(i) for i in v) if x is not drop]
        if isinstance(v, dict):
            stock = v.get("stock")
            if isinstance(stock, str) and stock.startswith(OWNER_PREFIX):
                rest = {k: x for k, x in v.items() if k != "stock"}
                return rest if ("assetId" in rest or "art" in rest) else drop
            return {k: x for k, x in ((k, walk(x)) for k, x in v.items()) if x is not drop}
        return v

    return walk(value)
