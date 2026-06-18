from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.core.deps import require_permission
from app.database import get_db
from app.models import ActivityLog, AuditStatus, InventoryAudit, InventoryAuditLine, User
from app.schemas import (
    ActivityLogResponse,
    InventoryAuditCreate,
    InventoryAuditLineCreate,
    InventoryAuditResponse,
    InventoryAuditUpdate,
    MessageResponse,
)
from app.services.order_service import InventoryAuditService

router = APIRouter(prefix="/audits", tags=["audits"])


def _load_audit(db: Session, audit_id: int) -> InventoryAudit | None:
    return (
        db.query(InventoryAudit)
        .options(joinedload(InventoryAudit.lines).joinedload(InventoryAuditLine.product))
        .filter(InventoryAudit.id == audit_id)
        .first()
    )


@router.get("", response_model=list[InventoryAuditResponse])
def list_audits(db: Session = Depends(get_db), _: User = Depends(require_permission("audits.read"))):
    return db.query(InventoryAudit).order_by(InventoryAudit.created_at.desc()).limit(50).all()


@router.get("/activity-logs", response_model=list[ActivityLogResponse])
def list_activity_logs(db: Session = Depends(get_db), _: User = Depends(require_permission("audits.read"))):
    return db.query(ActivityLog).order_by(ActivityLog.created_at.desc()).limit(200).all()


@router.post("", response_model=InventoryAuditResponse, status_code=status.HTTP_201_CREATED)
def create_audit(payload: InventoryAuditCreate, db: Session = Depends(get_db), user: User = Depends(require_permission("audits.create"))):
    audit = InventoryAudit(warehouse_id=payload.warehouse_id, notes=payload.notes, created_by=user.id, status=AuditStatus.IN_PROGRESS)
    db.add(audit)
    db.flush()
    for line in payload.lines:
        db.add(InventoryAuditLine(audit_id=audit.id, **line.model_dump()))
    db.commit()
    return _load_audit(db, audit.id)


@router.post("/{audit_id}/lines", response_model=InventoryAuditResponse)
def add_audit_line(audit_id: int, payload: InventoryAuditLineCreate, db: Session = Depends(get_db), _: User = Depends(require_permission("audits.update"))):
    audit = _load_audit(db, audit_id)
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    db.add(InventoryAuditLine(audit_id=audit_id, **payload.model_dump()))
    db.commit()
    return _load_audit(db, audit_id)


@router.post("/{audit_id}/complete", response_model=InventoryAuditResponse)
def complete_audit(audit_id: int, db: Session = Depends(get_db), user: User = Depends(require_permission("audits.update"))):
    audit = _load_audit(db, audit_id)
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    try:
        InventoryAuditService.complete(db, audit, user)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    db.commit()
    return _load_audit(db, audit_id)
