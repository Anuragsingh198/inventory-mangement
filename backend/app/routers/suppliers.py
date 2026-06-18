from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import require_permission
from app.database import get_db
from app.models import Supplier, SupplierPayment, User
from app.schemas import (
    MessageResponse,
    SupplierCreate,
    SupplierPaymentCreate,
    SupplierPaymentResponse,
    SupplierResponse,
    SupplierUpdate,
)

router = APIRouter(prefix="/suppliers", tags=["suppliers"])


@router.get("", response_model=list[SupplierResponse])
def list_suppliers(db: Session = Depends(get_db), _: User = Depends(require_permission("suppliers.read"))):
    return db.query(Supplier).order_by(Supplier.name).all()


@router.get("/{supplier_id}", response_model=SupplierResponse)
def get_supplier(supplier_id: int, db: Session = Depends(get_db), _: User = Depends(require_permission("suppliers.read"))):
    s = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return s


@router.post("", response_model=SupplierResponse, status_code=status.HTTP_201_CREATED)
def create_supplier(payload: SupplierCreate, db: Session = Depends(get_db), _: User = Depends(require_permission("suppliers.create"))):
    s = Supplier(**payload.model_dump())
    db.add(s)
    db.commit()
    db.refresh(s)
    return s


@router.patch("/{supplier_id}", response_model=SupplierResponse)
def update_supplier(supplier_id: int, payload: SupplierUpdate, db: Session = Depends(get_db), _: User = Depends(require_permission("suppliers.update"))):
    s = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Supplier not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(s, k, v)
    db.commit()
    db.refresh(s)
    return s


@router.delete("/{supplier_id}", response_model=MessageResponse)
def delete_supplier(supplier_id: int, db: Session = Depends(get_db), _: User = Depends(require_permission("suppliers.delete"))):
    s = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Supplier not found")
    db.delete(s)
    db.commit()
    return MessageResponse(message="Supplier deleted")


@router.get("/{supplier_id}/payments", response_model=list[SupplierPaymentResponse])
def list_payments(supplier_id: int, db: Session = Depends(get_db), _: User = Depends(require_permission("suppliers.read"))):
    return db.query(SupplierPayment).filter(SupplierPayment.supplier_id == supplier_id).all()


@router.post("/payments", response_model=SupplierPaymentResponse, status_code=status.HTTP_201_CREATED)
def record_payment(payload: SupplierPaymentCreate, db: Session = Depends(get_db), _: User = Depends(require_permission("invoices.create"))):
    from datetime import datetime, timezone
    p = SupplierPayment(**payload.model_dump(), paid_at=datetime.now(timezone.utc))
    db.add(p)
    db.commit()
    db.refresh(p)
    return p
