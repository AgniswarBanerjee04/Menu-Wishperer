import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_preferences_flow(client: AsyncClient):
    # Register a new user
    reg_res = await client.post("/api/v1/auth/register", json={
        "email": "foodie@example.com",
        "password": "Password123!",
        "full_name": "Foodie Tester"
    })
    assert reg_res.status_code == 201
    token = reg_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Initially preferences should return 404
    get_res = await client.get("/api/v1/me/preferences", headers=headers)
    assert get_res.status_code == 404

    # 2. Set preferences
    pref_payload = {
        "dietary_restrictions": ["Vegetarian", "Nut Allergy"],
        "spice_tolerance": "high",
        "cuisines_liked": ["Italian", "Thai", "Mexican"],
        "cuisines_disliked": ["Seafood"],
        "default_budget_min": 15.0,
        "default_budget_max": 45.0,
        "currency": "USD"
    }
    put_res = await client.put("/api/v1/me/preferences", json=pref_payload, headers=headers)
    assert put_res.status_code == 200
    saved = put_res.json()
    assert saved["dietary_restrictions"] == ["Vegetarian", "Nut Allergy"]
    assert saved["spice_tolerance"] == "high"
    assert saved["default_budget_max"] == 45.0

    # 3. Subsequent GET returns saved preferences
    get_res2 = await client.get("/api/v1/me/preferences", headers=headers)
    assert get_res2.status_code == 200
    assert get_res2.json()["spice_tolerance"] == "high"

    # 4. User profile reflects has_preferences == True
    me_res = await client.get("/api/v1/auth/me", headers=headers)
    assert me_res.status_code == 200
    assert me_res.json()["has_preferences"] is True

@pytest.mark.asyncio
async def test_preferences_unauthorized(client: AsyncClient):
    res = await client.get("/api/v1/me/preferences")
    assert res.status_code == 401
