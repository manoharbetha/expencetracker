import re

def detect_statement_source(text: str) -> str:
    """
    Scans the extracted text of the first few pages to detect the origin of the statement.
    """
    text_upper = text.upper()
    
    if "GOOGLE PAY" in text_upper or "GPAY" in text_upper or "GOOGLE INDIA" in text_upper:
        return "GOOGLE_PAY"
    if "PAYTM" in text_upper:
        return "PAYTM"
    if "PHONEPE" in text_upper:
        return "PHONEPE"
    if "STATE BANK OF INDIA" in text_upper or "SBI" in text_upper:
        return "SBI"
    if "HDFC BANK" in text_upper:
        return "HDFC"
    if "ICICI BANK" in text_upper:
        return "ICICI"
    if "AXIS BANK" in text_upper:
        return "AXIS"
        
    return "GENERIC"
