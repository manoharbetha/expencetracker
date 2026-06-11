from datetime import datetime, timezone
from fastapi import APIRouter, Body, Depends, HTTPException
from pymongo import ReturnDocument
from pymongo.errors import DuplicateKeyError
from bson import ObjectId

from app.core.security import hash_password, verify_password, create_access_token, get_current_user, serialize_user
from app.db.mongodb import get_db
from app.schemas import UserRegister, UserLogin, UserPublic, TokenResponse, UserProfileUpdate

from fastapi import APIRouter, Body, Depends, HTTPException, Response

router = APIRouter()

@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(response: Response, user_data: UserRegister = Body(...)) -> TokenResponse:
    now = datetime.now(timezone.utc)
    doc = {
        "name": user_data.name.strip(),
        "email": user_data.email.lower().strip(),
        "hashed_password": hash_password(user_data.password),
        "monthlyIncome": user_data.monthlyIncome,
        "currency": "INR",
        "country": "India",
        "createdAt": now,
        "updatedAt": now,
    }
    try:
        res = await get_db().users.insert_one(doc)
    except DuplicateKeyError:
        raise HTTPException(status_code=409, detail="An account with this email already exists.")
    user_doc = {**doc, "_id": res.inserted_id}
    user = serialize_user(user_doc)
    token = create_access_token(user["id"])
    response.set_cookie(
        key="fintell_token",
        value=token,
        httponly=True,
        samesite="lax",
        secure=False, # Set to True in production with HTTPS
        max_age=14 * 24 * 60 * 60,
    )
    return TokenResponse(access_token=token, user=UserPublic(**user))

@router.post("/login", response_model=TokenResponse)
async def login(response: Response, user_data: UserLogin = Body(...)) -> TokenResponse:
    doc = await get_db().users.find_one({"email": user_data.email.lower().strip()})
    if not doc or not verify_password(user_data.password, doc["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    user = serialize_user(doc)
    token = create_access_token(user["id"])
    response.set_cookie(
        key="fintell_token",
        value=token,
        httponly=True,
        samesite="lax",
        secure=False,
        max_age=14 * 24 * 60 * 60,
    )
    return TokenResponse(access_token=token, user=UserPublic(**user))

@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie(key="fintell_token", httponly=True, samesite="lax")
    return {"message": "Logged out successfully"}

@router.get("/me", response_model=UserPublic)
async def me(u: dict = Depends(get_current_user)) -> UserPublic:
    return UserPublic(**u)

@router.put("/profile", response_model=UserPublic)
async def update_profile(
    update_data: UserProfileUpdate = Body(...),
    u: dict = Depends(get_current_user),
) -> UserPublic:
    upd = {k: v for k, v in update_data.model_dump().items() if v is not None}
    upd["updatedAt"] = datetime.now(timezone.utc)
    res = await get_db().users.find_one_and_update(
        {"_id": ObjectId(u["id"])},
        {"$set": upd},
        return_document=ReturnDocument.AFTER,
    )
    return UserPublic(**serialize_user(res))
