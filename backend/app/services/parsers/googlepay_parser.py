from typing import List, Dict, Any
from app.services.parsers.base_parser import BaseParser
import re

class GooglePayParser(BaseParser):
    def extract(self) -> List[Dict[str, Any]]:
        transactions = []
        # GPay often has "Paid to XYZ" and the date right after or before.
        # This is a simplified regex approach customized for Google Pay text
        date_pattern = re.compile(r"(\w{3} \d{1,2}, \d{4})") # e.g. May 12, 2023
        amount_pattern = re.compile(r"(?:[₹nN]|\bINR\b)?\s*(\d{1,3}(?:,\d{3})*\.\d{2}|\d{1,3}(?:,\d{3})*)")
        
        for page in self.pdf_file.pages:
            text = page.extract_text()
            if not text:
                continue
                
            lines = text.split('\n')
            for i, line in enumerate(lines):
                if "Paid to" in line or "Sent to" in line:
                    date_match = date_pattern.search(line)
                    if not date_match and i + 1 < len(lines):
                        date_match = date_pattern.search(lines[i+1])
                        
                    amt_match = amount_pattern.search(line)
                    if not amt_match and i + 1 < len(lines):
                        amt_match = amount_pattern.search(lines[i+1])
                        
                    if date_match and amt_match:
                        merchant = line.replace("Paid to", "").replace("Sent to", "").strip()
                        # Remove the matched amount string (and prefix) from the merchant name
                        merchant = merchant.replace(amt_match.group(0), "").strip()
                        # Strip trailing isolated currency characters if any remain
                        merchant = re.sub(r"\s+[nN]$", "", merchant)
                        merchant = self.clean_merchant(merchant)
                        amt = float(amt_match.group(1).replace(",", ""))
                        date_str = date_match.group(1)
                        
                        transactions.append({
                            "date": self.parse_date(date_str),
                            "merchant": merchant,
                            "amount": amt,
                            "description": line[:100],
                            "is_credit": False,
                            "category": "Other"
                        })
        return transactions
