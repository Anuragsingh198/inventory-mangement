from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.base import pg_enum, utcnow
from app.models.enums import AuditStatus


class InventoryAudit(Base):
    __tablename__ = "inventory_audits"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    warehouse_id: Mapped[int] = mapped_column(ForeignKey("warehouses.id"), nullable=False)
    status: Mapped[AuditStatus] = mapped_column(
        pg_enum(AuditStatus), default=AuditStatus.DRAFT, nullable=False
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    warehouse: Mapped["Warehouse"] = relationship("Warehouse")
    lines: Mapped[list["InventoryAuditLine"]] = relationship(
        "InventoryAuditLine", back_populates="audit", cascade="all, delete-orphan"
    )


class InventoryAuditLine(Base):
    __tablename__ = "inventory_audit_lines"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    audit_id: Mapped[int] = mapped_column(ForeignKey("inventory_audits.id"), nullable=False)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), nullable=False)
    expected_quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    counted_quantity: Mapped[int | None] = mapped_column(Integer, nullable=True)
    variance: Mapped[int | None] = mapped_column(Integer, nullable=True)
    notes: Mapped[str | None] = mapped_column(String(500), nullable=True)

    audit: Mapped["InventoryAudit"] = relationship("InventoryAudit", back_populates="lines")
    product: Mapped["Product"] = relationship("Product")
