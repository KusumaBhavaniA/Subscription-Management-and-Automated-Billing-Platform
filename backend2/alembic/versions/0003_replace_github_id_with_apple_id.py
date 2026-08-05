"""replace github_id with apple_id

Revision ID: 0003
Revises: 0002
Create Date: 2026-08-02

GitHub OAuth is removed from scope.
Apple Sign In replaces it — github_id column is dropped and apple_id is added.
"""

from alembic import op
import sqlalchemy as sa

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Drop github_id unique constraint and column
    op.drop_constraint("uq_users_github_id", "users", type_="unique")
    op.drop_column("users", "github_id")

    # Add apple_id column with unique constraint
    op.add_column(
        "users",
        sa.Column("apple_id", sa.String(), nullable=True),
    )
    op.create_unique_constraint("uq_users_apple_id", "users", ["apple_id"])


def downgrade() -> None:
    op.drop_constraint("uq_users_apple_id", "users", type_="unique")
    op.drop_column("users", "apple_id")

    op.add_column(
        "users",
        sa.Column("github_id", sa.String(), nullable=True),
    )
    op.create_unique_constraint("uq_users_github_id", "users", ["github_id"])
