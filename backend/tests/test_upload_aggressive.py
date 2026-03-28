"""
UPLOAD AGGRESSIVE TESTS
Covers: valid CSV/JSON, oversized files, wrong extensions, empty files,
        malformed content, NaN/Inf values, Unicode, duplicate columns,
        CSV injection, extremely wide/tall datasets, re-upload same file.
"""
import io
import json
import pytest
from tests.helpers import user_auth, admin_auth, make_csv, make_json, upload_csv, upload_json, quick_dataset


# ── Happy path ────────────────────────────────────────────────────────────────

def test_upload_csv_success(client):
    h = user_auth(client)
    rows = [{"name": "Alice", "score": 95}, {"name": "Bob", "score": 88}]
    r = upload_csv(client, h, rows, "scores.csv")
    assert r.status_code == 201
    body = r.json()
    assert body["record_count"] == 2
    assert body["file_type"] == "csv"
    assert body["filename"] == "scores.csv"

def test_upload_json_success(client):
    h = user_auth(client)
    rows = [{"city": "NYC", "pop": 8_000_000}, {"city": "LA", "pop": 4_000_000}]
    r = upload_json(client, h, rows, "cities.json")
    assert r.status_code == 201
    assert r.json()["record_count"] == 2
    assert r.json()["file_type"] == "json"

def test_upload_large_csv_1000_rows(client):
    h = user_auth(client)
    rows = [{"id": i, "val": i * 3.14, "label": f"item_{i}"} for i in range(1000)]
    r = upload_csv(client, h, rows, "big.csv")
    assert r.status_code == 201
    assert r.json()["record_count"] == 1000

def test_upload_wide_csv_50_columns(client):
    h = user_auth(client)
    rows = [{f"col_{j}": j * i for j in range(50)} for i in range(1, 6)]
    r = upload_csv(client, h, rows, "wide.csv")
    assert r.status_code == 201
    assert r.json()["record_count"] == 5

def test_upload_stores_file_size(client):
    h = user_auth(client)
    r = quick_dataset(client, h)
    assert r["file_size"] > 0


# ── Wrong extension / MIME ────────────────────────────────────────────────────

def test_upload_txt_file_rejected(client):
    h = user_auth(client)
    r = client.post("/upload", headers=h,
                    files={"file": ("data.txt", io.BytesIO(b"hello"), "text/plain")})
    assert r.status_code == 400

def test_upload_pdf_rejected(client):
    h = user_auth(client)
    r = client.post("/upload", headers=h,
                    files={"file": ("report.pdf", io.BytesIO(b"%PDF-1.4"), "application/pdf")})
    assert r.status_code == 400

def test_upload_no_extension_rejected(client):
    h = user_auth(client)
    r = client.post("/upload", headers=h,
                    files={"file": ("noext", io.BytesIO(b"data"), "text/plain")})
    assert r.status_code == 400

def test_csv_extension_with_json_content(client):
    """CSV extension but JSON body — should either parse or reject gracefully."""
    h = user_auth(client)
    content = json.dumps([{"a": 1}]).encode()
    r = client.post("/upload", headers=h,
                    files={"file": ("tricky.csv", io.BytesIO(content), "text/csv")})
    # Should not 500 — either 201 (parsed as 1-col CSV) or 400
    assert r.status_code in (201, 400)

def test_json_extension_with_csv_content(client):
    h = user_auth(client)
    r = client.post("/upload", headers=h,
                    files={"file": ("tricky.json", io.BytesIO(b"a,b\n1,2"), "application/json")})
    assert r.status_code in (201, 400)


# ── Empty / headers-only files ────────────────────────────────────────────────

def test_upload_completely_empty_file(client):
    h = user_auth(client)
    r = client.post("/upload", headers=h,
                    files={"file": ("empty.csv", io.BytesIO(b""), "text/csv")})
    assert r.status_code in (400, 422)

def test_upload_csv_headers_only_no_rows(client):
    h = user_auth(client)
    r = client.post("/upload", headers=h,
                    files={"file": ("headers.csv", io.BytesIO(b"a,b,c\n"), "text/csv")})
    # Either 201 with 0 records or 400 — must not 500
    assert r.status_code in (201, 400)

def test_upload_json_empty_array(client):
    h = user_auth(client)
    r = client.post("/upload", headers=h,
                    files={"file": ("empty.json", io.BytesIO(b"[]"), "application/json")})
    assert r.status_code in (201, 400)

def test_upload_malformed_csv(client):
    h = user_auth(client)
    garbage = b"\x00\x01\x02\x03\xff\xfe broken\x00"
    r = client.post("/upload", headers=h,
                    files={"file": ("bad.csv", io.BytesIO(garbage), "text/csv")})
    assert r.status_code in (400, 422)

def test_upload_malformed_json(client):
    h = user_auth(client)
    r = client.post("/upload", headers=h,
                    files={"file": ("bad.json", io.BytesIO(b"{not valid json}"), "application/json")})
    assert r.status_code in (400, 422)

def test_upload_json_object_not_array(client):
    """JSON file containing object instead of array."""
    h = user_auth(client)
    content = json.dumps({"key": "value"}).encode()
    r = client.post("/upload", headers=h,
                    files={"file": ("obj.json", io.BytesIO(content), "application/json")})
    assert r.status_code in (201, 400)


# ── Data quality edge cases ───────────────────────────────────────────────────

def test_upload_csv_with_nan_values(client):
    """NaN should be stored as null, not crash."""
    h = user_auth(client)
    content = b"a,b\n1,\n2,3\n,4\n"
    r = client.post("/upload", headers=h,
                    files={"file": ("nulls.csv", io.BytesIO(content), "text/csv")})
    assert r.status_code == 201

def test_upload_csv_with_all_nulls_column(client):
    h = user_auth(client)
    content = b"name,score\nAlice,\nBob,\nCarl,\n"
    r = client.post("/upload", headers=h,
                    files={"file": ("nullscores.csv", io.BytesIO(content), "text/csv")})
    assert r.status_code == 201

def test_upload_csv_negative_and_float_values(client):
    h = user_auth(client)
    rows = [{"temp": -273.15}, {"temp": 1e6}, {"temp": -0.001}]
    r = upload_csv(client, h, rows)
    assert r.status_code == 201

def test_upload_csv_boolean_column(client):
    h = user_auth(client)
    content = b"name,active\nAlice,True\nBob,False\nCarl,true\n"
    r = client.post("/upload", headers=h,
                    files={"file": ("bools.csv", io.BytesIO(content), "text/csv")})
    assert r.status_code == 201

def test_upload_csv_unicode_column_names_and_values(client):
    h = user_auth(client)
    content = "名前,スコア\n山田,95\n田中,88\n".encode("utf-8")
    r = client.post("/upload", headers=h,
                    files={"file": ("japanese.csv", io.BytesIO(content), "text/csv")})
    assert r.status_code == 201

def test_upload_csv_emoji_in_values(client):
    h = user_auth(client)
    rows = [{"product": "🚀 Rocket", "qty": 1}, {"product": "💎 Diamond", "qty": 5}]
    r = upload_csv(client, h, rows)
    assert r.status_code == 201

def test_upload_csv_very_long_string_value(client):
    h = user_auth(client)
    long_val = "x" * 5000
    rows = [{"id": 1, "desc": long_val}]
    r = upload_csv(client, h, rows)
    assert r.status_code == 201

def test_upload_csv_injection_attempt_in_data(client):
    """CSV injection: =CMD(...) in a cell should be stored as string, not executed."""
    h = user_auth(client)
    content = b'name,formula\nAlice,"=CMD(|calc.exe)"\nBob,safe\n'
    r = client.post("/upload", headers=h,
                    files={"file": ("inject.csv", io.BytesIO(content), "text/csv")})
    assert r.status_code == 201

def test_upload_csv_newlines_inside_quoted_field(client):
    h = user_auth(client)
    content = b'id,note\n1,"line1\nline2"\n2,normal\n'
    r = client.post("/upload", headers=h,
                    files={"file": ("multiline.csv", io.BytesIO(content), "text/csv")})
    assert r.status_code == 201


# ── File size limit ───────────────────────────────────────────────────────────

def test_upload_oversized_file_rejected(client):
    h = user_auth(client)
    # 51 MB of data (limit is 50 MB)
    big = io.BytesIO(b"a,b\n" + b"1,2\n" * (51 * 1024 * 256))
    r = client.post("/upload", headers=h,
                    files={"file": ("huge.csv", big, "text/csv")})
    assert r.status_code in (400, 413)  # 413 from body-size limit, 400 from app validation


# ── Re-upload + listing ───────────────────────────────────────────────────────

def test_re_uploading_same_filename_creates_separate_datasets(client):
    h = user_auth(client)
    rows = [{"x": 1}]
    r1 = upload_csv(client, h, rows, "same.csv")
    r2 = upload_csv(client, h, rows, "same.csv")
    assert r1.status_code == 201
    assert r2.status_code == 201
    assert r1.json()["id"] != r2.json()["id"]

def test_upload_increments_dataset_count(client):
    h = user_auth(client)
    for i in range(5):
        upload_csv(client, h, [{"v": i}], f"file{i}.csv")
    r = client.get("/datasets", headers=h)
    assert r.json()["total"] == 5

def test_unauthenticated_upload_rejected(client):
    r = client.post("/upload", files={"file": ("x.csv", io.BytesIO(b"a,b\n1,2\n"), "text/csv")})
    assert r.status_code == 401
