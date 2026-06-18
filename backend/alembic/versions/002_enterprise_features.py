"""enterprise features migration

Revision ID: 002
Revises: 001
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy import inspect, text
from sqlalchemy.dialects.postgresql import ENUM, JSONB

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _table_exists(name: str) -> bool:
    return name in inspect(op.get_bind()).get_table_names()


def _column_exists(table: str, column: str) -> bool:
    return column in {c["name"] for c in inspect(op.get_bind()).get_columns(table)}


def _create_enum(name: str, values: tuple[str, ...]) -> None:
    vals = ", ".join(f"'{v}'" for v in values)
    op.execute(
        f"""
        DO $$ BEGIN
            CREATE TYPE {name} AS ENUM ({vals});
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END $$;
        """
    )


def _enum(name: str, *values: str) -> ENUM:
    return ENUM(*values, name=name, create_type=False)


def upgrade() -> None:
    for val in ("super_admin", "inventory_manager", "warehouse_staff", "sales_executive", "accountant"):
        op.execute(f"ALTER TYPE userrole ADD VALUE IF NOT EXISTS '{val}'")

    if not _column_exists("users", "full_name"):
        op.add_column("users", sa.Column("full_name", sa.String(200), nullable=True))
    if not _column_exists("users", "google_id"):
        op.add_column("users", sa.Column("google_id", sa.String(255), nullable=True))
    if not _column_exists("users", "is_active"):
        op.add_column("users", sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False))
    op.execute("CREATE UNIQUE INDEX IF NOT EXISTS ix_users_google_id ON users (google_id) WHERE google_id IS NOT NULL")

    if not _column_exists("categories", "parent_id"):
        op.add_column("categories", sa.Column("parent_id", sa.Integer(), nullable=True))
        op.create_foreign_key("fk_categories_parent", "categories", "categories", ["parent_id"], ["id"])

    for col, coltype in [
        ("cost_price", sa.Numeric(10, 2)),
        ("barcode", sa.String(100)),
        ("qr_code", sa.String(500)),
        ("weight", sa.Numeric(10, 3)),
    ]:
        if not _column_exists("products", col):
            op.add_column("products", sa.Column(col, coltype, nullable=True))
    op.execute("CREATE UNIQUE INDEX IF NOT EXISTS ix_products_barcode ON products (barcode) WHERE barcode IS NOT NULL")

    _create_enum("purchasestatus", ("draft", "pending_approval", "approved", "partially_received", "received", "cancelled"))
    _create_enum("salesstatus", ("draft", "confirmed", "fulfilled", "shipped", "delivered", "cancelled", "returned"))
    _create_enum("stockmovementtype", ("adjustment", "purchase_receipt", "sale_fulfillment", "return_in", "return_out", "damage", "transfer_in", "transfer_out", "audit_variance"))
    _create_enum("auditstatus", ("draft", "in_progress", "completed", "cancelled"))
    _create_enum("transferstatus", ("pending", "in_transit", "completed", "cancelled"))
    _create_enum("serialstatus", ("available", "reserved", "sold", "damaged"))
    _create_enum("invoicestatus", ("draft", "issued", "paid", "overdue", "cancelled"))
    _create_enum("notificationchannel", ("in_app", "email"))
    _create_enum("notificationstatus", ("pending", "sent", "failed"))

    for val in ("near_expiry", "critical_stock", "reorder"):
        op.execute(f"ALTER TYPE alerttype ADD VALUE IF NOT EXISTS '{val}'")

    if not _table_exists("warehouses"):
        op.create_table(
            "warehouses",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("name", sa.String(100), nullable=False),
            sa.Column("code", sa.String(20), unique=True, nullable=False),
            sa.Column("address", sa.Text(), nullable=True),
            sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()"), nullable=False),
        )

    if not _table_exists("warehouse_locations"):
        op.create_table(
            "warehouse_locations",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("warehouse_id", sa.Integer(), sa.ForeignKey("warehouses.id"), nullable=False),
            sa.Column("rack", sa.String(50), nullable=True),
            sa.Column("shelf", sa.String(50), nullable=True),
            sa.Column("bin", sa.String(50), nullable=True),
            sa.Column("label", sa.String(100), nullable=False),
        )

    if not _table_exists("inventory_balances"):
        op.create_table(
            "inventory_balances",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("product_id", sa.Integer(), sa.ForeignKey("products.id"), nullable=False),
            sa.Column("warehouse_id", sa.Integer(), sa.ForeignKey("warehouses.id"), nullable=False),
            sa.Column("location_id", sa.Integer(), sa.ForeignKey("warehouse_locations.id"), nullable=True),
            sa.Column("quantity", sa.Integer(), server_default="0", nullable=False),
            sa.Column("reserved_quantity", sa.Integer(), server_default="0", nullable=False),
            sa.Column("min_threshold", sa.Integer(), server_default="10", nullable=False),
            sa.Column("last_updated", sa.DateTime(timezone=True), server_default=sa.text("NOW()"), nullable=False),
        )

    if not _table_exists("suppliers"):
        op.create_table(
            "suppliers",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("name", sa.String(200), nullable=False),
            sa.Column("contact_name", sa.String(200), nullable=True),
            sa.Column("email", sa.String(255), nullable=True),
            sa.Column("phone", sa.String(50), nullable=True),
            sa.Column("address", sa.Text(), nullable=True),
            sa.Column("payment_terms", sa.String(100), nullable=True),
            sa.Column("rating", sa.Numeric(3, 2), nullable=True),
            sa.Column("notes", sa.Text(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()"), nullable=False),
        )

    if not _table_exists("customers"):
        op.create_table(
            "customers",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("name", sa.String(200), nullable=False),
            sa.Column("email", sa.String(255), nullable=True),
            sa.Column("phone", sa.String(50), nullable=True),
            sa.Column("address", sa.Text(), nullable=True),
            sa.Column("notes", sa.Text(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()"), nullable=False),
        )

    if not _table_exists("product_variants"):
        op.create_table(
            "product_variants",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("product_id", sa.Integer(), sa.ForeignKey("products.id"), nullable=False),
            sa.Column("sku", sa.String(50), unique=True, nullable=False),
            sa.Column("attributes", JSONB(), nullable=True),
            sa.Column("price", sa.Numeric(10, 2), nullable=True),
            sa.Column("barcode", sa.String(100), unique=True, nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()"), nullable=False),
        )

    if not _table_exists("purchase_orders"):
        op.create_table(
            "purchase_orders",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("supplier_id", sa.Integer(), sa.ForeignKey("suppliers.id"), nullable=False),
            sa.Column("warehouse_id", sa.Integer(), sa.ForeignKey("warehouses.id"), nullable=True),
            sa.Column("status", _enum("purchasestatus", "draft", "pending_approval", "approved", "partially_received", "received", "cancelled"), nullable=False),
            sa.Column("notes", sa.Text(), nullable=True),
            sa.Column("approved_by", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
            sa.Column("created_by", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()"), nullable=False),
            sa.Column("approved_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("received_at", sa.DateTime(timezone=True), nullable=True),
        )

    if not _table_exists("purchase_order_lines"):
        op.create_table(
            "purchase_order_lines",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("purchase_order_id", sa.Integer(), sa.ForeignKey("purchase_orders.id"), nullable=False),
            sa.Column("product_id", sa.Integer(), sa.ForeignKey("products.id"), nullable=False),
            sa.Column("quantity", sa.Integer(), nullable=False),
            sa.Column("received_quantity", sa.Integer(), server_default="0", nullable=False),
            sa.Column("unit_price", sa.Numeric(10, 2), nullable=False),
        )

    if not _table_exists("sales_orders"):
        op.create_table(
            "sales_orders",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("customer_id", sa.Integer(), sa.ForeignKey("customers.id"), nullable=False),
            sa.Column("warehouse_id", sa.Integer(), sa.ForeignKey("warehouses.id"), nullable=True),
            sa.Column("status", _enum("salesstatus", "draft", "confirmed", "fulfilled", "shipped", "delivered", "cancelled", "returned"), nullable=False),
            sa.Column("notes", sa.Text(), nullable=True),
            sa.Column("created_by", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()"), nullable=False),
            sa.Column("fulfilled_at", sa.DateTime(timezone=True), nullable=True),
        )

    if not _table_exists("sales_order_lines"):
        op.create_table(
            "sales_order_lines",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("sales_order_id", sa.Integer(), sa.ForeignKey("sales_orders.id"), nullable=False),
            sa.Column("product_id", sa.Integer(), sa.ForeignKey("products.id"), nullable=False),
            sa.Column("quantity", sa.Integer(), nullable=False),
            sa.Column("fulfilled_quantity", sa.Integer(), server_default="0", nullable=False),
            sa.Column("unit_price", sa.Numeric(10, 2), nullable=False),
        )

    if not _table_exists("batches"):
        op.create_table(
            "batches",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("product_id", sa.Integer(), sa.ForeignKey("products.id"), nullable=False),
            sa.Column("lot_number", sa.String(100), nullable=False),
            sa.Column("quantity", sa.Integer(), server_default="0", nullable=False),
            sa.Column("expiry_date", sa.Date(), nullable=True),
            sa.Column("manufacturing_date", sa.Date(), nullable=True),
            sa.Column("warehouse_id", sa.Integer(), sa.ForeignKey("warehouses.id"), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()"), nullable=False),
        )

    if not _table_exists("serial_numbers"):
        op.create_table(
            "serial_numbers",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("product_id", sa.Integer(), sa.ForeignKey("products.id"), nullable=False),
            sa.Column("serial", sa.String(100), unique=True, nullable=False),
            sa.Column("status", _enum("serialstatus", "available", "reserved", "sold", "damaged"), nullable=False),
            sa.Column("batch_id", sa.Integer(), sa.ForeignKey("batches.id"), nullable=True),
            sa.Column("warehouse_id", sa.Integer(), sa.ForeignKey("warehouses.id"), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()"), nullable=False),
        )

    if not _table_exists("stock_movements"):
        op.create_table(
            "stock_movements",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("product_id", sa.Integer(), sa.ForeignKey("products.id"), nullable=False),
            sa.Column("warehouse_id", sa.Integer(), sa.ForeignKey("warehouses.id"), nullable=False),
            sa.Column("quantity_delta", sa.Integer(), nullable=False),
            sa.Column("movement_type", _enum("stockmovementtype", "adjustment", "purchase_receipt", "sale_fulfillment", "return_in", "return_out", "damage", "transfer_in", "transfer_out", "audit_variance"), nullable=False),
            sa.Column("reference_type", sa.String(50), nullable=True),
            sa.Column("reference_id", sa.Integer(), nullable=True),
            sa.Column("reason", sa.Text(), nullable=True),
            sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
            sa.Column("batch_id", sa.Integer(), sa.ForeignKey("batches.id"), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()"), nullable=False),
        )

    if not _table_exists("warehouse_transfers"):
        op.create_table(
            "warehouse_transfers",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("from_warehouse_id", sa.Integer(), sa.ForeignKey("warehouses.id"), nullable=False),
            sa.Column("to_warehouse_id", sa.Integer(), sa.ForeignKey("warehouses.id"), nullable=False),
            sa.Column("product_id", sa.Integer(), sa.ForeignKey("products.id"), nullable=False),
            sa.Column("quantity", sa.Integer(), nullable=False),
            sa.Column("status", _enum("transferstatus", "pending", "in_transit", "completed", "cancelled"), nullable=False),
            sa.Column("notes", sa.Text(), nullable=True),
            sa.Column("created_by", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()"), nullable=False),
            sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        )

    if not _table_exists("inventory_audits"):
        op.create_table(
            "inventory_audits",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("warehouse_id", sa.Integer(), sa.ForeignKey("warehouses.id"), nullable=False),
            sa.Column("status", _enum("auditstatus", "draft", "in_progress", "completed", "cancelled"), nullable=False),
            sa.Column("notes", sa.Text(), nullable=True),
            sa.Column("created_by", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()"), nullable=False),
            sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        )

    if not _table_exists("inventory_audit_lines"):
        op.create_table(
            "inventory_audit_lines",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("audit_id", sa.Integer(), sa.ForeignKey("inventory_audits.id"), nullable=False),
            sa.Column("product_id", sa.Integer(), sa.ForeignKey("products.id"), nullable=False),
            sa.Column("expected_quantity", sa.Integer(), nullable=False),
            sa.Column("counted_quantity", sa.Integer(), nullable=True),
            sa.Column("variance", sa.Integer(), nullable=True),
            sa.Column("notes", sa.String(500), nullable=True),
        )

    if not _table_exists("activity_logs"):
        op.create_table(
            "activity_logs",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
            sa.Column("action", sa.String(100), nullable=False),
            sa.Column("entity_type", sa.String(50), nullable=False),
            sa.Column("entity_id", sa.Integer(), nullable=True),
            sa.Column("details", sa.Text(), nullable=True),
            sa.Column("ip_address", sa.String(45), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()"), nullable=False),
        )

    if not _table_exists("login_history"):
        op.create_table(
            "login_history",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
            sa.Column("ip_address", sa.String(45), nullable=True),
            sa.Column("user_agent", sa.String(500), nullable=True),
            sa.Column("success", sa.Boolean(), server_default="true", nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()"), nullable=False),
        )

    if not _table_exists("notification_deliveries"):
        op.create_table(
            "notification_deliveries",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("alert_id", sa.Integer(), sa.ForeignKey("alerts.id"), nullable=True),
            sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
            sa.Column("channel", _enum("notificationchannel", "in_app", "email"), nullable=False),
            sa.Column("status", _enum("notificationstatus", "pending", "sent", "failed"), nullable=False),
            sa.Column("recipient", sa.String(255), nullable=False),
            sa.Column("subject", sa.String(255), nullable=True),
            sa.Column("error_message", sa.Text(), nullable=True),
            sa.Column("sent_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()"), nullable=False),
        )

    if not _table_exists("vendor_invoices"):
        op.create_table(
            "vendor_invoices",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("purchase_order_id", sa.Integer(), sa.ForeignKey("purchase_orders.id"), nullable=True),
            sa.Column("supplier_id", sa.Integer(), sa.ForeignKey("suppliers.id"), nullable=False),
            sa.Column("invoice_number", sa.String(100), nullable=False),
            sa.Column("amount", sa.Numeric(12, 2), nullable=False),
            sa.Column("status", _enum("invoicestatus", "draft", "issued", "paid", "overdue", "cancelled"), nullable=False),
            sa.Column("due_date", sa.DateTime(timezone=True), nullable=True),
            sa.Column("file_url", sa.String(500), nullable=True),
            sa.Column("ocr_data", sa.Text(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()"), nullable=False),
        )

    if not _table_exists("customer_invoices"):
        op.create_table(
            "customer_invoices",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("sales_order_id", sa.Integer(), sa.ForeignKey("sales_orders.id"), nullable=True),
            sa.Column("customer_id", sa.Integer(), sa.ForeignKey("customers.id"), nullable=False),
            sa.Column("invoice_number", sa.String(100), nullable=False),
            sa.Column("amount", sa.Numeric(12, 2), nullable=False),
            sa.Column("status", _enum("invoicestatus", "draft", "issued", "paid", "overdue", "cancelled"), nullable=False),
            sa.Column("due_date", sa.DateTime(timezone=True), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()"), nullable=False),
        )

    if not _table_exists("supplier_payments"):
        op.create_table(
            "supplier_payments",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("supplier_id", sa.Integer(), sa.ForeignKey("suppliers.id"), nullable=False),
            sa.Column("amount", sa.Numeric(12, 2), nullable=False),
            sa.Column("reference", sa.String(100), nullable=True),
            sa.Column("notes", sa.Text(), nullable=True),
            sa.Column("paid_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()"), nullable=False),
        )

    op.execute(
        """
        INSERT INTO warehouses (name, code, address, is_active, created_at)
        SELECT 'Main Warehouse', 'MAIN', 'Default location', true, NOW()
        WHERE NOT EXISTS (SELECT 1 FROM warehouses WHERE code = 'MAIN')
        """
    )
    op.execute(
        """
        INSERT INTO inventory_balances (product_id, warehouse_id, quantity, reserved_quantity, min_threshold, last_updated)
        SELECT i.product_id, w.id, i.quantity, 0, i.min_threshold, i.last_updated
        FROM inventory i
        CROSS JOIN warehouses w
        WHERE w.code = 'MAIN'
        AND NOT EXISTS (
            SELECT 1 FROM inventory_balances ib
            WHERE ib.product_id = i.product_id AND ib.warehouse_id = w.id
        )
        """
    )


def downgrade() -> None:
    for table in [
        "supplier_payments", "customer_invoices", "vendor_invoices", "notification_deliveries",
        "login_history", "activity_logs", "inventory_audit_lines", "inventory_audits",
        "warehouse_transfers", "stock_movements", "serial_numbers", "batches",
        "sales_order_lines", "sales_orders", "purchase_order_lines", "purchase_orders",
        "product_variants", "customers", "suppliers", "inventory_balances",
        "warehouse_locations", "warehouses",
    ]:
        if _table_exists(table):
            op.drop_table(table)

    op.execute("DROP INDEX IF EXISTS ix_products_barcode")
    for col in ("weight", "qr_code", "barcode", "cost_price"):
        if _column_exists("products", col):
            op.drop_column("products", col)

    if _column_exists("categories", "parent_id"):
        op.drop_constraint("fk_categories_parent", "categories", type_="foreignkey")
        op.drop_column("categories", "parent_id")

    op.execute("DROP INDEX IF EXISTS ix_users_google_id")
    for col in ("is_active", "google_id", "full_name"):
        if _column_exists("users", col):
            op.drop_column("users", col)

    for t in [
        "notificationstatus", "notificationchannel", "invoicestatus", "serialstatus",
        "transferstatus", "auditstatus", "stockmovementtype", "salesstatus", "purchasestatus",
    ]:
        op.execute(f"DROP TYPE IF EXISTS {t}")
