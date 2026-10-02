import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()
DB_URL = os.getenv("DATABASE_URL")

engine = create_engine(DB_URL)
with engine.connect() as conn:
    commands = [
        "ALTER TABLE sellers ADD COLUMN IF NOT EXISTS bank_account_name VARCHAR(150);",
        "ALTER TABLE sellers ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100);",
        "ALTER TABLE sellers ADD COLUMN IF NOT EXISTS bank_account_number VARCHAR(100);",
        "ALTER TABLE sellers ADD COLUMN IF NOT EXISTS bank_ifsc VARCHAR(50);"
    ]
    for cmd in commands:
        try:
            conn.execute(text(cmd))
            print(f"Executed: {cmd}")
        except Exception as e:
            print(f"Error: {e}")
    conn.commit()

print("Migration completed successfully!")
