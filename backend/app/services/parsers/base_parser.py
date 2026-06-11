from datetime import datetime
from typing import List, Dict, Any
import re

class BaseParser:
    def __init__(self, pdf_file):
        self.pdf_file = pdf_file
        
    def parse_date(self, date_str: str) -> str:
        """Attempt to parse common Indian bank date formats."""
        formats = [
            "%d %b %Y", "%d %b %y", "%d-%b-%Y", "%d/%b/%Y",
            "%d-%m-%Y", "%d/%m/%Y", "%Y-%m-%d", "%d.%m.%Y",
            "%b %d, %Y"
        ]
        
        cleaned = re.sub(r'(st|nd|rd|th)', '', date_str.strip())
        
        for fmt in formats:
            try:
                return datetime.strptime(cleaned, fmt).strftime("%Y-%m-%d")
            except ValueError:
                pass
                
        return datetime.today().strftime("%Y-%m-%d")

    def clean_merchant(self, description: str) -> str:
        """Removes common bank jargon from descriptions."""
        merchant = re.sub(r"UPI[/-].*?[/-]", "", description, flags=re.IGNORECASE)
        merchant = re.sub(r"(NEFT|IMPS|RTGS)[/-]", "", merchant, flags=re.IGNORECASE)
        merchant = re.sub(r"To\s+", "", merchant, flags=re.IGNORECASE)
        merchant = re.sub(r"Paid to\s+", "", merchant, flags=re.IGNORECASE)
        # Handle cases where merchant is before the slash (e.g., SWIGGY/UPI...)
        merchant = merchant.split("/")[0].strip()
        return merchant[:50]

    def extract(self) -> List[Dict[str, Any]]:
        raise NotImplementedError("Subclasses must implement extract()")
