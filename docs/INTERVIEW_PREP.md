# Fintell Comprehensive Interview Study Guide

This document is a comprehensive guide designed to prepare you for software engineering and AI engineering interviews using the Fintell codebase. It breaks down every design pattern, file structure, optimization, and system design choice in the project.

---

## 1. System Folder & File Tour

### `src/api/`
- **Why it exists:** Isolates the raw HTTP client settings from the business services. 
- **`api.ts` (Global API Client):** Initializes Axios with a base URL, default timeouts, and configures headers.
  - **Request Interceptor:** Dynamically fetches the JWT token from localStorage on every outbound request and inserts it into the `Authorization: Bearer <token>` header.
  - **Response Interceptor:** Listens for responses. If the request method is a mutating method (`POST`, `PUT`, `PATCH`, or `DELETE`), it fires a custom window event (`'data-mutated'`). This is the foundation of our cache-synchronization system.

### `src/services/`
- **Why it exists:** Provides clean separation of concerns. Services contain raw REST mapping methods (e.g., `list`, `create`, `update`, `remove`) and act as the connection between frontend components and FastAPI routes.
- **Dependency Flow:** Services import the Axios client and the strongly-typed interfaces in `src/types/`. They do not contain UI state or render logic.

### `src/types/`
- **Why it exists:** Provides type-safety across the application. Replaces outdated inline interfaces with clean, split definition modules (`expense.ts`, `goal.ts`, `auth.ts`, etc.) re-exported via `index.ts`.

### `src/utils/`
- **Why it exists:** Houses self-contained helper modules like string currency formatters, GA4 analytics scripts, and math calculations.
- **`analytics.ts` (GA4 Wrapper):** Ensures that Google Analytics is initialized once and strips all PII (user emails, names, passwords) from outbound telemetry payloads.

---

## 2. Core React & State Concepts Explained

### React Router DOM v6
- **Routing Setup (`src/routes/index.tsx`):** Employs declarative array-based routes (`RouteObject[]`).
- **Protected Routes (`ProtectedLayout`):** Implements route guards. If the authentication state is loading, it displays a loading spinner. If the user is unauthenticated, it redirects to `/login` using the `<Navigate to="/login" replace />` component, preventing unauthorized page visits.
- **Lazy Loading (`React.lazy`):** All main pages are imported asynchronously via dynamic imports (e.g., `lazy(() => import('../pages/Dashboard'))`). This splits the production bundle into small code chunks, keeping the initial Largest Contentful Paint (LCP) under 2.5 seconds.

### Context API (`src/context/AuthContext.tsx`)
- **Purpose:** Manages global session state (the authenticated User object and login status).
- **Lifecycle:** 
  1. On application mount, a `useEffect` reads the local storage token.
  2. If found, it fetches the user details (`/me`) to validate the session.
  3. Provides `login`, `register`, `logout`, and `updateUser` hooks globally so that any component can check context status via `useAuth()`.

### React Hooks & Optimization
- **`useState`**: Manages local UI states (e.g., modal open/close states, input form values).
- **`useEffect`**: Triggers side effects. For example, tracks page views automatically in `App.tsx` whenever `location.pathname` changes.
- **`useCallback`**: Memoizes functions in the context provider (like `register` and `login`) to prevent child components from re-rendering due to function reference changes on parent renders.
- **`useMemo`**: Not heavily used but ideal for compute-heavy client calculations like mapping charts to prevent unnecessary recalculations.

---

## 3. Data Synchronization & Cache Strategy (TanStack Query)

### How It Works
Rather than storing fetched data in local page state (`useState`) and triggering manual fetches, Fintell uses **TanStack Query (React Query)**:
- **`useQuery`**: Fetches and caches data (e.g., `['expenses']`, `['goals']`).
- **`useMutation`**: Handles database writes (`POST`, `PUT`, `DELETE`).

### Cache Invalidation Architecture
To solve stale state issues across pages:
1. When any mutation succeeds (e.g., adding an expense on `/expenses` or confirming a statement import on `/import`), the response interceptor in `api.ts` dispatches the global `'data-mutated'` event.
2. `App.tsx` listens for this event and calls `queryClient.invalidateQueries()`.
3. This invalidates the cached query keys globally. Pages in the background (like the Dashboard) immediately refetch the fresh data, ensuring the UI is updated in real-time without requiring a browser refresh.

---

## 4. Key Engineering Features Detailed

### Statement Import Pipeline (PDF Parsing)
- **Business Need:** Manually entering credit card statements is tedious and error-prone.
- **Flow:**
  1. User drops a statement PDF on the frontend.
  2. `StatementImport.tsx` sends the file to the FastAPI `/statements/upload` route.
  3. The backend parses the PDF structure, runs regex patterns to identify statement types, lists individual transactions, and calculates outstanding limits.
  4. Returns transactions in JSON format.
  5. The user previews, selects a destination credit card, and clicks "Confirm" to save them to MongoDB.

### AI Financial Coach
- **Business Need:** Provides actionable insight instead of just raw ledgers.
- **Flow:**
  1. FastAPI gathers user profile metrics (monthly income, total debt ratio, goal timelines).
  2. The AI module evaluates these datasets and generates three custom arrays: suggestions (e.g., cut back on bills), warnings (e.g., credit card utilization above 80%), and an overall score.
  3. The dashboard widgets display these in a premium, Vision Pro-styled glass card layout.

---

## 5. Typical Interview Questions & Answers

### Q1: How did you optimize the performance (LCP) of this React application?
- **Best Answer:** "We noticed the initial LCP was 4.16 seconds. This was caused by massive 3D WebGL and animation libraries (Three.js, GSAP, Framer Motion) blocking the main thread. I resolved this in three ways: First, I configured Vite manual chunking in `vite.config.ts` to separate vendor packages from the main bundle. Second, I implemented route-level and component-level lazy loading (`React.lazy` and `Suspense`) to ensure the heavy charting libraries and 3D components only load when needed. Third, I added font preloading to index.html. These changes successfully isolated the main vendor bundle and allowed the initial text to render instantly."

### Q2: How did you ensure data consistency across multiple pages without manual refreshes?
- **Best Answer:** "We implemented a centralized cache invalidation architecture using TanStack Query. I set up a global response interceptor in our Axios client (`api.ts`). Whenever a successful write operation (`POST`, `PUT`, `PATCH`, `DELETE`) occurs, the interceptor dispatches a custom `'data-mutated'` event. In `App.tsx`, we listen to this event and call `queryClient.invalidateQueries()`. This automatically invalidates and refreshes the cache for all active queries (like dashboard stats, recent expenses, or goal targets) in the background. The user sees changes instantly, eliminating the need to refresh the page."

### Q3: How does your application protect user privacy (GDPR/HIPAA compliance) regarding analytics?
- **Best Answer:** "We have a strict data sanitation layer in our analytics utility (`src/utils/analytics.ts`). Before any custom event is dispatched to Google Analytics 4, the parameters pass through a sanitization function that explicitly deletes keys containing PII (such as `email`, `name`, `password`, `token`). In addition, our router-level page view tracker strips query strings from paths before tracking page views, ensuring sensitive parameters never leak to GA4 servers."

### Q4: Explain the authentication lifecycle of this application.
- **Best Answer:** "The app uses a JWT token-based auth flow. When a user logs in, the API returns a JWT token. We store this token in localStorage. Our Axios client uses a request interceptor to inject this token into the `Authorization` header of all outgoing requests. When the app loads, the `AuthProvider` component checks for the token in localStorage and validates it by calling the `/me` endpoint. If valid, the user's profile state is loaded; if invalid or expired, the token is cleared and the router redirects the user to `/login`."
