import io
import pytest
from httpx import AsyncClient
from PIL import Image
from app.utils.image_processing import preprocess_menu_image
from app.services.gemini_service import gemini_service

def test_preprocess_menu_image():
    # Create test image with text-like contrast
    img = Image.new("RGBA", (200, 100), color=(240, 240, 240, 255))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    raw_bytes = buf.getvalue()

    processed_bytes, mime, b64_str = preprocess_menu_image(raw_bytes)
    assert mime == "image/jpeg"
    assert len(processed_bytes) > 0
    assert len(b64_str) > 0

    # Ensure processed image can be opened and is RGB
    with Image.open(io.BytesIO(processed_bytes)) as out_img:
        assert out_img.mode == "RGB"
        assert out_img.size == (200, 100)

@pytest.mark.asyncio
async def test_tabular_multi_column_extraction():
    menu_text = """Golden Dragon Express
ITEMS | VEG | CHICKEN | MIXED
Brown Garlic Noodles | 140 | 160 | -
Hakka Noodles | 120 | 150 | 180
Egg Fried Rice Rs. 145/-
Chilli Paneer (Dry) ₹ 190/-"""

    result = await gemini_service.extract_menu_from_text(menu_text, restaurant_name="Golden Dragon Express")
    assert result.is_valid_menu is True
    assert result.restaurant_name == "Golden Dragon Express"
    
    dish_names = [d.name for d in result.dishes]
    # Check that variants were extracted
    assert any("Brown Garlic Noodles (Veg)" in name for name in dish_names)
    assert any("Brown Garlic Noodles (Chicken)" in name for name in dish_names)
    # Check that '-' variant (Mixed for Brown Garlic Noodles) was omitted
    assert not any("Brown Garlic Noodles (Mixed)" in name for name in dish_names)

    # Check Hakka Noodles variants
    assert any("Hakka Noodles (Veg)" in name for name in dish_names)
    assert any("Hakka Noodles (Chicken)" in name for name in dish_names)
    assert any("Hakka Noodles (Mixed)" in name for name in dish_names)

    # Check dietary inference
    veg_noodle = next(d for d in result.dishes if "Brown Garlic Noodles (Veg)" in d.name)
    assert veg_noodle.dietary == "veg"
    assert veg_noodle.price == 140.0

    chicken_noodle = next(d for d in result.dishes if "Brown Garlic Noodles (Chicken)" in d.name)
    assert chicken_noodle.dietary == "non-veg"
    assert chicken_noodle.price == 160.0

    egg_rice = next(d for d in result.dishes if "Egg Fried Rice" in d.name)
    assert egg_rice.dietary == "egg"
    assert egg_rice.price == 145.0

    paneer = next(d for d in result.dishes if "Chilli Paneer" in d.name)
    assert paneer.dietary == "veg"
    assert paneer.price == 190.0

@pytest.mark.asyncio
async def test_inline_variant_and_currency_cleansing():
    menu_text = """Chinatown Delights
Brown Garlic Noodles VEG: 140 | CHICKEN: 160
Schezwan Fried Rice (VEG 130 / CHICKEN 160)
Paneer Butter Masala Rs. 260/-
Butter Chicken (Half 240 / Full 420)"""

    result = await gemini_service.extract_menu_from_text(menu_text, restaurant_name="Chinatown Delights")
    names = [d.name for d in result.dishes]

    assert any("Brown Garlic Noodles (Veg)" in n for n in names)
    assert any("Brown Garlic Noodles (Chicken)" in n for n in names)
    assert any("Butter Chicken (Half)" in n for n in names)
    assert any("Butter Chicken (Full)" in n for n in names)

    # Check prices
    b_half = next(d for d in result.dishes if "Butter Chicken (Half)" in d.name)
    assert b_half.price == 240.0
    assert b_half.dietary == "non-veg"

    paneer = next(d for d in result.dishes if "Paneer Butter Masala" in d.name)
    assert paneer.price == 260.0
    assert paneer.dietary == "veg"

@pytest.mark.asyncio
async def test_dynamic_recommendation_eggitarian_and_spice(client: AsyncClient):
    # Register user
    reg = await client.post("/api/v1/auth/register", json={
        "email": "spiceuser@example.com",
        "password": "Password123!"
    })
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Set user as Vegetarian + Mild spice
    await client.put("/api/v1/me/preferences", json={
        "dietary_restrictions": ["Vegetarian"],
        "spice_tolerance": "mild",
        "cuisines_liked": ["Chinese", "North Indian"],
        "cuisines_disliked": [],
        "default_budget_min": 100.0,
        "default_budget_max": 400.0,
        "currency": "INR"
    }, headers=headers)

    dishes = [
        {"name": "Brown Garlic Noodles (Veg)", "price": 140.0, "category": "Noodles", "dietary": "veg", "spice_level": "mild"},
        {"name": "Brown Garlic Noodles (Chicken)", "price": 160.0, "category": "Noodles", "dietary": "non-veg", "spice_level": "mild"},
        {"name": "Schezwan Noodles (Spicy)", "price": 150.0, "category": "Noodles", "dietary": "veg", "spice_level": "spicy"},
        {"name": "Egg Fried Rice", "price": 140.0, "category": "Rice", "dietary": "egg", "spice_level": "mild"}
    ]

    rec_res = await client.post("/api/v1/menus/recommend", json={
        "dishes": dishes,
        "mood": "comfort_food",
        "budget": 200.0,
        "hunger_level": "moderate"
    }, headers=headers)

    assert rec_res.status_code == 200
    recs = rec_res.json()["recommendations"]
    rec_names = [r["dish_name"] for r in recs]

    # For pure vegetarian, Chicken and Egg MUST NOT be recommended
    assert not any("Chicken" in n for n in rec_names)
    assert not any("Egg" in n for n in rec_names)

    # For mild spice preference, mild dish should score higher than fiery spicy dish
    top_pick = recs[0]
    assert "Brown Garlic Noodles (Veg)" in top_pick["dish_name"]
