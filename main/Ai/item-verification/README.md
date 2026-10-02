# ChronoBid AI Item Verification & Eligibility Engine

An enterprise-grade, production-ready AI verification service for ChronoBid — the luxury AI-powered antique and vintage auction marketplace.

---

## ⚠️ Important AI Honesty Disclaimer

> **AI-assisted screening only. This is not an authentication or valuation.**

The ChronoBid AI Item Verification service performs automated visual classification, image quality diagnostics, duplicate/museum image detection, historical period estimation, and preliminary auction eligibility screening. 

**It does NOT:**
- Guarantee object authenticity or provenance
- Certify items as genuine antiques
- Predict market values or appraisals
- Replace expert human verification

All decisions (`APPROVE`, `NEEDS_REVIEW`, `REJECT`) indicate preliminary eligibility to proceed into ChronoBid's auction review pipeline.

---

## 🏗️ System Architecture

```text
Seller Upload
      ↓
Image Quality Diagnostics (Resolution, Blur, Exposure, Blank Check)
      ↓
CLIP ViT-B/32 Zero-Shot Category Classification (12 ChronoBid Categories)
      ↓
Metropolitan Museum Reference Retrieval (Cosine Similarity Search)
      ↓
Historical Period Estimation (Weighted Date Range Voting)
      ↓
Duplicate Upload & Museum Photo Detection (pHash SQLite + Similarity)
      ↓
Rules Engine (rules.yaml Thresholds & Category Mismatch Checking)
      ↓
Decision Output (APPROVE / NEEDS_REVIEW / REJECT)
      ↓
Seller Next.js Flow (Step 2 Scan Card & Step 4 Review Box)
      ↓
Admin Review Queue (/admin/ai-verification) if NEEDS_REVIEW
```

---

## ⚡ Setup & Quickstart

### 1. Requirements
- Python 3.10+
- PyTorch (CPU or CUDA)
- Node.js 18+ (for Next.js frontend)

### 2. Installation

```bash
cd Ai/item-verification
python -m venv .venv
# Windows PowerShell:
.venv\Scripts\Activate.ps1
# Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt
```

### 3. Generate Metropolitan Museum Dataset & Embeddings

```bash
python fetch_met_data.py
```

### 4. Start AI Verification API Service (Port 8001)

```bash
python main.py
```
Or with Uvicorn:
```bash
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

---

## 🧪 Testing & Evaluation

### Run Unit Tests
```bash
pytest
```

### Evaluate Classifier Accuracy & Confusion Matrix
```bash
python evaluation/evaluate_classifier.py
```

---

## 📡 API Endpoints

### 1. Health Check
`GET /health`

**Response:**
```json
{
  "status": "ok",
  "service": "ChronoBid AI Verification Service",
  "dataset_loaded": true,
  "registered_categories": 12
}
```

### 2. Verify Item Photo
`POST /verify` (Multipart Form)

**Parameters:**
- `file`: Image file (JPEG, PNG, WEBP, max 8MB)
- `declared_category`: (Optional) Category selected by seller
- `declared_title`: (Optional) Item title provided by seller

**Response Example:**
```json
{
  "decision": "APPROVE",
  "decision_reasons": [
    "Image quality is suitable for AI-assisted screening.",
    "The item is visually consistent with the Timepieces & Watches category.",
    "No configured prohibited-item indicators were detected."
  ],
  "flags": [],
  "quality": {
    "score": 0.91,
    "issues": []
  },
  "classification": {
    "top_categories": [
      {
        "category": "Timepieces & Watches",
        "probability": 0.82
      }
    ],
    "ambiguous": false
  },
  "estimated_period": {
    "label": "1850–1900",
    "begin_year": 1850,
    "end_year": 1900,
    "confidence": 0.74
  },
  "similar_museum_objects": [
    {
      "object_id": 19482,
      "title": "Gold Pocket Watch",
      "period": "Victorian",
      "culture": "British",
      "date": "1875",
      "similarity": 0.87,
      "image_url": "https://images.metmuseum.org/...",
      "met_url": "https://www.metmuseum.org/art/collection/search/19482"
    }
  ],
  "suggested_listing": {
    "category": "Timepieces & Watches",
    "title_suggestion": "Vintage Timepiece Item",
    "era": "1850–1900"
  },
  "disclaimer": "AI-assisted screening only. This is not an authentication or valuation."
}
```
