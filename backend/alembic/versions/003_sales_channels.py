"""sales channels migration

Revision ID: 003
Revises: 002
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "003"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "sales_channels",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("slug", sa.String(length=100), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
        sa.UniqueConstraint("slug"),
    )
    op.create_index(op.f("ix_sales_channels_id"), "sales_channels", ["id"], unique=False)
    op.create_index(op.f("ix_sales_channels_slug"), "sales_channels", ["slug"], unique=False)

    op.create_table(
        "product_channel_listings",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("product_id", sa.Integer(), nullable=False),
        sa.Column("channel_id", sa.Integer(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["channel_id"], ["sales_channels.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("product_id", "channel_id", name="uq_product_channel"),
    )
    op.create_index(op.f("ix_product_channel_listings_id"), "product_channel_listings", ["id"], unique=False)
    op.create_index(op.f("ix_product_channel_listings_product_id"), "product_channel_listings", ["product_id"], unique=False)
    op.create_index(op.f("ix_product_channel_listings_channel_id"), "product_channel_listings", ["channel_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_product_channel_listings_channel_id"), table_name="product_channel_listings")
    op.drop_index(op.f("ix_product_channel_listings_product_id"), table_name="product_channel_listings")
    op.drop_index(op.f("ix_product_channel_listings_id"), table_name="product_channel_listings")
    op.drop_table("product_channel_listings")
    op.drop_index(op.f("ix_sales_channels_slug"), table_name="sales_channels")
    op.drop_index(op.f("ix_sales_channels_id"), table_name="sales_channels")
    op.drop_table("sales_channels")
