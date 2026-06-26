import os
import json
import logging
import firebase_admin
from firebase_admin import credentials, messaging
from datetime import datetime, timezone
from app.db.mongodb import get_db
from app.core.config import get_settings

logger = logging.getLogger("expencetracker")

def initialize_firebase():
    if not firebase_admin._apps:
        cred_json = os.environ.get("FIREBASE_CREDENTIALS")
        if cred_json:
            try:
                cred_dict = json.loads(cred_json)
                cred = credentials.Certificate(cred_dict)
                firebase_admin.initialize_app(cred)
                logger.info("Firebase initialized successfully from environment variable.")
                return
            except Exception as e:
                logger.error(f"Error initializing Firebase from environment credentials: {e}")
                return
                
        settings = get_settings()
        if settings.app_env.lower() != "production":
            cred_path = os.path.join(os.path.dirname(__file__), "..", "..", "firebase-service-account.json")
            if os.path.exists(cred_path):
                try:
                    cred = credentials.Certificate(cred_path)
                    firebase_admin.initialize_app(cred)
                    logger.info("Firebase initialized successfully from local service account file.")
                except Exception as e:
                    logger.error(f"Error initializing Firebase from local file: {e}")
            else:
                logger.warning("Firebase service account file not found, skipping Firebase initialization in development.")
        else:
            logger.error("Firebase credentials are not set in production. Push notifications will be unavailable.")

async def send_to_user(user_id: str, title: str, message: str, notif_type: str):
    db = get_db()
    
    # 1. Save to notifications collection
    new_notif = {
        "userId": user_id,
        "title": title,
        "message": message,
        "type": notif_type,
        "isRead": False,
        "createdAt": datetime.now(timezone.utc)
    }
    await db.notifications.insert_one(new_notif)
    
    # 2. Get FCM tokens for user
    tokens = await db.notification_tokens.find({"userId": user_id}).to_list(100)
    
    if not tokens:
        return
        
    for doc in tokens:
        token = doc.get("fcmToken")
        if token:
            try:
                msg = messaging.Message(
                    notification=messaging.Notification(
                        title=title,
                        body=message
                    ),
                    data={"type": notif_type},
                    token=token
                )
                messaging.send(msg)
            except Exception as e:
                logger.error(f"Failed to send push to token {token}: {e}")
                # Optional: If error is unregistered, delete token from db
