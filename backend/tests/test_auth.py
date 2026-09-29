import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"

@pytest.mark.asyncio
async def test_register_user(client: AsyncClient):
    payload = {
        "email": "test@example.com",
        "password": "Password123!",
        "full_name": "Test Gourmet"
    }
    response = await client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "test@example.com"
    assert data["user"]["full_name"] == "Test Gourmet"
    assert data["user"]["has_preferences"] is False

@pytest.mark.asyncio
async def test_register_duplicate_email(client: AsyncClient):
    payload = {
        "email": "duplicate@example.com",
        "password": "Password123!",
        "full_name": "First User"
    }
    res1 = await client.post("/api/v1/auth/register", json=payload)
    assert res1.status_code == 201

    res2 = await client.post("/api/v1/auth/register", json=payload)
    assert res2.status_code == 400
    assert "already exists" in res2.json()["detail"]

@pytest.mark.asyncio
async def test_login_user(client: AsyncClient):
    # Register first
    await client.post("/api/v1/auth/register", json={
        "email": "login@example.com",
        "password": "SecretPassword123",
        "full_name": "Login User"
    })

    # Login
    response = await client.post("/api/v1/auth/login", json={
        "email": "login@example.com",
        "password": "SecretPassword123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "login@example.com"

@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient):
    await client.post("/api/v1/auth/register", json={
        "email": "wrongpwd@example.com",
        "password": "CorrectPassword123"
    })

    response = await client.post("/api/v1/auth/login", json={
        "email": "wrongpwd@example.com",
        "password": "IncorrectPassword"
    })
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_refresh_token(client: AsyncClient):
    reg = await client.post("/api/v1/auth/register", json={
        "email": "refresh@example.com",
        "password": "Password123!"
    })
    refresh_token = reg.json()["refresh_token"]

    response = await client.post("/api/v1/auth/refresh", json={
        "refresh_token": refresh_token
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

@pytest.mark.asyncio
async def test_get_me(client: AsyncClient):
    reg = await client.post("/api/v1/auth/register", json={
        "email": "me@example.com",
        "password": "Password123!",
        "full_name": "Me User"
    })
    token = reg.json()["access_token"]

    headers = {"Authorization": f"Bearer {token}"}
    response = await client.get("/api/v1/auth/me", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "me@example.com"
    assert data["full_name"] == "Me User"

@pytest.mark.asyncio
async def test_get_me_unauthorized(client: AsyncClient):
    response = await client.get("/api/v1/auth/me")
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_update_me(client: AsyncClient):
    reg = await client.post("/api/v1/auth/register", json={
        "email": "updateme@example.com",
        "password": "Password123!",
        "full_name": "Original Name"
    })
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    update_payload = {
        "full_name": "Updated Connoisseur",
        "mobile_number": "+91 9876543210"
    }
    response = await client.put("/api/v1/auth/me", json=update_payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["full_name"] == "Updated Connoisseur"
    assert data["mobile_number"] == "+91 9876543210"

    # Verify persist via GET /me
    get_res = await client.get("/api/v1/auth/me", headers=headers)
    assert get_res.status_code == 200
    assert get_res.json()["full_name"] == "Updated Connoisseur"
    assert get_res.json()["mobile_number"] == "+91 9876543210"

