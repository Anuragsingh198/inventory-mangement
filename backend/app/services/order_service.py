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
        if po.status == PurchaseOrderStatus.APPROVED:
            return po
        if po.status in (PurchaseOrderStatus.RECEIVED, PurchaseOrderStatus.PARTIALLY_RECEIVED):
            raise ValueError("Purchase order is already approved or received")
        if po.status == PurchaseOrderStatus.CANCELLED:
            raise ValueError("Cannot approve a cancelled purchase order")
        if po.status not in (PurchaseOrderStatus.DRAFT, PurchaseOrderStatus.PENDING_APPROVAL):
            raise ValueError(f"Cannot approve purchase order in '{po.status.value}' status")
        if not po.items:
            raise ValueError("Purchase order has no line items")
        po.status = PurchaseOrderStatus.APPROVED
        po.approved_by = user.id
        po.approved_at = datetime.now(timezone.utc)
        log_activity(db, user=user, action="approve", entity_type="purchase_order", entity_id=po.id)
        return po

    @staticmethod
    def receive(db: Session, po: PurchaseOrder, user: User) -> PurchaseOrder:
        if po.status == PurchaseOrderStatus.RECEIVED:
            return po
        if po.status == PurchaseOrderStatus.CANCELLED:
            raise ValueError("Cannot receive a cancelled purchase order")
        if po.status not in (PurchaseOrderStatus.APPROVED, PurchaseOrderStatus.PARTIALLY_RECEIVED):
            raise ValueError(
                f"Cannot receive purchase order in '{po.status.value}' status — approve it first"
            )
        if not po.items:
            raise ValueError("Purchase order has no line items to receive")
        warehouse_id = po.warehouse_id or get_or_create_default_warehouse(db).id
        received_any = False
        all_received = True
        for line in po.items:
            remaining = line.quantity - line.received_quantity
            if remaining <= 0:
                continue
            received_any = True
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
        if not received_any:
            po.status = PurchaseOrderStatus.RECEIVED
            po.received_at = po.received_at or datetime.now(timezone.utc)
            return po
        po.status = PurchaseOrderStatus.RECEIVED if all_received else PurchaseOrderStatus.PARTIALLY_RECEIVED
        po.received_at = datetime.now(timezone.utc)
        log_activity(db, user=user, action="receive", entity_type="purchase_order", entity_id=po.id)
        return po


class SalesService:
    @staticmethod
    def fulfill(db: Session, order: SalesOrder, user: User) -> SalesOrder:
        if order.status == SalesOrderStatus.FULFILLED:
            return order
        if order.status == SalesOrderStatus.CANCELLED:
            raise ValueError("Cannot fulfill a cancelled sales order")
        if order.status not in (SalesOrderStatus.CONFIRMED, SalesOrderStatus.DRAFT):
            raise ValueError(
                f"Cannot fulfill sales order in '{order.status.value}' status — confirm it first"
            )
        if not order.items:
            raise ValueError("Sales order has no line items to fulfill")
        warehouse_id = order.warehouse_id or get_or_create_default_warehouse(db).id
        fulfilled_any = False
        for line in order.items:
            remaining = line.quantity - line.fulfilled_quantity
            if remaining <= 0:
                continue
            fulfilled_any = True
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
        if not fulfilled_any and order.status == SalesOrderStatus.FULFILLED:
            return order
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
