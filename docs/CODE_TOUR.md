# Fintell Code Tour Guide

To understand this codebase in the shortest time, read the files in the following logical sequence. This matches the flow of execution and data within the application.

---

## 1. Entry Point (`src/main.tsx`)
- **What it is:** The index file that bootstraps the React application.
- **Why read it first:** Shows how React is mounted into the DOM, how global CSS is imported, and how the Router wraps the application tree.

## 2. Shell Layout (`src/App.tsx`)
- **What it is:** The root component containing providers and global listener systems.
- **Why read it next:** Sets up the `QueryClientProvider` (TanStack Query), manages the global `'data-mutated'` event listener for cache invalidation, and renders the router tree.

## 3. Router configuration (`src/routes/index.tsx`)
- **What it is:** Routing tables and route guards.
- **Why read it next:** Defines what paths are public (`/login`, `/register`) and protected (`ProtectedLayout`). Explains how lazy loading is set up to improve bundle split metrics.

## 4. Global State (`src/context/AuthContext.tsx`)
- **What it is:** Authentication Context Provider.
- **Why read it next:** Manages the active session validation, login, token storage, registration, and logout states. Underpins the `useAuth()` hook.

## 5. API Client Configuration (`src/services/api.ts`)
- **What it is:** Base Axios instance and global interceptor setup.
- **Why read it next:** Explains how headers dynamically append tokens and how response interceptors trigger global events on DB write mutations.

## 6. Type Declarations (`src/types/`)
- **What it is:** Split TypeScript typings (`src/types/user.ts`, `src/types/expense.ts`, etc.) re-exported via `src/types/index.ts`.
- **Why read it next:** Gives you a detailed look at the data shapes for users, expenses, goals, credit cards, and notifications.

## 7. Service Layer (`src/services/`)
- **What it is:** REST wrappers (`expenseService.ts`, `goalService.ts`, etc.) connecting frontend pages to FastAPI.
- **Why read it next:** Shows how the frontend performs standard CRUD actions and queries.

## 8. Layout shells (`src/layouts/`)
- **What it is:** Structural page shells like `AppLayout.tsx` (sidebar + header content grids) and `AuthLayout.tsx`.
- **Why read it next:** Explains the wireframe geometry of the application viewports.

## 9. Pages (`src/pages/`)
- **What it is:** SPA views.
- **Why read it next:** Explore `Dashboard.tsx` (the core widget hub), `Expenses.tsx` (advanced filter lists), `StatementImport.tsx` (file handling and transaction mapping preview), and `CreditCardPage.tsx` (outstanding limits).

## 10. Components (`src/components/`)
- **What it is:** Component sub-trees.
- **Why read it next:** Dive into `charts/` (Recharts graph models), `dashboard/` (widget calculations), and `notifications/` (drawer handling).

## 11. Tracking & Formatters (`src/utils/`)
- **What it is:** Analytics wrappers and formatters.
- **Why read it last:** Shows how currency metrics are converted to Indian Rupees (INR) and how GA4 sanitation is implemented in `analytics.ts`.
