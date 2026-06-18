from datetime import date, datetime, timedelta, timezone


def parse_start_datetime(value: str) -> datetime:
    """Inclusive start of calendar day (UTC)."""
    day = date.fromisoformat(value[:10])
    return datetime.combine(day, datetime.min.time(), tzinfo=timezone.utc)


def parse_end_datetime_exclusive(value: str) -> datetime:
    """Exclusive upper bound: start of the day after the selected end date."""
    day = date.fromisoformat(value[:10])
    return datetime.combine(day + timedelta(days=1), datetime.min.time(), tzinfo=timezone.utc)
