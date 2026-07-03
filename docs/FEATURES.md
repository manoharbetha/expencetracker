# Core Features Breakdown

Below is a detailed engineering look at the three primary features of Fintell: PDF statement imports, the AI financial coach, and the in-app notification center.

---

## 1. Automated PDF Statement Ingestion
Parsing PDF statements avoids human entry errors and provides immediate data visibility.

- **Upload & Extraction:** The user uploads a bank statement PDF. The FastAPI backend receives the binary file, extracts raw text strings using coordinate-based text layout blocks, and parses them using regular expression filters.
- **Categorization Engine:** The parser extracts key features (Merchant names, Date values, Payment directions, Transaction codes) and maps them to standard expense categories (Food, Bills, Travel, Shopping, etc.).
- **Card Synchronization:** If a Credit Card statement is detected, it compares the statement metrics with existing credit card configurations. If it is a new card, it automatically opens the "New Card Configuration" modal, importing the bank and credit limit parameters.
- **Transaction Conflict Resolution:** To prevent double entry of duplicate files:
  - Users can choose to **Replace** current card expenses with statement items.
  - Or **Append** the new records, filtering out items matching identical timestamp, description, and currency values.

---

## 2. AI Financial Coaching
Financial telemetry is worthless without active behavioral recommendations. Fintell processes transaction records and outputs real-time coaching:
- **Income-to-Expense Ratios:** Calculates user spending pace relative to monthly income.
- **Debt Limit Alerts:** Computes total active card limits against current outstanding usage. If usage crosses 80%, generates a high-priority alert.
- **Goal Deadlines:** Evaluates target deadline calendars and computes if current savings pace will cause the user to miss their milestone.
- **Insights generation:** Returns structured JSON containing suggestions (e.g. "Save ₹1,500/month on Bills"), critical warnings, and a dynamic financial health index score (from 0 to 100).

---

## 3. Real-Time In-App Notifications
Keeps users informed of critical payment deadlines and limit thresholds without using intrusive browser push mechanisms.
- **Trigger Services:** The backend runs a scheduler that evaluates credit card payment cycles daily.
- **Alert Generation:** If a payment is due in 7 days, 3 days, or today, it automatically writes a notification record to MongoDB.
- **Navbar Integration:** The frontend `Navbar` queries `/notifications` every 60 seconds. An unread count displays above the bell icon. Clicking on a notification flags it as read on the backend and immediately routes the user to the corresponding page (e.g. Credit Card page).
