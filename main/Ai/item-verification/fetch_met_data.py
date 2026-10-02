import os
import json
import time
import requests
from tqdm import tqdm
from config import settings

CATEGORY_QUERIES = {
    "Timepieces & Watches": ["watch", "pocket watch", "clock", "timepiece"],
    "Jewellery": ["ring", "necklace", "brooch", "bracelet", "jewelry"],
    "Paintings & Art": ["oil painting", "landscape painting", "portrait painting", "watercolor"],
    "Ceramics & Glass": ["vase", "porcelain", "ceramic", "glass bowl", "pottery"],
    "Books & Manuscripts": ["manuscript", "illuminated manuscript", "book", "folio"],
    "Automobiles": ["automobile", "car"],
    "Musical Instruments": ["violin", "guitar", "piano", "flute", "lute"],
    "Coins & Currency": ["coin", "medal", "banknote"],
    "Fashion & Accessories": ["dress", "handbag", "fan", "costume", "hat"],
    "Furniture": ["chair", "table", "cabinet", "desk"],
    "Photography": ["daguerreotype", "camera", "photograph", "albumen print"],
    "Sports Memorabilia": ["sports", "trophy", "baseball", "medal"]
}

BASE_URL = "https://collectionapi.metmuseum.org/public/collection/v1"

def fetch_with_retry(url, max_retries=3, backoff_factor=1.0):
    for attempt in range(max_retries):
        try:
            resp = requests.get(url, timeout=12)
            if resp.status_code == 200:
                return resp.json()
            elif resp.status_code == 404:
                return None
        except Exception:
            pass
        time.sleep(backoff_factor * (2 ** attempt))
    return None

def download_image(url, save_path, max_retries=3):
    for attempt in range(max_retries):
        try:
            resp = requests.get(url, timeout=15)
            if resp.status_code == 200:
                with open(save_path, 'wb') as f:
                    f.write(resp.content)
                return True
        except Exception:
            pass
        time.sleep(1.0 * (2 ** attempt))
    return False

def build_met_dataset():
    os.makedirs(settings.IMAGE_DIR, exist_ok=True)
    os.makedirs(settings.DATASET_DIR, exist_ok=True)
    
    existing_metadata = []
    if os.path.exists(settings.METADATA_FILE):
        try:
            with open(settings.METADATA_FILE, 'r', encoding='utf-8') as f:
                existing_metadata = json.load(f)
        except Exception:
            existing_metadata = []
            
    existing_ids = {item['objectID'] for item in existing_metadata}
    metadata = list(existing_metadata)
    category_counts = {cat: 0 for cat in CATEGORY_QUERIES.keys()}
    
    for item in metadata:
        cat = item.get('category')
        if cat in category_counts:
            category_counts[cat] += 1

    print("🚀 Starting Metropolitan Museum Dataset Builder...")
    
    for category, queries in CATEGORY_QUERIES.items():
        cat_dir = os.path.join(settings.IMAGE_DIR, category)
        os.makedirs(cat_dir, exist_ok=True)
        
        current_count = category_counts[category]
        if current_count >= settings.MAX_ITEMS_PER_CATEGORY:
            print(f"✓ Category '{category}' already has {current_count} objects. Skipping.")
            continue
            
        print(f"\n📂 Fetching category: [{category}] (Current: {current_count}/{settings.MAX_ITEMS_PER_CATEGORY})")
        
        object_ids = set()
        for q in queries:
            search_url = f"{BASE_URL}/search?hasImages=true&q={q}"
            data = fetch_with_retry(search_url)
            if data and data.get("objectIDs"):
                object_ids.update(data["objectIDs"])
            time.sleep(0.2)
            
        sorted_ids = sorted(list(object_ids))
        pbar = tqdm(total=settings.MAX_ITEMS_PER_CATEGORY, initial=current_count, desc=category[:20])
        
        for obj_id in sorted_ids:
            if category_counts[category] >= settings.MAX_ITEMS_PER_CATEGORY:
                break
                
            if obj_id in existing_ids:
                continue
                
            obj_data = fetch_with_retry(f"{BASE_URL}/objects/{obj_id}")
            if not obj_data:
                continue
                
            is_public_domain = obj_data.get("isPublicDomain", False)
            image_url = obj_data.get("primaryImageSmall") or obj_data.get("primaryImage")
            
            if not is_public_domain or not image_url:
                continue
                
            img_filename = f"{obj_id}.jpg"
            img_path = os.path.join(cat_dir, img_filename)
            
            if not os.path.exists(img_path):
                success = download_image(image_url, img_path)
                if not success:
                    continue
                    
            item_meta = {
                "objectID": obj_id,
                "category": category,
                "image_path": img_path,
                "title": obj_data.get("title") or "Unknown Object",
                "objectName": obj_data.get("objectName") or "",
                "classification": obj_data.get("classification") or "",
                "department": obj_data.get("department") or "",
                "period": obj_data.get("period") or "Unknown",
                "culture": obj_data.get("culture") or "Unknown",
                "objectDate": obj_data.get("objectDate") or "",
                "objectBeginDate": obj_data.get("objectBeginDate", 0),
                "objectEndDate": obj_data.get("objectEndDate", 0),
                "medium": obj_data.get("medium") or "",
                "artistDisplayName": obj_data.get("artistDisplayName") or "",
                "isPublicDomain": True,
                "primaryImageSmall": image_url,
                "objectURL": obj_data.get("objectURL") or f"https://www.metmuseum.org/art/collection/search/{obj_id}"
            }
            
            metadata.append(item_meta)
            existing_ids.add(obj_id)
            category_counts[category] += 1
            pbar.update(1)
            
            time.sleep(0.1)
            
        pbar.close()
        
        with open(settings.METADATA_FILE, 'w', encoding='utf-8') as f:
            json.dump(metadata, f, indent=2, ensure_ascii=False)
            
    print("\n==========================================")
    print("📊 DATASET SUMMARY TABLE")
    print("==========================================")
    for cat, count in category_counts.items():
        print(f"  • {cat:<25}: {count} objects")
    print(f"Total Dataset Objects: {len(metadata)}")
    print("==========================================")

if __name__ == "__main__":
    build_met_dataset()
