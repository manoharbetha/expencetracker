from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter

def create_dummy_gpay_pdf(filename):
    c = canvas.Canvas(filename, pagesize=letter)
    c.setFont("Helvetica", 12)
    c.drawString(100, 750, "GOOGLE PAY")
    c.drawString(100, 730, "Transaction Statement")
    
    c.drawString(100, 690, "Paid to KORRAI RANI")
    c.drawString(100, 675, "Mar 11, 2026")
    c.drawString(400, 690, "₹ 60.00")
    
    c.drawString(100, 640, "Paid to YARLANKI BALAJI")
    c.drawString(100, 625, "Mar 11, 2026")
    c.drawString(400, 640, "₹ 1.00")
    
    c.drawString(100, 590, "Paid to Bundl Technologies pvt Ltd")
    c.drawString(100, 575, "Mar 11, 2026")
    c.drawString(400, 590, "₹ 662.00")

    c.save()

if __name__ == "__main__":
    create_dummy_gpay_pdf("test_gpay.pdf")
    print("Created test_gpay.pdf")
