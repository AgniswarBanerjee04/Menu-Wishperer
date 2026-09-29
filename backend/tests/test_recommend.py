import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_recommend_honors_dietary_restrictions(client: AsyncClient):
    # 1. Register user
    reg = await client.post("/api/v1/auth/register", json={
        "email": "veggie@example.com",
        "password": "Password123!"
    })
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Set user as Vegetarian with nut allergy
    await client.put("/api/v1/me/preferences", json={
        "dietary_restrictions": ["Vegetarian", "Nut Allergy"],
        "spice_tolerance": "medium",
        "cuisines_liked": ["Italian"],
        "cuisines_disliked": [],
        "default_budget_min": 10.0,
        "default_budget_max": 30.0,
        "currency": "USD"
    }, headers=headers)

    # 3. Provide dishes containing meat, seafood, and vegetarian options
    dishes = [
        {"name": "Ribeye Steak", "description": "12oz grilled beef steak with butter", "price": 38.0, "category": "Main"},
        {"name": "Crispy Calamari", "description": "Fried squid rings with lemon", "price": 16.0, "category": "Appetizer"},
        {"name": "Margherita Pizza", "description": "Tomato sauce, mozzarella, and fresh basil", "price": 18.0, "category": "Pizza"},
        {"name": "Wild Mushroom Risotto", "description": "Creamy arborio rice with porcini mushrooms and parmesan", "price": 24.0, "category": "Main"}
    ]

    rec_res = await client.post("/api/v1/menus/recommend", json={
        "dishes": dishes,
        "mood": "comfort_food",
        "budget": 25.0,
        "hunger_level": "moderate"
    }, headers=headers)

    assert rec_res.status_code == 200
    data = rec_res.json()
    assert "recommendations" in data
    assert 2 <= len(data["recommendations"]) <= 3
    assert "disclaimer" in data
    assert "allergen" in data["disclaimer"].lower()

    # None of the recommended dishes should contain beef or squid
    for rec in data["recommendations"]:
        dish_lower = rec["dish_name"].lower()
        assert "steak" not in dish_lower
        assert "beef" not in dish_lower
        assert "calamari" not in dish_lower
        assert rec["match_score"] >= 70
        assert len(rec["reasoning"]) > 10
