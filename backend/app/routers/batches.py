from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import require_permission
from app.database import get_db
from app.models import Batch, Product, SerialNumber, User
from app.schemas import BatchCreate, BatchResponse, MessageResponse, SerialNumberCreate, SerialNumberResponse

router = APIRouter(prefix="/batches", tags=["batches"])


@router.get("", response_model=list[BatchResponse])
def list_batches(db: Session = Depends(get_db), _: User = Depends(require_permission("batches.read"))):
    return db.query(Batch).order_by(Batch.expiry_date).all()


@router.post("", response_model=BatchResponse, status_code=status.HTTP_201_CREATED)
def create_batch(payload: BatchCreate, db: Session = Depends(get_db), _: User = Depends(require_permission("batches.create"))):
    if not db.query(Product).filter(Product.id == payload.product_id).first():
        raise HTTPException(status_code=404, detail="Product not found")
    batch = Batch(**payload.model_dump())
    db.add(batch)
    db.commit()
    db.refresh(batch)
    return batch


@router.get("/serials", response_model=list[SerialNumberResponse])
def list_serials(db: Session = Depends(get_db), _: User = Depends(require_permission("batches.read"))):
    return db.query(SerialNumber).order_by(SerialNumber.created_at.desc()).limit(200).all()


@router.post("/serials", response_model=SerialNumberResponse, status_code=status.HTTP_201_CREATED)
def create_serial(payload: SerialNumberCreate, db: Session = Depends(get_db), _: User = Depends(require_permission("batches.create"))):
    if db.query(SerialNumber).filter(SerialNumber.serial == payload.serial).first():
        raise HTTPException(status_code=400, detail="Serial already exists")
    s = SerialNumber(**payload.model_dump())
    db.add(s)
    db.commit()
    db.refresh(s)
    return s
