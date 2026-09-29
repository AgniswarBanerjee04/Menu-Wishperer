import pytest
from unittest.mock import patch, AsyncMock
from httpx import AsyncClient
from app.schemas.menu import ExtractedDish

@pytest.mark.asyncio
async def test_qr_ingest_success(client: AsyncClient):
    # 1. Register & login to get token
    reg = await client.post("/api/v1/auth/register", json={
        "email": "qrtest@example.com",
        "password": "Password123!",
        "full_name": "QR Foodie"
    })
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    sample_html = """
    <html>
      <head><title>Pind Balluchi | Online Menu</title></head>
      <body>
        <h1>Pind Balluchi</h1>
        <h2>Tandoori Starters</h2>
        <div>Paneer Tikka - Rs. 320</div>
        <div>Dal Makhani - ₹ 260</div>
        <div>Butter Chicken - 420/-</div>
      </body>
    </html>
    """

    with patch("httpx.AsyncClient.get") as mock_get:
        mock_resp = AsyncMock()
        mock_resp.status_code = 200
        mock_resp.headers = {"content-type": "text/html; charset=utf-8"}
        mock_resp.text = sample_html
        mock_resp.content = sample_html.encode("utf-8")
        mock_get.return_value = mock_resp

        payload = {
            "url": "https://pindballuchi.dotpe.in/store/1/delivery",
            "restaurant_name": "Pind Balluchi"
        }

        res = await client.post("/api/v1/menus/qr-ingest", json=payload, headers=headers)
        assert res.status_code == 200
        data = res.json()
        assert data["raw_input_type"] == "qr"
        assert "dishes" in data
        assert len(data["dishes"]) >= 1
        assert "session_id" in data

@pytest.mark.asyncio
async def test_qr_ingest_direct_image(client: AsyncClient):
    reg = await client.post("/api/v1/auth/register", json={
        "email": "qrimage@example.com",
        "password": "Password123!",
        "full_name": "Image Foodie"
    })
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    with patch("httpx.AsyncClient.get") as mock_get:
        mock_resp = AsyncMock()
        mock_resp.status_code = 200
        mock_resp.headers = {"content-type": "image/jpeg"}
        # 1x1 dummy jpeg byte
        mock_resp.content = b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00\xff\xdb\x00C\x00"
        mock_get.return_value = mock_resp

        payload = {
            "url": "https://restaurant.com/menu-card.jpg",
            "restaurant_name": "Royal Cafe"
        }

        res = await client.post("/api/v1/menus/qr-ingest", json=payload, headers=headers)
        assert res.status_code == 200
        data = res.json()
        assert data["raw_input_type"] == "qr"
        assert len(data["dishes"]) >= 1

@pytest.mark.asyncio
async def test_qr_ingest_invalid_url_error(client: AsyncClient):
    reg = await client.post("/api/v1/auth/register", json={
        "email": "qrerr@example.com",
        "password": "Password123!"
    })
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    with patch("httpx.AsyncClient.get", side_effect=Exception("Failed to resolve host")):
        payload = {
            "url": "https://invalid-broken-domain-999.xyz"
        }
        res = await client.post("/api/v1/menus/qr-ingest", json=payload, headers=headers)
        assert res.status_code == 400
        assert "Unable to reach" in res.json()["detail"]
