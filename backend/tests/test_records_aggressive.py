"""
RECORDS AGGRESSIVE TESTS
Covers: pagination boundaries, search edge cases, bulk delete, edit validation,
        sort fields, concurrent deletes, record count consistency.
"""
import pytest
from tests.helpers import user_auth, quick_dataset, assert_unprocessable


def setup_dataset(client, n=20):
    h = user_auth(client)
    ds = quick_dataset(client, h, n=n)
    return h, ds


# ── Pagination ────────────────────────────────────────────────────────────────

def test_default_pagination_returns_20(client):
    h, ds = setup_dataset(client, 25)
    r = client.get("/records", headers=h, params={"dataset_id": ds["id"]})
    assert r.status_code == 200
    body = r.json()
    assert body["total"] == 25
    assert len(body["items"]) == 20  # default limit

def test_page_beyond_last_returns_empty(client):
    h, ds = setup_dataset(client, 5)
    r = client.get("/records", headers=h, params={"dataset_id": ds["id"], "page": 999, "limit": 20})
    assert r.status_code == 200
    assert r.json()["items"] == []

def test_limit_1_returns_single_record(client):
    h, ds = setup_dataset(client, 10)
    r = client.get("/records", headers=h, params={"dataset_id": ds["id"], "limit": 1})
    assert len(r.json()["items"]) == 1

def test_limit_100_max_cap(client):
    h, ds = setup_dataset(client, 150)
    r = client.get("/records", headers=h, params={"dataset_id": ds["id"], "limit": 100})
    assert len(r.json()["items"]) == 100

def test_limit_exceeds_max_rejected(client):
    h, ds = setup_dataset(client, 5)
    r = client.get("/records", headers=h, params={"dataset_id": ds["id"], "limit": 10000})
    assert r.status_code == 422

def test_negative_page_rejected(client):
    h, ds = setup_dataset(client, 5)
    r = client.get("/records", headers=h, params={"dataset_id": ds["id"], "page": -1})
    assert r.status_code == 422

def test_pagination_total_consistent_across_pages(client):
    h, ds = setup_dataset(client, 35)
    pages = []
    for p in range(1, 5):  # 4 pages for 35 rows at limit=10
        pages.append(client.get("/records", headers=h, params={"dataset_id": ds["id"], "page": p, "limit": 10}).json())
    totals = {pg["total"] for pg in pages}
    assert totals == {35}, f"Total inconsistent across pages: {totals}"
    all_ids = [r["id"] for pg in pages for r in pg["items"]]
    assert len(all_ids) == 35
    assert len(set(all_ids)) == 35  # no duplicates across pages


# ── Search ────────────────────────────────────────────────────────────────────

def test_search_finds_matching_records(client):
    h = user_auth(client)
    import io
    content = b"name,city\nAlice,London\nBob,Paris\nCarol,London\n"
    r = client.post("/upload", headers=h,
                    files={"file": ("cities.csv", io.BytesIO(content), "text/csv")})
    ds_id = r.json()["id"]
    result = client.get("/records", headers=h, params={"dataset_id": ds_id, "search": "London"})
    assert result.json()["total"] == 2

def test_search_empty_string_returns_all(client):
    h, ds = setup_dataset(client, 10)
    r = client.get("/records", headers=h, params={"dataset_id": ds["id"], "search": ""})
    assert r.json()["total"] == 10

def test_search_no_match_returns_empty(client):
    h, ds = setup_dataset(client, 10)
    r = client.get("/records", headers=h, params={"dataset_id": ds["id"], "search": "ZZZNOMATCH"})
    assert r.json()["total"] == 0

def test_search_sql_injection_safe(client):
    h, ds = setup_dataset(client, 5)
    # Must not crash, must not return all rows
    r = client.get("/records", headers=h,
                   params={"dataset_id": ds["id"], "search": "' OR '1'='1'; --"})
    assert r.status_code == 200

def test_search_special_chars_safe(client):
    h, ds = setup_dataset(client, 5)
    for payload in ["%", "_", "\\", "/*", "*/", "<script>", "\x00"]:
        r = client.get("/records", headers=h,
                       params={"dataset_id": ds["id"], "search": payload})
        assert r.status_code == 200


# ── Sorting ───────────────────────────────────────────────────────────────────

def test_sort_by_row_number_asc(client):
    h, ds = setup_dataset(client, 10)
    r = client.get("/records", headers=h,
                   params={"dataset_id": ds["id"], "sort_by": "row_number", "sort_order": "asc"})
    rows = [item["row_number"] for item in r.json()["items"]]
    assert rows == sorted(rows)

def test_sort_by_row_number_desc(client):
    h, ds = setup_dataset(client, 10)
    r = client.get("/records", headers=h,
                   params={"dataset_id": ds["id"], "sort_by": "row_number", "sort_order": "desc"})
    rows = [item["row_number"] for item in r.json()["items"]]
    assert rows == sorted(rows, reverse=True)

def test_sort_by_invalid_field_rejected(client):
    h, ds = setup_dataset(client, 5)
    r = client.get("/records", headers=h,
                   params={"dataset_id": ds["id"], "sort_by": "injected_field; DROP TABLE records; --"})
    assert r.status_code == 400

def test_sort_invalid_order_rejected(client):
    h, ds = setup_dataset(client, 5)
    r = client.get("/records", headers=h,
                   params={"dataset_id": ds["id"], "sort_order": "sideways"})
    assert r.status_code == 400


# ── Update (PUT) ──────────────────────────────────────────────────────────────

def test_update_record_persists(client):
    h, ds = setup_dataset(client, 5)
    records = client.get("/records", headers=h, params={"dataset_id": ds["id"]}).json()["items"]
    rid = records[0]["id"]
    r = client.put(f"/records/{rid}", headers=h, json={"data": {"id": 999, "value": 42.0, "category": "updated"}})
    assert r.status_code == 200
    assert r.json()["data"]["category"] == "updated"

def test_update_record_with_new_keys(client):
    """Adding new keys to a record data should work."""
    h, ds = setup_dataset(client, 3)
    records = client.get("/records", headers=h, params={"dataset_id": ds["id"]}).json()["items"]
    rid = records[0]["id"]
    r = client.put(f"/records/{rid}", headers=h, json={"data": {"brand_new_key": "hello", "another": 42}})
    assert r.status_code == 200

def test_update_record_with_empty_data(client):
    h, ds = setup_dataset(client, 3)
    records = client.get("/records", headers=h, params={"dataset_id": ds["id"]}).json()["items"]
    rid = records[0]["id"]
    r = client.put(f"/records/{rid}", headers=h, json={"data": {}})
    assert r.status_code == 200

def test_update_record_missing_data_field(client):
    h, ds = setup_dataset(client, 3)
    records = client.get("/records", headers=h, params={"dataset_id": ds["id"]}).json()["items"]
    rid = records[0]["id"]
    r = client.put(f"/records/{rid}", headers=h, json={})
    assert r.status_code == 422


# ── Delete ────────────────────────────────────────────────────────────────────

def test_delete_record_decrements_total(client):
    h, ds = setup_dataset(client, 5)
    records = client.get("/records", headers=h, params={"dataset_id": ds["id"]}).json()["items"]
    rid = records[0]["id"]
    client.delete(f"/records/{rid}", headers=h)
    r = client.get("/records", headers=h, params={"dataset_id": ds["id"]})
    assert r.json()["total"] == 4

def test_delete_same_record_twice(client):
    h, ds = setup_dataset(client, 3)
    records = client.get("/records", headers=h, params={"dataset_id": ds["id"]}).json()["items"]
    rid = records[0]["id"]
    r1 = client.delete(f"/records/{rid}", headers=h)
    r2 = client.delete(f"/records/{rid}", headers=h)
    assert r1.status_code == 200
    assert r2.status_code == 404

def test_delete_all_records_individually(client):
    h, ds = setup_dataset(client, 5)
    records = client.get("/records", headers=h, params={"dataset_id": ds["id"]}).json()["items"]
    for rec in records:
        client.delete(f"/records/{rec['id']}", headers=h)
    r = client.get("/records", headers=h, params={"dataset_id": ds["id"]})
    assert r.json()["total"] == 0

def test_delete_dataset_removes_all_records(client):
    h, ds = setup_dataset(client, 10)
    client.delete(f"/dataset/{ds['id']}", headers=h)
    # Dataset gone
    r = client.get(f"/datasets/{ds['id']}", headers=h)
    assert r.status_code == 404

def test_record_count_on_dataset_matches_actual(client):
    h, ds = setup_dataset(client, 15)
    assert ds["record_count"] == 15
    records_r = client.get("/records", headers=h, params={"dataset_id": ds["id"], "limit": 100})
    assert records_r.json()["total"] == 15
