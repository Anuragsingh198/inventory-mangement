"""Seed database with comprehensive demo data for all tables."""

import random
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal

from app.core.security import get_password_hash
from app.database import SessionLocal
from app.models import (
    ActivityLog,
    AuditStatus,
    Batch,
    Category,
    Customer,
    CustomerInvoice,
    Inventory,
    InventoryAudit,
    InventoryAuditLine,
    InventoryBalance,
    InvoiceStatus,
    LoginHistory,
    NotificationChannel,
    NotificationDelivery,
    NotificationStatus,
    Order,
    OrderItem,
    OrderStatus,
    Product,
    ProductVariant,
    PurchaseOrder,
    PurchaseOrderLine,
    PurchaseOrderStatus,
    SalesOrder,
    SalesOrderLine,
    SalesOrderStatus,
    SalesChannel,
    ProductChannelListing,
    SerialNumber,
    SerialStatus,
    StockMovement,
    StockMovementType,
    Supplier,
    SupplierPayment,
    TransferStatus,
    User,
    UserRole,
    VendorInvoice,
    Warehouse,
    WarehouseLocation,
    WarehouseTransfer,
)
from app.services.alert_service import check_and_create_stock_alert
from app.services.product_service import generate_barcode, generate_sku
from app.services.stock_movement_service import get_or_create_default_warehouse, get_or_create_balance

CATEGORIES = [
    ("Electronics", "Electronic devices and accessories"),
    ("Office Supplies", "Stationery and office essentials"),
    ("Furniture", "Office and warehouse furniture"),
    ("Packaging", "Boxes, labels, and packing materials"),
    ("Tools", "Hand tools and equipment"),
]

SUBCATEGORIES = [
    ("Computer Accessories", 0),
    ("Writing Tools", 1),
    ("Desks & Chairs", 2),
]

PRODUCTS = [
    ("Wireless Mouse", "ELC-001", 0, 29.99, "Ergonomic wireless mouse"),
    ("USB-C Hub", "ELC-002", 0, 49.99, "7-in-1 USB-C hub"),
    ("Monitor Stand", "ELC-003", 0, 39.99, "Adjustable monitor stand"),
    ("Bluetooth Keyboard", "ELC-004", 0, 59.99, "Compact bluetooth keyboard"),
    ("A4 Paper Ream", "OFF-001", 1, 8.99, "500 sheets premium A4 paper"),
    ("Ballpoint Pens (12pk)", "OFF-002", 1, 4.99, "Blue ink ballpoint pens"),
    ("Sticky Notes", "OFF-003", 1, 3.49, "Assorted color sticky notes"),
    ("Desk Organizer", "OFF-004", 1, 14.99, "Multi-compartment desk organizer"),
    ("Office Chair", "FUR-001", 2, 249.99, "Ergonomic office chair"),
    ("Standing Desk", "FUR-002", 2, 399.99, "Electric height-adjustable desk"),
    ("Filing Cabinet", "FUR-003", 2, 179.99, "4-drawer metal filing cabinet"),
    ("Bookshelf", "FUR-004", 2, 129.99, "5-tier wooden bookshelf"),
    ("Shipping Boxes (25pk)", "PKG-001", 3, 24.99, "Medium corrugated boxes"),
    ("Packing Tape", "PKG-002", 3, 6.99, "Clear packing tape roll"),
    ("Bubble Wrap Roll", "PKG-003", 3, 12.99, "12-inch bubble wrap"),
    ("Shipping Labels", "PKG-004", 3, 9.99, "500 thermal shipping labels"),
    ("Screwdriver Set", "TOL-001", 4, 19.99, "10-piece precision screwdriver set"),
    ("Utility Knife", "TOL-002", 4, 7.99, "Retractable utility knife"),
    ("Measuring Tape", "TOL-003", 4, 11.99, "25ft measuring tape"),
    ("Work Gloves (5pk)", "TOL-004", 4, 15.99, "Cut-resistant work gloves"),
]

LOCATIONS = ["Warehouse A", "Warehouse B", "Shelf 1", "Shelf 2", "Shelf 3"]
NOW = lambda: datetime.now(timezone.utc)


DEMO_USERS = [
    ("admin@inventory.com", "admin123", UserRole.SUPER_ADMIN, "Super Admin"),
    ("manager@inventory.com", "manager123", UserRole.INVENTORY_MANAGER, "Inventory Manager"),
    ("warehouse@inventory.com", "warehouse123", UserRole.WAREHOUSE_STAFF, "Warehouse Staff"),
    ("sales@inventory.com", "sales123", UserRole.SALES_EXECUTIVE, "Sales Executive"),
    ("viewer@inventory.com", "viewer123", UserRole.VIEWER, "Viewer"),
]


def _seed_users(db):
    created = 0
    updated = 0
    for email, password, role, full_name in DEMO_USERS:
        existing = db.query(User).filter(User.email == email).first()
        if existing:
            existing.hashed_password = get_password_hash(password)
            existing.role = role
            existing.full_name = full_name
            existing.is_active = True
            updated += 1
            continue
        db.add(User(
            email=email,
            hashed_password=get_password_hash(password),
            role=role,
            full_name=full_name,
            is_active=True,
        ))
        created += 1
    if created:
        print(f"Created {created} demo user(s)")
    if updated:
        print(f"Reset {updated} demo user password(s)")
    db.flush()
    admin = db.query(User).filter(User.email == "admin@inventory.com").first()
    return admin or db.query(User).first()


def _seed_warehouses(db):
    main = get_or_create_default_warehouse(db)
    warehouses = [main]
    if db.query(Warehouse).filter(Warehouse.code == "EAST").count() == 0:
        east = Warehouse(name="East Distribution", code="EAST", address="456 East Blvd, NY", is_active=True)
        db.add(east)
        db.flush()
        warehouses.append(east)
    if db.query(Warehouse).filter(Warehouse.code == "WEST").count() == 0:
        west = Warehouse(name="West Fulfillment", code="WEST", address="789 West Ave, CA", is_active=True)
        db.add(west)
        db.flush()
        warehouses.append(west)

    if db.query(WarehouseLocation).count() == 0:
        for wh in warehouses:
            for i in range(1, 4):
                db.add(WarehouseLocation(warehouse_id=wh.id, rack=f"R{i}", shelf="A", bin="01", label=f"{wh.code}-R{i}-A-01"))
        print("Created warehouse locations")
    return main, warehouses


def _seed_categories(db):
    if db.query(Category).count() == 0:
        cats = [Category(name=n, description=d) for n, d in CATEGORIES]
        db.add_all(cats)
        db.flush()
        print(f"Created {len(cats)} categories")
    cats = db.query(Category).order_by(Category.id).all()
    if db.query(Category).filter(Category.parent_id.isnot(None)).count() == 0:
        for name, idx in SUBCATEGORIES:
            if idx < len(cats):
                db.add(Category(name=name, description=f"Subcategory of {cats[idx].name}", parent_id=cats[idx].id))
        db.flush()
        print("Created subcategories")
    return db.query(Category).filter(Category.parent_id.is_(None)).order_by(Category.id).all()


def _seed_products(db, categories):
    if db.query(Product).count() > 0:
        return db.query(Product).all()
    products = []
    for name, sku, cat_idx, price, desc in PRODUCTS:
        p = Product(
            name=name, sku=sku, category_id=categories[cat_idx].id,
            price=Decimal(str(price)), cost_price=Decimal(str(round(price * 0.7, 2))),
            description=desc, weight=Decimal(str(round(random.uniform(0.1, 5.0), 2))),
        )
        products.append(p)
    db.add_all(products)
    db.flush()
    for p in products:
        p.barcode = generate_barcode(db, p.id)
        p.qr_code = f"https://ventorio.app/p/{p.id}"
    print(f"Created {len(products)} products")
    return products


def _seed_variants(db, products):
    if db.query(ProductVariant).count() > 0:
        return
    for p in products[:4]:
        db.add(ProductVariant(
            product_id=p.id,
            sku=generate_sku(db, prefix="VAR"),
            attributes={"color": random.choice(["Black", "White", "Blue"]), "size": random.choice(["S", "M", "L"])},
            price=p.price,
        ))
    print("Created product variants")


def _seed_inventory(db, products, main_wh, warehouses):
    if db.query(Inventory).count() == 0:
        items = []
        for product in products:
            qty = random.randint(0, 150)
            threshold = random.randint(10, 30)
            items.append(Inventory(product_id=product.id, quantity=qty, min_threshold=threshold, location=random.choice(LOCATIONS)))
        db.add_all(items)
        db.flush()
        for item in items:
            item.product = db.query(Product).filter(Product.id == item.product_id).first()
            check_and_create_stock_alert(db, item)
        print(f"Created {len(items)} inventory records")

    if db.query(InventoryBalance).count() == 0:
        for product in products:
            inv = db.query(Inventory).filter(Inventory.product_id == product.id).first()
            qty = inv.quantity if inv else random.randint(20, 100)
            bal = get_or_create_balance(db, product.id, main_wh.id)
            bal.quantity = qty
            if len(warehouses) > 1:
                east = next((w for w in warehouses if w.code == "EAST"), None)
                if east:
                    eb = get_or_create_balance(db, product.id, east.id)
                    eb.quantity = random.randint(0, 40)
        print("Created inventory balances")

    if db.query(StockMovement).count() == 0:
        admin = db.query(User).first()
        for product in products[:8]:
            db.add(StockMovement(
                product_id=product.id, warehouse_id=main_wh.id, quantity_delta=random.randint(10, 50),
                movement_type=StockMovementType.ADJUSTMENT, reason="Initial seed stock",
                user_id=admin.id if admin else None, created_at=NOW(),
            ))
        print("Created stock movements")


def _seed_suppliers(db):
    if db.query(Supplier).count() > 0:
        return db.query(Supplier).all()
    suppliers = [
        Supplier(name="Acme Corp", contact_name="John Doe", email="john@acme.com", phone="+1-555-0100", payment_terms="Net 30", rating=Decimal("4.50")),
        Supplier(name="Global Supplies", contact_name="Jane Smith", email="jane@global.com", phone="+1-555-0200", payment_terms="Net 45", rating=Decimal("4.20")),
        Supplier(name="TechParts Inc", contact_name="Mike Chen", email="mike@techparts.com", phone="+1-555-0300", payment_terms="Net 15", rating=Decimal("4.80")),
        Supplier(name="OfficeMax Wholesale", contact_name="Sarah Lee", email="sarah@officemax.com", payment_terms="Net 30", rating=Decimal("3.90")),
    ]
    db.add_all(suppliers)
    db.flush()
    print("Created suppliers")
    return suppliers


def _seed_supplier_payments(db, suppliers):
    if db.query(SupplierPayment).count() > 0:
        return
    for s in suppliers[:2]:
        db.add(SupplierPayment(supplier_id=s.id, amount=Decimal(str(random.randint(500, 5000))), reference=f"PAY-{s.id:04d}", paid_at=NOW()))
        db.add(SupplierPayment(supplier_id=s.id, amount=Decimal(str(random.randint(200, 2000))), reference=f"PAY-{s.id:04d}B", paid_at=None))
    print("Created supplier payments")


def _seed_customers(db):
    if db.query(Customer).count() > 0:
        return db.query(Customer).all()
    customers = [
        Customer(name="Retail Co", email="orders@retail.com", phone="+1-555-1001", address="100 Main St"),
        Customer(name="Office Depot Plus", email="buyer@odplus.com", phone="+1-555-1002", address="200 Commerce Dr"),
        Customer(name="TechStart LLC", email="procurement@techstart.io", phone="+1-555-1003"),
        Customer(name="Global Retailers", email="supply@globalretail.com"),
    ]
    db.add_all(customers)
    db.flush()
    print("Created customers")
    return customers


def _seed_legacy_orders(db, products):
    if db.query(Order).count() > 0:
        return
    names = ["Acme Corp", "Global Supplies", "TechParts Inc", "OfficeMax Wholesale"]
    for i in range(5):
        order = Order(supplier=names[i % len(names)], status=OrderStatus.PENDING if i < 2 else OrderStatus.RECEIVED, notes=f"Legacy order #{i + 1}")
        db.add(order)
        db.flush()
        for product in random.sample(products, k=min(3, len(products))):
            db.add(OrderItem(order_id=order.id, product_id=product.id, quantity=random.randint(5, 50), unit_price=product.price))
    print("Created legacy orders")


def _seed_purchase_orders(db, suppliers, products, main_wh, admin):
    if db.query(PurchaseOrder).count() > 0:
        _refresh_demo_purchase_orders(db, suppliers, products, main_wh, admin)
        return
    statuses = [
        PurchaseOrderStatus.PENDING_APPROVAL,
        PurchaseOrderStatus.APPROVED,
        PurchaseOrderStatus.RECEIVED,
        PurchaseOrderStatus.DRAFT,
        PurchaseOrderStatus.PARTIALLY_RECEIVED,
    ]
    for i, status in enumerate(statuses):
        supplier = suppliers[i % len(suppliers)]
        po = PurchaseOrder(
            supplier_id=supplier.id, warehouse_id=main_wh.id, status=status,
            notes=f"Purchase order #{i + 1}", created_by=admin.id if admin else None,
            approved_at=NOW() if status != PurchaseOrderStatus.PENDING_APPROVAL else None,
            received_at=NOW() if status == PurchaseOrderStatus.RECEIVED else None,
        )
        db.add(po)
        db.flush()
        selected = random.sample(products, k=min(3, len(products)))
        for p in selected:
            qty = random.randint(10, 40)
            received = qty if status == PurchaseOrderStatus.RECEIVED else (qty // 2 if status == PurchaseOrderStatus.PARTIALLY_RECEIVED else 0)
            db.add(PurchaseOrderLine(purchase_order_id=po.id, product_id=p.id, quantity=qty, received_quantity=received, unit_price=p.cost_price or p.price))
    print("Created purchase orders")


def _refresh_demo_purchase_orders(db, suppliers, products, main_wh, admin):
    """Keep at least one approvable and one receivable PO for demo workflows."""
    target_states = [
        PurchaseOrderStatus.PENDING_APPROVAL,
        PurchaseOrderStatus.APPROVED,
        PurchaseOrderStatus.PARTIALLY_RECEIVED,
    ]
    pos = db.query(PurchaseOrder).order_by(PurchaseOrder.id).all()
    for i, status in enumerate(target_states):
        if i >= len(pos):
            break
        po = pos[i]
        po.status = status
        po.warehouse_id = main_wh.id
        po.approved_at = NOW() if status != PurchaseOrderStatus.PENDING_APPROVAL else None
        po.received_at = None
        for line in po.items:
            if status == PurchaseOrderStatus.PARTIALLY_RECEIVED:
                line.received_quantity = max(0, line.quantity // 2)
            else:
                line.received_quantity = 0
    print("Refreshed demo purchase order statuses")


def _seed_vendor_invoices(db, suppliers):
    if db.query(VendorInvoice).count() > 0:
        return
    pos = db.query(PurchaseOrder).limit(3).all()
    for i, po in enumerate(pos):
        db.add(VendorInvoice(
            purchase_order_id=po.id, supplier_id=po.supplier_id,
            invoice_number=f"VI-{po.id:05d}", amount=Decimal(str(random.randint(500, 3000))),
            status=random.choice([InvoiceStatus.ISSUED, InvoiceStatus.PAID, InvoiceStatus.DRAFT]),
            due_date=NOW() + timedelta(days=30),
        ))
    db.add(VendorInvoice(supplier_id=suppliers[0].id, invoice_number="VI-STANDALONE-001", amount=Decimal("1250.00"), status=InvoiceStatus.OVERDUE))
    print("Created vendor invoices")


def _seed_sales_orders(db, customers, products, main_wh, admin):
    if db.query(SalesOrder).count() > 0:
        _refresh_demo_sales_orders(db, main_wh)
        return
    statuses = [SalesOrderStatus.CONFIRMED, SalesOrderStatus.FULFILLED, SalesOrderStatus.DRAFT, SalesOrderStatus.SHIPPED, SalesOrderStatus.DELIVERED]
    for i, status in enumerate(statuses):
        customer = customers[i % len(customers)]
        so = SalesOrder(
            customer_id=customer.id, warehouse_id=main_wh.id, status=status,
            notes=f"Sales order #{i + 1}", created_by=admin.id if admin else None,
            fulfilled_at=NOW() if status in (SalesOrderStatus.FULFILLED, SalesOrderStatus.SHIPPED, SalesOrderStatus.DELIVERED) else None,
        )
        db.add(so)
        db.flush()
        for p in random.sample(products, k=min(2, len(products))):
            qty = random.randint(2, 15)
            fulfilled = qty if status != SalesOrderStatus.DRAFT else 0
            db.add(SalesOrderLine(sales_order_id=so.id, product_id=p.id, quantity=qty, fulfilled_quantity=fulfilled, unit_price=p.price))
    print("Created sales orders")


def _refresh_demo_sales_orders(db, main_wh):
    """Ensure at least one confirmed sales order is available to fulfill in demos."""
    so = db.query(SalesOrder).order_by(SalesOrder.id).first()
    if not so:
        return
    so.status = SalesOrderStatus.CONFIRMED
    so.warehouse_id = main_wh.id
    so.fulfilled_at = None
    for line in so.items:
        line.fulfilled_quantity = 0
    print("Refreshed demo sales order statuses")


def _seed_customer_invoices(db, customers):
    if db.query(CustomerInvoice).count() > 0:
        return
    orders = db.query(SalesOrder).limit(3).all()
    for so in orders:
        total = sum(float(l.quantity) * float(l.unit_price) for l in so.items) if so.items else random.randint(100, 500)
        db.add(CustomerInvoice(
            sales_order_id=so.id, customer_id=so.customer_id,
            invoice_number=f"CI-{so.id:05d}", amount=Decimal(str(round(total, 2))),
            status=InvoiceStatus.ISSUED if so.status != SalesOrderStatus.DRAFT else InvoiceStatus.DRAFT,
        ))
    print("Created customer invoices")


def _seed_batches(db, products, main_wh):
    if db.query(Batch).count() > 0:
        return
    for p in products[:6]:
        db.add(Batch(
            product_id=p.id, lot_number=f"LOT-{p.sku}-{random.randint(1000, 9999)}",
            quantity=random.randint(20, 100),
            expiry_date=date.today() + timedelta(days=random.randint(30, 365)),
            manufacturing_date=date.today() - timedelta(days=random.randint(10, 60)),
            warehouse_id=main_wh.id,
        ))
    db.add(Batch(product_id=products[0].id, lot_number="LOT-EXPIRING-SOON", quantity=15, expiry_date=date.today() + timedelta(days=14), warehouse_id=main_wh.id))
    print("Created batches")


def _seed_serials(db, products, main_wh):
    if db.query(SerialNumber).count() > 0:
        return
    batch = db.query(Batch).first()
    for i, p in enumerate(products[:5]):
        db.add(SerialNumber(
            product_id=p.id, serial=f"SN-{p.sku}-{1000 + i}",
            status=random.choice([SerialStatus.AVAILABLE, SerialStatus.RESERVED, SerialStatus.SOLD]),
            batch_id=batch.id if batch else None, warehouse_id=main_wh.id,
        ))
    print("Created serial numbers")


def _seed_transfers(db, warehouses, products, admin):
    if db.query(WarehouseTransfer).count() > 0 or len(warehouses) < 2:
        return
    src, dst = warehouses[0], warehouses[1]
    for p in products[:3]:
        db.add(WarehouseTransfer(
            from_warehouse_id=src.id, to_warehouse_id=dst.id, product_id=p.id,
            quantity=random.randint(5, 20), status=TransferStatus.COMPLETED,
            notes="Seed transfer", created_by=admin.id if admin else None, completed_at=NOW(),
        ))
    print("Created warehouse transfers")


def _seed_audits(db, main_wh, products, admin):
    if db.query(InventoryAudit).count() > 0:
        return
    audit = InventoryAudit(warehouse_id=main_wh.id, status=AuditStatus.COMPLETED, notes="Q1 cycle count", created_by=admin.id if admin else None, completed_at=NOW())
    db.add(audit)
    db.flush()
    for p in products[:5]:
        expected = random.randint(10, 80)
        counted = expected + random.choice([-2, 0, 0, 1])
        db.add(InventoryAuditLine(audit_id=audit.id, product_id=p.id, expected_quantity=expected, counted_quantity=counted, variance=counted - expected))
    in_progress = InventoryAudit(warehouse_id=main_wh.id, status=AuditStatus.IN_PROGRESS, notes="Q2 cycle count in progress", created_by=admin.id if admin else None)
    db.add(in_progress)
    db.flush()
    for p in products[5:8]:
        db.add(InventoryAuditLine(audit_id=in_progress.id, product_id=p.id, expected_quantity=random.randint(10, 50)))
    print("Created inventory audits")


def _seed_activity(db, admin):
    if db.query(ActivityLog).count() > 0:
        return
    logs = [
        ("login", "user", admin.id if admin else 1),
        ("create", "product", 1),
        ("adjust", "inventory", 1),
        ("approve", "purchase_order", 1),
        ("fulfill", "sales_order", 1),
        ("receive", "purchase_order", 2),
    ]
    for action, entity_type, entity_id in logs:
        db.add(ActivityLog(user_id=admin.id if admin else None, action=action, entity_type=entity_type, entity_id=entity_id, created_at=NOW()))
    print("Created activity logs")

    if db.query(LoginHistory).count() == 0:
        for u in db.query(User).limit(3).all():
            db.add(LoginHistory(user_id=u.id, ip_address="127.0.0.1", user_agent="Seed/1.0", success=True, created_at=NOW()))
        print("Created login history")


def _seed_sales_channels(db, products):
    channel_names = ["Aliexpress", "eBay", "Amazon", "Walmart", "Etsy", "Wayfair", "Rakuten"]
    if db.query(SalesChannel).count() > 0:
        return db.query(SalesChannel).order_by(SalesChannel.id).all()

    channels = []
    for name in channel_names:
        channel = SalesChannel(name=name, slug=name.lower().replace(" ", "-"), is_active=True, created_at=NOW())
        db.add(channel)
        channels.append(channel)
    db.flush()
    print(f"Created {len(channels)} sales channels")

    for product in products:
        count = (product.id % 4) + 2
        channel_indexes = [i for i in range(len(channels)) if (product.id + i) % 3 != 0][:count]
        for index in channel_indexes:
            db.add(ProductChannelListing(product_id=product.id, channel_id=channels[index].id, is_active=True))
    print("Created product channel listings")
    return channels


def _seed_notifications(db):
    if db.query(NotificationDelivery).count() > 0:
        return
    from app.models import StockAlert
    alert = db.query(StockAlert).first()
    if alert:
        db.add(NotificationDelivery(
            alert_id=alert.id, channel=NotificationChannel.IN_APP,
            status=NotificationStatus.SENT, recipient="admin@inventory.com", subject="Low stock alert", sent_at=NOW(),
        ))
        db.add(NotificationDelivery(
            alert_id=alert.id, channel=NotificationChannel.EMAIL,
            status=NotificationStatus.PENDING, recipient="admin@inventory.com", subject="Low stock alert",
        ))
        print("Created notification deliveries")


def seed():
    db = SessionLocal()
    try:
        admin = _seed_users(db)
        main_wh, warehouses = _seed_warehouses(db)
        categories = _seed_categories(db)
        products = _seed_products(db, categories)
        _seed_variants(db, products)
        _seed_inventory(db, products, main_wh, warehouses)
        suppliers = _seed_suppliers(db)
        _seed_supplier_payments(db, suppliers)
        customers = _seed_customers(db)
        _seed_legacy_orders(db, products)
        _seed_purchase_orders(db, suppliers, products, main_wh, admin)
        _seed_vendor_invoices(db, suppliers)
        _seed_sales_orders(db, customers, products, main_wh, admin)
        _seed_customer_invoices(db, customers)
        _seed_batches(db, products, main_wh)
        _seed_serials(db, products, main_wh)
        _seed_transfers(db, warehouses, products, admin)
        _seed_audits(db, main_wh, products, admin)
        _seed_sales_channels(db, products)
        _seed_activity(db, admin)
        _seed_notifications(db)

        db.commit()
        print("Seed completed successfully!")
    except Exception as e:
        db.rollback()
        print(f"Seed failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
