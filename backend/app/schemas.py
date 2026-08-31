from pydantic import BaseModel, EmailStr
from uuid import UUID
from typing import Optional
from .models import UserRole

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[UserRole] = None

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: UUID
    username: str
    email: EmailStr
    role: UserRole
    is_active: bool

    class Config:
        from_attributes = True
