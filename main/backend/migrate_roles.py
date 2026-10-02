import os
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'Database')))
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()
DB_URL = os.getenv("DATABASE_URL")
engine = create_engine(DB_URL)

with engine.connect() as conn:
    try:
        # PostgreSQL syntax for adding/dropping columns
        conn.execute(text("ALTER TABLE admins ADD COLUMN IF NOT EXISTS role_type VARCHAR(50) DEFAULT 'ops_admin';"))
        conn.execute(text("ALTER TABLE admins DROP COLUMN IF EXISTS permission_level;"))
        conn.commit()
        print("Successfully migrated Admin roles!")
    except Exception as e:
        print(f"Migration error: {e}")
