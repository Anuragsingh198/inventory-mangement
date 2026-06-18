import re
from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import Generic, TypeVar

from pydantic import BaseModel, ConfigDict, Field, field_validator

T = TypeVar("T")

EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def validate_email(value: str) -> str:
    if not EMAIL_PATTERN.match(value):
        raise ValueError("Invalid email address")
    return value.lower()


class MessageResponse(BaseModel):
    message: str


class PaginatedResponse(BaseModel, Generic[T]):
    model_config = ConfigDict(from_attributes=True)

    items: list[T]
    total: int
    page: int
    page_size: int
    pages: int


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    sub: str | None = None
