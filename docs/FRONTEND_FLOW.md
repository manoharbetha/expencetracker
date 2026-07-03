# Frontend Page Rendering & Navigation Lifecycles

Fintell is a single page application (SPA) built with React 18, React Router v6, and TanStack Query. 

---

## 1. App Mounting Lifecycle
When a user loads the website:
1. `index.html` loads static assets.
2. `main.tsx` mounts the React application tree inside `div#root`.
3. `App.tsx` configures the TanStack `QueryClientProvider` cache and registers the global `data-mutated` event listener.
4. `routes/index.tsx` checks session cookies/tokens:
   - If not authenticated, redirects `/` to `/login`.
   - If authenticated, redirects `/` to `/dashboard`.

---

## 2. Page Navigation Lifecycle
When a user clicks a sidebar navigation link:
1. **Route Transition:** React Router intercepts the URL switch, preventing a browser page reload.
2. **Dynamic Importing (Code Splitting):** If navigating to a page for the first time, Vite fetches the corresponding lazy-loaded chunk (e.g. `Expenses-*.js`).
3. **Suspense Loader:** Shows the `<SuspenseLoader />` pulsing backdrop spinner until the file chunk compiles.
4. **Mounting:** The page component mounts. It initiates TanStack queries (like `['expenses']`) using standard hooks.
5. **Data Population:** Skeletons display until API responses populate the TanStack Query cache, replacing Skeletons with the actual widget UI.

---

## 3. Form Validation Flow
All registration, login, expense addition, and card creation forms implement rigid client-side validation logic before firing network requests:
- **Registration (`Register.tsx`):** Validates name length, email syntax via regex, password length (minimum 8 characters), password matching, and a positive monthly income number.
- **Expenses (`Expenses.tsx`):** Validates that description, positive amount, and valid date fields are filled before submitting to the mutation handler.
- **Credit Cards (`CreditCardPage.tsx`):** Validates card name, bank name, and positive credit limits.
- **Error Handling:** Triggers react-hot-toast error notifications or sets localized `errors` state object to draw inline red helper tags beneath failed inputs.
