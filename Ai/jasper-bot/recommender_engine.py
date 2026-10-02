import os
import pandas as pd
import numpy as np

class RecommenderEngine:
    def __init__(self, data_dir=None):
        self.items_df = None
        self.users_df = None
        self.behavior_df = None
        
        if data_dir is None:
            base_dir = os.path.dirname(os.path.abspath(__file__))
            self.data_dir = os.path.join(base_dir, "data")
        else:
            self.data_dir = data_dir

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
        """Loads items, users, and behavior CSV data files using absolute os.path resolution."""
        try:
            items_path = os.path.join(self.data_dir, "items.csv")
            users_path = os.path.join(self.data_dir, "users.csv")
            behavior_path = os.path.join(self.data_dir, "behavior.csv")

            if not (os.path.exists(items_path) and os.path.exists(users_path) and os.path.exists(behavior_path)):
                print(f"Warning: Recommender CSV files missing in {self.data_dir}")
                return False

            self.items_df = pd.read_csv(items_path)
            self.users_df = pd.read_csv(users_path)
            self.behavior_df = pd.read_csv(behavior_path)
            print(f"Recommender data loaded successfully from {self.data_dir}.")
            return True
        except Exception as e:
            print(f"Error loading recommender data: {e}")
            return False

    def get_recommendations(self, user_id: int, top_n: int = 4):
        """
        Two-Source Recommender Algorithm:
        A) Vault (personal history & preferences)
        B) Trending (most-bid categories across all users)
        Merges 50/50, deduplicates, flags affordability, and excludes items user already bid on.
        """
        if self.items_df is None or self.users_df is None or self.behavior_df is None:
            if not self.load_data():
                return {"error": "Recommender data not available.", "recommendations": []}

        try:
            user = self.users_df[self.users_df['user_id'] == user_id]
            if user.empty:
                escrow_balance = 0.0
            else:
                escrow_balance = float(user.iloc[0]['escrow_balance'])
        except Exception:
            escrow_balance = 0.0

        try:
            # 1. Extract user action history
            user_history = self.behavior_df[self.behavior_df['user_id'] == user_id]
            searched_items = set(user_history[user_history['action_type'] == 'search']['item_id'].tolist())
            wishlist_items = set(user_history[user_history['action_type'] == 'wishlist']['item_id'].tolist())
            bid_items = set(user_history[user_history['action_type'] == 'bid']['item_id'].tolist())

            fav_categories = {}
            fav_eras = {}

            all_user_items = list(bid_items | wishlist_items | searched_items)
            for i_id in all_user_items:
                item = self.items_df[self.items_df['item_id'] == i_id]
                if not item.empty:
                    cat = str(item.iloc[0]['category'])
                    era = str(item.iloc[0]['era'])
                    weight = 3 if i_id in bid_items else (2 if i_id in wishlist_items else 1)
                    fav_categories[cat] = fav_categories.get(cat, 0) + weight
                    fav_eras[era] = fav_eras.get(era, 0) + weight

            top_cats = sorted(fav_categories, key=fav_categories.get, reverse=True)
            top_eras = sorted(fav_eras, key=fav_eras.get, reverse=True)

            # --- SOURCE A: VAULT (PERSONAL) RECOMMENDATIONS ---
            vault_scored = []
            for _, item in self.items_df.iterrows():
                i_id = item['item_id']
                if i_id in bid_items:
                    continue  # NEVER recommend items user has already bid on

                price = float(item['price'])
                affordable = bool(price <= escrow_balance)
                score = 10.0 if affordable else -50.0

                cat = str(item['category'])
                era = str(item['era'])
                reasons = []

                if cat in fav_categories:
                    score += fav_categories[cat] * 2
                    reasons.append(f"Matches your interest in {cat}")
                if era in fav_eras:
                    score += fav_eras[era] * 1.5
                    reasons.append(f"Matches your preferred {era} era")
                if i_id in wishlist_items:
                    score += 5
                    reasons.append("Saved in your wishlist")
                if i_id in searched_items:
                    score += 2
                    reasons.append("Based on your recent searches")

                for top_cat in top_cats[:2]:
                    if cat in self.complementary_map.get(top_cat, []):
                        if era in top_eras[:2]:
                            score += 15
                            reasons.append(f"Collector's Journey pairing for {top_cat}")

                score += float(item['popularity_score']) * 0.1
                reason_str = ", ".join(reasons) if reasons else f"Matches your personal vault preferences ({cat})"

                vault_scored.append({
                    "item_id": int(i_id),
                    "title": str(item['title']),
                    "category": cat,
                    "price": round(price, 2),
                    "score": round(score, 2),
                    "affordable": affordable,
                    "source": "vault",
                    "reason": reason_str
                })

            vault_scored.sort(key=lambda x: (not x['affordable'], -x['score']))

            # --- SOURCE B: TRENDING (MARKET) RECOMMENDATIONS ---
            bids_df = self.behavior_df[self.behavior_df['action_type'] == 'bid']
            merged_bids = bids_df.merge(self.items_df[['item_id', 'category']], on='item_id', how='inner')
            category_bid_counts = merged_bids['category'].value_counts().to_dict()

            trending_scored = []
            for _, item in self.items_df.iterrows():
                i_id = item['item_id']
                if i_id in bid_items:
                    continue

                price = float(item['price'])
                affordable = bool(price <= escrow_balance)
                cat = str(item['category'])
                bid_count = category_bid_counts.get(cat, 0)

                score = (bid_count * 3.0) + (float(item['popularity_score']) * 0.2)
                score += 10.0 if affordable else -50.0

                reason_str = f"{cat.capitalize()} is a top-trending category on ChronoBid ({bid_count} total bids)"

                trending_scored.append({
                    "item_id": int(i_id),
                    "title": str(item['title']),
                    "category": cat,
                    "price": round(price, 2),
                    "score": round(score, 2),
                    "affordable": affordable,
                    "source": "trending",
                    "reason": reason_str
                })

            trending_scored.sort(key=lambda x: (not x['affordable'], -x['score']))

            # --- MERGE & DEDUPLICATE (Half Vault, Half Trending) ---
            vault_target = max(1, top_n // 2)
            trending_target = top_n - vault_target

            selected = []
            seen_ids = set()

            for item in vault_scored:
                if len([x for x in selected if x['source'] == 'vault']) >= vault_target:
                    break
                if item['item_id'] not in seen_ids:
                    selected.append(item)
                    seen_ids.add(item['item_id'])

            for item in trending_scored:
                if len([x for x in selected if x['source'] == 'trending']) >= trending_target:
                    break
                if item['item_id'] not in seen_ids:
                    selected.append(item)
                    seen_ids.add(item['item_id'])

            # Fill remaining slots up to top_n from combined pool if needed
            combined_pool = vault_scored + trending_scored
            for item in combined_pool:
                if len(selected) >= top_n:
                    break
                if item['item_id'] not in seen_ids:
                    selected.append(item)
                    seen_ids.add(item['item_id'])

            # Final sort prioritizing affordable items first
            selected.sort(key=lambda x: (not x['affordable'], -x['score']))

            return {
                "user_id": user_id,
                "escrow_balance": escrow_balance,
                "top_interests": top_cats[:3],
                "recommendations": selected
            }

        except Exception as e:
            print(f"Error generating recommendations: {e}")
            return {"error": str(e), "recommendations": []}

if __name__ == "__main__":
    engine = RecommenderEngine()
    engine.load_data()
    print(engine.get_recommendations(user_id=1, top_n=4))
