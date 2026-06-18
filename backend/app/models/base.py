import enum
from datetime import datetime, timezone

from sqlalchemy import DateTime, Enum


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def pg_enum(enum_cls: type[enum.Enum]) -> Enum:
    return Enum(
        enum_cls,
        values_callable=lambda members: [member.value for member in members],
    )
