"""
RBAC AGGRESSIVE TESTS
Covers: user isolation, admin cross-access, ownership enforcement,
        cross-user dataset/record access, delete other user's data.
"""
import pytest
from tests.helpers import user_auth, admin_auth, quick_dataset, assert_forbidden, assert_not_found


def make_two_users(client):
    h1 = user_auth(client, "alice@test.com", "Alice1234!")
    h2 = user_auth(client, "bob@test.com", "Bob1234!")
    return h1, h2


# ── Dataset isolation ─────────────────────────────────────────────────────────

def test_user_cannot_see_other_users_datasets(client):
    h1, h2 = make_two_users(client)
    quick_dataset(client, h1, filename="alice.csv")
    quick_dataset(client, h1, filename="alice2.csv")
    # Bob should see 0 datasets
    r = client.get("/datasets", headers=h2)
    assert r.json()["total"] == 0

def test_user_cannot_get_other_users_dataset_by_id(client):
    h1, h2 = make_two_users(client)
    ds = quick_dataset(client, h1)
    r = client.get(f"/datasets/{ds['id']}", headers=h2)
    assert_forbidden(r)

def test_admin_can_see_all_datasets(client):
    ha = admin_auth(client, "admin@test.com", "Admin1234!")
    h1 = user_auth(client, "u1@test.com", "User1234!")
    h2 = user_auth(client, "u2@test.com", "User5678!")
    quick_dataset(client, h1, filename="u1.csv")
    quick_dataset(client, h2, filename="u2.csv")
    r = client.get("/datasets", headers=ha)
    assert r.json()["total"] == 2

def test_admin_can_access_any_dataset_by_id(client):
    ha = admin_auth(client)
    h1 = user_auth(client, "u@test.com")
    ds = quick_dataset(client, h1)
    r = client.get(f"/datasets/{ds['id']}", headers=ha)
    assert r.status_code == 200

def test_user_sees_only_own_datasets_after_multiple_uploads(client):
    h1, h2 = make_two_users(client)
    for i in range(3):
        quick_dataset(client, h1, filename=f"a{i}.csv")
    for i in range(5):
        quick_dataset(client, h2, filename=f"b{i}.csv")
    assert client.get("/datasets", headers=h1).json()["total"] == 3
    assert client.get("/datasets", headers=h2).json()["total"] == 5


# ── Record isolation ──────────────────────────────────────────────────────────

def test_user_cannot_read_records_of_other_users_dataset(client):
    h1, h2 = make_two_users(client)
    ds = quick_dataset(client, h1)
    r = client.get("/records", headers=h2, params={"dataset_id": ds["id"]})
    assert_forbidden(r)

def test_user_cannot_delete_other_users_record(client):
    h1, h2 = make_two_users(client)
    ds = quick_dataset(client, h1)
    # Get a record id from Alice's dataset
    records = client.get("/records", headers=h1, params={"dataset_id": ds["id"]}).json()["items"]
    record_id = records[0]["id"]
    # Bob tries to delete it
    r = client.delete(f"/records/{record_id}", headers=h2)
    assert_forbidden(r)

def test_user_cannot_update_other_users_record(client):
    h1, h2 = make_two_users(client)
    ds = quick_dataset(client, h1)
    records = client.get("/records", headers=h1, params={"dataset_id": ds["id"]}).json()["items"]
    record_id = records[0]["id"]
    r = client.put(f"/records/{record_id}", headers=h2, json={"data": {"id": 999}})
    assert_forbidden(r)

def test_user_cannot_delete_other_users_entire_dataset(client):
    h1, h2 = make_two_users(client)
    ds = quick_dataset(client, h1)
    r = client.delete(f"/dataset/{ds['id']}", headers=h2)
    assert_forbidden(r)

def test_admin_can_delete_any_dataset(client):
    ha = admin_auth(client)
    h1 = user_auth(client, "u@test.com")
    ds = quick_dataset(client, h1)
    r = client.delete(f"/dataset/{ds['id']}", headers=ha)
    assert r.status_code == 200


# ── Analytics isolation ───────────────────────────────────────────────────────

def test_user_cannot_analyze_other_users_dataset(client):
    h1, h2 = make_two_users(client)
    ds = quick_dataset(client, h1)
    r = client.post(f"/analyze/{ds['id']}", headers=h2, json={})
    assert_forbidden(r)

def test_admin_can_analyze_any_dataset(client):
    ha = admin_auth(client)
    h1 = user_auth(client, "u@test.com")
    ds = quick_dataset(client, h1)
    r = client.post(f"/analyze/{ds['id']}", headers=ha, json={})
    assert r.status_code == 200


# ── Non-existent resources ────────────────────────────────────────────────────

def test_get_nonexistent_dataset_404(client):
    h = user_auth(client)
    assert_not_found(client.get("/datasets/99999", headers=h))

def test_delete_nonexistent_dataset_404(client):
    h = user_auth(client)
    assert_not_found(client.delete("/dataset/99999", headers=h))

def test_update_nonexistent_record_404(client):
    h = user_auth(client)
    r = client.put("/records/99999", headers=h, json={"data": {"x": 1}})
    assert_not_found(r)

def test_analyze_nonexistent_dataset_404(client):
    h = user_auth(client)
    assert_not_found(client.post("/analyze/99999", headers=h, json={}))

def test_get_records_of_nonexistent_dataset(client):
    h = user_auth(client)
    r = client.get("/records", headers=h, params={"dataset_id": 99999})
    assert_not_found(r)


# ── Token ownership ───────────────────────────────────────────────────────────

def test_deleted_dataset_no_longer_accessible(client):
    h = user_auth(client)
    ds = quick_dataset(client, h)
    client.delete(f"/dataset/{ds['id']}", headers=h)
    assert_not_found(client.get(f"/datasets/{ds['id']}", headers=h))

def test_deleted_dataset_records_also_gone(client):
    h = user_auth(client)
    ds = quick_dataset(client, h)
    client.delete(f"/dataset/{ds['id']}", headers=h)
    r = client.get("/records", headers=h, params={"dataset_id": ds["id"]})
    assert r.status_code in (404, 200)  # either 404 or empty list
    if r.status_code == 200:
        assert r.json()["total"] == 0
