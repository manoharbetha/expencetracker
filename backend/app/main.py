from contextlib import asynccontextmanager
import time
import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from jose import JWTError
from pymongo.errors import PyMongoError

from app.core.config import get_settings
from app.core.logging_config import setup_logging
from app.core.rate_limiter import limiter
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler

from app.db.mongodb import connect_to_mongo, close_mongo_connection, db_manager
from app.core.scheduler import start_scheduler, stop_scheduler
from app.services.fcm_service import initialize_firebase

from app.api.endpoints import auth, expenses, goals, dashboard, ai, debts, notifications, statements, notepad, credit_card

# Initialize logging before settings are created or validated
setup_logging()
logger = logging.getLogger("expencetracker")

@asynccontextmanager
async def lifespan(_app: FastAPI):
    # Startup
    await connect_to_mongo()
    start_scheduler()
    initialize_firebase()
    
    # Initialize Groq client
    from groq import AsyncGroq
    settings = get_settings()
    if settings.groq_api_key:
        _app.state.groq_client = AsyncGroq(api_key=settings.groq_api_key)
    else:
        _app.state.groq_client = None
        
    yield
    # Shutdown
    stop_scheduler()
    await close_mongo_connection()

settings = get_settings()
startup_time = time.time()

app = FastAPI(
    title=settings.app_name,
    version="4.0.0",
    description="AI-powered personal finance tracker — Modular Production Ready.",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Cookie"],
)

@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    if settings.app_env.lower() == "production":
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Content-Security-Policy"] = "default-src 'self'; frame-ancestors 'none'; object-src 'none';"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    return response

# Exception Handlers
@app.exception_handler(PyMongoError)
async def mongo_err(_req: Request, exc: PyMongoError) -> JSONResponse:
    logger.error(f"Database error occurred: {type(exc).__name__}")
    return JSONResponse(status_code=503, content={"detail": "Database error. Please try again."})

@app.exception_handler(JWTError)
async def jwt_err(_req: Request, _exc: JWTError) -> JSONResponse:
    return JSONResponse(status_code=401, content={"detail": "Invalid or expired token."})

@app.exception_handler(Exception)
async def generic_err(_req: Request, exc: Exception) -> JSONResponse:
    if hasattr(exc, "status_code"):
        return JSONResponse(status_code=exc.status_code, content={"detail": getattr(exc, "detail", "Error")})
    logger.error(f"Unhandled error occurred: {type(exc).__name__}", exc_info=True)
    return JSONResponse(status_code=500, content={"detail": "Internal server error."})

# Health
_last_db_ping_time = 0
_last_db_ping_status = "disconnected"

@app.get("/health", tags=["System"])
async def health() -> dict:
    global _last_db_ping_time, _last_db_ping_status
    now = time.time()
    if now - _last_db_ping_time > 5:
        try:
            if db_manager.client is not None:
                await db_manager.client.admin.command('ping')
                _last_db_ping_status = "connected"
            else:
                _last_db_ping_status = "disconnected"
        except Exception as e:
            _last_db_ping_status = f"error: {str(e)}"
        _last_db_ping_time = now
        
    if _last_db_ping_status != "connected":
        return JSONResponse(status_code=503, content={"status": "error"})
        
    return {
        "status": "ok"
    }

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
app.include_router(credit_card.router, prefix=f"{api}/credit-card", tags=["Credit Card"])
