# API Request & Response Flows

Fintell utilizes a centralized Axios setup in `src/services/api.ts` to connect to its FastAPI REST backend.

---

## 1. Request Flow (Dynamic Header Ingestion)
When a component calls an API service (e.g. `expenseService.list()`), the request passes through the following chain:

1. **Service Call:** Service invokes the Axios instance `api.get('/expenses')`.
2. **Request Interceptor:** 
   - Interceptor catches the outbound request.
   - Performs a check: `localStorage.getItem('fintell_token')`.
   - If a token is found, adds the `Authorization: Bearer <token>` header.
3. **Network Transit:** Outgoing request is fired to FastAPI.

---

## 2. Response Flow (Global Mutation Dispatch)
When FastAPI responds, the client processes it as follows:

1. **Client Receives Response:** Response object enters the response interceptor.
2. **Method Evaluation:** Interceptor reads the original HTTP request method.
3. **State Mutation Check:** If method is `POST`, `PUT`, `PATCH`, or `DELETE`:
   - Fires a custom DOM Event: `window.dispatchEvent(new Event('data-mutated'))`.
   - Fires a notification sync event: `window.dispatchEvent(new Event('notification-updated'))`.
4. **Resolution:** Returns the raw response data to the calling service, resolving the Promise.

---

## 3. Global Invalidation Loop
The custom event fired by the interceptor creates an automatic, self-healing state loop:

```
Component Mutation (e.g., Add Expense)
           │
           ▼
Axios POST /expenses
           │
           ▼
Axios Interceptor receives success response
           │
           ▼
Dispatches 'data-mutated' event
           │
           ▼
App.tsx catches event ──► queryClient.invalidateQueries()
           │
           ▼
Dashboard refetches data in background ──► React state updates ──► UI renders fresh data
```
This loop guarantees that no stale data is shown after any write operation.
