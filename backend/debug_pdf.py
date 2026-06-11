import asyncio
from app.services.pdf_extractor import extract_transactions_from_pdf

async def debug_pdf(filename: str):
    print("==================================================")
    print("STEP 1: VERIFY FILE UPLOAD")
    print("==================================================")
    try:
        with open(filename, "rb") as f:
            content = f.read()
        print(f"Filename: {filename}")
        print(f"Size: {len(content)} bytes")
    except Exception as e:
        print(f"Failed to read file: {e}")
        return

    print("\n==================================================")
    print("STEP 2: VERIFY PDF READING & EXTRACTION")
    print("==================================================")
    result = await extract_transactions_from_pdf(content)
    
    print(f"Detected Source: {result.get('source')}")
    print(f"Fallback Used: {result.get('fallback_used')}")
    print(f"Error: {result.get('error')}")
    
    raw_txns = result.get("items", [])
    print(f"\nTransactions Found (Raw): {len(raw_txns)}")
    for t in raw_txns:
        print(t)
        
    print("\n==================================================")
    print("STEP 6: VERIFY FILTERING LOGIC")
    print("==================================================")
    expense_txns = [t for t in raw_txns if not t.get("is_credit", False)]
    print(f"Transactions Before Filter: {len(raw_txns)}")
    print(f"Transactions After Filter: {len(expense_txns)}")

if __name__ == "__main__":
    asyncio.run(debug_pdf("test_gpay.pdf"))
