"""Initial baseline migration

Revision ID: 0001_initial
Revises:
Create Date: 2026-08-19 12:00:00.000000

"""

from typing import Sequence, Union

# revision identifiers, used by Alembic.
revision: str = "0001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Baseline migration placeholder; domain tables will be added in feature branches
    pass


def downgrade() -> None:
    pass
