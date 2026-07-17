import os
import json
import torch
from PIL import Image
from transformers import CLIPProcessor, CLIPModel
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

METADATA_FILE = "dataset_metadata.json"
CATEGORIES = [
    "clock", "coin", "sculpture", "pottery", 
    "furniture", "painting", "crown", "watch", "clothes"
]

class VerificationEngine:
    def __init__(self):
        print("Loading CLIP model (this might take a minute on first run)...")
        # Load the model and processor from HuggingFace
        self.model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
        self.processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
        
        self.metadata = []
        self.embeddings = []
        self.dataset_loaded = False
        
    def load_dataset_embeddings(self):
        if not os.path.exists(METADATA_FILE):
            print("No metadata file found. Please run fetch_met_data.py first.")
            return False
            
        with open(METADATA_FILE, 'r') as f:
            self.metadata = json.load(f)
            
        print(f"Generating embeddings for {len(self.metadata)} museum items...")
        
        # In a production app, you would pre-compute and save these to disk or a vector DB
        valid_metadata = []
        for item in self.metadata:
            try:
                img = Image.open(item['image_path']).convert("RGB")
                inputs = self.processor(images=img, return_tensors="pt")
                with torch.no_grad():
                    img_features = self.model.get_image_features(**inputs)
                self.embeddings.append(img_features.numpy().flatten())
                valid_metadata.append(item)
            except Exception as e:
                print(f"Skipping {item['image_path']}: {e}")
                
        self.metadata = valid_metadata
        self.embeddings = np.array(self.embeddings)
        self.dataset_loaded = True
        print("Dataset embeddings loaded successfully!")
        return True

    def classify_category(self, image):
        """Zero-shot classification to guess the category of the uploaded item"""
        # Create text prompts for CLIP
        text_prompts = [f"a photo of an antique {cat}" for cat in CATEGORIES]
        
        inputs = self.processor(text=text_prompts, images=image, return_tensors="pt", padding=True)
        with torch.no_grad():
            outputs = self.model(**inputs)
            
        # Get probabilities
        logits_per_image = outputs.logits_per_image
        probs = logits_per_image.softmax(dim=1).numpy()[0]
        
        # Get best match
        best_idx = np.argmax(probs)
        return CATEGORIES[best_idx], float(probs[best_idx])
        
    def find_similar_items(self, image, top_k=3):
        """Find the most similar museum items using vector similarity"""
        if not self.dataset_loaded:
            return []
            
        inputs = self.processor(images=image, return_tensors="pt")
        with torch.no_grad():
            img_features = self.model.get_image_features(**inputs).numpy()
            
        # Calculate cosine similarity between uploaded image and all museum images
        similarities = cosine_similarity(img_features, self.embeddings).flatten()
        
        # Get top K indices
        top_indices = np.argsort(similarities)[::-1][:top_k]
        
        results = []
        for idx in top_indices:
            match = self.metadata[idx].copy()
            match['similarity_score'] = float(similarities[idx])
            results.append(match)
            
        return results

    def verify_item(self, image_path):
        """Full pipeline: Classify category, find similar, and generate report"""
        try:
            img = Image.open(image_path).convert("RGB")
        except Exception as e:
            return {"error": f"Failed to open image: {str(e)}"}
            
        category, confidence = self.classify_category(img)
        
        similar_items = []
        estimated_period = "Unknown"
        verification_confidence = 0.0
        
        if self.dataset_loaded:
            similar_items = self.find_similar_items(img)
            if similar_items:
                estimated_period = similar_items[0].get("period", "Unknown")
                verification_confidence = similar_items[0].get("similarity_score", 0.0)
                
        return {
            "predicted_category": category,
            "category_confidence": confidence,
            "verification_confidence": verification_confidence,
            "estimated_period": estimated_period,
            "similar_museum_objects": similar_items
        }

if __name__ == "__main__":
    # Small test
    engine = VerificationEngine()
    engine.load_dataset_embeddings()
    print("Engine ready. You can import this into your API.")
