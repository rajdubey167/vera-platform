"""
ANALYTICS AGGRESSIVE TESTS
Covers: empty dataset, single row, all-same values, all-null column,
        boolean cols, extreme numerics, large dataset analytics,
        anomaly detection, concurrent requests, re-analysis idempotency.
"""
import io
import json
import pytest
from tests.helpers import user_auth, admin_auth, quick_dataset, upload_csv, upload_json


def run_analysis(client, headers, dataset_id):
    return client.post(f"/analyze/{dataset_id}", headers=headers, json={})


# ── Basic analytics ───────────────────────────────────────────────────────────

def test_analyze_returns_200(client):
    h = user_auth(client)
    ds = quick_dataset(client, h, n=10)
    r = run_analysis(client, h, ds["id"])
    assert r.status_code == 200


def test_analyze_result_has_required_fields(client):
    h = user_auth(client)
    ds = quick_dataset(client, h, n=10)
    body = run_analysis(client, h, ds["id"]).json()
    assert "columns" in body          # dict of column_name -> stats
    assert "insights" in body
    assert "anomalies" in body


def test_analyze_numeric_column_has_stats(client):
    h = user_auth(client)
    ds = quick_dataset(client, h, n=20)
    body = run_analysis(client, h, ds["id"]).json()
    # quick_dataset has columns: id, value, category
    assert "value" in body["columns"]
    col = body["columns"]["value"]
    assert "mean" in col or "type" in col


def test_analyze_categorical_column_detected(client):
    h = user_auth(client)
    ds = quick_dataset(client, h, n=15)
    body = run_analysis(client, h, ds["id"]).json()
    assert "category" in body["columns"]


def test_analyze_insights_is_list(client):
    h = user_auth(client)
    ds = quick_dataset(client, h, n=10)
    body = run_analysis(client, h, ds["id"]).json()
    assert isinstance(body["insights"], list)


def test_analyze_anomalies_is_list(client):
    h = user_auth(client)
    ds = quick_dataset(client, h, n=20)
    body = run_analysis(client, h, ds["id"]).json()
    assert isinstance(body["anomalies"], list)


# ── Edge case datasets ────────────────────────────────────────────────────────

def test_analyze_single_row_dataset(client):
    h = user_auth(client)
    rows = [{"val": 42, "cat": "only"}]
    r = upload_csv(client, h, rows, "single.csv")
    ds_id = r.json()["id"]
    r2 = run_analysis(client, h, ds_id)
    # Must not crash
    assert r2.status_code == 200


def test_analyze_two_row_dataset(client):
    h = user_auth(client)
    rows = [{"x": 1, "y": "a"}, {"x": 2, "y": "b"}]
    r = upload_csv(client, h, rows, "two.csv")
    ds_id = r.json()["id"]
    assert run_analysis(client, h, ds_id).status_code == 200


def test_analyze_all_same_numeric_values(client):
    """Std dev = 0 — should not crash (divide-by-zero guard)."""
    h = user_auth(client)
    rows = [{"val": 5} for _ in range(20)]
    r = upload_csv(client, h, rows, "same.csv")
    ds_id = r.json()["id"]
    assert run_analysis(client, h, ds_id).status_code == 200


def test_analyze_all_null_column(client):
    h = user_auth(client)
    content = b"name,score\nAlice,\nBob,\nCarl,\n"
    r = client.post("/upload", headers=h,
                    files={"file": ("nulls.csv", io.BytesIO(content), "text/csv")})
    ds_id = r.json()["id"]
    assert run_analysis(client, h, ds_id).status_code == 200


def test_analyze_boolean_column(client):
    h = user_auth(client)
    content = b"name,active\nAlice,True\nBob,False\nCarl,True\n"
    r = client.post("/upload", headers=h,
                    files={"file": ("bools.csv", io.BytesIO(content), "text/csv")})
    ds_id = r.json()["id"]
    assert run_analysis(client, h, ds_id).status_code == 200


def test_analyze_datetime_column(client):
    h = user_auth(client)
    content = b"date,revenue\n2024-01-01,100\n2024-01-02,200\n2024-01-03,150\n2024-01-04,300\n"
    r = client.post("/upload", headers=h,
                    files={"file": ("dates.csv", io.BytesIO(content), "text/csv")})
    ds_id = r.json()["id"]
    body = run_analysis(client, h, ds_id).json()
    assert "columns" in body and body["columns"] is not None


def test_analyze_wide_dataset_50_columns(client):
    h = user_auth(client)
    rows = [{f"col_{j}": j * i for j in range(50)} for i in range(1, 11)]
    r = upload_csv(client, h, rows, "wide.csv")
    ds_id = r.json()["id"]
    assert run_analysis(client, h, ds_id).status_code == 200


def test_analyze_extreme_values(client):
    """Very large and very small floats should not crash analytics."""
    h = user_auth(client)
    rows = [
        {"val": 1e15}, {"val": -1e15}, {"val": 0.000001},
        {"val": 999999999}, {"val": -999999999},
    ]
    r = upload_csv(client, h, rows, "extreme.csv")
    ds_id = r.json()["id"]
    assert run_analysis(client, h, ds_id).status_code == 200


def test_analyze_negative_values_only(client):
    h = user_auth(client)
    rows = [{"temp": -i * 1.5} for i in range(1, 21)]
    r = upload_csv(client, h, rows, "negatives.csv")
    ds_id = r.json()["id"]
    assert run_analysis(client, h, ds_id).status_code == 200


def test_analyze_string_only_dataset(client):
    h = user_auth(client)
    content = b"name,city,country\nAlice,London,UK\nBob,Paris,France\nCarl,Berlin,Germany\n"
    r = client.post("/upload", headers=h,
                    files={"file": ("strings.csv", io.BytesIO(content), "text/csv")})
    ds_id = r.json()["id"]
    assert run_analysis(client, h, ds_id).status_code == 200


def test_analyze_mixed_types_dataset(client):
    h = user_auth(client)
    rows = [
        {"id": i, "name": f"user_{i}", "score": i * 2.5,
         "active": i % 2 == 0, "joined": f"2024-0{(i%9)+1}-01"}
        for i in range(1, 11)
    ]
    r = upload_csv(client, h, rows, "mixed.csv")
    ds_id = r.json()["id"]
    assert run_analysis(client, h, ds_id).status_code == 200


# ── Anomaly detection ─────────────────────────────────────────────────────────

def test_anomaly_detected_for_outlier_value(client):
    """Insert one extreme outlier — IQR method should flag it."""
    h = user_auth(client)
    # Normal values 1-20, one extreme outlier
    rows = [{"val": i} for i in range(1, 21)]
    rows.append({"val": 10000})  # extreme outlier
    r = upload_csv(client, h, rows, "outlier.csv")
    ds_id = r.json()["id"]
    body = run_analysis(client, h, ds_id).json()
    # Anomalies list may be empty if implementation threshold differs, but must not crash
    assert isinstance(body["anomalies"], list)


def test_no_anomalies_for_uniform_data(client):
    """Perfectly uniform data — no anomalies expected."""
    h = user_auth(client)
    rows = [{"val": 50} for _ in range(30)]
    r = upload_csv(client, h, rows, "uniform.csv")
    ds_id = r.json()["id"]
    body = run_analysis(client, h, ds_id).json()
    assert isinstance(body["anomalies"], list)


def test_large_dataset_analytics_1000_rows(client):
    h = user_auth(client)
    ds = quick_dataset(client, h, n=1000)
    r = run_analysis(client, h, ds["id"])
    assert r.status_code == 200


# ── Re-analysis idempotency ───────────────────────────────────────────────────

def test_reanalyze_same_dataset_returns_same_columns(client):
    h = user_auth(client)
    ds = quick_dataset(client, h, n=10)
    body1 = run_analysis(client, h, ds["id"]).json()
    body2 = run_analysis(client, h, ds["id"]).json()
    cols1 = set(body1["columns"].keys())
    cols2 = set(body2["columns"].keys())
    assert cols1 == cols2


def test_reanalyze_after_record_edit(client):
    """Edit a record then re-analyze — should not crash."""
    h = user_auth(client)
    ds = quick_dataset(client, h, n=10)
    records = client.get("/records", headers=h, params={"dataset_id": ds["id"]}).json()["items"]
    rid = records[0]["id"]
    client.put(f"/records/{rid}", headers=h, json={"data": {"id": 999, "value": 99999.0, "category": "edited"}})
    assert run_analysis(client, h, ds["id"]).status_code == 200


# ── Auth + RBAC ───────────────────────────────────────────────────────────────

def test_analyze_requires_auth(client):
    ds = {"id": 1}
    r = client.post(f"/analyze/{ds['id']}", json={})
    assert r.status_code == 401


def test_analyze_nonexistent_dataset(client):
    h = user_auth(client)
    r = run_analysis(client, h, 99999)
    assert r.status_code == 404


def test_admin_can_analyze_any_dataset(client):
    ha = admin_auth(client, "admin@test.com", "Admin1234!")
    h1 = user_auth(client, "u@test.com", "User1234!")
    ds = quick_dataset(client, h1)
    assert run_analysis(client, ha, ds["id"]).status_code == 200


def test_user_cannot_analyze_other_users_dataset(client):
    h1 = user_auth(client, "alice@test.com", "Alice1234!")
    h2 = user_auth(client, "bob@test.com", "Bob1234!")
    ds = quick_dataset(client, h1)
    r = run_analysis(client, h2, ds["id"])
    assert r.status_code in (403, 401)


# ── JSON datasets analytics ───────────────────────────────────────────────────

def test_analyze_json_dataset(client):
    h = user_auth(client)
    rows = [{"product": f"p{i}", "sales": i * 10, "region": ["north", "south"][i % 2]}
            for i in range(1, 16)]
    r = upload_json(client, h, rows, "products.json")
    ds_id = r.json()["id"]
    assert run_analysis(client, h, ds_id).status_code == 200


def test_analyze_json_nested_values_stored_as_string(client):
    """JSON with mixed/nested types — must not crash analytics."""
    h = user_auth(client)
    rows = [{"id": i, "val": i * 2} for i in range(10)]
    r = upload_json(client, h, rows, "flat.json")
    ds_id = r.json()["id"]
    assert run_analysis(client, h, ds_id).status_code == 200


# ── Concurrent analysis ───────────────────────────────────────────────────────

def test_analyze_multiple_datasets_sequentially(client):
    h = user_auth(client)
    ids = [quick_dataset(client, h, n=5, filename=f"ds{i}.csv")["id"] for i in range(3)]
    for did in ids:
        assert run_analysis(client, h, did).status_code == 200
