from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.base import pg_enum, utcnow
from app.models.enums import SerialStatus


class Batch(Base):
    __tablename__ = "batches"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), nullable=False)
    lot_number: Mapped[str] = mapped_column(String(100), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    expiry_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    manufacturing_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    warehouse_id: Mapped[int | None] = mapped_column(ForeignKey("warehouses.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    product: Mapped["Product"] = relationship("Product", back_populates="batches")
    warehouse: Mapped["Warehouse | None"] = relationship("Warehouse")


class SerialNumber(Base):
    __tablename__ = "serial_numbers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), nullable=False)
    serial: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    status: Mapped[SerialStatus] = mapped_column(
        pg_enum(SerialStatus), default=SerialStatus.AVAILABLE, nullable=False
    )
    batch_id: Mapped[int | None] = mapped_column(ForeignKey("batches.id"), nullable=True)
    warehouse_id: Mapped[int | None] = mapped_column(ForeignKey("warehouses.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    product: Mapped["Product"] = relationship("Product", back_populates="serial_numbers")
    batch: Mapped["Batch | None"] = relationship("Batch")
    warehouse: Mapped["Warehouse | None"] = relationship("Warehouse")
