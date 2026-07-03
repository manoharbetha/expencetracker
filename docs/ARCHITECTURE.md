# Fintell Technical Architecture Diagrams

This document outlines the detailed system flows and architecture of Fintell using ASCII diagrams.

---

## 1. Overall Application Architecture
```
┌────────────────────────────────────────────────────────┐
│                      Web Client                        │
│   (React SPA, Router, Context, Recharts, Tailwind)      │
└──────────────────────────┬─────────────────────────────┘
                           │ HTTPS (JSON Payload / JWT)
                           ▼
┌────────────────────────────────────────────────────────┐
│                    FastAPI Server                      │
│   (API Endpoints, CORS, Token Authentication, JWT)     │
└────────────┬─────────────┬─────────────┬───────────────┘
             │             │             │
             ▼             ▼             ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  AI Engine   │    │ PDF Extractor│    │   Database   │
│ (Financial   │    │ (Regex & PDF │    │  Connector   │
│  Analytics)  │    │  Parsing)    │    │ (PyMongo/    │
│              │    │              │    │  MongoDB)    │
└──────────────┘    └──────────────┘    └──────┬───────┘
                                               │
                                               ▼
                                        ┌──────────────┐
                                        │ MongoDB Atlas│
                                        │ Document DB  │
                                        └──────────────┘
```

---

## 2. Login Flow
```
User Inputs Email/Password
          │
          ▼
Form Validation (Checks syntax/rules)
          │
          ▼
Axios POST Request (to /login)
          │
          ▼
FastAPI checks email & verifies hashed password
          │
          ├─► [Failure] ──► Return 401 Unauthorized
          ▼
    [Success] ──► Generate JWT Access Token
          │
          ▼
Return TokenResponse payload (access_token, user object)
          │
          ▼
Axios stores token in localStorage & updates AuthContext
          │
          ▼
React Router redirects user to /dashboard
```

---

## 3. Registration Flow
```
User Inputs Name, Email, Password, and Monthly Income
          │
          ▼
Form Validation (Length, strength checker)
          │
          ▼
Axios POST Request (to /register)
          │
          ▼
FastAPI checks if email already exists in MongoDB
          │
          ├─► [Yes] ──► Return 400 Bad Request
          ▼
    [No] ──► Hash password (bcrypt) & insert new User document
          │
          ▼
Generate JWT Token ──► Return TokenResponse
          │
          ▼
Save token locally, update AuthContext ──► redirect /dashboard
```

---

## 4. Authentication Flow
```
App starts/reloads ──► Read token from localStorage
          │
          ├─► [Token Missing] ──► Set user = null, isAuthenticated = false
          ▼
     [Token Found]
          │
          ▼
Axios GET /me with Bearer Token in headers
          │
          ▼
FastAPI Decodes JWT token
          │
          ├─► [Expired/Invalid] ──► Clear local token, redirect to /login
          ▼
      [Valid] ──► Return user document 
          │
          ▼
Update AuthContext (isAuthenticated = true, user = doc)
```

---

## 5. Protected Route Flow
```
User navigates to Protected Route (e.g. /settings)
          │
          ▼
React Router matches path ──► ProtectedLayout Wrapper
          │
          ▼
ProtectedLayout checks AuthContext.isLoading
          │
          ├─► [Yes] ──► Render SuspenseLoader Spinner
          ▼
       [No]
          │
          ├─► [isAuthenticated === false] ──► Redirect to /login
          ▼
       [isAuthenticated === true]
          │
          ▼
Render Outlet children (Settings Page Component)
```

---

## 6. Expense CRUD Flow
```
Create/Update: Click "Save Expense"
      │
      ▼
Axios POST/PUT request to /expenses
      │
      ▼
FastAPI inserts/updates document in MongoDB
      │
      ▼
API response returned ──► Axios interceptor intercepts response
      │
      ▼
Interceptors fire custom event: window.dispatchEvent('data-mutated')
      │
      ▼
App.tsx listener catches event ──► queryClient.invalidateQueries()
      │
      ▼
TanStack Query refetches current queries in background ──► UI updates
```

---

## 7. Dashboard Flow
```
Dashboard Mounts
       │
       ├─► queryClient fetches ['dashboard'] ────► analyticsService.getDashboard()
       ├─► queryClient fetches ['recentExpenses'] ─► expenseService.list()
       ├─► queryClient fetches ['goals'] ────────► goalService.list()
       ├─► queryClient fetches ['notifications'] ─► notificationService.get()
       └─► queryClient fetches ['aiInsights'] ────► aiService.insights()
       │
       ▼
Show Skeletons while fetching ────► Suspense & lazy loading wraps
       │
       ▼
Successful API responses populated in cache
       │
       ▼
Charts and widgets paint with actual data (Recharts)
```

---

## 8. Statement Import Flow
```
Upload PDF file in StatementImport page
          │
          ▼
statementService.upload() ──► POST file to /statements/upload
          │
          ▼
FastAPI reads PDF buffer ──► Runs PDF extraction pipeline
          │
          ▼
Regex parsing maps transactions, checks statement type (Bank vs. CC)
          │
          ▼
FastAPI returns extracted items list and metadata summary
          │
          ▼
Frontend displays preview table ──► User clicks "Confirm Import"
          │
          ▼
Axios POST to /statements/confirm ──► items inserted into DB
          │
          ▼
Triggers 'data-mutated' event ──► Dashboard cache updates
```

---

## 9. Credit Card Flow
```
Card Configuration: Click "Save Card"
          │
          ▼
Axios POST to /credit-card
          │
          ▼
Saved to DB. Outstanding balances computed from transaction list
          │
          ▼
Invalidates ['credit-cards'] query key
          │
          ▼
Card widgets (CreditCardPage / CreditCardWidget) repaint
```

---

## 10. AI Insights Flow
```
Query Key ['aiInsights'] evaluated
          │
          ▼
FastAPI POST to /ai/insights
          │
          ▼
AI service gathers user financial profile (Income, Card usage, Goals)
          │
          ▼
Generates custom suggestions, warnings, and health scores (0-100)
          │
          ▼
Returns insights JSON ──► Frontend displays coach alerts bento layout
```

---

## 11. Notification Flow
```
Event updates on backend (Import completed, payment due in 3 days)
          │
          ▼
FastAPI creates in-app notification document (centralized service)
          │
          ▼
Client Navbar performs polling check every 60 seconds
          │
          ▼
Notification indicator updates unread count on bell icon
          │
          ▼
User clicks notification ──► trackEvent('notification_opened') ──► Redirects to page
```

---

## 12. Google Analytics Flow
```
User Actions (Login, Route Switch, Expense Created, etc.)
          │
          ▼
Call trackPageView(path) or trackEvent(name, params) in components
          │
          ▼
Scrub email/name/password fields from params (PII Sanitation)
          │
          ▼
Verify GA is initialized (Measurement ID is present)
          │
          ├─► [No] ──► Log event details directly to developer console
          ▼
       [Yes] ──► Dispatch payload safely to Google GA4 endpoints
```

---

## 13. Deployment Architecture
```
┌────────────────────────────────────────────────────────┐
│                    GitHub Repository                   │
└──────────────────────────┬─────────────────────────────┘
                           │ git push
                           ▼
┌────────────────────────────────────────────────────────┐
│                   Vercel Platform                      │
│  (Triggers Webhook, Runs "npm install", "vite build")   │
└──────────────────────────┬─────────────────────────────┘
                           │ Serves static build files
                           ▼
┌────────────────────────────────────────────────────────┐
│                     CDN Edge Nodes                     │
│              (Fast loading for static assets)          │
└────────────────────────────────────────────────────────┘
```

---

## 14. Folder Hierarchy
```
src/
 ├─ api/         # Global API Client
 ├─ components/  # Layout elements & Bento Widgets
 ├─ context/     # Global state (Auth)
 ├─ hooks/       # Custom React Hooks
 ├─ layouts/     # Routing Shells
 ├─ pages/       # SPA view pages
 ├─ routes/      # Router configurations
 ├─ services/    # REST API connectors
 ├─ types/       # TypeScript modules
 └─ utils/       # Global tracking & math
```

---

## 15. Request Lifecycle
```
Axios Request Triggered (e.g. api.get('/expenses'))
          │
          ▼
Request Interceptor (attaches Bearer Token to Authorization headers)
          │
          ▼
Network request traverses DNS to FastAPI endpoint
          │
          ▼
FastAPI Authentication Middleware verifies JWT credentials
          │
          ▼
Route handler logic processes command ──► Database query
```

---

## 16. Response Lifecycle
```
FastAPI routes query data ──► returns JSON payload
          │
          ▼
Client receives response
          │
          ▼
Axios Response Interceptor captures response
          │
          ├─► [Method is POST/PUT/DELETE/PATCH] ──► dispatch 'data-mutated' event
          ▼
Promise resolves ──► UI component receives data
```

---

## 17. Component Hierarchy
```
┌────────────────────────────────────────────────────────┐
│                        App.tsx                         │
│ (QueryClientProvider, ErrorBoundary, AnimatePresence)   │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│                      ProtectedLayout                   │
│         (AppLayout wrapper with Auth check)            │
└──────────────────────────┬─────────────────────────────┘
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
┌──────────────────────────┐ ┌──────────────────────────┐
│        Navbar.tsx        │ │       Sidebar.tsx        │
│(Dropdown, Notification)  │ │   (Navigation Links)     │
└──────────────────────────┘ └──────────────────────────┘
              │
              ▼
┌────────────────────────────────────────────────────────┐
│                     Outlet Children                    │
│     (Dashboard.tsx, Expenses.tsx, Goals.tsx, etc.)     │
└────────────────────────────────────────────────────────┘
```
