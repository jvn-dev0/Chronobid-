import requests
import json
import os
import time

CATEGORIES = [
    "clock", "coin", "sculpture", "pottery", 
    "furniture", "painting", "crown", "watch", "clothes"
]
MAX_ITEMS_PER_CATEGORY = 20  # Limit to 20 for MVP to save time/space
DATASET_DIR = "dataset_images"
METADATA_FILE = "dataset_metadata.json"

def fetch_met_data():
    if not os.path.exists(DATASET_DIR):
        os.makedirs(DATASET_DIR)
        
    metadata = []
    
    for category in CATEGORIES:
        print(f"Fetching data for category: {category}...")
        
        # 1. Search for objects matching category
        search_url = f"https://collectionapi.metmuseum.org/public/collection/v1/search?q={category}&hasImages=true"
        response = requests.get(search_url)
        
        if response.status_code != 200:
            print(f"  Failed to fetch search results for {category}")
            continue
            
        data = response.json()
        object_ids = data.get("objectIDs", [])
        
        if not object_ids:
            print(f"  No items found for {category}")
            continue
            
        # 2. Get details and images for the top results
        count = 0
        for obj_id in object_ids:
            if count >= MAX_ITEMS_PER_CATEGORY:
                break
                
            obj_url = f"https://collectionapi.metmuseum.org/public/collection/v1/objects/{obj_id}"
            obj_resp = requests.get(obj_url)
            
            try:
                obj_data = obj_resp.json()
            except Exception as e:
                print(f"    Failed to parse JSON for {obj_id}: {e}")
                continue
                
            image_url = obj_data.get("primaryImage")
            
            if not image_url:
                continue
                
            # Download image
            try:
                img_resp = requests.get(image_url, timeout=10)
                if img_resp.status_code == 200:
                    img_filename = f"{category}_{obj_id}.jpg"
                    img_path = os.path.join(DATASET_DIR, img_filename)
                    
                    with open(img_path, 'wb') as f:
                        f.write(img_resp.content)
                        
                    # Save metadata
                    item_meta = {
                        "met_id": obj_id,
                        "category": category,
                        "title": obj_data.get("title", "Unknown Title"),
                        "period": obj_data.get("period", "Unknown Period"),
                        "culture": obj_data.get("culture", "Unknown Culture"),
                        "medium": obj_data.get("medium", "Unknown Medium"),
                        "image_path": img_path,
                        "image_url": image_url
                    }
                    metadata.append(item_meta)
                    count += 1
                    print(f"    Saved: {item_meta['title']}")
                    
            except Exception as e:
                print(f"    Error downloading image for {obj_id}: {e}")
                
            time.sleep(0.5) # Be nice to the API
            
    # Save all metadata to JSON
    with open(METADATA_FILE, 'w') as f:
        json.dump(metadata, f, indent=4)
        
    print(f"\nDone! Saved {len(metadata)} items total.")

if __name__ == "__main__":
    fetch_met_data()
