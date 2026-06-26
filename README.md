# AI Finance Manager

A personal finance dashboard that tracks expenses, manages goals, and provides data-driven financial insights.

## About the Project

AI Finance Manager is a web application designed to help users track their income, expenses, and financial goals in one centralized dashboard. It solves the problem of manual expense tracking by providing automated categorizations, credit card utilization monitoring, and AI-driven spending insights. This application is intended for students, young professionals, and anyone looking for a clear overview of their personal finances.

Developed during the Full Stack Development Internship at Symbiosis Technologies.

## Features

- **Dashboard Analytics**: View monthly income, total expenses, net savings, and active goals.
- **AI Financial Insights**: Receive automated recommendations and a financial health score based on spending patterns.
- **Credit Card Tracking**: Track credit utilization and view billing cycle due dates.
- **Statement Import**: Upload bank statements to categorize and track transactions automatically.
- **Goal Tracking**: Create financial goals and monitor progress over time.
- **Financial Notepad**: Log quick notes, wishlist items, or pending purchases.
- **Authentication**: Secure user login and registration.

## Screenshots

* [Dashboard Placeholder]
* [Expenses Placeholder]
* [Goals Placeholder]
* [Credit Card Placeholder]
* [AI Insights Placeholder]
* [Statement Import Placeholder]

## Tech Stack

**Frontend**
- React
- TypeScript
- Vite
- Tailwind CSS

**Backend**
- FastAPI
- Python

**Database**
- MongoDB

## Project Architecture

The application is built using a standard client-server architecture:
- **React Frontend**: A single-page application handling the user interface and state management.
- **FastAPI Backend**: A RESTful API handling business logic, authentication, and AI service integration.
- **MongoDB Database**: A NoSQL database storing user accounts, transactions, and goals.

## Folder Structure

```
expencetracker/
├── backend/            
│   ├── app/
│   │   ├── api/        
│   │   ├── core/       
│   │   ├── models/     
│   │   └── services/   
│   └── requirements.txt
└── src/                
    ├── components/     
    ├── context/        
    ├── pages/          
    ├── services/       
    ├── types/          
    └── utils/          
```

## Team

Developed during the Full Stack Development Internship at Symbiosis Technologies.

### Team Members
- Manohar Betha
- Chandu
- Amrutha
- Pardhu
- Sonu

## Installation

### Prerequisites
- Node.js (v16+)
- Python (3.8+)
- MongoDB Atlas account (or local MongoDB instance)

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
Open a new terminal window, navigate to the project root, and install the frontend dependencies:
```bash
npm install
```
Start the React development server:
```bash
npm run dev
```

## Environment Variables

You will need to create environment configuration files to run the application locally.

**Frontend** (`.env` in the root directory):
```env
VITE_API_URL=http://localhost:8000
```

**Backend** (`.env` in the `backend` directory):
```env
MONGODB_URI=<your-mongodb-connection-string>
JWT_SECRET=<your-jwt-secret-key>
AI_API_KEY=<your-ai-service-api-key>
```

## Future Improvements

- Support for managing multiple credit cards simultaneously.
- Implementation of OCR (Optical Character Recognition) to parse physical receipts.
- Development of a companion mobile application.
- Advanced forecasting for long-term financial planning.
