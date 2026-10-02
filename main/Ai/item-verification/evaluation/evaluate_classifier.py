import os
import sys
import numpy as np
from PIL import Image
from sklearn.metrics import classification_report, confusion_matrix

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from verification_engine import VerificationEngine, CHRONOBID_CATEGORIES

def evaluate_on_test_dataset(test_dir="test_images"):
    if not os.path.exists(test_dir):
        print(f"⚠️ Test directory '{test_dir}' not found.")
        print("Please structure your test dataset as:")
        print("  test_images/")
        print("    Timepieces & Watches/")
        print("    Jewellery/")
        print("    Paintings & Art/")
        print("    ...")
        return

    print("📊 Starting Evaluation of AI Zero-Shot Classifier...")
    engine = VerificationEngine()

    y_true = []
    y_pred = []

    for cat in CHRONOBID_CATEGORIES:
        cat_folder = os.path.join(test_dir, cat)
        if not os.path.exists(cat_folder):
            continue

        images = [f for f in os.listdir(cat_folder) if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp'))]
        print(f"  • Evaluating '{cat}': {len(images)} images")

        for img_name in images:
            img_path = os.path.join(cat_folder, img_name)
            try:
                pil_img = Image.open(img_path).convert("RGB")
                cls_report = engine.classify_category(pil_img)
                predicted_cat = cls_report["top_categories"][0]["category"]
                
                y_true.append(cat)
                y_pred.append(predicted_cat)
            except Exception as e:
                print(f"    Failed {img_name}: {e}")

    if not y_true:
        print("⚠️ No valid test images processed.")
        return

    print("\n==========================================")
    print("📈 CLASSIFICATION PERFORMANCE REPORT")
    print("==========================================")
    print(classification_report(y_true, y_pred, zero_division=0))

    labels = sorted(list(set(y_true + y_pred)))
    cm = confusion_matrix(y_true, y_pred, labels=labels)
    
    print("==========================================")
    print("🔲 CONFUSION MATRIX")
    print("==========================================")
    print(f"{'True \\ Pred':<25} | " + " | ".join([l[:8] for l in labels]))
    print("-" * 75)
    for i, label in enumerate(labels):
        row_str = " | ".join([f"{val:^8}" for val in cm[i]])
        print(f"{label:<25} | {row_str}")
    print("==========================================")

if __name__ == "__main__":
    evaluate_on_test_dataset()
