from fastapi import APIRouter, Depends, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import io

from app.core.deps import require_permission
from app.database import get_db
from app.models import User
from app.services.import_export_service import export_inventory_csv, export_products_csv, import_products_csv

router = APIRouter(prefix="/import-export", tags=["import-export"])


@router.get("/export/inventory")
def export_inventory(db: Session = Depends(get_db), _: User = Depends(require_permission("export.read"))):
    csv_data = export_inventory_csv(db)
    return StreamingResponse(
        iter([csv_data]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=inventory_balances.csv"},
    )


@router.get("/export/products")
def export_products(db: Session = Depends(get_db), _: User = Depends(require_permission("export.read"))):
    csv_data = export_products_csv(db)
    return StreamingResponse(
        iter([csv_data]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=products.csv"},
    )


@router.post("/import/products")
async def import_products(file: UploadFile = File(...), db: Session = Depends(get_db), _: User = Depends(require_permission("import.create"))):
    content = (await file.read()).decode("utf-8")
    return import_products_csv(db, content)
