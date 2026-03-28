"""Shared test helpers — token factories, CSV/JSON builders, assertion utilities."""
import io
import json


# ─── Auth helpers ──────────────────────────────────────────────────────────────

def register(client, email, password="Test1234!", full_name="Test User", role="user"):
    return client.post("/register", json={"email": email, "password": password,
                                          "full_name": full_name, "role": role})


def login(client, email, password="Test1234!"):
    r = client.post("/login", json={"email": email, "password": password})
    return r.json().get("access_token", "")


def auth(client, email="u@test.com", password="Test1234!", role="user"):
    """Register + login, return Authorization header dict."""
    register(client, email, password, role=role)
    token = login(client, email, password)
    return {"Authorization": f"Bearer {token}"}


def admin_auth(client, email="admin@test.com", password="Admin1234!"):
    return auth(client, email, password, role="admin")


def user_auth(client, email="user@test.com", password="User1234!"):
    return auth(client, email, password, role="user")


# ─── File builders ─────────────────────────────────────────────────────────────

def make_csv(rows: list[dict], extra_header_cols: list[str] | None = None) -> io.BytesIO:
    if not rows:
        return io.BytesIO(b"col_a,col_b\n")
    cols = list(rows[0].keys())
    if extra_header_cols:
        cols += extra_header_cols
    lines = [",".join(cols)]
    for row in rows:
        lines.append(",".join(str(row.get(c, "")) for c in cols))
    return io.BytesIO("\n".join(lines).encode())


def make_json(rows: list[dict]) -> io.BytesIO:
    return io.BytesIO(json.dumps(rows).encode())


def upload_csv(client, headers, rows, filename="test.csv"):
    f = make_csv(rows)
    return client.post("/upload", headers=headers,
                       files={"file": (filename, f, "text/csv")})


def upload_json(client, headers, rows, filename="test.json"):
    f = make_json(rows)
    return client.post("/upload", headers=headers,
                       files={"file": (filename, f, "application/json")})


def quick_dataset(client, headers, n=10, filename="data.csv"):
    """Upload n-row numeric CSV, return dataset JSON."""
    rows = [{"id": i, "value": i * 1.5, "category": f"cat_{i % 3}"} for i in range(1, n + 1)]
    r = upload_csv(client, headers, rows, filename)
    assert r.status_code == 201, f"quick_dataset upload failed: {r.text}"
    return r.json()


# ─── Assert helpers ────────────────────────────────────────────────────────────

def assert_forbidden(r):
    assert r.status_code in (403, 401), f"Expected 403/401, got {r.status_code}: {r.text}"


def assert_not_found(r):
    assert r.status_code == 404, f"Expected 404, got {r.status_code}: {r.text}"


def assert_unprocessable(r):
    assert r.status_code in (400, 422), f"Expected 400/422, got {r.status_code}: {r.text}"
