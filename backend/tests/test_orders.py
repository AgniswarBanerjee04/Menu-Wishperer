import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_orders_and_insights_flow(client: AsyncClient):
    # 1. Register user
    reg = await client.post("/api/v1/auth/register", json={
        "email": "critic@example.com",
        "password": "Password123!",
        "full_name": "Food Critic"
    })
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Check empty insights
    insights_res = await client.get("/api/v1/insights", headers=headers)
    assert insights_res.status_code == 200
    assert insights_res.json()["total_orders"] == 0

    # 3. Create 3 orders
    order1 = {
        "restaurant_name": "Trattoria Roma",
        "dish_name": "Cacio e Pepe",
        "price": 20.0,
        "rating": 5,
        "note": "Perfection! Creamy with the right peppery punch."
    }
    res1 = await client.post("/api/v1/orders", json=order1, headers=headers)
    assert res1.status_code == 201
    assert res1.json()["dish_name"] == "Cacio e Pepe"

    order2 = {
        "restaurant_name": "Trattoria Roma",
        "dish_name": "Tiramisu",
        "price": 10.0,
        "rating": 4,
        "note": "Very light and fluffy."
    }
    await client.post("/api/v1/orders", json=order2, headers=headers)

    order3 = {
        "restaurant_name": "Tokyo Ramen Bar",
        "dish_name": "Tonkotsu Ramen",
        "price": 18.0,
        "rating": 5,
        "note": "Rich broth."
    }
    await client.post("/api/v1/orders", json=order3, headers=headers)

    # 4. List orders & search
    list_res = await client.get("/api/v1/orders", headers=headers)
    assert list_res.status_code == 200
    orders = list_res.json()
    assert len(orders) == 3

    # Search for "Roma"
    search_res = await client.get("/api/v1/orders?search=Roma", headers=headers)
    assert search_res.status_code == 200
    assert len(search_res.json()) == 2

    # Filter by min_rating=5
    rating_res = await client.get("/api/v1/orders?min_rating=5", headers=headers)
    assert rating_res.status_code == 200
    assert len(rating_res.json()) == 2

    # 5. Check calculated insights
    insights2 = await client.get("/api/v1/insights", headers=headers)
    assert insights2.status_code == 200
    idata = insights2.json()
    assert idata["total_orders"] == 3
    # Average rating: (5 + 4 + 5) / 3 = 4.67 -> 4.7
    assert idata["average_rating"] >= 4.6
    # Average spend: (20 + 10 + 18) / 3 = 16.0
    assert idata["average_spend"] == 16.0
    assert len(idata["highest_rated_dishes"]) >= 2
    assert idata["rating_distribution"]["5"] == 2
    assert idata["rating_distribution"]["4"] == 1
