# AI Finance Manager

A modern, full-stack personal finance application with AI-driven insights.

## About the Project

The AI Finance Manager is a comprehensive platform designed to help users gain complete control over their personal finances. Built for young professionals and students, it consolidates expense tracking, goal management, and credit card utilization into a single dashboard. 

The primary objective of this project is to simplify financial tracking while leveraging artificial intelligence to provide personalized, actionable recommendations—empowering users to save more and spend smarter without manual calculations.

## Internship Information

Developed during the Full Stack Development Internship at Symbiosis Technologies.

## Features

- 📊 **Dashboard Analytics**: A consolidated view of monthly income, total expenses, net savings, and active goals.
- 🤖 **AI Financial Insights**: Automated, dynamic recommendations and financial health scoring based on spending patterns.
- 💳 **Credit Card Tracking**: Monitor credit utilization, receive billing cycle reminders, and maintain a healthy credit score securely.
- 🧾 **Statement Import**: Upload bank statements directly to auto-categorize and track transactions quickly.
- 🎯 **Goal Tracking**: Set targets for savings or debt repayment and track them with visual progress indicators.
- 📝 **Financial Notepad**: Integrated quick notes to log wishlist items, pending purchases, or rough calculations.
- 🔒 **Secure Authentication**: Robust user authentication flow protecting personal financial data.

## Screenshots

*(Placeholders for future project screenshots)*

- `[Dashboard]`
- `[Expenses]`
- `[Goals]`
- `[Credit Card]`
- `[AI Insights]`
- `[Statement Import]`

## Tech Stack

**Frontend**
- React 18
- TypeScript
- Vite
- Tailwind CSS

**Backend**
- FastAPI (Python)
- REST APIs

**Database**
- MongoDB (via MongoDB Atlas)

**AI & Analytics**
- Integrated AI Models for Financial Insights

## Project Architecture

The application follows a decoupled client-server architecture:
- **React Frontend**: A modular, responsive user interface built with component-driven architecture for rapid rendering and smooth user experiences.
- **FastAPI Backend**: A highly performant RESTful API layer managing business logic, AI interactions, and data processing.
- **MongoDB Database**: A flexible NoSQL database storing user profiles, transaction history, and financial goals.

## Folder Structure

```
expencetracker/
├── backend/            # FastAPI Server Application
│   ├── app/
│   │   ├── api/        # REST Route Definitions
│   │   ├── core/       # Configurations and Security
│   │   ├── models/     # Database Schemas
│   │   └── services/   # Backend Business & AI Logic
│   └── requirements.txt
└── src/                # React Vite Frontend Application
    ├── components/     # Reusable UI widgets and domain components
    ├── context/        # Global State (Auth, Theme)
    ├── pages/          # Application Route Views
    ├── services/       # Frontend API Integration layer
    ├── types/          # TypeScript interface definitions
    └── utils/          # Helpers and formatters
```

## My Contributions

I primarily focused on the core logic and integrations of the platform. My personal contributions include:
- Backend API Development (FastAPI)
- MongoDB Integration
- AI Financial Insights Implementation
- Statement Import Processing Logic
- Credit Card Tracking System
- User Authentication Flow
- Dashboard Data Integration

## Team

This project was developed during the Full Stack Development Internship at Symbiosis Technologies.

### Team Members
- Manohar Betha
- Chandu
- Amrutha
- Pardhu
- Sonu

## Installation

Follow these steps to run the project locally.

### 1. Clone the repository
```bash
git clone https://github.com/manoharbetha/expencetracker.git
cd expencetracker
```

### 2. Backend Setup
Navigate to the backend directory, create a virtual environment, and install the dependencies:
```bash
cd backend
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

pip install -r requirements.txt
```
Start the FastAPI backend server:
```bash
uvicorn app.main:app --reload
```

### 3. Frontend Setup
Open a new terminal window, navigate to the project root, and install dependencies:
```bash
npm install
```
Start the React development server:
```bash
npm run dev
```
The application will be accessible at `http://localhost:5173`.

## Environment Variables

To run this project, you will need to add the following environment variables.

### Frontend (`.env` in root)
```env
VITE_API_URL=http://localhost:8000
```

### Backend (`backend/.env`)
```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
AI_API_KEY=your_ai_service_api_key
```

## Future Improvements

- Multiple Credit Cards management.
- OCR (Optical Character Recognition) for automated physical receipt importing.
- Mobile Application utilizing React Native.
- Advanced AI Recommendations forecasting multi-year financial roadmaps.

## License

This project is licensed under the MIT License.
