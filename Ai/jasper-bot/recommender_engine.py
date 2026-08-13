import pandas as pd
import numpy as np

class RecommenderEngine:
    def __init__(self):
        self.items_df = None
        self.users_df = None
        self.behavior_df = None
        self.complementary_map = {
            "coin": ["watch", "pottery"],
            "watch": ["coin", "clothes"],
            "painting": ["sculpture", "furniture"],
            "sculpture": ["painting", "pottery"],
            "furniture": ["painting", "clock"],
            "clock": ["furniture", "sculpture"],
            "crown": ["clothes", "coin"],
            "clothes": ["crown", "watch"],
            "pottery": ["sculpture", "coin"]
        }

    def load_data(self):
        try:
            self.items_df = pd.read_csv("data/items.csv")
            self.users_df = pd.read_csv("data/users.csv")
            self.behavior_df = pd.read_csv("data/behavior.csv")
            print("Data loaded successfully.")
            return True
        except FileNotFoundError:
            print("Error: Mock data CSVs not found. Run generate_large_mock_data.py first.")
            return False

    def get_recommendations(self, user_id, top_n=10):
        if self.items_df is None:
            return {"error": "Data not loaded."}
            
        user = self.users_df[self.users_df['user_id'] == user_id]
        if user.empty:
            return {"error": f"User {user_id} not found."}
            
        escrow_balance = float(user.iloc[0]['escrow_balance'])
        
        # 1. Load User History
        user_history = self.behavior_df[self.behavior_df['user_id'] == user_id]
        
        searched_items = user_history[user_history['action_type'] == 'search']['item_id'].tolist()
        wishlist_items = user_history[user_history['action_type'] == 'wishlist']['item_id'].tolist()
        bid_items = user_history[user_history['action_type'] == 'bid']['item_id'].tolist()
        
        # Figure out user's favorite categories & eras from history
        fav_categories = {}
        fav_eras = {}
        
        for i_id in bid_items + wishlist_items + searched_items:
            item = self.items_df[self.items_df['item_id'] == i_id]
            if not item.empty:
                cat = item.iloc[0]['category']
                era = item.iloc[0]['era']
                
                # Weighting: Bid = 3, Wishlist = 2, Search = 1
                weight = 3 if i_id in bid_items else (2 if i_id in wishlist_items else 1)
                
                fav_categories[cat] = fav_categories.get(cat, 0) + weight
                fav_eras[era] = fav_eras.get(era, 0) + weight

        # Sort favorites to find top interests
        top_cats = sorted(fav_categories, key=fav_categories.get, reverse=True)
        top_eras = sorted(fav_eras, key=fav_eras.get, reverse=True)
        
        # Scoring all items
        scored_items = []
        
        for _, item in self.items_df.iterrows():
            score = 0.0
            
            # Step 1: Escrow Balance Filter (Soft filter: lower score if they can't afford it)
            if item['price'] > escrow_balance:
                score -= 50  # Huge penalty for items outside budget
            else:
                score += 10  # Base point for affordable items
                
            # Step 2: History Match
            if item['category'] in fav_categories:
                score += fav_categories[item['category']] * 2
                
            if item['era'] in fav_eras:
                score += fav_eras[item['era']] * 1.5
                
            # Step 3: The Collector's Journey (Complementary Items)
            # If they bid on a coin, recommend watches from the same era
            for top_cat in top_cats[:2]: # Look at their top 2 categories
                if item['category'] in self.complementary_map.get(top_cat, []):
                    if item['era'] in top_eras[:2]: # Must match their favorite eras to make sense
                        score += 15 # "Collector's Journey" bonus
                        
            # Step 4: Base Popularity
            score += item['popularity_score'] * 0.1
            
            # Don't recommend things they already bid on
            if item['item_id'] in bid_items:
                score = -9999
                
            scored_items.append({
                "item_id": item['item_id'],
                "title": item['title'],
                "category": item['category'],
                "price": item['price'],
                "score": round(score, 2)
            })
            
        # Sort by score and get top N
        scored_items.sort(key=lambda x: x['score'], reverse=True)
        top_recommendations = scored_items[:top_n]
        
        return {
            "user_id": user_id,
            "escrow_balance": escrow_balance,
            "top_interests": top_cats[:3],
            "recommendations": top_recommendations
        }

if __name__ == "__main__":
    engine = RecommenderEngine()
    engine.load_data()
    # Test for user 1
    print(engine.get_recommendations(user_id=1, top_n=5))
