import os
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'Database')))
from sqlalchemy import create_engine
from dotenv import load_dotenv
import models

load_dotenv()
DB_URL = os.getenv("DATABASE_URL")
engine = create_engine(DB_URL)

models.Base.metadata.create_all(bind=engine)
print("Successfully created BidHistory table!")
