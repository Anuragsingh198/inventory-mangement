from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers import (
    ai,
    alerts,
    audits,
    auth,
    batches,
    categories,
    import_export,
    inventory,
    notifications,
    orders,
    products,
    purchases,
    reports,
    sales,
    sales_channels,
    suppliers,
    warehouses,
)

app = FastAPI(title="Ventorio Inventory Management System", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(categories.router)
app.include_router(products.router)
app.include_router(inventory.router)
app.include_router(orders.router)
app.include_router(reports.router)
app.include_router(alerts.router)
app.include_router(notifications.router)
app.include_router(warehouses.router)
app.include_router(suppliers.router)
app.include_router(purchases.router)
app.include_router(sales.router)
app.include_router(sales_channels.router)
app.include_router(batches.router)
app.include_router(audits.router)
app.include_router(ai.router)
app.include_router(import_export.router)


@app.get("/health")
def health_check():
    return {"status": "ok", "version": "2.0.0"}
