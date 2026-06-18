from decimal import Decimal

from pydantic import BaseModel


class ReportSummary(BaseModel):
    total_products: int
    total_stock_value: Decimal
    pending_orders: int
    received_orders: int
    cancelled_orders: int
    low_stock_count: int
    top_products_by_stock: list[dict]
    pending_purchase_orders: int = 0
    pending_sales_orders: int = 0
    total_warehouses: int = 0
    inventory_turnover_ratio: float = 0.0
