"""Add product_id to coupons

Revision ID: 99c43ec38006
Revises: 7d2c4860edf7
Create Date: 2026-08-13 13:37:39.136729

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '99c43ec38006'
down_revision: Union[str, Sequence[str], None] = '7d2c4860edf7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table('coupons', schema=None) as batch_op:
        batch_op.add_column(sa.Column('product_id', sa.Integer(), nullable=True))
        batch_op.create_foreign_key('fk_coupon_product', 'products', ['product_id'], ['id'])

def downgrade() -> None:
    with op.batch_alter_table('coupons', schema=None) as batch_op:
        batch_op.drop_constraint('fk_coupon_product', type_='foreignkey')
        batch_op.drop_column('product_id')
