# AI Finance Manager

An intelligent, modern, and highly scalable personal finance management dashboard built with React and Vite. This application helps users track their expenses, manage goals, monitor credit card utilization, and receive AI-powered financial insights in real-time.

## Features

- **📊 Comprehensive Dashboard**: Get a bird's-eye view of your monthly income, expenses, and net savings.
- **🤖 AI Financial Coach**: Receive personalized, automated insights and health scores based on your spending habits.
- **💳 Credit Card Tracking**: Monitor credit utilization, get automated billing cycle reminders, and maintain a healthy credit score.
- **🎯 Goal Management**: Set, track, and achieve your financial milestones with visual progress indicators.
- **🧾 Statement Import**: Easily upload bank statements to auto-categorize and track transactions.
- **📝 Financial Notepad**: A simple integrated notepad to track wishlist items or rough calculations.

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, Lucide Icons
- **State Management**: React Hooks & Context API
- **Routing**: React Router DOM
- **Backend (API)**: FastAPI / Python (Separate Backend Service)
- **Database**: MongoDB (via Atlas)

## Project Architecture

The codebase has been safely refactored and structured to ensure extreme explainability and scalability, making it perfect for technical interviews or production-level deployments.

```
src/
├── components/
│   ├── cards/          # Reusable summary and goal cards
│   ├── charts/         # Reusable chart components
│   ├── dashboard/      # Dashboard-specific composite widgets
│   ├── layout/         # Navbar, Sidebar, Modals, Auth Layouts
│   ├── notifications/  # Notification drawer and alert components
│   └── ui/             # Core UI components (Buttons, Inputs, Skeletons)
├── context/            # Global state context (e.g., AuthContext)
├── pages/              # Primary route views (Dashboard, Login, Expenses, etc.)
├── services/           # API interaction logic (authService, expenseService, aiService)
├── types/              # Global TypeScript interfaces
└── utils/              # Helper functions (Formatters, Validators)
```

## Getting Started

### Prerequisites
- Node.js (v16+)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/manoharbetha/expencetracker.git
   cd expencetracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env` file in the root directory and add any necessary frontend environment variables.
   ```env
   VITE_API_URL=http://localhost:8000
   ```

4. **Start the Development Server**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:5173`.

### Building for Production

To create an optimized production build:
```bash
npm run build
```

## Contributing

Contributions are welcome! Please ensure that you follow the established architectural patterns (e.g., placing new API calls in `services/` and keeping reusable UI fragments in `components/ui/`).

## Contributors

Special thanks to the following contributors who helped build and maintain this project:
- Chandu
- Amrutha
- Pardhu
- Sonu

## License

This project is licensed under the MIT License.
