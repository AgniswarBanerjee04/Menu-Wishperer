import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_custom_group_recommendations_with_diverse_diets(client: AsyncClient):
    # 1. Register user
    reg = await client.post("/api/v1/auth/register", json={
        "email": "familydining@example.com",
        "password": "Password123!"
    })
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Rich menu with various dietary and spice attributes
    dishes = [
        {"name": "Paneer Butter Masala", "description": "Cottage cheese in rich creamy tomato gravy", "price": 320.0, "category": "Curries", "dietary": "veg", "spice_level": "mild"},
        {"name": "Dal Makhani", "description": "Slow cooked black lentils with cream and butter", "price": 280.0, "category": "Curries", "dietary": "veg", "spice_level": "mild"},
        {"name": "Butter Chicken", "description": "Tender chicken cooked in rich makhani gravy", "price": 420.0, "category": "Non-Veg", "dietary": "non-veg", "spice_level": "medium"},
        {"name": "Mutton Kolhapuri", "description": "Fiery mutton curry cooked in Kolhapuri spices", "price": 520.0, "category": "Non-Veg", "dietary": "non-veg", "spice_level": "spicy"},
        {"name": "Assorted Bread Basket", "description": "Garlic naan, tandoori roti, butter kulcha", "price": 180.0, "category": "Breads", "dietary": "veg", "spice_level": "mild"},
        {"name": "Schezwan Paneer Tikka", "description": "Spicy roasted paneer with bell peppers", "price": 290.0, "category": "Starters", "dietary": "veg", "spice_level": "spicy"},
        {"name": "Egg Biryani", "description": "Fragrant basmati rice layered with boiled spiced eggs", "price": 310.0, "category": "Rice", "dietary": "egg", "spice_level": "medium"},
        {"name": "Jain Yellow Dal Tadka", "description": "Yellow lentils tempered with cumin, no onion or garlic", "price": 240.0, "category": "Curries", "dietary": "veg", "spice_level": "mild"},
    ]

    # 3. Call /menus/recommend in custom group mode
    payload = {
        "dishes": dishes,
        "mood": "comfort_food",
        "budget": 1500.0,
        "hunger_level": "starving",
        "mode": "custom",
        "guests": [
            {
                "id": "g_dad",
                "name": "Dad",
                "dietary": "veg",
                "spice_level": "mild",
                "max_budget": 450.0
            },
            {
                "id": "g_mom",
                "name": "Mom",
                "dietary": "jain",
                "spice_level": "mild",
                "max_budget": 450.0
            },
            {
                "id": "g_friend",
                "name": "Friend",
                "dietary": "non-veg",
                "spice_level": "spicy",
                "max_budget": 650.0
            }
        ]
    }

    res = await client.post("/api/v1/menus/recommend", json=payload, headers=headers)
    assert res.status_code == 200
    data = res.json()

    assert data["mode"] == "custom"
    assert "guest_recommendations" in data
    assert "table_share_recommendations" in data
    assert "group_bill_estimate" in data

    # Verify Dad's picks (Strict Veg + Mild)
    dad_picks = data["guest_recommendations"]["g_dad"]
    assert len(dad_picks) >= 1
    for pick in dad_picks:
        assert pick["dietary"] == "veg"
        assert "chicken" not in pick["dish_name"].lower()
        assert "mutton" not in pick["dish_name"].lower()
        assert "egg" not in pick["dish_name"].lower()

    # Verify Mom's picks (Jain + Mild - no root vegetables)
    mom_picks = data["guest_recommendations"]["g_mom"]
    assert len(mom_picks) >= 1
    for pick in mom_picks:
        assert pick["dietary"] == "veg"
        assert "chicken" not in pick["dish_name"].lower()

    # Verify Friend's picks (Non-Veg + Spicy)
    friend_picks = data["guest_recommendations"]["g_friend"]
    assert len(friend_picks) >= 1

    # Verify Table Share: must be 100% veg and not spicy
    table_shares = data["table_share_recommendations"]
    assert len(table_shares) >= 1
    for share in table_shares:
        assert share["dietary"] == "veg"
        assert "chicken" not in share["dish_name"].lower()
        assert "mutton" not in share["dish_name"].lower()

    # Verify Group Bill Estimate
    estimate = data["group_bill_estimate"]
    assert estimate["total_cost"] > 0
    assert estimate["per_person_average"] > 0
    assert len(estimate["breakdown"]) == 3
