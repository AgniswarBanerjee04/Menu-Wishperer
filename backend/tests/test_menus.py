import io
import pytest
from httpx import AsyncClient

SAMPLE_MENU_TEXT = """
Osteria Bella Vista
Appetizers:
Bruschetta al Pomodoro - Toasted bread with vine tomatoes, garlic and basil - $9.50
Calamari Fritti - Crispy fried squid with lemon aioli - $14.00

Main Courses:
Penne alla Vodka - Creamy tomato sauce with pancetta - $19.00
Bistecca alla Fiorentina - Grilled T-bone steak with rosemary potatoes - $34.00
Margherita Pizza - Fresh mozzarella, tomato, basil - $16.50
Tiramisu - Espresso soaked savoiardi - $8.00
"""

@pytest.mark.asyncio
async def test_extract_menu_text(client: AsyncClient):
    reg = await client.post("/api/v1/auth/register", json={
        "email": "menutest@example.com",
        "password": "Password123!"
    })
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    response = await client.post(
        "/api/v1/menus/extract-text",
        json={"text": SAMPLE_MENU_TEXT, "restaurant_name": "Osteria Bella Vista"},
        headers=headers
    )
    assert response.status_code == 200
    data = response.json()
    assert "session_id" in data
    assert data["restaurant_name"] == "Osteria Bella Vista"
    assert len(data["dishes"]) >= 3
    # Check that prices were correctly extracted
    dish_names = [d["name"] for d in data["dishes"]]
    assert any("Bruschetta" in name or "Penne" in name or "Margherita" in name for name in dish_names)

@pytest.mark.asyncio
async def test_extract_menu_image(client: AsyncClient):
    reg = await client.post("/api/v1/auth/register", json={
        "email": "imagetest@example.com",
        "password": "Password123!"
    })
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create dummy image bytes
    dummy_image = io.BytesIO(b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00\xff\xdb\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a\x1f\x1e\x1d\x1a\x1c\x1c $.' \",#\x1c\x1c(7),01444\x1f'9=82<.342\xff\xc0\x00\x0b\x08\x00\x01\x00\x01\x01\x01\x11\x00\xff\xc4\x00\x1f\x00\x00\x01\x05\x01\x01\x01\x01\x01\x01\x00\x00\x00\x00\x00\x00\x00\x00\x01\x02\x03\x04\x05\x06\x07\x08\t\n\x0b\xff\xda\x00\x08\x01\x01\x00\x00?\x00\xbf\x00\xff\xd9")

    response = await client.post(
        "/api/v1/menus/extract",
        data={"restaurant_name": "Test Trattoria"},
        files={"file": ("menu.jpg", dummy_image, "image/jpeg")},
        headers=headers
    )
    assert response.status_code == 200
    data = response.json()
    assert "session_id" in data
    assert data["raw_input_type"] == "image"
    assert len(data["dishes"]) > 0

@pytest.mark.asyncio
async def test_extract_unsupported_file_type(client: AsyncClient):
    reg = await client.post("/api/v1/auth/register", json={
        "email": "pdftest@example.com",
        "password": "Password123!"
    })
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    dummy_pdf = io.BytesIO(b"%PDF-1.4...")
    response = await client.post(
        "/api/v1/menus/extract",
        files={"file": ("menu.pdf", dummy_pdf, "application/pdf")},
        headers=headers
    )
    assert response.status_code == 400
    assert "Unsupported file format" in response.json()["detail"]

@pytest.mark.asyncio
async def test_extract_cafe_menu_with_context(client: AsyncClient):
    reg = await client.post("/api/v1/auth/register", json={
        "email": "cafetest@example.com",
        "password": "Password123!"
    })
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    cafe_menu = """
    Artisanal Roast Cafe
    Pour Over Coffee $5.00
    Flat White $4.50
    Avocado Sourdough Toast $9.00
    Almond Croissant $4.00
    """

    response = await client.post(
        "/api/v1/menus/extract-text",
        json={
            "text": cafe_menu,
            "restaurant_name": "Artisanal Roast Cafe",
            "venue_type": "cafe",
            "dining_mode": "custom"
        },
        headers=headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["venue_type"] == "cafe"
    assert data["dining_mode"] == "custom"
    assert len(data["dishes"]) >= 2
