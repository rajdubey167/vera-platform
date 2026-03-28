"""
Run this once to create the first admin user.
Usage:
    python seed.py
"""
import os
from dotenv import load_dotenv

load_dotenv()

from app.database import SessionLocal, engine, Base
from app.models import User, Dataset, Record, AnalyticsResult  # noqa: F401 - registers models
from app.utils.security import hash_password

ADMIN_EMAIL    = os.getenv("ADMIN_EMAIL", "")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "")
ADMIN_NAME     = os.getenv("ADMIN_NAME", "VERA Admin")

def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == ADMIN_EMAIL).first()
        if existing:
            print(f"Admin already exists: {ADMIN_EMAIL}")
            return

        admin = User(
            email=ADMIN_EMAIL,
            hashed_password=hash_password(ADMIN_PASSWORD),
            full_name=ADMIN_NAME,
            role="admin",
            is_active=True,
        )
        db.add(admin)
        db.commit()
        print(f"Admin created successfully!")
        print(f"  Email:    {ADMIN_EMAIL}")
        print(f"  Password: {ADMIN_PASSWORD}")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
