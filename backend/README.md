# AI Financial Expense Tracker Backend

Production-ready FastAPI backend for the FINTELL-style AI financial expense tracker. It includes JWT authentication, MongoDB Atlas integration with Motor, async CRUD APIs, analytics aggregations, reports, notifications, and Gemini-powered AI endpoints.

## Stack

- FastAPI + Uvicorn
- MongoDB Atlas + Motor
- Pydantic v2
- JWT auth with bcrypt password hashing
- Gemini API via `google-generativeai`
- SlowAPI rate limiting

## Setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload
```

Update `.env` with your MongoDB Atlas URI, JWT secret, and `GEMINI_API_KEY`.

Swagger docs:

```text
http://127.0.0.1:8000/docs
```

Health check:

```text
GET /health
```

## Authentication

Register:

```http
POST /api/v1/register
{
  "name": "Aarav Mehta",
  "email": "aarav@example.com",
  "password": "strongpassword123"
}
```

Login:

```http
POST /api/v1/login
{
  "email": "aarav@example.com",
  "password": "strongpassword123"
}
```

Use the returned token for protected routes:

```http
Authorization: Bearer <access_token>
```

## Core Endpoints

- `GET /api/v1/me`
- `PUT /api/v1/profile`
- `POST /api/v1/expenses`
- `GET /api/v1/expenses`
- `GET /api/v1/expenses/{id}`
- `PUT /api/v1/expenses/{id}`
- `DELETE /api/v1/expenses/{id}`
- `POST /api/v1/goals`
- `GET /api/v1/goals`
- `PUT /api/v1/goals/{id}`
- `DELETE /api/v1/goals/{id}`
- `POST /api/v1/debts`
- `GET /api/v1/debts`
- `PUT /api/v1/debts/{id}`
- `DELETE /api/v1/debts/{id}`
- `GET /api/v1/dashboard`
- `GET /api/v1/analytics`
- `GET /api/v1/reports/monthly`
- `GET /api/v1/reports/yearly`
- `POST /api/v1/notifications`
- `GET /api/v1/notifications`

## AI Endpoints

- `POST /api/v1/ai/budget-suggestions`
- `POST /api/v1/ai/chat`
- `POST /api/v1/ai/purchase-impact`
- `POST /api/v1/ai/goal-conflicts`
- `POST /api/v1/ai/storytelling`
- `POST /api/v1/ai/debt-alert`

If `GEMINI_API_KEY` is missing, AI routes return a safe fallback message so the API remains usable in local development.

## MongoDB Collections

- `users`
- `expenses`
- `goals`
- `debts`
- `reports`
- `ai_insights`
- `chat_history`
- `notifications`

Indexes are created on startup for user-owned lookups and common sort fields.
