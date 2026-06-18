from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.schemas.common import validate_email
from app.schemas.enums import UserRole


class UserCreate(BaseModel):
    email: str
    password: str = Field(min_length=6)
    role: UserRole = UserRole.VIEWER
    full_name: str | None = None

    @field_validator("email")
    @classmethod
    def validate_email_field(cls, value: str) -> str:
        return validate_email(value)


class UserLogin(BaseModel):
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def validate_email_field(cls, value: str) -> str:
        return validate_email(value)


class GoogleAuthRequest(BaseModel):
    credential: str


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    role: UserRole
    full_name: str | None = None
    is_active: bool = True
    created_at: datetime
