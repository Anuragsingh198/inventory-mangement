from datetime import datetime, timezone

from sqlalchemy.orm import Session, joinedload

from app.models import (
    AuditStatus,
    InventoryAudit,
    InventoryAuditLine,
    PurchaseOrder,
    PurchaseOrderStatus,
    SalesOrder,
    SalesOrderStatus,
    StockMovementType,
    User,
)
from app.services.audit_service import log_activity
from app.services.stock_movement_service import StockMovementService, get_or_create_default_warehouse


class PurchaseService:
    @staticmethod
    def approve(db: Session, po: PurchaseOrder, user: User) -> PurchaseOrder:
        if po.status not in (PurchaseOrderStatus.DRAFT, PurchaseOrderStatus.PENDING_APPROVAL):
            raise ValueError("Purchase order cannot be approved in current status")
        po.status = PurchaseOrderStatus.APPROVED
        po.approved_by = user.id
        po.approved_at = datetime.now(timezone.utc)
        log_activity(db, user=user, action="approve", entity_type="purchase_order", entity_id=po.id)
        return po

    @staticmethod
    def receive(db: Session, po: PurchaseOrder, user: User) -> PurchaseOrder:
        if po.status not in (PurchaseOrderStatus.APPROVED, PurchaseOrderStatus.PARTIALLY_RECEIVED):
            raise ValueError("Purchase order must be approved before receiving")
        warehouse_id = po.warehouse_id or get_or_create_default_warehouse(db).id
        all_received = True
        for line in po.items:
            remaining = line.quantity - line.received_quantity
            if remaining <= 0:
                continue
            StockMovementService.record(
                db,
                product_id=line.product_id,
                warehouse_id=warehouse_id,
                quantity_delta=remaining,
                movement_type=StockMovementType.PURCHASE_RECEIPT,
                reason=f"PO #{po.id} receipt",
                reference_type="purchase_order",
                reference_id=po.id,
                user=user,
            )
            line.received_quantity = line.quantity
            if line.received_quantity < line.quantity:
                all_received = False
        po.status = PurchaseOrderStatus.RECEIVED if all_received else PurchaseOrderStatus.PARTIALLY_RECEIVED
        po.received_at = datetime.now(timezone.utc)
        log_activity(db, user=user, action="receive", entity_type="purchase_order", entity_id=po.id)
        return po


class SalesService:
    @staticmethod
    def fulfill(db: Session, order: SalesOrder, user: User) -> SalesOrder:
        if order.status not in (SalesOrderStatus.CONFIRMED, SalesOrderStatus.DRAFT):
            raise ValueError("Sales order must be confirmed before fulfillment")
        warehouse_id = order.warehouse_id or get_or_create_default_warehouse(db).id
        for line in order.items:
            remaining = line.quantity - line.fulfilled_quantity
            if remaining <= 0:
                continue
            StockMovementService.record(
                db,
                product_id=line.product_id,
                warehouse_id=warehouse_id,
                quantity_delta=-remaining,
                movement_type=StockMovementType.SALE_FULFILLMENT,
                reason=f"SO #{order.id} fulfillment",
                reference_type="sales_order",
                reference_id=order.id,
                user=user,
            )
            line.fulfilled_quantity = line.quantity
        order.status = SalesOrderStatus.FULFILLED
        order.fulfilled_at = datetime.now(timezone.utc)
        log_activity(db, user=user, action="fulfill", entity_type="sales_order", entity_id=order.id)
        return order


class InventoryAuditService:
    @staticmethod
    def complete(db: Session, audit: InventoryAudit, user: User) -> InventoryAudit:
        if audit.status != AuditStatus.IN_PROGRESS:
            raise ValueError("Audit must be in progress to complete")
        warehouse_id = audit.warehouse_id
        for line in audit.lines:
            if line.counted_quantity is None:
                continue
            line.variance = line.counted_quantity - line.expected_quantity
            if line.variance != 0:
                StockMovementService.record(
                    db,
                    product_id=line.product_id,
                    warehouse_id=warehouse_id,
                    quantity_delta=line.variance,
                    movement_type=StockMovementType.AUDIT_VARIANCE,
                    reason=f"Audit #{audit.id} variance",
                    reference_type="inventory_audit",
                    reference_id=audit.id,
                    user=user,
                )
        audit.status = AuditStatus.COMPLETED
        audit.completed_at = datetime.now(timezone.utc)
        log_activity(db, user=user, action="complete", entity_type="inventory_audit", entity_id=audit.id)
        return audit
