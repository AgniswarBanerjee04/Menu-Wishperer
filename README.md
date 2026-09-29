# 🍽️ Menu Whisperer — AI Restaurant Decision Fatigue Relief

> **Tired of scanning overwhelming restaurant menus?** Photograph or paste the menu, dial in your mood, budget, and hunger, and let **Menu Whisperer** recommend the top 2–3 dishes tailored to your taste profile. Log what you ate to train the AI over time.

---

## ✨ Features

1. **🔐 Secure JWT Authentication**: Full registration, login, token refresh, and protected routes.
2. **🥗 Onboarding Taste Quiz**: First-time wizard capturing dietary restrictions (Vegetarian, Vegan, Halal, Gluten-Free, Nut Allergies), spice tolerance meter (None to Extreme), liked/disliked cuisines, and default budget range.
3. **📸 Multimodal Menu Extraction (Image + Text)**:
   - Photograph or upload menu images (JPEG, PNG, WEBP up to 5 MB) parsed via **Google Gemini Vision**.
   - Paste raw menu text with automated category, price, and ingredient identification.
   - Built-in detection that flags blurry or non-menu uploads with friendly guidance.
4. **✏️ Interactive Menu Correction UI**: Review parsed dishes, adjust prices, edit descriptions, and add or remove items before getting recommendations.
5. **🎯 Personalized Recommendation Engine**:
   - Matches today's mood (*Light, Comfort Food, Adventurous, Healthy, Celebrating*), meal budget ceiling, and hunger level.
   - Incorporates your permanent taste profile and past ratings (boosting 4–5★ flavors and strictly avoiding dishes similar to past 1–2★ ratings).
   - Delivers top 2–3 picks with match score percentages, personalized reasoning, and allergen warning tags.
   - **Safety First**: Never asserts a dish is 100% allergen-free. Injects mandatory restaurant staff verification disclaimers.
6. **📝 Order Logging & History**: Log what you actually ordered, assign 1–5 stars, add tasting notes, and view past meals in a searchable timeline with star rating filters.
7. **📊 Taste Insights Dashboard**: Live telemetry of total meals, average rating, average spend, favorite cuisines, and all-time highest-rated dishes.
8. **🎨 Rich Warm Food Aesthetic**: Mobile-first responsive UI crafted with Tailwind CSS, custom warm saffron/terracotta palettes, glassmorphic cards, and full Dark/Light mode support.

---

## 🏗️ Architecture & Technology Stack

```
menu-whisperer/
├── backend/
│   ├── app/
│   │   ├── config.py           # Pydantic Settings & environment config
│   │   ├── database.py         # SQLAlchemy 2.0 Async (SQLite & PostgreSQL dual-engine)
│   │   ├── main.py             # FastAPI entrypoint, CORS, static uploads
│   │   ├── seed.py             # Database seed script with sample user & menu
│   │   ├── models/             # User, UserPreference, Restaurant, MenuSession, Recommendation, OrderHistory
│   │   ├── schemas/            # Pydantic v2 validation models
│   │   ├── routers/            # /auth, /me/preferences, /menus, /orders, /insights
│   │   ├── services/           # Gemini AI service & sliding-window rate limiter
│   │   ├── prompts/            # Dedicated extraction & recommendation prompt templates
│   │   └── utils/              # Bcrypt security & JWT authentication dependencies
│   ├── tests/                  # 15 comprehensive async pytest unit & integration tests
│   ├── alembic/                # Database migrations
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── api/                # API client with token refresh & interceptors
│   │   ├── context/            # AuthContext and ThemeContext (Dark/Light)
│   │   ├── components/         # Common buttons, cards, badges, navbar, mobile bottom nav
│   │   ├── components/wizard/  # Step 1 (Input), Step 1.5 (Editor), Step 2 (Mood), Step 3 (Picks)
│   │   ├── components/history/ # OrderLogModal, InsightsCard
│   │   ├── pages/              # Login, Register, OnboardingQuiz, Wizard, Profile, History, 404
│   │   └── test/               # Vitest component tests
│   └── Dockerfile
├── docker-compose.yml          # Containerized Postgres, Backend, and Frontend
└── README.md
```

- **Frontend**: React 19 + TypeScript + Vite, Tailwind CSS, TanStack React Query, React Router v6, Lucide React icons.
- **Backend**: Python 3.11, FastAPI, SQLAlchemy 2.0 (Async), Alembic, Pydantic v2, PyJWT, Bcrypt.
- **Database**: Dual-engine support — **SQLite** for instant zero-dependency local runs, **PostgreSQL** for Docker/Production.
- **AI**: Google Gemini (`google-genai` SDK) with structured JSON enforcement, automated retries, and high-fidelity local fallback mode for offline/demo operation.

---

## 🚀 Quickstart Guide

### Option A: Local Development (Recommended for quick testing)

#### 1. Backend Setup
```bash
cd backend

# Create and activate virtual environment
python -m venv venv
# Windows:
.\venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations (defaults to SQLite ./menu_whisperer.db)
alembic upgrade head

# Seed demo user & sample restaurant menu
python seed.py

# Start FastAPI server
uvicorn app.main:app --reload --port 8000
```
Backend API and Swagger docs will be live at:
- **API Base**: `http://localhost:8000/api/v1`
- **Interactive OpenAPI Docs**: `http://localhost:8000/docs`

#### 2. Frontend Setup
```bash
cd frontend

# Install packages
npm install

# Start Vite dev server
npm run dev
```
Open **`http://localhost:5173`** in your browser!

---

### Option B: Docker Compose (Single Command)

```bash
# From the repository root:
docker compose up --build
```
This starts:
1. `postgres`: PostgreSQL 16 database on port `5432`
2. `backend`: FastAPI server on port `8000`
3. `frontend`: Vite React app on port `5173`

---

## 🔑 Demo Account Credentials

A pre-configured demo account is included in the seed data:
- **Email**: `demo@menuwhisperer.com`
- **Password**: `Password123!`
- *Or click the **"⚡ Instant Demo Login"** button on the Login page.*

---

## 🧪 Testing

### Backend Unit & Integration Tests (pytest)
```bash
cd backend
.\venv\Scripts\pytest -v tests/
```
*Result: 15/15 tests passing (covers authentication, user registration, JWT refresh, preference quiz, text menu extraction, image upload format validation, recommendation engine dietary filtering, and order logging telemetry).*

### Frontend Component Tests (Vitest)
```bash
cd frontend
npx vitest run
```
*Result: 7/7 tests passing (covers Button variants & loading states, Badge indicators, and Step 2 Mood & Budget interaction).*

---

## 🛡️ AI Guardrails & Liability Policy

1. **Strict Dietary Enforcement**: When users configure Vegetarian, Vegan, Halal, or specific allergies, candidate dishes conflicting with these rules are excluded from suggestions.
2. **Allergen Disclaimer**: Every recommendation response includes a high-visibility disclaimer instructing patrons to verify ingredients directly with waitstaff.
3. **Structured Pydantic Validation & Retry**: Model responses are coerced into validated JSON schemas. If a response is malformed, the pipeline retries once with explicit structural reminders.
4. **Rate Limiting**: AI endpoints enforce sliding-window per-user rate limits (default 15 requests/minute).

---

## 📋 Architecture Decisions & Limitations

- **Dual-Engine ORM**: We utilized SQLAlchemy 2.0 with driver normalization in `env.py` and `database.py`. This provides zero-friction instant local startup with SQLite while supporting PostgreSQL in Docker with zero code changes.
- **Client-Side Hashing & Session Storage**: Access and refresh tokens are managed via standards-compliant Authorization Bearer headers with automatic silent refresh interceptors.
- **Known Limitations**:
  - Image OCR depends on camera focus and lighting. Very dark or blurry photos will trigger the friendly rejection warning.
  - Multi-page menus can be pasted into the raw text tab for comprehensive whole-menu evaluation.
