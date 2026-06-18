from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload

from app.core.deps import get_current_user, require_permission
from app.database import get_db
from app.models import Product, ProductVariant, User
from app.schemas import MessageResponse, ProductCreate, ProductResponse, ProductUpdate, ProductVariantCreate, ProductVariantResponse
from app.services.audit_service import log_activity
from app.services.product_service import generate_barcode, generate_sku

router = APIRouter(prefix="/products", tags=["products"])


@router.get("", response_model=list[ProductResponse])
def list_products(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_permission("products.read"))],
    search: str | None = Query(default=None),
    category_id: int | None = Query(default=None),
):
    query = db.query(Product).options(joinedload(Product.category))
    if search:
        query = query.filter(Product.name.ilike(f"%{search}%") | Product.sku.ilike(f"%{search}%"))
    if category_id is not None:
        query = query.filter(Product.category_id == category_id)
    return query.order_by(Product.name).all()


@router.get("/generate-sku")
def get_generated_sku(db: Annotated[Session, Depends(get_db)], _: Annotated[User, Depends(require_permission("products.create"))], prefix: str = "SKU"):
    return {"sku": generate_sku(db, prefix=prefix)}


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: int, db: Annotated[Session, Depends(get_db)], _: Annotated[User, Depends(require_permission("products.read"))]):
    product = db.query(Product).options(joinedload(Product.category)).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


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
    return db.query(Product).options(joinedload(Product.category)).filter(Product.id == product.id).first()


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
    return db.query(Product).options(joinedload(Product.category)).filter(Product.id == product_id).first()


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
