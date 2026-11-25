"""The same fixture corpus is checked by tests/unit/contracts.test.ts against the TypeScript schema."""

import json

import pytest
from django.conf import settings

from imprint import contracts

FIXTURES = settings.CONTRACTS_DIR / "fixtures" / "sitedoc"
VALID = sorted((FIXTURES / "valid").glob("*.json"))
INVALID = sorted((FIXTURES / "invalid").glob("*.json"))


def test_corpus_present():
    assert len(VALID) >= 18 and len(INVALID) >= 8


@pytest.mark.parametrize("path", VALID, ids=lambda p: p.stem)
def test_valid_documents_pass(path):
    ok, error = contracts.validate_sitedoc(json.loads(path.read_text(encoding="utf-8")))
    assert ok, error


@pytest.mark.parametrize("path", INVALID, ids=lambda p: p.stem)
def test_invalid_documents_fail(path):
    ok, _ = contracts.validate_sitedoc(json.loads(path.read_text(encoding="utf-8")))
    assert not ok


def test_draft_doc_returns_none_for_bad_input():
    assert contracts.draft_doc(None) is None
    assert contracts.draft_doc("{not json") is None
    assert contracts.draft_doc(json.dumps({"type": "personal"})) is None


def test_locked_prices_come_from_the_contract():
    assert {p["type"]: p["priceCents"] for p in contracts.public_config()["plans"]} == {"personal": 2000, "business": 3000, "ecommerce": 10000}
    assert all(p["currency"] == "USD" and p["billing"] == "one_time" for p in contracts.public_config()["plans"])


def test_customer_intake_drops_private_stock_and_preserves_uploaded_asset():
    source = {"gallery": [{"stock": "owner-private"}, {"stock": "public-photo"}],
              "logo": {"assetId": "ast_customer", "stock": "owner-private"}}
    assert contracts.strip_owner_photos(source) == {
        "gallery": [{"stock": "public-photo"}], "logo": {"assetId": "ast_customer"}
    }
