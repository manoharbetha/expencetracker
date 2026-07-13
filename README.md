# Fintell — AI-Powered Financial Intelligence Cockpit

Fintell is a production-ready, AI-driven personal finance application that helps users track expenses, manage credit card debt, auto-ingest transactions from PDF statements, and receive intelligent financial warnings and coaching.

---

## 🚀 Key Features

- **📊 Interactive Dashboard:** A central financial command center containing dynamic income vs. expense bars, monthly spending trends, active goal progress gauges, and notification centers.
- **📄 Automated Statement Import:** Seamless PDF parser that reads bank and credit card statement transactions and imports them, with intelligent transaction conflict resolution (replace vs. append).
- **💳 Credit Card Outstanding Debt Ledger:** Monitor card outstanding details, available limits, statement dates, and warning cycles when credit utilization spikes.
- **🤖 AI Financial Coach:** Runs real-time diagnostic checks on user income, expense patterns, and goals to provide personalized savings advice and compute a unified financial health score.
- **🔔 Notification Alerts:** Integrated notifications that alert you when statements finish parsing, card payment dates approach, or limits are crossed.
- **🌐 Google Analytics 4 (GA4):** Complete user-journey tracking with path sanitization, environment flag fallbacks, and strict PII exclusion blocks.

---

## 🛠 Tech Stack

- **Frontend:** React 18, TypeScript, TailwindCSS, TanStack Query, React Router v6, Recharts.
- **Build Tooling:** Vite 6, PostCSS, Progressive Web App caching (`vite-plugin-pwa`).
- **Backend Connector:** REST API communication via Axios client with request/response authorization token interceptors.
- **Backend (Python):** FastAPI, MongoDB document store, PyDantic validation models, PDF extraction engines.

---

## 📂 Folder Structure

```
src/
 ├─ api/         # Global API Client & interceptor setups
 ├─ components/  # Chart engines & Dashboard bento cards
 ├─ context/     # Global state (Session, JWT validation)
 ├─ hooks/       # Custom React Hooks
 ├─ layouts/     # Routing wireframes & layouts
 ├─ pages/       # Router page components
 ├─ routes/      # Declarative routes & protected layout guards
 ├─ services/    # REST API services
 ├─ types/       # Consolidated TypeScript declarations
 ├─ utils/       # Formatter scripts & GA4 wrapper
 └─ main.tsx     # React bootstrapper
```

For a comprehensive guide to Fintell's directories and import relationships, review the [PROJECT_STRUCTURE.md](docs/PROJECT_STRUCTURE.md) documentation.

---

## 📦 Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/manoharbetha/expencetracker.git
   cd expencetracker
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory:
   ```env
   VITE_API_URL=http://localhost:8000
   VITE_GA_MEASUREMENT_ID=G-EB04P029LF
   ```

4. **Launch development server:**
   ```bash
   npm run dev
   ```

5. **Build for production:**
   ```bash
   npm run build
   ```

---

## 🛡 Security & Privacy

Fintell enforces industry-standard user privacy and security protocols:
- **Authorization:** Sessions are authorized via Bearer JWT tokens attached to outgoing Axios calls.
- **Route Protection:** Layout wrappers block unauthenticated users from page endpoints.
- **PII Sanitation:** GA4 logging helper blocks names, emails, and passwords from telemetry data. Path analytics strip queries to prevent parameter leakage.

Review the [SECURITY.md](docs/SECURITY.md) guidelines for full details.

---

## 👥 Team & Contributions

Fintell was developed as a collaborative team project. Each member was responsible for a core area of the application.

| Team Member | Role | Responsibilities | Technologies |
|-------------|------|------------------|--------------|
| **Pardhu** | 🎨 Frontend Developer | Designed the user interface, built the dashboard, authentication pages, responsive layouts, and interactive charts. | React, TypeScript, Tailwind CSS |
| **Manohar Betha** | ⚙️ Backend Developer | Developed the FastAPI backend, designed REST APIs, implemented JWT authentication, and built expense & financial management services. | FastAPI, Python, JWT |
| **Amrutha** | 🗄️ Database & Security Engineer | Managed MongoDB database design, user & expense storage, database connectivity, and password security. | MongoDB Atlas, bcrypt |
| **Chandu** | 🤖 AI/ML Developer | Developed AI-powered expense categorization, budget prediction, financial insights, and intelligent chatbot features. | Pandas, Scikit-learn, OpenAI API |
| **Sonu** | 🚀 Testing & Deployment Engineer | Performed application testing, fixed bugs, managed deployment, and prepared project documentation. | Postman, Vercel, Render, GitHub |



---

## 📖 Project Documentation

Detailed architecture maps, design tradeoffs, and code walkthroughs are available inside the `/docs` folder:
- **[README_PROJECT.md](docs/README_PROJECT.md):** High-level business purpose and tech stack specs.
- **[ARCHITECTURE.md](docs/ARCHITECTURE.md):** 17 ASCII system data-flow diagrams.
- **[INTERVIEW_PREP.md](docs/INTERVIEW_PREP.md):** Detailed interview preparation guide containing common interview questions and expert answers.
- **[CODE_TOUR.md](docs/CODE_TOUR.md):** Step-by-step walkthrough detailing how to read this codebase.

---

## 📄 License
This project is open-source and licensed under the MIT License.
