from typing import Optional
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo import ASCENDING, DESCENDING
import logging
from app.core.config import get_settings

logger = logging.getLogger("expencetracker")

class MongoManager:
    client: Optional[AsyncIOMotorClient] = None
    db: Optional[AsyncIOMotorDatabase] = None

db_manager = MongoManager()

async def connect_to_mongo() -> None:
    settings = get_settings()
    db_manager.client = AsyncIOMotorClient(settings.mongodb_uri, uuidRepresentation="standard")
    db_manager.db = db_manager.client[settings.mongodb_db_name]
    db = db_manager.db
    
    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.expenses.create_index([("user_id", ASCENDING), ("date", DESCENDING)])
    await db.expenses.create_index([("user_id", ASCENDING), ("category", ASCENDING)])
    await db.goals.create_index([("user_id", ASCENDING), ("deadline", ASCENDING)])
    await db.debts.create_index([("user_id", ASCENDING), ("dueDate", ASCENDING)])
    await db.notifications.create_index([("user_id", ASCENDING), ("createdAt", DESCENDING)])
    await db.chat_history.create_index([("user_id", ASCENDING), ("createdAt", ASCENDING)])
    logger.info("MongoDB connected and indexes created.")

async def close_mongo_connection() -> None:
    if db_manager.client:
        db_manager.client.close()

def get_db() -> AsyncIOMotorDatabase:
    if db_manager.db is None:
        raise RuntimeError("Database not initialized")
    return db_manager.db
