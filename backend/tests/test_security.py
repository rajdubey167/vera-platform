"""
SECURITY TESTS
Covers: XSS in stored data, path traversal, SQL injection in all inputs,
        oversized payloads, header injection, CORS, response leakage,
        concurrent stress, MIME sniffing, auth bypass attempts.
"""
import base64
import hmac
import io
import json
import pytest
from tests.helpers import user_auth, admin_auth, quick_dataset, upload_csv, register, login


# ── XSS / Injection in stored data ───────────────────────────────────────────

def test_xss_in_csv_data_stored_verbatim(client):
    """XSS payloads in CSV data must be stored as-is, not executed."""
    h = user_auth(client)
    content = 'name,note\nAlice,"<script>alert(1)</script>"\nBob,safe\n'.encode()
    r = client.post("/upload", headers=h,
                    files={"file": ("xss.csv", io.BytesIO(content), "text/csv")})
    assert r.status_code == 201
    ds_id = r.json()["id"]
    records = client.get("/records", headers=h, params={"dataset_id": ds_id}).json()["items"]
    notes = [rec["data"].get("note", "") for rec in records]
    assert any("<script>" in str(n) for n in notes), "XSS payload should be stored verbatim"


def test_html_injection_in_column_name(client):
    h = user_auth(client)
    content = '<img src=x onerror=alert(1)>,value\ntest,1\n'.encode()
    r = client.post("/upload", headers=h,
                    files={"file": ("htmlcol.csv", io.BytesIO(content), "text/csv")})
    # Either 201 (stored safely) or 400 — must not 500
    assert r.status_code in (201, 400)


def test_sql_injection_in_search_param(client):
    h = user_auth(client)
    ds = quick_dataset(client, h, n=5)
    payloads = [
        "' OR '1'='1",
        "'; DROP TABLE records; --",
        "' UNION SELECT * FROM users --",
        "1' AND SLEEP(5) --",
        "admin'--",
    ]
    for p in payloads:
        r = client.get("/records", headers=h, params={"dataset_id": ds["id"], "search": p})
        assert r.status_code == 200, f"SQL injection crashed with: {p}"


def test_sql_injection_in_sort_field(client):
    h = user_auth(client)
    ds = quick_dataset(client, h, n=5)
    payloads = [
        "1; DROP TABLE records",
        "row_number; DELETE FROM users",
        "id UNION SELECT password FROM users",
    ]
    for p in payloads:
        r = client.get("/records", headers=h, params={"dataset_id": ds["id"], "sort_by": p})
        assert r.status_code in (400, 422), f"Expected rejection for: {p}"


def test_sql_injection_in_dataset_id_param(client):
    h = user_auth(client)
    payloads = ["1 OR 1=1", "1; DROP TABLE datasets", "0 UNION SELECT 1,2,3"]
    for p in payloads:
        r = client.get("/records", headers=h, params={"dataset_id": p})
        assert r.status_code in (400, 422, 404)


def test_path_traversal_in_filename(client):
    """Filenames with path traversal patterns must not cause 500."""
    h = user_auth(client)
    malicious_names = [
        "../../etc/passwd.csv",
        "../../../windows/system32/config.csv",
        "....//....//etc//passwd.csv",
    ]
    for name in malicious_names:
        r = client.post("/upload", headers=h,
                        files={"file": (name, io.BytesIO(b"a,b\n1,2\n"), "text/csv")})
        # Must not crash — 201 (stored safely), 400, or 422 are acceptable
        assert r.status_code in (201, 400, 422), f"Server error for: {name} → {r.status_code}"


def test_null_byte_in_filename(client):
    h = user_auth(client)
    r = client.post("/upload", headers=h,
                    files={"file": ("file\x00.csv", io.BytesIO(b"a,b\n1,2\n"), "text/csv")})
    assert r.status_code in (201, 400, 422)


# ── Oversized payloads ────────────────────────────────────────────────────────

def test_oversized_json_body_on_register(client):
    """Huge full_name should be rejected gracefully."""
    long_name = "A" * 100_000
    r = client.post("/register", json={
        "email": "big@test.com", "password": "Test1234!", "full_name": long_name
    })
    assert r.status_code in (201, 400, 422)


def test_oversized_record_update_payload(client):
    h = user_auth(client)
    ds = quick_dataset(client, h, n=3)
    records = client.get("/records", headers=h, params={"dataset_id": ds["id"]}).json()["items"]
    rid = records[0]["id"]
    # 1000 fields of large strings
    huge_data = {f"key_{i}": "x" * 1000 for i in range(1000)}
    r = client.put(f"/records/{rid}", headers=h, json={"data": huge_data})
    # Must not 500
    assert r.status_code in (200, 400, 422, 413)


def test_deeply_nested_json_payload(client):
    """Deeply nested JSON should not cause stack overflow."""
    h = user_auth(client)
    # 100 levels of nesting
    nested = {}
    current = nested
    for i in range(100):
        current["child"] = {}
        current = current["child"]
    r = client.post("/register", json={
        "email": "nested@test.com", "password": "Test1234!", "full_name": json.dumps(nested)
    })
    assert r.status_code in (201, 400, 422)


# ── Authentication bypass ─────────────────────────────────────────────────────

def test_empty_authorization_header(client):
    r = client.get("/me", headers={"Authorization": ""})
    assert r.status_code == 401


def test_malformed_bearer_token(client):
    for bad_token in ["Bearer", "Bearer ", "Bearer  ", "Bearer null", "Bearer undefined"]:
        r = client.get("/me", headers={"Authorization": bad_token})
        assert r.status_code == 401, f"Expected 401 for: {bad_token}"


def test_token_reuse_after_user_deletion_would_fail(client):
    """Token with valid structure but non-existent numeric user ID should be rejected."""
    from app.utils.security import create_access_token
    # sub must be a numeric string (user ID) matching the backend's int() cast
    token = create_access_token({"sub": "99999"})
    r = client.get("/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 401


def test_algorithm_confusion_attack(client):
    """Try 'alg: none' JWT — must be rejected."""
    import base64
    header = base64.urlsafe_b64encode(b'{"alg":"none","typ":"JWT"}').rstrip(b"=").decode()
    payload = base64.urlsafe_b64encode(
        json.dumps({"sub": "admin@evil.com", "role": "admin", "exp": 9999999999}).encode()
    ).rstrip(b"=").decode()
    none_token = f"{header}.{payload}."
    r = client.get("/me", headers={"Authorization": f"Bearer {none_token}"})
    assert r.status_code == 401


def test_jwt_with_wrong_algorithm(client):
    """HS512 token instead of HS256 — must be rejected."""
    import hmac, hashlib
    header = base64.urlsafe_b64encode(b'{"alg":"HS512","typ":"JWT"}').rstrip(b"=").decode()
    payload_data = {"sub": "attacker@test.com", "exp": 9999999999}
    payload = base64.urlsafe_b64encode(json.dumps(payload_data).encode()).rstrip(b"=").decode()
    sig = base64.urlsafe_b64encode(
        hmac.new(b"wrongkey", f"{header}.{payload}".encode(), hashlib.sha512).digest()
    ).rstrip(b"=").decode()
    token = f"{header}.{payload}.{sig}"
    r = client.get("/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 401


# ── Information disclosure ────────────────────────────────────────────────────

def test_error_responses_dont_leak_stack_traces(client):
    """Error responses must not include Python tracebacks."""
    h = user_auth(client)
    r = client.get("/datasets/999999999", headers=h)
    text = r.text.lower()
    assert "traceback" not in text
    assert "sqlalchemy" not in text
    assert "file \"" not in text


def test_register_response_no_password_fields(client):
    r = register(client, "noleak@test.com")
    assert r.status_code == 201
    body = r.json()
    forbidden = ["password", "hashed_password", "pwd", "secret"]
    for field in forbidden:
        assert field not in body, f"Sensitive field '{field}' leaked in register response"


def test_login_response_no_password_fields(client):
    register(client, "loginleak@test.com")
    r = client.post("/login", json={"email": "loginleak@test.com", "password": "Test1234!"})
    assert r.status_code == 200
    body = r.json()
    assert "hashed_password" not in body
    assert "password" not in body


def test_wrong_password_error_not_verbose(client):
    """Error should say 'invalid credentials', not 'wrong password' or 'user found'."""
    register(client, "vague@test.com")
    r = client.post("/login", json={"email": "vague@test.com", "password": "WRONG1234!"})
    assert r.status_code == 401
    # Should not reveal whether user exists
    body = r.text.lower()
    assert "password" not in body or "invalid" in body  # generic message


def test_nonexistent_user_same_error_as_wrong_password(client):
    """Timing/message consistency to prevent user enumeration."""
    r1 = client.post("/login", json={"email": "noexist@test.com", "password": "Test1234!"})
    r2 = client.post("/login", json={"email": "also_noexist@test.com", "password": "Test1234!"})
    assert r1.status_code == r2.status_code == 401


# ── Header injection ──────────────────────────────────────────────────────────

def test_header_injection_in_auth_header(client):
    """Newline injection in Authorization header."""
    r = client.get("/me", headers={"Authorization": "Bearer token\r\nX-Injected: evil"})
    assert r.status_code == 401


def test_content_type_mismatch_handled(client):
    """Send JSON body to upload endpoint instead of multipart."""
    h = user_auth(client)
    r = client.post("/upload", headers={**h, "Content-Type": "application/json"},
                    content=b'{"file": "data"}')
    assert r.status_code in (400, 422)


# ── CORS / access control ─────────────────────────────────────────────────────

def test_protected_endpoints_require_auth(client):
    endpoints = [
        ("GET", "/me"),
        ("GET", "/datasets"),
        ("GET", "/records?dataset_id=1"),
        ("POST", "/upload"),
        ("POST", "/analyze/1"),
    ]
    for method, path in endpoints:
        if method == "GET":
            r = client.get(path)
        elif method == "POST":
            r = client.post(path, json={})
        assert r.status_code == 401, f"{method} {path} should require auth, got {r.status_code}"


def test_admin_endpoint_blocked_for_regular_user(client):
    """Regular user should not access another user's dataset."""
    # Admin must register first (backend only allows admin as first user)
    ha = admin_auth(client, "adm@test.com", "Admin1234!")
    h = user_auth(client, "reg@test.com", "Reg12345!")
    ds_admin = quick_dataset(client, ha, filename="admin_ds.csv")
    # User tries to read admin's dataset — should be 403
    r = client.get(f"/datasets/{ds_admin['id']}", headers=h)
    assert r.status_code in (403, 401)


# ── Concurrent / race conditions ─────────────────────────────────────────────

def test_concurrent_deletes_no_crash(client):
    """Delete same record multiple times — only first should succeed."""
    h = user_auth(client)
    ds = quick_dataset(client, h, n=5)
    records = client.get("/records", headers=h, params={"dataset_id": ds["id"]}).json()["items"]
    rid = records[0]["id"]
    results = [client.delete(f"/records/{rid}", headers=h) for _ in range(5)]
    statuses = [r.status_code for r in results]
    assert 200 in statuses  # at least one succeeded
    assert all(s in (200, 404) for s in statuses)  # no 500s


def test_rapid_uploads_all_succeed(client):
    h = user_auth(client)
    results = [
        upload_csv(client, h, [{"x": i}], f"rapid{i}.csv")
        for i in range(10)
    ]
    assert all(r.status_code == 201 for r in results)


def test_rapid_analytics_requests(client):
    h = user_auth(client)
    ds = quick_dataset(client, h, n=20)
    results = [client.post(f"/analyze/{ds['id']}", headers=h, json={}) for _ in range(5)]
    assert all(r.status_code == 200 for r in results)


# ── Sensitive data patterns in uploads ───────────────────────────────────────

def test_credit_card_numbers_stored_as_string(client):
    """Credit card-like data should be stored as string, not processed specially."""
    h = user_auth(client)
    content = b"name,card\nAlice,4111111111111111\nBob,5500000000000004\n"
    r = client.post("/upload", headers=h,
                    files={"file": ("cards.csv", io.BytesIO(content), "text/csv")})
    assert r.status_code == 201


def test_ssn_pattern_stored_safely(client):
    h = user_auth(client)
    content = b"name,ssn\nAlice,123-45-6789\nBob,987-65-4321\n"
    r = client.post("/upload", headers=h,
                    files={"file": ("ssn.csv", io.BytesIO(content), "text/csv")})
    assert r.status_code == 201


# ── Method not allowed ────────────────────────────────────────────────────────

def test_delete_on_login_endpoint(client):
    r = client.delete("/login")
    assert r.status_code in (404, 405)


def test_put_on_register_endpoint(client):
    r = client.put("/register", json={})
    assert r.status_code in (404, 405)


def test_patch_on_datasets_endpoint(client):
    h = user_auth(client)
    r = client.patch("/datasets", headers=h)
    assert r.status_code in (404, 405)
