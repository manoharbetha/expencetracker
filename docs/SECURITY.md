# Security & Privacy Guidelines

Fintell is built around industry-standard security protocols to protect users' financial credentials and session states.

---

## 1. JWT Session Lifecycle
- **Password Hashing:** Passwords are hashed on the backend using **bcrypt** with a work factor of 12 before being committed to MongoDB. Plaintext passwords are never logged or stored.
- **Token Generation:** Upon login/register, the backend generates an asymmetric HS256 JWT Access Token containing the user's ID as the subject (`sub`) and a strict 24-hour expiration (`exp`).
- **Storage:** Stored locally in `localStorage` as `fintell_token`.
- **Transmission:** Automatically injected into the `Authorization` header of all Axios calls using Bearer format.

---

## 2. API Request Gatekeeping (CORS & Middleware)
- **FastAPI CORS Middleware:** Restricts cross-origin resource sharing. Only whitelisted staging and production domains (e.g. `expencetracker-nu.vercel.app`) can query the API endpoints.
- **Dependencies & Route Protection:** The backend uses security dependencies (`OAuth2PasswordBearer`). Route endpoints fetch the current user dynamically:
  ```python
  @router.get("/me")
  async def read_users_me(current_user: User = Depends(get_current_user)):
      return current_user
  ```
  If the header token is missing, expired, or invalid, the route immediately rejects the request with a `401 Unauthorized` status before running any database logic.

---

## 3. Telemetry Privacy & Sanitation (PII Exclusion)
Google Analytics 4 collects usage patterns but must never capture PII:
- **String Parameter Scrubbing:** In `src/utils/analytics.ts`, all custom events pass through a `sanitizeParams` helper that strips keys containing user details (`email`, `name`, `password`, `token`, etc.) from the payload.
- **Path Sanitization:** The router page view listener splits paths at the query parameter separator `?`. The URL path `/dashboard?user=aarav@example.com` is tracked simply as `/dashboard`, preventing user details from leaking via query parameters.
- **Log Fallback:** Local development runs analytics in a log-only mode that outputs events to the console without firing external trackers.
