import io


def create_user_and_token(client):
    client.post(
        "/register",
        json={
            "email": "user@example.com",
            "password": "User1234!",
            "full_name": "Regular User",
            "role": "user",
        },
    )
    login_response = client.post(
        "/login",
        json={"email": "user@example.com", "password": "User1234!"},
    )
    token = login_response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_upload_dataset_list_records_and_analyze(client):
    headers = create_user_and_token(client)
    csv_bytes = io.BytesIO(
        b"date,product,quantity,price\n"
        b"2025-01-01,Widget,10,29.99\n"
        b"2025-01-02,Gadget,500,39.99\n"
        b"2025-01-03,Widget,8,29.99\n"
    )

    upload_response = client.post(
        "/upload",
        headers=headers,
        files={"file": ("sales.csv", csv_bytes, "text/csv")},
    )
    assert upload_response.status_code == 201
    dataset = upload_response.json()
    assert dataset["record_count"] == 3

    list_response = client.get("/datasets", headers=headers)
    assert list_response.status_code == 200
    assert list_response.json()["total"] == 1

    detail_response = client.get(f"/datasets/{dataset['id']}", headers=headers)
    assert detail_response.status_code == 200
    assert len(detail_response.json()["preview"]) == 3

    records_response = client.get(
        "/records",
        headers=headers,
        params={"dataset_id": dataset["id"], "search": "Widget"},
    )
    assert records_response.status_code == 200
    assert records_response.json()["total"] == 2

    analysis_response = client.post(
        f"/analyze/{dataset['id']}",
        headers=headers,
        json={"analysis_type": "full", "anomaly_threshold": 1.5},
    )
    assert analysis_response.status_code == 200
    analysis = analysis_response.json()
    assert analysis["dataset_id"] == dataset["id"]
    assert analysis["total_records"] == 3
    assert "quantity" in analysis["columns"]
