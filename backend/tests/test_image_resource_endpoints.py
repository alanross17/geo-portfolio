import json
from contextlib import contextmanager
from types import SimpleNamespace

import app as app_module


def image_record(record_id, **overrides):
    values = {
        "id": record_id,
        "relative_url": f"images/{record_id}.jpg",
        "image_uid": None,
        "variant_generation": None,
        "generated_variants": None,
        "width": None,
        "height": None,
        "aspect_ratio": None,
        "title": record_id,
        "subtitle": None,
        "ig_link": None,
        "lat": 1.0,
        "lng": 2.0,
        "original_filename": None,
        "original_format": None,
        "processing_status": None,
        "processing_version": None,
    }
    values.update(overrides)
    return SimpleNamespace(**values)


class ScalarResult:
    def __init__(self, records):
        self.records = records

    def all(self):
        return self.records


class FakeSession:
    def __init__(self, records):
        self.records = records

    def scalars(self, statement):
        return ScalarResult(self.records)

    def scalar(self, statement):
        return self.records[0]

    def add(self, value):
        pass

    def flush(self):
        pass



def test_catalog_image_session_and_admin_endpoints_accept_mixed_migration_rows(monkeypatch):
    uid = "a" * 32
    generation = "b" * 32
    records = [
        image_record("legacy"),
        image_record(
            "ready-db-id",
            image_uid=uid,
            variant_generation=generation,
            generated_variants=json.dumps([{
                "variant": "large", "format": "jpeg", "width": 1200, "height": 800,
            }]),
            processing_status="ready",
        ),
        image_record(
            "failed-db-id",
            image_uid="c" * 32,
            variant_generation="d" * 32,
            generated_variants="not-json",
            processing_status="failed",
        ),
    ]

    @contextmanager
    def fake_get_session():
        yield FakeSession(records)

    monkeypatch.setattr(app_module, "get_session", fake_get_session)
    monkeypatch.setattr(app_module.random, "random", lambda: 1)
    app_module.app.config.update(TESTING=True, SECRET_KEY="test", ADMIN_PASSWORD_HASH="configured")
    client = app_module.app.test_client()

    catalog = client.get("/api/images")
    assert catalog.status_code == 200
    assert [item["id"] for item in catalog.get_json()] == ["legacy", uid, "c" * 32]
    assert catalog.get_json()[2]["fallbackUrl"] == "/images/failed-db-id.jpg"

    individual = client.get("/api/image/legacy")
    assert individual.status_code == 200
    assert individual.get_json()["sources"] == {"jpeg": [], "webp": []}

    started = client.post("/api/session")
    assert started.status_code == 200
    assert started.get_json()["next_image"]["fallbackUrl"].startswith("/images/")

    with client.session_transaction() as flask_session:
        flask_session["is_admin"] = True
    admin = client.get("/api/admin/images")
    assert admin.status_code == 200
    assert len(admin.get_json()) == 3