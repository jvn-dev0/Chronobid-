import os
import json
import sqlite3
import yaml
import torch
import numpy as np
import cv2
from PIL import Image
import imagehash
from transformers import CLIPProcessor, CLIPModel
from sklearn.metrics.pairwise import cosine_similarity
from config import settings

CHRONOBID_CATEGORIES = [
    "Timepieces & Watches",
    "Jewellery",
    "Paintings & Art",
    "Ceramics & Glass",
    "Books & Manuscripts",
    "Automobiles",
    "Musical Instruments",
    "Coins & Currency",
    "Fashion & Accessories",
    "Furniture",
    "Photography",
    "Sports Memorabilia"
]

OTHER_PROMPTS = [
    "not an antique",
    "modern product",
    "person",
    "screenshot",
    "text document",
    "food",
    "animal",
    "random object"
]

DISCLAIMER_TEXT = "AI-assisted screening only. This is not an authentication or valuation."

class VerificationEngine:
    def __init__(self):
        print("[AI] Initializing Verification Engine...")
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"  * Using compute device: {self.device}")
        
        self.model = CLIPModel.from_pretrained(settings.CLIP_MODEL_NAME).to(self.device)
        self.processor = CLIPProcessor.from_pretrained(settings.CLIP_MODEL_NAME)
        
        self.rules = self.load_rules()
        self.metadata = []
        self.embeddings = np.array([])
        self.category_text_embeds = {}
        self.dataset_loaded = False
        
        self.init_sqlite_db()
        self.precompute_category_text_embeddings()

    def load_rules(self):
        if os.path.exists(settings.RULES_FILE):
            with open(settings.RULES_FILE, 'r', encoding='utf-8') as f:
                return yaml.safe_load(f)
        return {
            "thresholds": {
                "category_confidence_min": 0.55,
                "ambiguity_margin": 0.15,
                "similarity_min": 0.45,
                "quality_min": 0.60,
                "museum_photo_similarity": 0.95,
                "duplicate_hash_distance": 5,
                "period_similarity_min": 0.50,
                "min_resolution_px": 400,
                "laplacian_blur_threshold": 100.0
            },
            "prohibited_keywords": ["firearm", "gun", "ivory", "human remains", "counterfeit"]
        }

    def init_sqlite_db(self):
        os.makedirs(settings.STORAGE_DIR, exist_ok=True)
        conn = sqlite3.connect(settings.DB_FILE)
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS uploads (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                upload_id TEXT UNIQUE,
                seller_id TEXT,
                image_hash TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.commit()
        conn.close()

    def precompute_category_text_embeddings(self):
        print("  * Pre-computing category text embeddings...")
        with torch.no_grad():
            for cat in CHRONOBID_CATEGORIES:
                prompts = [
                    f"a photo of an antique {cat}",
                    f"a vintage {cat}",
                    f"a close-up photo of a {cat}",
                    f"an old collectible {cat}",
                    f"a museum-style photograph of a {cat}"
                ]
                inputs = self.processor(text=prompts, return_tensors="pt", padding=True).to(self.device)
                text_features = self.model.get_text_features(**inputs)
                if hasattr(text_features, "pooler_output"):
                    text_features = text_features.pooler_output
                norm_features = text_features / text_features.norm(dim=-1, keepdim=True)
                avg_feature = norm_features.mean(dim=0, keepdim=True)
                avg_feature = avg_feature / avg_feature.norm(dim=-1, keepdim=True)
                self.category_text_embeds[cat] = avg_feature.cpu().numpy()

            inputs_other = self.processor(text=OTHER_PROMPTS, return_tensors="pt", padding=True).to(self.device)
            other_features = self.model.get_text_features(**inputs_other)
            if hasattr(other_features, "pooler_output"):
                other_features = other_features.pooler_output
            other_norm = other_features / other_features.norm(dim=-1, keepdim=True)
            other_avg = other_norm.mean(dim=0, keepdim=True)
            other_avg = other_avg / other_avg.norm(dim=-1, keepdim=True)
            self.category_text_embeds["Not an Antique / Other"] = other_avg.cpu().numpy()

    def load_dataset_embeddings(self):
        if not os.path.exists(settings.METADATA_FILE):
            print("[WARNING] No dataset metadata found. Run fetch_met_data.py to build reference dataset.")
            return False
            
        with open(settings.METADATA_FILE, 'r', encoding='utf-8') as f:
            self.metadata = json.load(f)
            
        if os.path.exists(settings.EMBEDDINGS_FILE) and os.path.exists(settings.INDEX_FILE):
            try:
                self.embeddings = np.load(settings.EMBEDDINGS_FILE)
                with open(settings.INDEX_FILE, 'r', encoding='utf-8') as f:
                    index_meta = json.load(f)
                if len(index_meta) == len(self.metadata):
                    self.dataset_loaded = True
                    print(f"✓ Cached embeddings loaded ({len(self.embeddings)} items).")
                    return True
            except Exception as e:
                print(f"⚠️ Failed to load cached embeddings: {e}. Rebuilding...")

        print(f"🔄 Generating embeddings for {len(self.metadata)} dataset objects...")
        embeddings_list = []
        valid_metadata = []

        for item in self.metadata:
            img_path = item.get("image_path")
            if not img_path or not os.path.exists(img_path):
                continue
            try:
                img = Image.open(img_path).convert("RGB")
                inputs = self.processor(images=img, return_tensors="pt").to(self.device)
                with torch.no_grad():
                    feats = self.model.get_image_features(**inputs)
                    norm_feats = feats / feats.norm(dim=-1, keepdim=True)
                embeddings_list.append(norm_feats.cpu().numpy().flatten())
                valid_metadata.append(item)
            except Exception as e:
                print(f"Skipping {img_path}: {e}")

        if embeddings_list:
            self.embeddings = np.array(embeddings_list)
            self.metadata = valid_metadata
            os.makedirs(settings.DATASET_DIR, exist_ok=True)
            np.save(settings.EMBEDDINGS_FILE, self.embeddings)
            with open(settings.INDEX_FILE, 'w', encoding='utf-8') as f:
                json.dump(self.metadata, f, indent=2, ensure_ascii=False)
            self.dataset_loaded = True
            print("✓ Embedding index generated and saved.")
            return True
        return False

    def analyze_image_quality(self, pil_image, image_path):
        thresholds = self.rules.get("thresholds", {})
        min_res = thresholds.get("min_resolution_px", 400)
        blur_thresh = thresholds.get("laplacian_blur_threshold", 100.0)
        
        issues = []
        score = 1.0

        w, h = pil_image.size
        if min(w, h) < min_res:
            issues.append(f"Image resolution ({w}x{h}) is below recommended minimum ({min_res}px).")
            score -= 0.3

        cv_img = cv2.imread(image_path)
        if cv_img is not None:
            gray = cv2.cvtColor(cv_img, cv2.COLOR_BGR2GRAY)
            laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
            if laplacian_var < blur_thresh:
                issues.append("Image appears blurry or out of focus.")
                score -= 0.25
                
            mean_brightness = np.mean(gray)
            if mean_brightness < 30:
                issues.append("Image is underexposed / too dark.")
                score -= 0.2
            elif mean_brightness > 225:
                issues.append("Image is overexposed / too bright.")
                score -= 0.2
                
            std_brightness = np.std(gray)
            if std_brightness < 8:
                issues.append("Image appears blank or uniform.")
                score -= 0.5

        final_score = max(0.0, round(score, 2))
        return {
            "score": final_score,
            "issues": issues
        }

    def classify_category(self, pil_image):
        inputs = self.processor(images=pil_image, return_tensors="pt").to(self.device)
        with torch.no_grad():
            img_feats = self.model.get_image_features(**inputs)
            img_feats = img_feats / img_feats.norm(dim=-1, keepdim=True)
            img_np = img_feats.cpu().numpy()

        all_cats = CHRONOBID_CATEGORIES + ["Not an Antique / Other"]
        similarities = []

        for cat in all_cats:
            txt_np = self.category_text_embeds[cat]
            sim = cosine_similarity(img_np, txt_np)[0][0]
            similarities.append(sim)

        exp_sims = np.exp(np.array(similarities) * 10)
        probs = exp_sims / np.sum(exp_sims)
        
        top_indices = np.argsort(probs)[::-1][:3]
        top_categories = []
        for idx in top_indices:
            top_categories.append({
                "category": all_cats[idx],
                "probability": round(float(probs[idx]), 2)
            })

        ambiguity_margin = self.rules.get("thresholds", {}).get("ambiguity_margin", 0.15)
        ambiguous = False
        if len(top_categories) >= 2:
            margin = top_categories[0]["probability"] - top_categories[1]["probability"]
            if margin < ambiguity_margin:
                ambiguous = True

        return {
            "top_categories": top_categories,
            "ambiguous": ambiguous,
            "image_embedding": img_np
        }

    def find_met_references(self, img_embedding, predicted_category, top_k=5):
        if not self.dataset_loaded or len(self.embeddings) == 0:
            return []

        cat_indices = [i for i, item in enumerate(self.metadata) if item.get("category") == predicted_category]
        
        if len(cat_indices) < 10:
            target_indices = list(range(len(self.metadata)))
        else:
            target_indices = cat_indices

        target_embeddings = self.embeddings[target_indices]
        sims = cosine_similarity(img_embedding, target_embeddings).flatten()
        top_k_sorted = np.argsort(sims)[::-1][:top_k]

        results = []
        for idx in top_k_sorted:
            original_idx = target_indices[idx]
            match = self.metadata[original_idx]
            results.append({
                "object_id": match.get("objectID"),
                "title": match.get("title", "Reference Object"),
                "period": match.get("period", "Unknown"),
                "culture": match.get("culture", "Unknown"),
                "date": match.get("objectDate", ""),
                "similarity": round(float(sims[idx]), 2),
                "image_url": match.get("primaryImageSmall", ""),
                "met_url": match.get("objectURL", "")
            })
        return results

    def estimate_period(self, met_references):
        if not met_references:
            return {"label": "Unknown", "begin_year": 0, "end_year": 0, "confidence": 0.0}

        min_sim_thresh = self.rules.get("thresholds", {}).get("period_similarity_min", 0.50)
        valid_refs = [r for r in met_references if r.get("similarity", 0) >= min_sim_thresh]
        
        if not valid_refs:
            return {"label": "Unknown", "begin_year": 0, "end_year": 0, "confidence": 0.0}

        total_weight = 0.0
        weighted_begin = 0.0
        weighted_end = 0.0

        for r in valid_refs:
            sim = r.get("similarity", 0.5)
            obj = next((m for m in self.metadata if m.get("objectID") == r.get("object_id")), None)
            if obj:
                b = obj.get("objectBeginDate", 0)
                e = obj.get("objectEndDate", 0)
                if b != 0 or e != 0:
                    weighted_begin += b * sim
                    weighted_end += e * sim
                    total_weight += sim

        if total_weight == 0:
            top_period = valid_refs[0].get("period", "Unknown")
            return {"label": top_period, "begin_year": 0, "end_year": 0, "confidence": round(valid_refs[0].get("similarity", 0.5), 2)}

        avg_b = int(weighted_begin / total_weight)
        avg_e = int(weighted_end / total_weight)
        
        if avg_b == avg_e:
            label = f"c. {avg_b}"
        else:
            label = f"{avg_b}–{avg_e}"

        avg_conf = round(sum(r.get("similarity", 0) for r in valid_refs) / len(valid_refs), 2)
        return {
            "label": label,
            "begin_year": avg_b,
            "end_year": avg_e,
            "confidence": avg_conf
        }

    def check_duplicate_and_museum_photo(self, pil_image, met_references, upload_id=None, seller_id=None):
        flags = []
        thresh = self.rules.get("thresholds", {})
        museum_sim_thresh = thresh.get("museum_photo_similarity", 0.95)
        dup_hash_dist = thresh.get("duplicate_hash_distance", 5)

        if met_references and met_references[0].get("similarity", 0) >= museum_sim_thresh:
            flags.append({
                "code": "POSSIBLE_MUSEUM_PHOTO",
                "message": "The uploaded image is extremely similar to a museum reference photograph. Please upload original photographs of the item."
            })

        current_hash = str(imagehash.phash(pil_image))

        conn = sqlite3.connect(settings.DB_FILE)
        cursor = conn.cursor()
        cursor.execute("SELECT image_hash FROM uploads WHERE upload_id != ?", (upload_id or "",))
        rows = cursor.fetchall()

        for row in rows:
            existing_hash_str = row[0]
            try:
                existing_hash = imagehash.hex_to_hash(existing_hash_str)
                new_hash = imagehash.hex_to_hash(current_hash)
                if (new_hash - existing_hash) <= dup_hash_dist:
                    flags.append({
                        "code": "DUPLICATE_UPLOAD",
                        "message": "Near-identical image has already been submitted in ChronoBid."
                    })
                    break
            except Exception:
                pass

        if upload_id:
            cursor.execute("INSERT OR REPLACE INTO uploads (upload_id, seller_id, image_hash) VALUES (?, ?, ?)",
                           (upload_id, seller_id or "", current_hash))
            conn.commit()
            
        conn.close()
        return flags

    def verify_item(self, image_path, declared_category=None, declared_title=None, upload_id=None, seller_id=None):
        try:
            pil_img = Image.open(image_path).convert("RGB")
        except Exception as e:
            return {"error": f"Invalid image file: {str(e)}"}

        quality_report = self.analyze_image_quality(pil_img, image_path)
        cls_report = self.classify_category(pil_img)
        img_embedding = cls_report["image_embedding"]
        
        top_cat = cls_report["top_categories"][0]["category"]
        top_prob = cls_report["top_categories"][0]["probability"]

        met_references = self.find_met_references(img_embedding, top_cat)
        period_report = self.estimate_period(met_references)
        dup_flags = self.check_duplicate_and_museum_photo(pil_img, met_references, upload_id, seller_id)

        flags = list(dup_flags)
        reasons = []
        
        thresh = self.rules.get("thresholds", {})
        cat_conf_min = thresh.get("category_confidence_min", 0.55)
        qual_min = thresh.get("quality_min", 0.60)

        if declared_category and declared_category != top_cat and top_cat != "Not an Antique / Other":
            if top_prob >= cat_conf_min:
                flags.append({
                    "code": "CATEGORY_MISMATCH",
                    "message": f"AI visual analysis suggests '{top_cat}' instead of '{declared_category}'."
                })

        if top_cat == "Not an Antique / Other" and top_prob > 0.5:
            flags.append({
                "code": "NON_ANTIQUE_DETECTED",
                "message": "Item appears to be a modern non-vintage item, document, or non-auction object."
            })

        for kw in self.rules.get("prohibited_keywords", []):
            if declared_title and kw.lower() in declared_title.lower():
                flags.append({
                    "code": "PROHIBITED_KEYWORD",
                    "message": f"Title contains restricted item indicator: '{kw}'."
                })

        if any(f["code"] in ["PROHIBITED_KEYWORD", "NON_ANTIQUE_DETECTED"] for f in flags):
            decision = "REJECT"
            reasons.append("Item contains prohibited or non-eligible characteristics for ChronoBid auctions.")
        elif (
            quality_report["score"] < qual_min or
            top_prob < cat_conf_min or
            cls_report["ambiguous"] or
            any(f["code"] in ["CATEGORY_MISMATCH", "POSSIBLE_MUSEUM_PHOTO", "DUPLICATE_UPLOAD"] for f in flags)
        ):
            decision = "NEEDS_REVIEW"
            if quality_report["score"] < qual_min:
                reasons.append("Image quality is below optimal screening thresholds.")
            if top_prob < cat_conf_min or cls_report["ambiguous"]:
                reasons.append("Category classification is ambiguous or borderline.")
            if any(f["code"] == "CATEGORY_MISMATCH" for f in flags):
                reasons.append("Declared category differs from visual screening analysis.")
            if any(f["code"] == "POSSIBLE_MUSEUM_PHOTO" for f in flags):
                reasons.append("Image resembles a public museum photograph.")
            if any(f["code"] == "DUPLICATE_UPLOAD" for f in flags):
                reasons.append("Identical photo has previously been uploaded.")
        else:
            decision = "APPROVE"
            reasons.append("Image quality is suitable for AI-assisted screening.")
            reasons.append(f"The item is visually consistent with the {top_cat} category.")
            reasons.append("No configured prohibited-item indicators were detected.")

        if top_cat != "Not an Antique / Other":
            title_sug = f"Vintage {top_cat.rstrip('s')} Item"
        else:
            title_sug = declared_title or "Collectible Lot"

        return {
            "decision": decision,
            "decision_reasons": reasons,
            "flags": flags,
            "quality": quality_report,
            "classification": {
                "top_categories": cls_report["top_categories"],
                "ambiguous": cls_report["ambiguous"]
            },
            "estimated_period": period_report,
            "similar_museum_objects": met_references[:3],
            "suggested_listing": {
                "category": top_cat if top_cat != "Not an Antique / Other" else (declared_category or "Collectibles"),
                "title_suggestion": title_sug,
                "era": period_report["label"]
            },
            "disclaimer": DISCLAIMER_TEXT
        }
