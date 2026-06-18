from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.core.deps import require_permission
from app.database import get_db
from app.models import Customer, CustomerInvoice, Product, SalesOrder, SalesOrderLine, SalesOrderStatus, User
from app.schemas import (
    CustomerCreate,
    CustomerInvoiceCreate,
    CustomerInvoiceResponse,
    CustomerResponse,
    CustomerUpdate,
    SalesOrderCreate,
    SalesOrderResponse,
    SalesOrderUpdate,
)
from app.services.order_service import SalesService

router = APIRouter(prefix="/sales", tags=["sales"])


def _load_so(db: Session, so_id: int) -> SalesOrder | None:
    return (
        db.query(SalesOrder)
        .options(joinedload(SalesOrder.items).joinedload(SalesOrderLine.product), joinedload(SalesOrder.customer))
        .filter(SalesOrder.id == so_id)
        .first()
    )


@router.get("/customers", response_model=list[CustomerResponse])
def list_customers(db: Session = Depends(get_db), _: User = Depends(require_permission("customers.read"))):
    return db.query(Customer).order_by(Customer.name).all()


@router.post("/customers", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
def create_customer(payload: CustomerCreate, db: Session = Depends(get_db), _: User = Depends(require_permission("customers.create"))):
    c = Customer(**payload.model_dump())
    db.add(c)
    db.commit()
    db.refresh(c)
    return c


@router.patch("/customers/{customer_id}", response_model=CustomerResponse)
def update_customer(customer_id: int, payload: CustomerUpdate, db: Session = Depends(get_db), _: User = Depends(require_permission("customers.update"))):
    c = db.query(Customer).filter(Customer.id == customer_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Customer not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(c, k, v)
    db.commit()
    db.refresh(c)
    return c


@router.get("/orders", response_model=list[SalesOrderResponse])
def list_sales_orders(db: Session = Depends(get_db), _: User = Depends(require_permission("sales.read"))):
    return (
        db.query(SalesOrder)
        .options(joinedload(SalesOrder.items), joinedload(SalesOrder.customer))
        .order_by(SalesOrder.created_at.desc())
        .all()
    )


@router.get("/orders/{so_id}", response_model=SalesOrderResponse)
def get_sales_order(so_id: int, db: Session = Depends(get_db), _: User = Depends(require_permission("sales.read"))):
    so = _load_so(db, so_id)
    if not so:
        raise HTTPException(status_code=404, detail="Sales order not found")
    return so


@router.post("/orders", response_model=SalesOrderResponse, status_code=status.HTTP_201_CREATED)
def create_sales_order(payload: SalesOrderCreate, db: Session = Depends(get_db), user: User = Depends(require_permission("sales.create"))):
    so = SalesOrder(customer_id=payload.customer_id, warehouse_id=payload.warehouse_id, notes=payload.notes, created_by=user.id, status=SalesOrderStatus.CONFIRMED)
    db.add(so)
    db.flush()
    for line in payload.items:
        if not db.query(Product).filter(Product.id == line.product_id).first():
            raise HTTPException(status_code=400, detail=f"Product {line.product_id} not found")
        db.add(SalesOrderLine(sales_order_id=so.id, **line.model_dump()))
    db.commit()
    return _load_so(db, so.id)


@router.post("/orders/{so_id}/fulfill", response_model=SalesOrderResponse)
def fulfill_sales_order(so_id: int, db: Session = Depends(get_db), user: User = Depends(require_permission("sales.fulfill"))):
    so = _load_so(db, so_id)
    if not so:
        raise HTTPException(status_code=404, detail="Sales order not found")
    try:
        SalesService.fulfill(db, so, user)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    db.commit()
    return _load_so(db, so_id)


@router.patch("/orders/{so_id}", response_model=SalesOrderResponse)
def update_sales_order(so_id: int, payload: SalesOrderUpdate, db: Session = Depends(get_db), _: User = Depends(require_permission("sales.update"))):
    so = _load_so(db, so_id)
    if not so:
        raise HTTPException(status_code=404, detail="Sales order not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(so, k, v)
    db.commit()
    return _load_so(db, so_id)


@router.post("/invoices", response_model=CustomerInvoiceResponse, status_code=status.HTTP_201_CREATED)
def create_customer_invoice(payload: CustomerInvoiceCreate, db: Session = Depends(get_db), _: User = Depends(require_permission("invoices.create"))):
    inv = CustomerInvoice(**payload.model_dump())
    db.add(inv)
    db.commit()
    db.refresh(inv)
    return inv
