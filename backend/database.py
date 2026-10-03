import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from dotenv import load_dotenv

load_dotenv()

DEFAULT_DB_URL = "postgresql://postgres.sqeybzyxdotrykoblccj:JtW0Qtb1DjCzKvrV@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?sslmode=require"
DATABASE_URL = os.getenv("DATABASE_URL") or DEFAULT_DB_URL

if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# If DATABASE_URL points to IPv6-only direct host, replace with IPv4 connection pooler
if "db.sqeybzyxdotrykoblccj.supabase.co" in DATABASE_URL:
    DATABASE_URL = "postgresql://postgres.sqeybzyxdotrykoblccj:JtW0Qtb1DjCzKvrV@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres"

if "sslmode=" not in DATABASE_URL:
    delimiter = "&" if "?" in DATABASE_URL else "?"
    DATABASE_URL = f"{DATABASE_URL}{delimiter}sslmode=require"

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=300,
    pool_size=10,
    max_overflow=20
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
