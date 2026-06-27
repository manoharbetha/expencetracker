import io
import json
import asyncio
import re
from typing import List, Dict, Any
import logging
import pdfplumber
from groq import AsyncGroq

from app.core.config import get_settings
from app.services.statement_detector import detect_statement_source, detect_statement_type
from app.services.parsers.generic_parser import GenericParser
from app.services.parsers.googlepay_parser import GooglePayParser

logger = logging.getLogger("expencetracker")

def extract_dates_from_text(text: str) -> List[dict]:
    months_map = {
        "JAN": 1, "FEB": 2, "MAR": 3, "APR": 4, "MAY": 5, "JUN": 6,
        "JUL": 7, "AUG": 8, "SEP": 9, "OCT": 10, "NOV": 11, "DEC": 12
    }
    
    dates = []
    text_upper = text.upper()
    
    # 1. DD MMM YY/YYYY
    alpha_pattern1 = re.compile(r"\b(\d{1,2})\s*([A-Z]{3})[^\w\d]?\s*(\d{2,4})\b")
    for m in alpha_pattern1.finditer(text_upper):
        try:
            day = int(m.group(1))
            month = months_map.get(m.group(2))
            year = int(m.group(3))
            if year < 100:
                year += 2000
            if month and 1 <= month <= 12 and 1 <= day <= 31:
                dates.append({"day": day, "month": month, "year": year})
        except Exception:
            pass
            
    # 2. MMM DD YY/YYYY (e.g. May 12, 2026)
    alpha_pattern2 = re.compile(r"\b([A-Z]{3})\s*(\d{1,2})[^\w\d]?\s*(\d{2,4})\b")
    for m in alpha_pattern2.finditer(text_upper):
        try:
            month = months_map.get(m.group(1))
            day = int(m.group(2))
            year = int(m.group(3))
            if year < 100:
                year += 2000
            if month and 1 <= month <= 12 and 1 <= day <= 31:
                dates.append({"day": day, "month": month, "year": year})
        except Exception:
            pass
            
    # 3. DD/MM/YYYY or DD-MM-YYYY
    numeric_pattern = re.compile(r"\b(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})\b")
    for m in numeric_pattern.finditer(text_upper):
        try:
            day = int(m.group(1))
            month = int(m.group(2))
            year = int(m.group(3))
            if year < 100:
                year += 2000
            if 1 <= month <= 12 and 1 <= day <= 31:
                dates.append({"day": day, "month": month, "year": year})
        except Exception:
            pass
            
    return dates

def get_statement_period(text: str) -> dict:
    if not text:
        return {}
        
    text_upper = text.upper()
    lines = text_upper.split('\n')
    
    period_keywords = ["PERIOD", "STATEMENT FOR", "STATEMENT DATE", "STMT DATE"]
    target_text = ""
    for line in lines[:30]:
        if any(kw in line for kw in period_keywords):
            target_text = line
            break
            
    dates = []
    if target_text:
        dates = extract_dates_from_text(target_text)
        
    if len(dates) < 2:
        dates = extract_dates_from_text(text_upper[:1000])
        
    if len(dates) < 2:
        dates = extract_dates_from_text(text_upper[:4000])
        
    if len(dates) >= 2:
        try:
            sorted_dates = sorted(dates, key=lambda x: (x["year"], x["month"], x["day"]))
            return {
                "start": sorted_dates[0],
                "end": sorted_dates[-1]
            }
        except Exception:
            pass
            
    if len(dates) == 1:
        return {
            "start": dates[0],
            "end": dates[0]
        }
        
    return {}

def normalize_transaction_dates(transactions: List[Dict[str, Any]], text_preview: str) -> List[Dict[str, Any]]:
    period = get_statement_period(text_preview)
    if not period or "start" not in period or "end" not in period:
        return transactions
        
    start_year = period["start"]["year"]
    start_month = period["start"]["month"]
    end_year = period["end"]["year"]
    end_month = period["end"]["month"]
    
    from datetime import datetime
    
    normalized = []
    for t in transactions:
        date_str = t.get("date")
        if not date_str:
            normalized.append(t)
            continue
            
        try:
            dt = datetime.strptime(date_str, "%Y-%m-%d")
            t_month = dt.month
            t_day = dt.day
            
            if start_year == end_year:
                t_year = start_year
            else:
                if t_month >= start_month:
                    t_year = start_year
                else:
                    t_year = end_year
                    
            corrected_date = f"{t_year:04d}-{t_month:02d}-{t_day:02d}"
            t["date"] = corrected_date
        except Exception:
            pass
            
        normalized.append(t)
        
    return normalized

async def extract_transactions_from_pdf(file_bytes: bytes, groq_client: AsyncGroq = None) -> Dict[str, Any]:
    """
    Coordinator function that detects source, routes to the correct parser,
    and falls back to Groq AI if zero transactions are found.
    """
    text_preview = ""
    pages_read = 0
    transactions = []
    source = "UNKNOWN"
    statement_type = "bank"
    
    # 1. Open PDF once to extract text and parse transactions
    try:
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            pages_read = len(pdf.pages)
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    text_preview += text + "\n"
            
            source = detect_statement_source(text_preview)
            statement_type = detect_statement_type(text_preview)
            
            # 2. Parse using the opened PDF handle
            if source == "GOOGLE_PAY":
                parser = GooglePayParser(pdf)
            else:
                parser = GenericParser(pdf)
                
            transactions = parser.extract()
    except Exception as e:
        logger.error(f"PDF read or parser error occurred: {e}")
        
    # 3. AI Fallback if Parser fails
    fallback_used = False
    if not transactions and len(text_preview.strip()) > 50:
        fallback_used = True
        transactions = await extract_with_ai_fallback(text_preview, groq_client=groq_client)

    # Normalize dates based on statement period
    transactions = normalize_transaction_dates(transactions, text_preview)

    return {
        "items": transactions,
        "source": source,
        "statement_type": statement_type,
        "text_preview": text_preview,
        "pages_read": pages_read,
        "text_length": len(text_preview),
        "fallback_used": fallback_used,
        "error": None if transactions else "Parser pattern mismatch. AI fallback triggered but yielded 0 results."
    }

async def extract_cc_details_with_ai(text_chunk: str, groq_client: AsyncGroq = None) -> Dict[str, Any]:
    s = get_settings()
    if not s.groq_api_key:
        return {}
    client = groq_client or AsyncGroq(api_key=s.groq_api_key)
    prompt = """
    Extract credit card details from this statement text.
    Return ONLY a JSON object with these keys (use null if not found):
    "credit_limit" (number), "outstanding" (number), "available_limit" (number), "minimum_due" (number), "due_date" (number 1-31), "statement_date" (string YYYY-MM-DD), "card_name" (string), "bank_name" (string).
    Statement Text:
    """ + text_chunk[:6000]
    try:
        resp = await client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are a financial extraction API. Output JSON object only."},
                {"role": "user", "content": prompt}
            ],
            model=s.groq_model,
            temperature=0.0,
            max_tokens=500,
            response_format={"type": "json_object"}
        )
        content = resp.choices[0].message.content
        if content:
            return json.loads(content)
    except Exception as e:
        logger.error(f"Groq CC extraction failed: {e}")
    return {}

async def extract_with_ai_fallback(text_chunk: str, groq_client: AsyncGroq = None) -> List[Dict[str, Any]]:
    s = get_settings()
    if not s.groq_api_key:
        return []
        
    client = groq_client or AsyncGroq(api_key=s.groq_api_key)
    
    # Split text into manageable chunks (approx 6000 chars by line)
    lines = text_chunk.split('\n')
    chunks = []
    current_chunk = ""
    for line in lines:
        if len(current_chunk) + len(line) > 5500:
            chunks.append(current_chunk)
            current_chunk = line + "\n"
        else:
            current_chunk += line + "\n"
    if current_chunk:
        chunks.append(current_chunk)
        
    async def process_chunk(chunk: str) -> List[Dict[str, Any]]:
        prompt = """
        Extract all financial transactions from this text. Ignore 'Fuel Surcharge Waiver', 'Reward Point', 'Payment Received', 'Credits', 'Opening Balance'.
        Return ONLY a JSON object with a single key "transactions" which is an array of objects.
        Each object must have: "date" (YYYY-MM-DD), "merchant" (string), "amount" (number), "is_credit" (boolean).
        Statement Text:
        """ + chunk
        
        try:
            resp = await client.chat.completions.create(
                messages=[
                    {"role": "system", "content": "You are a financial extraction API. Output JSON object only."},
                    {"role": "user", "content": prompt}
                ],
                model=s.groq_model,
                temperature=0.0,
                max_tokens=2048,
                response_format={"type": "json_object"}
            )
            content = resp.choices[0].message.content
            if content:
                data = json.loads(content)
                return data.get("transactions", [])
        except Exception as e:
            logger.error(f"Groq fallback failed for chunk: {e}")
        return []

    all_transactions = []
    # Parallelize Groq calls for all chunks using asyncio.gather
    results = await asyncio.gather(*[process_chunk(chunk) for chunk in chunks])
    for res in results:
        all_transactions.extend(res)
            
    return all_transactions
