import random
import string

from sqlalchemy.orm import Session

from app.models import Product, ProductVariant


def generate_sku(db: Session, prefix: str = "SKU", length: int = 6) -> str:
    while True:
        suffix = "".join(random.choices(string.digits, k=length))
        sku = f"{prefix}-{suffix}"
        if not db.query(Product).filter(Product.sku == sku).first():
            if not db.query(ProductVariant).filter(ProductVariant.sku == sku).first():
                return sku


def generate_barcode(db: Session, product_id: int | None = None) -> str:
    base = f"890{product_id or 0:06d}"
    while len(base) < 12:
        base += "0"
    # Simple EAN-13 check digit
    digits = [int(d) for d in base[:12]]
    checksum = (10 - (sum(digits[::2]) + sum(d * 3 for d in digits[1::2])) % 10) % 10
    return base[:12] + str(checksum)
