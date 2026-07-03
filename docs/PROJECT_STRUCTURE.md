# Project Structure & Dependency Flow

Fintell is organized using a feature-based, modular architecture. This separation ensures that logic, state management, components, and types remain isolated, making the codebase highly maintainable.

---

## Folder Guide

### 1. `src/api/`
- **Purpose:** Centralized Axios configuration.
- **Key Files:** 
  - `src/services/api.ts` (manages the base Axios client, injects auth headers dynamically, interceptors to dispatch `data-mutated` on mutations).

### 2. `src/components/`
Grouped sub-directories for UI components:
- **`src/components/ai/`**: AI chatbot and coach banners.
- **`src/components/cards/`**: Reusable summary dashboard cards, goal cards, debt cards.
- **`src/components/charts/`**: Custom Recharts wrappers (spending trend lines, category distribution pies, income/expense bars).
- **`src/components/dashboard/`**: Widget panels (financial health alerts, credit card outstanding details, notifications pane).
- **`src/components/layout/`**: Desktop sidebar, top navigation header (Navbar), theme togglers.
- **`src/components/notifications/`**: Sliding notification drawer list.
- **`src/components/ui/`**: Reusable generic layout components (Buttons, Modals, Progress bars, Skeletons, Tooltips).

### 3. `src/context/`
- **Purpose:** Global application state.
- **Key Files:** 
  - `src/context/AuthContext.tsx` (manages the token lifecycle, user validation, register, login, and logout events).

### 4. `src/hooks/`
- **Purpose:** Reusable state hooks.
- **Key Files:** 
  - `src/hooks/useTheme.ts` (dark-mode theme toggler).

### 5. `src/layouts/`
- **Purpose:** Core layout templates.
- **Key Files:**
  - `AppLayout.tsx` (grid shell wrapping sidebar, header, and content).
  - `AuthLayout.tsx` (layout for authentication templates).

### 6. `src/pages/`
- **Purpose:** Main SPA router pages.
- **Key Files:**
  - `Dashboard.tsx`: Main financial dashboard.
  - `Expenses.tsx`: Ledger page with filters.
  - `CreditCardPage.tsx`: CC manager page.
  - `StatementImport.tsx`: PDF uploader and parser.
  - `Goals.tsx` / `DebtManager.tsx` / `AIAssistant.tsx` / `Notepad.tsx` / `Settings.tsx` / `NotFound.tsx`.

### 7. `src/routes/`
- **Purpose:** SPA routing.
- **Key Files:**
  - `index.tsx`: Defines the router configuration. Implements route guards (`ProtectedLayout`), lazy-loads all routes, and injects `<SuspenseLoader />` fallbacks.

### 8. `src/services/`
- **Purpose:** API service layers.
- **Key Files:**
  - `authService.ts`, `expenseService.ts`, `creditCardService.ts`, `goalService.ts`, `debtService.ts`, `statementService.ts`, `notificationService.ts`, `aiService.ts`.

### 9. `src/types/`
- **Purpose:** Strongly-typed TypeScript declarations.
- **Key Files:**
  - `auth.ts`, `analytics.ts`, `expense.ts`, `goal.ts`, `creditCard.ts`, `debt.ts`, `notification.ts`, `report.ts`, `user.ts`.
  - `index.ts` (re-exports all file structures).

### 10. `src/utils/`
- **Purpose:** Helper libraries.
- **Key Files:**
  - `analytics.ts`: GA4 initialization and event tracking wrapper.
  - `calculations.ts`: Savings rate formulas and statistics.
  - `formatters.ts`: Date and Indian Rupee currency formatters.

---

## Import Relationships & Dependency Flow

The code follows a strict dependency hierarchy to prevent circular imports:

```
                  ┌──────────────────────┐
                  │   Vite Entrypoint    │
                  │   (src/main.tsx)     │
                  └──────────┬───────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │      React App       │
                  │     (src/App.tsx)    │
                  └──────────┬───────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │   React Router DOM   │
                  │  (src/routes/index)  │
                  └──────────┬───────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │      SPA Pages       │
                  │     (src/pages/)     │
                  └────┬────────────┬────┘
                       │            │
         ┌─────────────┘            └─────────────┐
         ▼                                        ▼
┌──────────────────┐                     ┌──────────────────┐
│  UI Components   │                     │   API Services   │
│(src/components/) │                     │ (src/services/)  │
└────────┬─────────┘                     └────────┬─────────┘
         │                                        │
         └─────────────┐            ┌─────────────┘
                       ▼            ▼
                  ┌──────────────────────┐
                  │      Axios Client    │
                  │  (src/services/api)  │
                  └──────────┬───────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │   Type Definitions   │
                  │    (src/types/)      │
                  └──────────────────────┘
```

1. **Page/Component Layer:** Imports services and context state. Never imports routers directly.
2. **Service Layer:** Calls `/src/services/api.ts` Axios instances and utilizes `src/types/` definitions. Does not import UI components.
3. **API Client Layer:** Raw Axios initialization. Only imports types.
4. **Types/Utils Layer:** Completely self-contained modules. They have zero dependencies on app pages, layouts, or routers.
