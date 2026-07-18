from database import engine, Base
import models

print("Connecting to Supabase PostgreSQL...")
try:
    # This creates all tables defined in models.py that don't yet exist in the DB
    Base.metadata.create_all(bind=engine)
    print("Successfully created all Core Tables in Supabase!")
except Exception as e:
    print(f"Error creating tables: {e}")
