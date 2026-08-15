"""add customer status and soft delete fields to users

Revision ID: 0005
Revises: 0004
Create Date: 2026-08-10
"""

from alembic import op
import sqlalchemy as sa


revision = "0005"
down_revision = "0004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("account_status", sa.String(), server_default="ACTIVE", nullable=False))
    op.add_column("users", sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("users", sa.Column("deleted_by", sa.String(), nullable=True))
    op.add_column("users", sa.Column("suspended_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("users", sa.Column("suspended_by", sa.String(), nullable=True))
    op.add_column("users", sa.Column("suspension_reason", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "suspension_reason")
    op.drop_column("users", "suspended_by")
    op.drop_column("users", "suspended_at")
    op.drop_column("users", "deleted_by")
    op.drop_column("users", "deleted_at")
    op.drop_column("users", "account_status")
