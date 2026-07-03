# Fintell Expense Tracker — Project Overview

Fintell is a production-grade, AI-powered financial cockpit designed to give users complete control over their money. Built with React 18, TypeScript, TailwindCSS, and TanStack Query on the frontend, and communicating with a high-performance FastAPI backend, it provides category-level expense clearings, automated PDF bank/credit card statement imports, and intelligent financial coaching.

## Business Purpose
Managing personal finance is traditionally fragmented, relying on manual data entry and reactive budgeting. Fintell solves this by creating a single, integrated source of truth that:
1. **Automates Data Ingestion:** Eliminates tedious entry by parsing complex PDF bank and credit card statements directly.
2. **Minimizes Debt Overhead:** Provides deep credit card metrics (current usage, statements, minimum due dates, available limit alerts).
3. **Encourages Proactive Saving:** Tracks goal milestones and details pace metrics (monthly contributions required to hit deadlines).
4. **Delivers Tailored Coaching:** Uses AI intelligence to generate personalized financial warnings, savings suggestions, and health metrics.

---

## Technical Architecture

The application is structured around a decoupled client-server architecture:
- **Client (Frontend):** React + Vite SPA, managed via TanStack Query for cache invalidation and data synchronization.
- **Server (Backend):** High-performance FastAPI server serving API endpoints, integrating PDF extraction pipelines (regex-based parsers), and AI coach generators.
- **Database:** MongoDB for persistent document storage (users, expenses, credit cards, goals, notifications).

```
┌─────────────────────────────────────────────────────────┐
│                    Vite Dev Server                      │
│     (Vite Asset Bundler & TypeScript compiler)           │
└────────────────────────────┬────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│                    Client Browser                       │
│  ┌───────────────────────────────────────────────────┐  │
│  │                     SPA App                       │  │
│  │   (React Router, TanStack Query, Axios, Context)  │  │
│  └─────────────────────────┬─────────────────────────┘  │
└────────────────────────────┼────────────────────────────┘
                             │ (JSON / HTTP Requests)
                             ▼
┌─────────────────────────────────────────────────────────┐
│                    FastAPI Backend                      │
│    (endpoints, auth middleware, parsing pipelines)      │
└────────────────────────────┬────────────────────────────┘
                             │ (Mongoose/PyMongo)
                             ▼
┌─────────────────────────────────────────────────────────┐
│                     MongoDB Atlas                       │
│    (Users, Expenses, Cards, Goals, Notifications)       │
└─────────────────────────────────────────────────────────┘
```

---

## Core Features
1. **Financial Dashboard:** Real-time summary cards, monthly spending trend graphs (Recharts), credit card summary widgets, recent transactions, active goal progresses, and recent notification logs.
2. **Expense Management:** Fully-featured CRUD (Create, Read, Update, Delete) with multi-dimensional filtering (by search query, category, payment source, or specific credit card).
3. **Credit Card Registry:** Full outstanding debt ledger tracking credit card details, available limits, and statement due dates.
4. **Statement Import Pipeline:** High-performance statement parser that extracts transactions from bank or credit card PDFs and populates the database seamlessly.
5. **AI Financial Coach:** Periodically processes user telemetry (income vs. expense patterns, debt ratios, upcoming goals) to generate suggestions, warning alerts, and a financial health score.
6. **In-App Notification Center:** Synchronized system alerts that notify the user about statement imports, upcoming payment deadlines, and budget limits.

---

## Folder Structure

```
docs/                    # Repository architecture and documentation
src/
  api/                   # Axios client configuration and global mutation triggers
  components/            # UI components (dashboard, charts, layout, notifications)
  context/               # React Context providers (AuthContext)
  hooks/                 # Reusable hooks (useTheme)
  layouts/               # Core application shell layouts (AppLayout, AuthLayout)
  pages/                 # Top-level SPA views (Dashboard, Expenses, StatementImport, etc.)
  routes/                # Router configurations and lazy loader setups
  services/              # Axios service endpoints grouped by model
  types/                 # Structured TypeScript modules (user, expense, etc.)
  utils/                 # Math helpers, string formatters, and Google Analytics
```

---

## Deployment
- **Frontend SPA:** Deployed on **Vercel** with automatic pull request preview builds.
- **Backend API:** Deployed on hosting environments with automatic MongoDB Atlas clustering.
- **Continuous Integration:** TypeScript checking (`npx tsc -b`) and asset building (`vite build`) run on every push.
