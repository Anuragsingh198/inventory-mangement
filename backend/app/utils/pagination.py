from sqlalchemy.orm import Query


def paginate_query(query: Query, page: int, page_size: int) -> tuple[list, int]:
    """Return (items, total). page_size=0 returns all rows."""
    if page_size <= 0:
        items = query.all()
        return items, len(items)

    total = query.order_by(None).count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    return items, total


def total_pages(total: int, page_size: int) -> int:
    if page_size <= 0:
        return 1
    return max(1, (total + page_size - 1) // page_size)
