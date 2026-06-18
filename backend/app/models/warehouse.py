from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.base import pg_enum, utcnow
from app.models.enums import TransferStatus


class Warehouse(Base):
    __tablename__ = "warehouses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    code: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    locations: Mapped[list["WarehouseLocation"]] = relationship("WarehouseLocation", back_populates="warehouse")
    inventory_balances: Mapped[list["InventoryBalance"]] = relationship(
        "InventoryBalance", back_populates="warehouse"
    )


class WarehouseLocation(Base):
    __tablename__ = "warehouse_locations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    warehouse_id: Mapped[int] = mapped_column(ForeignKey("warehouses.id"), nullable=False)
    rack: Mapped[str | None] = mapped_column(String(50), nullable=True)
    shelf: Mapped[str | None] = mapped_column(String(50), nullable=True)
    bin: Mapped[str | None] = mapped_column(String(50), nullable=True)
    label: Mapped[str] = mapped_column(String(100), nullable=False)

    warehouse: Mapped["Warehouse"] = relationship("Warehouse", back_populates="locations")
    inventory_balances: Mapped[list["InventoryBalance"]] = relationship(
        "InventoryBalance", back_populates="location"
    )


class InventoryBalance(Base):
    __tablename__ = "inventory_balances"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), nullable=False)
    warehouse_id: Mapped[int] = mapped_column(ForeignKey("warehouses.id"), nullable=False)
    location_id: Mapped[int | None] = mapped_column(ForeignKey("warehouse_locations.id"), nullable=True)
    quantity: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    reserved_quantity: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    min_threshold: Mapped[int] = mapped_column(Integer, default=10, nullable=False)
    last_updated: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    product: Mapped["Product"] = relationship("Product", back_populates="inventory_balances")
    warehouse: Mapped["Warehouse"] = relationship("Warehouse", back_populates="inventory_balances")
    location: Mapped["WarehouseLocation | None"] = relationship(
        "WarehouseLocation", back_populates="inventory_balances"
    )

    @property
    def available_quantity(self) -> int:
        return max(0, self.quantity - self.reserved_quantity)


class WarehouseTransfer(Base):
    __tablename__ = "warehouse_transfers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    from_warehouse_id: Mapped[int] = mapped_column(ForeignKey("warehouses.id"), nullable=False)
    to_warehouse_id: Mapped[int] = mapped_column(ForeignKey("warehouses.id"), nullable=False)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[TransferStatus] = mapped_column(
        pg_enum(TransferStatus), default=TransferStatus.PENDING, nullable=False
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    from_warehouse: Mapped["Warehouse"] = relationship("Warehouse", foreign_keys=[from_warehouse_id])
    to_warehouse: Mapped["Warehouse"] = relationship("Warehouse", foreign_keys=[to_warehouse_id])
    product: Mapped["Product"] = relationship("Product")
