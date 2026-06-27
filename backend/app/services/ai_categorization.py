import json
from typing import List, Dict, Any
import logging
from groq import AsyncGroq
from app.core.config import get_settings

logger = logging.getLogger("expencetracker")

async def categorize_transactions_ai(merchants: List[str], groq_client = None) -> Dict[str, str]:
    """
    Takes a list of merchant names, queries Groq, and returns a dictionary 
    mapping merchant name to category.
    """
    s = get_settings()
    if not s.groq_api_key or not merchants:
        return {m: "Other" for m in merchants}
        
    client = groq_client or AsyncGroq(api_key=s.groq_api_key)
    
    prompt = """
    Categorize the following merchants into one of these exact categories:
    Food, Travel, Shopping, Bills, Education, Entertainment, Healthcare, Investment, Other

    Merchants:
    """ + ", ".join(merchants) + """

    Return ONLY a valid JSON object mapping the merchant string to the category string.
    Example output format:
    {
      "Swiggy": "Food",
      "Uber": "Travel",
      "Amazon": "Shopping"
    }
    """
    
    try:
        chat_completion = await client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are a precise data categorization API. Return ONLY valid raw JSON with no markdown wrapping or backticks."},
                {"role": "user", "content": prompt}
            ],
            model=s.groq_model,
            temperature=0.0,
            max_tokens=1024,
            response_format={"type": "json_object"}
        )
        
        content = chat_completion.choices[0].message.content
        if not content:
            return {m: "Other" for m in merchants}
            
        mapping = json.loads(content)
        return mapping
    except Exception as e:
        logger.error(f"AI Categorization error occurred: {e}")
        return {m: "Other" for m in merchants}

async def summarize_import_ai(transactions: List[Dict[str, Any]], groq_client = None) -> str:
    """Generate a brief summary of the imported transactions using Groq."""
    s = get_settings()
    if not s.groq_api_key or not transactions:
        return "Transactions imported."
        
    client = groq_client or AsyncGroq(api_key=s.groq_api_key)
    
    # Calculate totals
    totals = {}
    for t in transactions:
        c = t.get("category", "Other")
        totals[c] = totals.get(c, 0) + float(t.get("amount", 0))
        
    totals_str = ", ".join([f"{k}: ₹{v:,.0f}" for k, v in totals.items()])
    
    prompt = f"Summarize this imported spending in one friendly, concise sentence: {totals_str}"
    
    try:
        resp = await client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are a helpful financial assistant. Be very brief (max 1 sentence)."},
                {"role": "user", "content": prompt}
            ],
            model=s.groq_model,
            temperature=0.7,
            max_tokens=150,
        )
        return resp.choices[0].message.content or "Import successful."
    except Exception:
        return "Transactions imported successfully."
