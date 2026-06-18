from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload

from app.core.deps import require_permission
from app.database import get_db
from app.models import Order, OrderItem, OrderStatus, Product, StockMovementType, User
from app.schemas import MessageResponse, OrderCreate, OrderResponse, OrderUpdate
from app.services.stock_movement_service import StockMovementService

router = APIRouter(prefix="/orders", tags=["orders"])


@router.get("", response_model=list[OrderResponse])
def list_orders(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_permission("purchases.read"))],
    status_filter: OrderStatus | None = Query(default=None, alias="status"),
    start_date: str | None = Query(default=None),
    end_date: str | None = Query(default=None),
):
    query = db.query(Order).options(joinedload(Order.items).joinedload(OrderItem.product).joinedload(Product.category))
    if status_filter:
        query = query.filter(Order.status == status_filter)
    if start_date:
        query = query.filter(Order.created_at >= start_date)
    if end_date:
        query = query.filter(Order.created_at <= end_date)
    return query.order_by(Order.created_at.desc()).all()


@router.get("/{order_id}", response_model=OrderResponse)
def get_order(
    order_id: int,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_permission("purchases.read"))],
):
    order = (
        db.query(Order)
        .options(joinedload(Order.items).joinedload(OrderItem.product).joinedload(Product.category))
        .filter(Order.id == order_id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(
    order_in: OrderCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_permission("purchases.create"))],
):
    order = Order(supplier=order_in.supplier, notes=order_in.notes)
    db.add(order)
    db.flush()
    for item_in in order_in.items:
        product = db.query(Product).filter(Product.id == item_in.product_id).first()
        if not product:
            raise HTTPException(status_code=400, detail=f"Product {item_in.product_id} not found")
        db.add(OrderItem(order_id=order.id, product_id=item_in.product_id, quantity=item_in.quantity, unit_price=item_in.unit_price))
    db.commit()
    return (
        db.query(Order)
        .options(joinedload(Order.items).joinedload(OrderItem.product).joinedload(Product.category))
        .filter(Order.id == order.id)
        .first()
    )


@router.patch("/{order_id}", response_model=OrderResponse)
def update_order(
    order_id: int,
    order_in: OrderUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_permission("purchases.update"))],
):
    order = (
        db.query(Order)
        .options(joinedload(Order.items))
        .filter(Order.id == order_id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    prev_status = order.status
    for field, value in order_in.model_dump(exclude_unset=True).items():
        setattr(order, field, value)

    if prev_status != OrderStatus.RECEIVED and order.status == OrderStatus.RECEIVED:
        for item in order.items:
            try:
                StockMovementService.record(
                    db,
                    product_id=item.product_id,
                    warehouse_id=None,
                    quantity_delta=item.quantity,
                    movement_type=StockMovementType.PURCHASE_RECEIPT,
                    reason=f"Legacy order #{order.id} received",
                    reference_type="order",
                    reference_id=order.id,
                    user=current_user,
                )
            except ValueError as exc:
                raise HTTPException(status_code=400, detail=str(exc))

    db.commit()
    return (
        db.query(Order)
        .options(joinedload(Order.items).joinedload(OrderItem.product).joinedload(Product.category))
        .filter(Order.id == order_id)
        .first()
    )


@router.delete("/{order_id}", response_model=MessageResponse)
def delete_order(
    order_id: int,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_permission("purchases.delete"))],
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    db.delete(order)
    db.commit()
    return MessageResponse(message="Order deleted")
