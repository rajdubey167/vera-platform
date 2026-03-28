def test_register_login_and_me_flow(client):
    register_response = client.post(
        "/register",
        json={
            "email": "owner@example.com",
            "password": "Owner123!",
            "full_name": "Owner User",
            "role": "admin",
        },
    )
    assert register_response.status_code == 201
    assert register_response.json()["role"] == "admin"

    second_admin_attempt = client.post(
        "/register",
        json={
            "email": "another-admin@example.com",
            "password": "Admin123!",
            "full_name": "Another Admin",
            "role": "admin",
        },
    )
    assert second_admin_attempt.status_code == 403

    login_response = client.post(
        "/login",
        json={"email": "owner@example.com", "password": "Owner123!"},
    )
    assert login_response.status_code == 200
    body = login_response.json()
    assert "access_token" in body

    me_response = client.get(
        "/me",
        headers={"Authorization": f"Bearer {body['access_token']}"},
    )
    assert me_response.status_code == 200
    assert me_response.json()["email"] == "owner@example.com"
