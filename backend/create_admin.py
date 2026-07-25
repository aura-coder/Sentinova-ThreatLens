"""
One-time bootstrap script to create the first admin user.

Usage:
    python create_admin.py <email> <password>

There's no public /register endpoint by design (SOC accounts are
provisioned by an admin, not self-signup) - so the very first admin
has to be created directly against the database like this.
"""

import sys

import models
from auth import hash_password
from database import SessionLocal


def create_admin(email: str, password: str) -> None:
    db = SessionLocal()
    try:
        existing = db.query(models.User).filter(models.User.email == email).first()
        if existing:
            print(f"A user with email '{email}' already exists (role: {existing.role.value}).")
            return

        admin = models.User(
            email=email,
            hashed_password=hash_password(password),
            role=models.UserRole.admin,
        )
        db.add(admin)
        db.commit()
        print(f"Admin user created: {email}")
    finally:
        db.close()


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python create_admin.py <email> <password>")
        sys.exit(1)
    create_admin(sys.argv[1], sys.argv[2])