"""Public shop routes: products, categories."""
from fastapi import APIRouter, HTTPException, Query, Depends
from sqlalchemy.orm import Session
from sqlalchemy import or_
from db import get_db
from sql_models import Category, Product
from utils import serialize, serialize_list

router = APIRouter(prefix="/api", tags=["shop"])


@router.get("/categories")
async def list_categories(db: Session = Depends(get_db)):
    docs = db.query(Category).all()
    return serialize_list(docs)


@router.get("/categories/{slug}")
async def get_category(slug: str, db: Session = Depends(get_db)):
    doc = db.query(Category).filter(Category.slug == slug).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Category not found")
    return serialize(doc)


@router.get("/products")
async def list_products(
    category: str | None = Query(None),
    q: str | None = Query(None),
    featured: bool | None = Query(None),
    min_price: float | None = Query(None),
    max_price: float | None = Query(None),
    sort: str = Query("newest"),
    limit: int = Query(48, le=100),
    db: Session = Depends(get_db)
):
    query = db.query(Product).filter(Product.active == True)
    
    if category:
        query = query.filter(Product.category_slug == category)
    if featured is not None:
        query = query.filter(Product.featured == featured)
    if q:
        search_pattern = f"%{q}%"
        query = query.filter(
            or_(
                Product.name.ilike(search_pattern),
                Product.description.ilike(search_pattern),
                Product.brand.ilike(search_pattern)
            )
        )
    if min_price is not None:
        query = query.filter(Product.price >= min_price)
    if max_price is not None:
        query = query.filter(Product.price <= max_price)

    if sort == "price_asc":
        query = query.order_by(Product.price.asc())
    elif sort == "price_desc":
        query = query.order_by(Product.price.desc())
    elif sort == "name":
        query = query.order_by(Product.name.asc())
    else:
        query = query.order_by(Product.id.desc())

    docs = query.limit(limit).all()
    return serialize_list(docs)


@router.get("/products/{slug}")
async def get_product(slug: str, db: Session = Depends(get_db)):
    doc = db.query(Product).filter(Product.slug == slug).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Product not found")
    return serialize(doc)


@router.get("/products-by-id/{pid}")
async def get_product_by_id(pid: int, db: Session = Depends(get_db)):
    doc = db.query(Product).filter(Product.id == pid).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Product not found")
    return serialize(doc)