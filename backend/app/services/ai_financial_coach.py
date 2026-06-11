import json
from datetime import datetime, timezone, timedelta
from groq import AsyncGroq
from app.core.config import get_settings
from app.services import build_ai_context

async def generate_dashboard_insights(db, user_id: str, user: dict, force_refresh: bool = False) -> dict:
    now = datetime.now(timezone.utc)
    
    # Check cache
    if not force_refresh:
        cached = await db.ai_insights.find_one({"userId": user_id})
        if cached:
            cached_time = cached.get("generatedAt")
            if cached_time:
                if cached_time.tzinfo is None:
                    cached_time = cached_time.replace(tzinfo=timezone.utc)
                if (now - cached_time) < timedelta(hours=24):
                    return {
                        "financialHealthScore": cached.get("financialHealthScore", {}),
                        "potentialSavings": cached.get("potentialSavings", {}),
                        "insights": cached.get("insights", [])
                    }
                
    s = get_settings()
    if not s.groq_api_key:
        return {"financialHealthScore": {}, "potentialSavings": {}, "insights": []}
        
    client = AsyncGroq(api_key=s.groq_api_key)
    ctx = await build_ai_context(db, user_id, user)
    
    prompt = """
    You are a Senior AI Financial Coach. Analyze the user's financial data below and generate three components:
    1. A Financial Health Score (0-100) based on savings rate, debt burden, budget discipline, goal progress, and emergency cash. Provide a grade (Excellent: 90-100, Good: 75-89, Average: 60-74, Needs Improvement: 40-59, Critical: 0-39) and a short breakdown.
    2. A Potential Savings Calculator that identifies realistic monthly savings opportunities by looking at categories (e.g., Food, Shopping, Subscriptions).
    3. Exactly 5 personalized, highly actionable insights. Use actual numbers. Priorities must be one of: 'high', 'medium', 'low'. Types must be one of: 'budget', 'goal', 'debt', 'saving', 'spending', 'achievement'. Keep messages under 25 words.

    Return ONLY valid JSON matching this exact structure (no markdown, no backticks):
    {
      "financialHealthScore": {
        "score": 84,
        "grade": "Good",
        "breakdown": {
          "savings": "Good",
          "debt": "Moderate",
          "budgetControl": "Excellent",
          "goalProgress": "Good"
        }
      },
      "potentialSavings": {
        "amount": 1850,
        "recommendations": [
          {"category": "Food", "amount": 800},
          {"category": "Subscriptions", "amount": 300}
        ]
      },
      "insights": [
        {
          "priority": "high",
          "type": "budget",
          "title": "Food Spending High",
          "message": "Food spending increased 28% compared to last month."
        }
      ]
    }
    
    Context:
    """ + ctx

    try:
        completion = await client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are a precise data analysis API. Return ONLY valid JSON."},
                {"role": "user", "content": prompt}
            ],
            model=s.groq_model,
            temperature=0.2,
            max_tokens=1500,
            response_format={"type": "json_object"}
        )
        
        content = completion.choices[0].message.content
        if not content:
            raise ValueError("Empty response from Groq")
            
        data = json.loads(content)
        
        # Save to cache
        cache_doc = {
            "userId": user_id,
            "financialHealthScore": data.get("financialHealthScore", {}),
            "potentialSavings": data.get("potentialSavings", {}),
            "insights": data.get("insights", []),
            "generatedAt": now
        }
        await db.ai_insights.update_one(
            {"userId": user_id},
            {"$set": cache_doc},
            upsert=True
        )
        
        return {
            "financialHealthScore": data.get("financialHealthScore", {}),
            "potentialSavings": data.get("potentialSavings", {}),
            "insights": data.get("insights", [])
        }
        
    except Exception as e:
        print(f"AI Coach error: {e}")
        return {"financialHealthScore": {}, "potentialSavings": {}, "insights": []}
