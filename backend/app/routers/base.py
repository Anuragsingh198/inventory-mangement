from typing import Callable, Generic, TypeVar

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, require_permission
from app.database import get_db
from app.models import User
from app.schemas import MessageResponse

ModelT = TypeVar("ModelT")
CreateT = TypeVar("CreateT", bound=BaseModel)
UpdateT = TypeVar("UpdateT", bound=BaseModel)
ResponseT = TypeVar("ResponseT", bound=BaseModel)


def crud_router(
    *,
    prefix: str,
    tags: list[str],
    model: type,
    response_schema: type[ResponseT],
    create_schema: type[CreateT],
    update_schema: type[UpdateT],
    read_permission: str,
    write_permission: str,
    order_by=None,
    eager_load: Callable | None = None,
) -> APIRouter:
    router = APIRouter(prefix=prefix, tags=tags)
    order = order_by or model.id

    @router.get("", response_model=list[response_schema])
    def list_items(
        db: Session = Depends(get_db),
        _: User = Depends(require_permission(read_permission)),
    ):
        query = db.query(model)
        if eager_load:
            query = eager_load(query)
        return query.order_by(order).all()

    @router.get("/{item_id}", response_model=response_schema)
    def get_item(
        item_id: int,
        db: Session = Depends(get_db),
        _: User = Depends(require_permission(read_permission)),
    ):
        query = db.query(model)
        if eager_load:
            query = eager_load(query)
        item = query.filter(model.id == item_id).first()
        if not item:
            raise HTTPException(status_code=404, detail=f"{model.__name__} not found")
        return item

    @router.post("", response_model=response_schema, status_code=status.HTTP_201_CREATED)
    def create_item(
        payload: create_schema,
        db: Session = Depends(get_db),
        _: User = Depends(require_permission(write_permission)),
    ):
        item = model(**payload.model_dump())
        db.add(item)
        db.commit()
        db.refresh(item)
        return item

    @router.patch("/{item_id}", response_model=response_schema)
    def update_item(
        item_id: int,
        payload: update_schema,
        db: Session = Depends(get_db),
        _: User = Depends(require_permission(write_permission)),
    ):
        item = db.query(model).filter(model.id == item_id).first()
        if not item:
            raise HTTPException(status_code=404, detail=f"{model.__name__} not found")
        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(item, field, value)
        db.commit()
        db.refresh(item)
        return item

    @router.delete("/{item_id}", response_model=MessageResponse)
    def delete_item(
        item_id: int,
        db: Session = Depends(get_db),
        _: User = Depends(require_permission(write_permission)),
    ):
        item = db.query(model).filter(model.id == item_id).first()
        if not item:
            raise HTTPException(status_code=404, detail=f"{model.__name__} not found")
        db.delete(item)
        db.commit()
        return MessageResponse(message=f"{model.__name__} deleted")

    return router
