from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import String, cast, func
from sqlalchemy.orm import Session, joinedload

from app.core.deps import get_current_user, require_permission
from app.database import get_db
from app.models import Inventory, Product, ProductChannelListing, ProductVariant, SalesChannel, User
from app.schemas import MessageResponse, ProductCreate, ProductResponse, ProductUpdate, ProductVariantCreate, ProductVariantResponse
from app.schemas.common import PaginatedResponse
from app.services.audit_service import log_activity
from app.services.product_service import generate_barcode, generate_sku
from app.services.sales_channel_service import get_product_channel_map, resolve_channel
from app.utils.pagination import paginate_query, total_pages

router = APIRouter(prefix="/products", tags=["products"])


def _serialize_products(db: Session, products: list[Product]) -> list[ProductResponse]:
    channel_map = get_product_channel_map(db, [product.id for product in products])
    return [
        ProductResponse.model_validate(product).model_copy(
            update={"channels": channel_map.get(product.id, [])},
        )
        for product in products
    ]


@router.get("", response_model=PaginatedResponse[ProductResponse])
def list_products(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_permission("products.read"))],
    search: str | None = Query(default=None),
    category_id: int | None = Query(default=None),
    channel: str | None = Query(default=None, description="Filter by sales channel name or slug"),
    sort: Literal["name", "price", "quantity"] = Query(default="name"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=0, le=500),
):
    query = db.query(Product).options(joinedload(Product.category))
    if search:
        term = search.strip().lstrip("#")
        if term:
            pattern = f"%{term}%"
            query = query.filter(
                Product.name.ilike(pattern)
                | Product.sku.ilike(pattern)
                | Product.description.ilike(pattern)
                | cast(Product.id, String).ilike(pattern)
                | func.lpad(cast(Product.id, String), 6, "0").ilike(pattern)
            )
    if category_id is not None:
        query = query.filter(Product.category_id == category_id)
    if channel:
        sales_channel = resolve_channel(db, channel)
        if not sales_channel:
            return PaginatedResponse(items=[], total=0, page=page, page_size=page_size, pages=1)
        query = (
            query.join(ProductChannelListing, ProductChannelListing.product_id == Product.id)
            .join(SalesChannel, SalesChannel.id == ProductChannelListing.channel_id)
            .filter(
                ProductChannelListing.channel_id == sales_channel.id,
                ProductChannelListing.is_active.is_(True),
                SalesChannel.is_active.is_(True),
            )
        )
    if sort == "price":
        query = query.order_by(Product.price)
    elif sort == "quantity":
        query = query.outerjoin(Inventory).order_by(func.coalesce(Inventory.quantity, 0).desc())
    else:
        query = query.order_by(Product.name)

    items, total = paginate_query(query, page, page_size)
    return PaginatedResponse(
        items=_serialize_products(db, items),
        total=total,
        page=page,
        page_size=page_size if page_size > 0 else total,
        pages=total_pages(total, page_size),
    )


@router.get("/generate-sku")
def get_generated_sku(db: Annotated[Session, Depends(get_db)], _: Annotated[User, Depends(require_permission("products.create"))], prefix: str = "SKU"):
    return {"sku": generate_sku(db, prefix=prefix)}


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: int, db: Annotated[Session, Depends(get_db)], _: Annotated[User, Depends(require_permission("products.read"))]):
    product = db.query(Product).options(joinedload(Product.category)).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return _serialize_products(db, [product])[0]


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    product_in: ProductCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_permission("products.create"))],
):
    existing = db.query(Product).filter(Product.sku == product_in.sku).first()
    if existing:
        raise HTTPException(status_code=400, detail="SKU already exists")
    data = product_in.model_dump()
    product = Product(**data)
    db.add(product)
    db.flush()
    if not product.barcode:
        product.barcode = generate_barcode(db, product.id)
        product.qr_code = f"https://ventorio.app/p/{product.id}"
    log_activity(db, user=current_user, action="create", entity_type="product", entity_id=product.id)
    db.commit()
    product = db.query(Product).options(joinedload(Product.category)).filter(Product.id == product.id).first()
    return _serialize_products(db, [product])[0]


@router.patch("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    product_in: ProductUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_permission("products.update"))],
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if product_in.sku:
        existing = db.query(Product).filter(Product.sku == product_in.sku, Product.id != product_id).first()
        if existing:
            raise HTTPException(status_code=400, detail="SKU already exists")
    for field, value in product_in.model_dump(exclude_unset=True).items():
        setattr(product, field, value)
    log_activity(db, user=current_user, action="update", entity_type="product", entity_id=product_id)
    db.commit()
    product = db.query(Product).options(joinedload(Product.category)).filter(Product.id == product_id).first()
    return _serialize_products(db, [product])[0]


@router.delete("/{product_id}", response_model=MessageResponse)
def delete_product(
    product_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_permission("products.delete"))],
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(product)
    log_activity(db, user=current_user, action="delete", entity_type="product", entity_id=product_id)
    db.commit()
    return MessageResponse(message="Product deleted")


@router.get("/{product_id}/variants", response_model=list[ProductVariantResponse])
def list_variants(product_id: int, db: Annotated[Session, Depends(get_db)], _: Annotated[User, Depends(require_permission("products.read"))]):
    return db.query(ProductVariant).filter(ProductVariant.product_id == product_id).all()


@router.post("/variants", response_model=ProductVariantResponse, status_code=status.HTTP_201_CREATED)
def create_variant(
    payload: ProductVariantCreate,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_permission("products.create"))],
):
    if db.query(ProductVariant).filter(ProductVariant.sku == payload.sku).first():
        raise HTTPException(status_code=400, detail="Variant SKU exists")
    variant = ProductVariant(**payload.model_dump())
    db.add(variant)
    db.commit()
    db.refresh(variant)
    return variant
