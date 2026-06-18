from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.core.deps import require_permission
from app.database import get_db
from app.models import Product, PurchaseOrder, PurchaseOrderLine, PurchaseOrderStatus, User, VendorInvoice
from app.schemas import (
    MessageResponse,
    PurchaseOrderCreate,
    PurchaseOrderResponse,
    PurchaseOrderUpdate,
    VendorInvoiceCreate,
    VendorInvoiceResponse,
)
from app.services.order_service import PurchaseService

router = APIRouter(prefix="/purchases", tags=["purchases"])


def _load_po(db: Session, po_id: int) -> PurchaseOrder | None:
    return (
        db.query(PurchaseOrder)
        .options(joinedload(PurchaseOrder.items).joinedload(PurchaseOrderLine.product), joinedload(PurchaseOrder.supplier))
        .filter(PurchaseOrder.id == po_id)
        .first()
    )


@router.get("", response_model=list[PurchaseOrderResponse])
def list_purchase_orders(db: Session = Depends(get_db), _: User = Depends(require_permission("purchases.read"))):
    return (
        db.query(PurchaseOrder)
        .options(joinedload(PurchaseOrder.items), joinedload(PurchaseOrder.supplier))
        .order_by(PurchaseOrder.created_at.desc())
        .all()
    )


@router.get("/{po_id}", response_model=PurchaseOrderResponse)
def get_purchase_order(po_id: int, db: Session = Depends(get_db), _: User = Depends(require_permission("purchases.read"))):
    po = _load_po(db, po_id)
    if not po:
        raise HTTPException(status_code=404, detail="Purchase order not found")
    return po


@router.post("", response_model=PurchaseOrderResponse, status_code=status.HTTP_201_CREATED)
def create_purchase_order(payload: PurchaseOrderCreate, db: Session = Depends(get_db), user: User = Depends(require_permission("purchases.create"))):
    po = PurchaseOrder(supplier_id=payload.supplier_id, warehouse_id=payload.warehouse_id, notes=payload.notes, created_by=user.id, status=PurchaseOrderStatus.PENDING_APPROVAL)
    db.add(po)
    db.flush()
    for line in payload.items:
        if not db.query(Product).filter(Product.id == line.product_id).first():
            raise HTTPException(status_code=400, detail=f"Product {line.product_id} not found")
        db.add(PurchaseOrderLine(purchase_order_id=po.id, **line.model_dump()))
    db.commit()
    return _load_po(db, po.id)


@router.post("/{po_id}/approve", response_model=PurchaseOrderResponse)
def approve_purchase_order(po_id: int, db: Session = Depends(get_db), user: User = Depends(require_permission("purchases.approve"))):
    po = _load_po(db, po_id)
    if not po:
        raise HTTPException(status_code=404, detail="Purchase order not found")
    try:
        PurchaseService.approve(db, po, user)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    db.commit()
    return _load_po(db, po_id)


@router.post("/{po_id}/receive", response_model=PurchaseOrderResponse)
def receive_purchase_order(po_id: int, db: Session = Depends(get_db), user: User = Depends(require_permission("purchases.receive"))):
    po = _load_po(db, po_id)
    if not po:
        raise HTTPException(status_code=404, detail="Purchase order not found")
    try:
        PurchaseService.receive(db, po, user)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    db.commit()
    return _load_po(db, po_id)


@router.patch("/{po_id}", response_model=PurchaseOrderResponse)
def update_purchase_order(po_id: int, payload: PurchaseOrderUpdate, db: Session = Depends(get_db), _: User = Depends(require_permission("purchases.update"))):
    po = _load_po(db, po_id)
    if not po:
        raise HTTPException(status_code=404, detail="Purchase order not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(po, k, v)
    db.commit()
    return _load_po(db, po_id)


@router.post("/invoices", response_model=VendorInvoiceResponse, status_code=status.HTTP_201_CREATED)
def create_vendor_invoice(payload: VendorInvoiceCreate, db: Session = Depends(get_db), _: User = Depends(require_permission("invoices.create"))):
    inv = VendorInvoice(**payload.model_dump())
    db.add(inv)
    db.commit()
    db.refresh(inv)
    return inv
