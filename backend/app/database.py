from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from .models import Base

# Connection string matching our docker-compose.yml
SQLALCHEMY_DATABASE_URL = "postgresql://threatlens_user:supersecretpassword@localhost:5432/threatlens"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Dependency to yield database sessions
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
