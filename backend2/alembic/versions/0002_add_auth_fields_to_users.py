"""add auth fields to users

Revision ID: 0002
Revises: 237220b2dd38
Create Date: 2026-08-01

Adds the following columns to the existing users table:
  - role           (VARCHAR, default 'Customer')
  - is_verified    (BOOLEAN, default false)
  - otp_code       (VARCHAR(6))
  - otp_expires_at (TIMESTAMPTZ)
  - reset_token    (TEXT)
  - reset_token_expires_at (TIMESTAMPTZ)
  - github_id      (VARCHAR, unique)

Also makes hashed_password nullable to support future OAuth-only accounts.
"""

from alembic import op
import sqlalchemy as sa

# ---------------------------------------------------------------------------
revision = "0002"
down_revision = "237220b2dd38"
branch_labels = None
depends_on = None
# ---------------------------------------------------------------------------


def upgrade() -> None:
    # Role column — default Customer for all existing rows
    op.add_column(
        "users",
        sa.Column(
            "role",
            sa.String(),
            nullable=False,
            server_default="Customer",
        ),
    )

    # Email verification flag — default False (unverified)
    op.add_column(
        "users",
        sa.Column(
            "is_verified",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )

    # OTP fields
    op.add_column(
        "users",
        sa.Column("otp_code", sa.String(6), nullable=True),
    )
    op.add_column(
        "users",
        sa.Column("otp_expires_at", sa.DateTime(timezone=True), nullable=True),
    )

    # Password reset fields
    op.add_column(
        "users",
        sa.Column("reset_token", sa.Text(), nullable=True),
    )
    op.add_column(
        "users",
        sa.Column(
            "reset_token_expires_at", sa.DateTime(timezone=True), nullable=True
        ),
    )

    # GitHub OAuth ID
    op.add_column(
        "users",
        sa.Column("github_id", sa.String(), nullable=True),
    )
    op.create_unique_constraint("uq_users_github_id", "users", ["github_id"])

    # Make hashed_password nullable for OAuth-only accounts
    op.alter_column("users", "hashed_password", nullable=True)


def downgrade() -> None:
    # Reverse nullable change
    op.alter_column("users", "hashed_password", nullable=False)

    # Drop unique constraint and github_id column
    op.drop_constraint("uq_users_github_id", "users", type_="unique")
    op.drop_column("users", "github_id")

    # Drop auth fields in reverse order
    op.drop_column("users", "reset_token_expires_at")
    op.drop_column("users", "reset_token")
    op.drop_column("users", "otp_expires_at")
    op.drop_column("users", "otp_code")
    op.drop_column("users", "is_verified")
    op.drop_column("users", "role")
