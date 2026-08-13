import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# 1. Load environment variables from .env file
load_dotenv()

# 2. Get database URL (checks DATABASE_URL first, then DB_NAME fallback, then SQLite)
DATABASE_URL = os.getenv("DATABASE_URL") or os.getenv("DB_NAME") or "sqlite:///./nordic_commerce.db"

# 3. Ensure Postgres compatibility for SQLAlchemy 1.4/2.0
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# 4. Configure engine based on database type
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args, pool_pre_ping=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()