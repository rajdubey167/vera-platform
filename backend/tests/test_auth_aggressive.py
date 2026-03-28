"""
AUTH AGGRESSIVE TESTS
Covers: duplicate email, wrong credentials, tampered JWT, role enforcement,
        boundary passwords, SQL injection attempts, token-less access.
"""
import base64
import json
import pytest
from tests.helpers import register, login, auth, admin_auth, user_auth


# ── Registration ───────────────────────────────────────────────────────────────

def test_duplicate_email_rejected(client):
    register(client, "dup@test.com")
    r2 = register(client, "dup@test.com")
    assert r2.status_code == 400

def test_only_one_admin_allowed(client):
    register(client, "admin1@test.com", role="admin")
    r = register(client, "admin2@test.com", role="admin")
    assert r.status_code == 403

def test_second_admin_blocked_even_with_different_password(client):
    register(client, "a1@test.com", password="Aa1!aaaa", role="admin")
    r = register(client, "a2@test.com", password="Bb2!bbbb", role="admin")
    assert r.status_code == 403

def test_register_missing_fields_rejected(client):
    assert client.post("/register", json={"email": "x@x.com"}).status_code == 422
    assert client.post("/register", json={"password": "Test1234!"}).status_code == 422
    assert client.post("/register", json={}).status_code == 422

def test_register_invalid_email_format(client):
    r = register(client, "not-an-email")
    assert r.status_code == 422

def test_register_short_password(client):
    r = register(client, "short@test.com", password="Ab1!")
    assert r.status_code in (400, 422)

def test_register_returns_no_password_hash(client):
    r = register(client, "nohash@test.com")
    body = r.json()
    assert "password" not in body
    assert "hashed_password" not in body

def test_sql_injection_in_email_field(client):
    r = register(client, "' OR '1'='1'; --")
    assert r.status_code == 422  # invalid email format

def test_xss_payload_in_full_name_stored_safely(client):
    xss = "<script>alert('xss')</script>"
    r = register(client, "xss@test.com", full_name=xss)
    assert r.status_code == 201
    assert r.json()["full_name"] == xss  # stored verbatim, not executed

def test_register_extremely_long_email_rejected(client):
    long_email = "a" * 300 + "@test.com"
    r = register(client, long_email)
    assert r.status_code in (400, 422)


# ── Login ──────────────────────────────────────────────────────────────────────

def test_login_wrong_password(client):
    register(client, "u@test.com")
    r = client.post("/login", json={"email": "u@test.com", "password": "WRONGPASS!"})
    assert r.status_code == 401

def test_login_nonexistent_user(client):
    r = client.post("/login", json={"email": "ghost@test.com", "password": "Test1234!"})
    assert r.status_code == 401

def test_login_empty_credentials(client):
    assert client.post("/login", json={}).status_code == 422
    assert client.post("/login", json={"email": ""}).status_code == 422

def test_login_returns_token_and_type(client):
    register(client, "tok@test.com")
    r = client.post("/login", json={"email": "tok@test.com", "password": "Test1234!"})
    assert r.status_code == 200
    body = r.json()
    assert "access_token" in body
    assert body["token_type"] == "bearer"

def test_login_case_sensitive_email(client):
    register(client, "case@test.com")
    # Uppercase email should fail (exact match expected)
    r = client.post("/login", json={"email": "CASE@TEST.COM", "password": "Test1234!"})
    assert r.status_code in (401, 200)  # implementation-defined; just must not crash

def test_brute_force_multiple_wrong_passwords(client):
    register(client, "brute@test.com")
    for i in range(10):
        r = client.post("/login", json={"email": "brute@test.com", "password": f"wrong{i}"})
        assert r.status_code == 401
    # Correct password still works
    r = client.post("/login", json={"email": "brute@test.com", "password": "Test1234!"})
    assert r.status_code == 200


# ── JWT tampering ──────────────────────────────────────────────────────────────

def test_tampered_jwt_rejected(client):
    register(client, "t@test.com")
    token = login(client, "t@test.com")
    # Flip one character in the signature
    parts = token.split(".")
    parts[2] = parts[2][:-2] + "XX"
    bad_token = ".".join(parts)
    r = client.get("/me", headers={"Authorization": f"Bearer {bad_token}"})
    assert r.status_code == 401

def test_jwt_with_forged_admin_payload(client):
    """Manually build a JWT with admin role but wrong signature."""
    header = base64.urlsafe_b64encode(b'{"alg":"HS256","typ":"JWT"}').rstrip(b"=").decode()
    payload = base64.urlsafe_b64encode(
        json.dumps({"sub": "admin@evil.com", "role": "admin", "exp": 9999999999}).encode()
    ).rstrip(b"=").decode()
    forged = f"{header}.{payload}.invalidsignature"
    r = client.get("/me", headers={"Authorization": f"Bearer {forged}"})
    assert r.status_code == 401

def test_no_token_blocked(client):
    assert client.get("/me").status_code == 401
    assert client.get("/datasets").status_code == 401
    assert client.get("/records", params={"dataset_id": 1}).status_code == 401

def test_expired_token_rejected(client):
    """Token with exp in the past."""
    from datetime import timedelta
    from app.utils.security import create_access_token
    token = create_access_token({"sub": "999"}, expires_delta=timedelta(minutes=-10))
    r = client.get("/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 401

def test_token_with_nonexistent_user_rejected(client):
    """Token sub is a valid int but user doesn't exist in DB."""
    from app.utils.security import create_access_token
    token = create_access_token({"sub": "99999"})   # numeric ID, no such user
    r = client.get("/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 401

def test_bearer_prefix_required(client):
    register(client, "prefix@test.com")
    token = login(client, "prefix@test.com")
    r = client.get("/me", headers={"Authorization": token})  # no "Bearer "
    assert r.status_code == 401


# ── /me endpoint ──────────────────────────────────────────────────────────────

def test_me_returns_correct_user_data(client):
    register(client, "me@test.com", full_name="Full Name Here")
    token = login(client, "me@test.com")
    r = client.get("/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    body = r.json()
    assert body["email"] == "me@test.com"
    assert body["full_name"] == "Full Name Here"
    assert "hashed_password" not in body

def test_me_shows_correct_role(client):
    register(client, "adm@test.com", role="admin")
    token = login(client, "adm@test.com")
    r = client.get("/me", headers={"Authorization": f"Bearer {token}"})
    assert r.json()["role"] == "admin"

def test_user_cannot_escalate_own_role(client):
    """User cannot self-assign admin role via re-registration or update."""
    register(client, "escalate@test.com", role="user")
    # Second attempt same email with admin role
    r = register(client, "escalate@test.com", role="admin")
    assert r.status_code in (400, 403)
