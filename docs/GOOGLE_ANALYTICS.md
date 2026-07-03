# Google Analytics 4 (GA4) Implementation

Fintell uses Google Analytics 4 (GA4) to track user interaction patterns. The implementation is isolated, TypeScript-safe, and enforces strict privacy protections.

---

## 1. Setup & Environment
- **Library:** Powered by `react-ga4`.
- **Measurement ID:** Read from `import.meta.env.VITE_GA_MEASUREMENT_ID`.
- **Initialization:** Initialized exactly once in `App.tsx` via `initGA()`. If the measurement ID is missing, the wrapper runs in a safe log-only mode.

---

## 2. Page View Tracking
Automatic page view tracking is handled in `src/App.tsx` by subscribing to router location changes:
```typescript
useEffect(() => {
  trackPageView(location.pathname);
}, [location.pathname]);
```
Inside `analytics.ts`, `trackPageView` strips the query string (e.g. `?search=term`) to prevent leaking search tokens or parameters.

---

## 3. Custom Events Logged
Custom events are dispatched using the `trackEvent` function:

1. **Authentication:**
   - `login_success`
   - `register_success`
   - `logout`
2. **Dashboard:**
   - `dashboard_viewed`
3. **Expenses:**
   - `expense_created` (Parameters: `category`, `amount`)
   - `expense_updated` (Parameters: `category`, `amount`)
   - `expense_deleted` (Parameters: `expense_id`)
4. **Income:**
   - `income_created` (Parameters: `amount` - fired when settings update monthly income)
5. **Statement Import:**
   - `statement_import_started` (Parameters: `file_size`)
   - `statement_import_success` (Parameters: `statement_type`, `item_count`)
   - `statement_import_failed` (Parameters: `reason`)
6. **Credit Cards:**
   - `credit_card_added` (Parameters: `credit_limit`, `bank_name`)
   - `credit_card_deleted` (Parameters: `card_id`)
7. **AI Coaching:**
   - `ai_insights_generated` (Parameters: `insight_count`)
8. **Notifications:**
   - `notification_opened` (Parameters: `notification_id`, `category`, `type`, `priority`)

---

## 4. Sanitation Middleware (No PII)
Every event payload is filtered through a sanitation loop:
```typescript
const sanitizeParams = (params?: Record<string, any>) => {
  if (!params) return undefined;
  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(params)) {
    if (['email', 'name', 'password', 'token', 'user', 'userName'].includes(key)) {
      continue;
    }
    sanitized[key] = value;
  }
  return sanitized;
};
```
This guarantees user metadata never reaches Google servers.
