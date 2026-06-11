from datetime import datetime, timedelta, timezone
from bson import ObjectId
import bcrypt
from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from app.core.config import get_settings
from app.db.mongodb import get_db

bearer_scheme = HTTPBearer(auto_error=False)

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def verify_password(password: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False

def create_access_token(user_id: str) -> str:
    settings = get_settings()
    exp = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_access_token_expire_minutes)
    return jwt.encode(
        {"sub": user_id, "exp": exp, "iat": datetime.now(timezone.utc)},
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm,
    )

def decode_access_token(token: str) -> str:
    settings = get_settings()
    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
        sub = payload.get("sub")
        if not sub:
            raise JWTError("no sub")
        return str(sub)
    except JWTError as e:
        raise ValueError("invalid token") from e

def serialize_user(doc: dict) -> dict:
    return {
        "id": str(doc["_id"]),
        "name": doc.get("name", ""),
        "email": doc.get("email", ""),
        "monthlyIncome": float(doc.get("monthlyIncome", doc.get("monthly_income", 0))),
        "currency": doc.get("currency", "INR"),
        "country": doc.get("country", "India"),
        "createdAt": doc.get("createdAt", doc.get("created_at", datetime.now(timezone.utc))).isoformat()
        if hasattr(doc.get("createdAt", doc.get("created_at")), "isoformat")
        else str(doc.get("createdAt", doc.get("created_at", ""))),
    }

async def get_current_user(request: Request, creds: HTTPAuthorizationCredentials = Depends(bearer_scheme)) -> dict:
    token = request.cookies.get("fintell_token")
    if not token and creds:
        token = creds.credentials
    
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
        
    try:
        uid = decode_access_token(token)
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
        
    if not ObjectId.is_valid(uid):
        raise HTTPException(status_code=401, detail="Invalid token payload")
    
    db = get_db()
    user = await db.users.find_one({"_id": ObjectId(uid)})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return serialize_user(user)
