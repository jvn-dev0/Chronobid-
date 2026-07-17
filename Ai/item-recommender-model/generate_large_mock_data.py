import pandas as pd
import numpy as np
import random
import os

CATEGORIES = ["clock", "coin", "sculpture", "pottery", "furniture", "painting", "crown", "watch", "clothes"]
ERAS = ["17th Century", "18th Century", "19th Century", "Roman", "Greek", "Ming Dynasty", "Victorian"]

def generate_items(n=10000):
    print(f"Generating {n} items...")
    items = []
    for i in range(1, n + 1):
        category = random.choice(CATEGORIES)
        era = random.choice(ERAS)
        # Price skewed towards lower values, but some very high
        price = round(np.random.exponential(scale=500) + 50, 2)
        if random.random() > 0.95: 
            price *= 10 # 5% chance of being very expensive
            
        items.append({
            "item_id": i,
            "title": f"Antique {era} {category.capitalize()}",
            "category": category,
            "era": era,
            "price": price,
            "popularity_score": round(random.uniform(0, 100), 2)
        })
    return pd.DataFrame(items)

def generate_users(n=50):
    print(f"Generating {n} users...")
    users = []
    for i in range(1, n + 1):
        users.append({
            "user_id": i,
            "escrow_balance": round(random.uniform(100, 15000), 2)
        })
    return pd.DataFrame(users)

def generate_user_behavior(users_df, items_df, n_actions=2000):
    print("Generating user search, wishlist, and bid history...")
    behavior = []
    item_ids = items_df['item_id'].tolist()
    user_ids = users_df['user_id'].tolist()
    
    actions = ["search", "wishlist", "bid"]
    # Weights for actions: 60% search, 30% wishlist, 10% bid
    
    for _ in range(n_actions):
        u_id = random.choice(user_ids)
        i_id = random.choice(item_ids)
        action = random.choices(actions, weights=[0.6, 0.3, 0.1])[0]
        
        behavior.append({
            "user_id": u_id,
            "item_id": i_id,
            "action_type": action
        })
        
    return pd.DataFrame(behavior)

if __name__ == "__main__":
    os.makedirs("data", exist_ok=True)
    
    df_items = generate_items(10000)
    df_users = generate_users(50)
    df_behavior = generate_user_behavior(df_users, df_items, 5000)
    
    df_items.to_csv("data/items.csv", index=False)
    df_users.to_csv("data/users.csv", index=False)
    df_behavior.to_csv("data/behavior.csv", index=False)
    
    print("Successfully generated items.csv, users.csv, and behavior.csv in the data/ folder!")
