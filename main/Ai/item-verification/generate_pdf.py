from fpdf import FPDF
import os

class PDF(FPDF):
    def header(self):
        # Set font for header
        self.set_font('Times', 'B', 16)
        self.cell(0, 10, 'Chronobid AI Item Verification Engine - Workflow', 0, 1, 'C')
        self.ln(5)

    def chapter_title(self, title):
        self.set_font('Times', 'B', 14)
        self.cell(0, 10, title, 0, 1, 'L')
        self.ln(2)

    def chapter_body(self, body):
        self.set_font('Times', '', 12)
        # Multi-cell allows text wrapping
        self.multi_cell(0, 8, body)
        self.ln(5)

def create_pdf():
    pdf = PDF()
    pdf.add_page()
    
    # Section 1
    pdf.chapter_title('Phase 1: Knowledge Base Setup (Offline/Background Task)')
    body1 = (
        "1. Fetch Data: The system calls the Met Museum API and requests images for specific categories "
        "(e.g., Clocks, Coins, Sculptures, Pottery, Vintage Clothes).\n"
        "2. Download: The AI downloads a sample of these verified antique images and their details (material, period) "
        "and saves them to the 'dataset_images' folder.\n"
        "3. Generate AI Fingerprints: The OpenAI CLIP model processes every downloaded museum image and converts it into a "
        "mathematical vector (an AI fingerprint). These fingerprints are saved locally so the AI has a verified baseline to compare against."
    )
    pdf.chapter_body(body1)

    # Section 2
    pdf.chapter_title('Phase 2: Live Item Verification (User Action)')
    body2 = (
        "1. Image Upload: A seller on the Chronobid website uploads an image of an item (e.g., an ancient coin) to create a new auction listing.\n"
        "2. API Request: The Chronobid website automatically sends this image in the background to the AI Verification API (running on port 8001) "
        "via an HTTP POST request.\n"
        "3. Zero-Shot Classification: The AI engine (using CLIP) instantly looks at the image and predicts its category out of the allowed list "
        "with a confidence score (e.g., 'Coin' - 98% confidence).\n"
        "4. Vector Similarity: The AI generates a mathematical fingerprint for the user's uploaded image and calculates the 'Cosine Similarity' "
        "against all the verified Met Museum fingerprints in the database.\n"
        "5. Finding Matches: The AI finds the top 3 museum objects whose fingerprints most closely match the user's item."
    )
    pdf.chapter_body(body2)
    
    # Section 3
    pdf.chapter_title('Phase 3: The AI Report (The Output)')
    body3 = (
        "1. Generate Report: The AI Engine compiles a JSON report containing:\n"
        "   - The predicted Category (e.g., 'Coin').\n"
        "   - The Category Confidence Score.\n"
        "   - The Estimated Period (inferred from the closest matching museum piece).\n"
        "   - The Verification Confidence (how closely it visually resembles the real museum piece).\n"
        "   - Details of the Top 3 similar museum objects (so humans can visually compare them).\n"
        "2. Display to Users: The Chronobid platform receives this report. Admins can use the Verification Confidence to auto-flag fake items, "
        "and Buyers can see the 'AI Verified Category' tag on the auction page, boosting trust and bidding engagement."
    )
    pdf.chapter_body(body3)

    output_path = 'How_Item_Verification_Works.pdf'
    pdf.output(output_path)
    print(f"Successfully generated {output_path}")

if __name__ == '__main__':
    create_pdf()
