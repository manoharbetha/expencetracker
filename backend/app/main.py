from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from jose import JWTError
from pymongo.errors import PyMongoError

from app.core.config import get_settings
from app.db.mongodb import connect_to_mongo, close_mongo_connection
from app.core.scheduler import start_scheduler, stop_scheduler
from app.services.fcm_service import initialize_firebase

from app.api.endpoints import auth, expenses, goals, dashboard, ai, debts, notifications, statements, notepad

@asynccontextmanager
async def lifespan(_app: FastAPI):
    # Startup
    await connect_to_mongo()
    start_scheduler()
    initialize_firebase()
    yield
    # Shutdown
    stop_scheduler()
    await close_mongo_connection()

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version="4.0.0",
    description="AI-powered personal finance tracker — Modular Production Ready.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception Handlers
@app.exception_handler(PyMongoError)
async def mongo_err(_req: Request, exc: PyMongoError) -> JSONResponse:
    print(f"MongoDB error: {exc}")
    return JSONResponse(status_code=503, content={"detail": "Database error. Please try again."})

@app.exception_handler(JWTError)
async def jwt_err(_req: Request, _exc: JWTError) -> JSONResponse:
    return JSONResponse(status_code=401, content={"detail": "Invalid or expired token."})

@app.exception_handler(Exception)
async def generic_err(_req: Request, exc: Exception) -> JSONResponse:
    # Allow HTTPException to pass through cleanly
    if hasattr(exc, "status_code"):
        return JSONResponse(status_code=exc.status_code, content={"detail": getattr(exc, "detail", "Error")})
    print(f"Unhandled error: {type(exc).__name__}: {exc}")
    return JSONResponse(status_code=500, content={"detail": "Internal server error."})

# Health
@app.get("/health", tags=["System"])
async def health() -> dict:
    return {"status": "ok", "service": "Expence Tracker API", "version": "4.0.0"}

# Routers
# Routers
api = settings.api_prefix
app.include_router(auth.router, prefix=api, tags=["Auth"])
app.include_router(expenses.router, prefix=f"{api}/expenses", tags=["Expenses"])
app.include_router(goals.router, prefix=f"{api}/goals", tags=["Goals"])
app.include_router(debts.router, prefix=f"{api}/debts", tags=["Debts"])
app.include_router(dashboard.router, prefix=api, tags=["Analytics"])
app.include_router(ai.router, prefix=f"{api}/ai", tags=["AI"])
app.include_router(notifications.router, prefix=f"{api}/notifications", tags=["Notifications"])
app.include_router(statements.router, prefix=f"{api}/statements", tags=["Statements"])
app.include_router(notepad.router, prefix=f"{api}/notepad", tags=["Notepad"])
