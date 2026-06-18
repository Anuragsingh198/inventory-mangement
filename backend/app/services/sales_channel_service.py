from decimal import Decimal

from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.models import Product, ProductChannelListing, SalesChannel


def get_product_channel_map(db: Session, product_ids: list[int]) -> dict[int, list[str]]:
    if not product_ids:
        return {}

    rows = (
        db.query(ProductChannelListing.product_id, SalesChannel.name)
        .join(SalesChannel, SalesChannel.id == ProductChannelListing.channel_id)
        .filter(
            ProductChannelListing.product_id.in_(product_ids),
            ProductChannelListing.is_active.is_(True),
            SalesChannel.is_active.is_(True),
        )
        .order_by(SalesChannel.name)
        .all()
    )

    channel_map: dict[int, list[str]] = {product_id: [] for product_id in product_ids}
    for product_id, channel_name in rows:
        channel_map[product_id].append(channel_name)
    return channel_map


def get_channel_summaries(db: Session) -> list[dict]:
    channels = db.query(SalesChannel).order_by(SalesChannel.name).all()
    summaries: list[dict] = []

    for channel in channels:
        stats = (
            db.query(
                func.count(ProductChannelListing.id),
                func.coalesce(func.sum(Product.price), 0),
            )
            .join(Product, Product.id == ProductChannelListing.product_id)
            .filter(
                ProductChannelListing.channel_id == channel.id,
                ProductChannelListing.is_active.is_(True),
            )
            .one()
        )
        listings_count = int(stats[0] or 0)
        revenue = Decimal(str(stats[1] or 0))
        summaries.append(
            {
                "id": channel.id,
                "name": channel.name,
                "slug": channel.slug,
                "is_active": channel.is_active,
                "created_at": channel.created_at,
                "listings_count": listings_count,
                "revenue": revenue,
            }
        )

    return summaries


def resolve_channel(db: Session, channel_ref: str) -> SalesChannel | None:
    term = channel_ref.strip()
    if not term:
        return None

    channel = db.query(SalesChannel).filter(SalesChannel.slug == term.lower()).first()
    if channel:
        return channel

    return db.query(SalesChannel).filter(SalesChannel.name.ilike(term)).first()


def connect_product_to_channel(db: Session, channel_id: int, product_id: int) -> ProductChannelListing:
    channel = db.query(SalesChannel).filter(SalesChannel.id == channel_id).first()
    if not channel:
        raise ValueError("Sales channel not found")

    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise ValueError("Product not found")

    listing = (
        db.query(ProductChannelListing)
        .filter(
            ProductChannelListing.channel_id == channel_id,
            ProductChannelListing.product_id == product_id,
        )
        .first()
    )
    if listing:
        listing.is_active = True
        return listing

    listing = ProductChannelListing(channel_id=channel_id, product_id=product_id, is_active=True)
    db.add(listing)
    db.flush()
    return listing


def disconnect_product_from_channel(db: Session, channel_id: int, product_id: int) -> None:
    listing = (
        db.query(ProductChannelListing)
        .filter(
            ProductChannelListing.channel_id == channel_id,
            ProductChannelListing.product_id == product_id,
        )
        .first()
    )
    if not listing:
        raise ValueError("Listing not found on this channel")
    db.delete(listing)
