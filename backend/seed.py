import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import AsyncSessionLocal, init_db
from app.models.user import User
from app.models.preference import UserPreference
from app.models.restaurant import Restaurant
from app.models.order import OrderHistory
from app.models.session import MenuSession
from app.models.recommendation import Recommendation
from app.utils.security import hash_password

async def seed_data():
    print("[Seed] Initializing database tables...")
    await init_db()

    async with AsyncSessionLocal() as db:
        # 1. Create Demo User
        stmt = select(User).where(User.email == "demo@menuwhisperer.com")
        existing_user = await db.scalar(stmt)
        if existing_user:
            print("[Seed] Demo user already exists. Skipping creation.")
            user = existing_user
        else:
            print("[Seed] Creating demo user: demo@menuwhisperer.com / Password123!")
            user = User(
                email="demo@menuwhisperer.com",
                hashed_password=hash_password("Password123!"),
                full_name="Alex Gourmet",
                is_active=True
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)

        # 2. Seed Preferences
        pref_stmt = select(UserPreference).where(UserPreference.user_id == user.id)
        existing_pref = await db.scalar(pref_stmt)
        if not existing_pref:
            print("[Seed] Setting taste preferences for demo user...")
            pref = UserPreference(
                user_id=user.id,
                dietary_restrictions=["Vegetarian"],
                spice_tolerance="medium",
                cuisines_liked=["North Indian", "Mughlai", "Street Food / Chaat", "Tandoor"],
                cuisines_disliked=["Fast Food"],
                default_budget_min=200.0,
                default_budget_max=750.0,
                currency="INR"
            )
            db.add(pref)
            await db.commit()

        # 3. Seed Sample Restaurant
        rest_stmt = select(Restaurant).where(Restaurant.name == "Dum Pukht Dawat")
        restaurant = await db.scalar(rest_stmt)
        if not restaurant:
            print("[Seed] Adding sample restaurant: Dum Pukht Dawat...")
            restaurant = Restaurant(
                name="Dum Pukht Dawat",
                cuisine_type="North Indian & Mughlai",
                address="ITC Maurya, Diplomatic Enclave, New Delhi"
            )
            db.add(restaurant)
            await db.commit()
            await db.refresh(restaurant)

        # 4. Seed Order History (Positive and Negative experiences to feed personalization loop)
        order_stmt = select(OrderHistory).where(OrderHistory.user_id == user.id)
        existing_orders = (await db.execute(order_stmt)).scalars().all()
        if not existing_orders:
            print("[Seed] Logging sample past dining history in INR...")
            orders = [
                OrderHistory(
                    user_id=user.id,
                    restaurant_id=restaurant.id,
                    restaurant_name=restaurant.name,
                    dish_name="Dal Makhani (Dum Pukht)",
                    price=280.0,
                    rating=5,
                    note="Exceptional overnight charcoal simmering! Creamy texture with subtle Kashmiri chili aroma."
                ),
                OrderHistory(
                    user_id=user.id,
                    restaurant_id=restaurant.id,
                    restaurant_name=restaurant.name,
                    dish_name="Paneer Butter Masala",
                    price=320.0,
                    rating=5,
                    note="Silky rich cashew gravy with tender cottage cheese and fragrant kasuri methi."
                ),
                OrderHistory(
                    user_id=user.id,
                    restaurant_id=restaurant.id,
                    restaurant_name=restaurant.name,
                    dish_name="Greasy Street Samosa",
                    price=40.0,
                    rating=1,
                    note="Overly stale oil and burnt crust. Avoid repeating."
                )
            ]
            db.add_all(orders)
            await db.commit()

        # 5. Seed Sample Menu Session
        session_stmt = select(MenuSession).where(MenuSession.user_id == user.id)
        existing_session = await db.scalar(session_stmt)
        if not existing_session:
            print("[Seed] Creating sample active menu session...")
            sample_dishes = [
                {"name": "Paneer Tikka Angara", "description": "Smoky cottage cheese cubes in spiced Rajasthani marinade", "price": 310.0, "currency": "INR", "category": "Starters", "dietary": "veg"},
                {"name": "Dal Makhani (Dum Pukht)", "description": "Black lentils slow-cooked overnight with churned butter & cream", "price": 280.0, "currency": "INR", "category": "Main Course", "dietary": "veg"},
                {"name": "Paneer Butter Masala", "description": "Velvet satin tomato gravy with fresh paneer & fenugreek", "price": 320.0, "currency": "INR", "category": "Main Course", "dietary": "veg"},
                {"name": "Dum Subz Handi Biryani", "description": "Fragrant basmati rice layered with vegetables, saffron & mint", "price": 340.0, "currency": "INR", "category": "Rice & Biryani", "dietary": "veg"},
                {"name": "Butter Garlic Naan", "description": "Clay oven leavened bread topped with minced garlic and butter", "price": 85.0, "currency": "INR", "category": "Breads", "dietary": "veg"},
                {"name": "Shahi Gulab Jamun with Rabdi", "description": "Warm khoya dumplings with saffron milk reduction", "price": 160.0, "currency": "INR", "category": "Desserts", "dietary": "veg"}
            ]
            menu_session = MenuSession(
                user_id=user.id,
                restaurant_id=restaurant.id,
                restaurant_name=restaurant.name,
                raw_input_type="text",
                raw_text="Sample Indian Menu",
                extracted_dishes=sample_dishes,
                mood="comfort_food",
                budget=600.0,
                hunger_level="moderate"
            )
            db.add(menu_session)
            await db.commit()
            await db.refresh(menu_session)

            # Recommendations for this session
            recs = [
                Recommendation(
                    session_id=menu_session.id,
                    dish_name="Dal Makhani (Dum Pukht)",
                    description="Black lentils slow-cooked overnight with churned butter & cream",
                    price=280.0,
                    category="Main Course",
                    match_score=98,
                    reasoning="Matches your comfort food craving and honors your 5-star rating for slow-cooked dal. Comfortably under your ₹600 budget.",
                    warnings="Contains dairy products (churned butter & cream); verify with staff if lactose sensitive."
                ),
                Recommendation(
                    session_id=menu_session.id,
                    dish_name="Paneer Butter Masala",
                    description="Velvet satin tomato gravy with fresh paneer & fenugreek",
                    price=320.0,
                    category="Main Course",
                    match_score=94,
                    reasoning="Rich, comforting North Indian classic with buttery tomato-cashew reduction, perfectly vegetarian.",
                    warnings="Contains cashew nut paste and dairy; confirm nut prep with staff."
                )
            ]
            db.add_all(recs)
            await db.commit()

    print("[Seed] Database seeding completed successfully!")

if __name__ == "__main__":
    asyncio.run(seed_data())
