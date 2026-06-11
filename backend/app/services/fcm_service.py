import os
import firebase_admin
from firebase_admin import credentials, messaging
from datetime import datetime, timezone
from app.db.mongodb import get_db

def initialize_firebase():
    if not firebase_admin._apps:
        cred_path = os.path.join(os.path.dirname(__file__), "..", "..", "firebase-service-account.json")
        try:
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)
            print("Firebase initialized successfully")
        except Exception as e:
            print(f"Error initializing Firebase: {e}")

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
                print(f"Failed to send push to token {token}: {e}")
                # Optional: If error is unregistered, delete token from db
