from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class CategoryBase(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: str | None = None
    parent_id: int | None = None


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = None
    parent_id: int | None = None


class CategoryResponse(CategoryBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


class ProductBase(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    sku: str = Field(min_length=1, max_length=50)
    category_id: int
    price: Decimal = Field(gt=0)
    cost_price: Decimal | None = Field(default=None, gt=0)
    description: str | None = None
    image_url: str | None = None
    barcode: str | None = None
    weight: Decimal | None = Field(default=None, gt=0)


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    sku: str | None = Field(default=None, min_length=1, max_length=50)
    category_id: int | None = None
    price: Decimal | None = Field(default=None, gt=0)
    cost_price: Decimal | None = Field(default=None, gt=0)
    description: str | None = None
    image_url: str | None = None
    barcode: str | None = None
    weight: Decimal | None = Field(default=None, gt=0)


class ProductResponse(ProductBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    qr_code: str | None = None
    created_at: datetime
    category: CategoryResponse | None = None


class ProductVariantCreate(BaseModel):
    product_id: int
    sku: str
    attributes: dict | None = None
    price: Decimal | None = Field(default=None, gt=0)
    barcode: str | None = None


class ProductVariantResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    product_id: int
    sku: str
    attributes: dict | None = None
    price: Decimal | None = None
    barcode: str | None = None
    created_at: datetime
