"""Admin routes: /api/admin/*  (requires admin or super_admin)"""
import os
import shutil
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import func
from db import get_db
from models import (CategoryInput, ProductInput, CouponInput, UpdateOrderStatusInput, UpdateUserRoleInput)
from sql_models import User, Product, Order, Ticket, Feedback, Category, Coupon, Address, OrderItem
from security import require_admin, require_super
from utils import serialize, serialize_list

router = APIRouter(prefix="/api/admin", tags=["admin"])

@router.post("/upload")
async def upload_file(file: UploadFile = File(...), _: dict = Depends(require_admin)):
    allowed_types = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Invalid file type. Only JPG, PNG, WEBP allowed.")
    
    # max 5MB is generally handled by middleware, but we can do a quick read check or just trust
    upload_dir = os.path.join(os.path.dirname(__file__), "..", "uploads")
    os.makedirs(upload_dir, exist_ok=True)
    
    file_extension = os.path.splitext(file.filename)[1]
    import uuid
    safe_name = f"{uuid.uuid4().hex}{file_extension}"
    file_path = os.path.join(upload_dir, safe_name)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    return {"url": f"/uploads/{safe_name}"}

@router.get("/stats")
async def get_stats(_: dict = Depends(require_admin), db: Session = Depends(get_db)):
    total_users = db.query(User).filter(User.role == "customer").count()
    total_products = db.query(Product).count()
    total_orders = db.query(Order).count()
    paid_orders = db.query(Order).filter(Order.payment_status == "paid").all()
    revenue = round(sum((o.total or 0) for o in paid_orders), 2)
    open_tickets = db.query(Ticket).filter(Ticket.status.in_(["open", "in_progress"])).count()
    pending_feedback = db.query(Feedback).filter(Feedback.resolved == False).count()
    low_stock = db.query(Product).filter(Product.stock <= 5).count()

    from collections import defaultdict
    from datetime import timedelta
    
    # Generate last 30 days of dates initialized to 0
    today = datetime.now(timezone.utc)
    sales_by_day = {}
    for i in range(29, -1, -1):
        d_str = (today - timedelta(days=i)).strftime("%Y-%m-%d")
        sales_by_day[d_str] = 0.0

    cutoff_date = today - timedelta(days=30)
    for o in paid_orders:
        d = o.paid_at or o.created_at
        if d:
            if d.tzinfo is None:
                d = d.replace(tzinfo=timezone.utc)
            if d >= cutoff_date:
                d_str = str(d)[:10]
                if d_str in sales_by_day:
                    sales_by_day[d_str] += (o.total or 0)
                else:
                    sales_by_day[d_str] = (o.total or 0)

    daily = [{"date": k, "total": round(v, 2)} for k, v in sorted(sales_by_day.items())][-30:]

    # Top selling categories
    category_sales = db.query(
        Product.category_slug, 
        func.sum(OrderItem.quantity * OrderItem.price)
    ).join(OrderItem, OrderItem.product_id == Product.id)\
     .join(Order, Order.id == OrderItem.order_id)\
     .filter(Order.payment_status == 'paid')\
     .group_by(Product.category_slug)\
     .order_by(func.sum(OrderItem.quantity * OrderItem.price).desc())\
     .limit(5).all()

    top_categories = [{"name": c[0] or "Uncategorized", "value": round(c[1], 2)} for c in category_sales]

    return {
        "total_customers": total_users,
        "total_products": total_products,
        "total_orders": total_orders,
        "revenue": revenue,
        "open_tickets": open_tickets,
        "pending_feedback": pending_feedback,
        "low_stock": low_stock,
        "daily_sales": daily,
        "top_categories": top_categories,
    }

@router.post("/categories")
async def create_category(payload: CategoryInput, _: dict = Depends(require_admin), db: Session = Depends(get_db)):
    if db.query(Category).filter(Category.slug == payload.slug).first():
        raise HTTPException(status_code=400, detail="Slug already exists")
    doc = Category(**payload.model_dump())
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return serialize(doc)

@router.put("/categories/{cid}")
async def update_category(cid: int, payload: CategoryInput, _: dict = Depends(require_admin), db: Session = Depends(get_db)):
    doc = db.query(Category).filter(Category.id == cid).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Category not found")
    for k, v in payload.model_dump().items():
        setattr(doc, k, v)
    db.commit()
    db.refresh(doc)
    return serialize(doc)

@router.delete("/categories/{cid}")
async def delete_category(cid: int, _: dict = Depends(require_admin), db: Session = Depends(get_db)):
    db.query(Category).filter(Category.id == cid).delete()
    db.commit()
    return {"ok": True}

@router.get("/products")
async def admin_list_products(_: dict = Depends(require_admin), db: Session = Depends(get_db)):
    docs = db.query(Product).order_by(Product.id.desc()).limit(500).all()
    return serialize_list(docs)

@router.post("/products")
async def create_product(payload: ProductInput, _: dict = Depends(require_admin), db: Session = Depends(get_db)):
    if db.query(Product).filter(Product.slug == payload.slug).first():
        raise HTTPException(status_code=400, detail="Slug already exists")
    doc = Product(**payload.model_dump())
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return serialize(doc)

@router.put("/products/{pid}")
async def update_product(pid: int, payload: ProductInput, _: dict = Depends(require_admin), db: Session = Depends(get_db)):
    doc = db.query(Product).filter(Product.id == pid).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Product not found")
    for k, v in payload.model_dump().items():
        setattr(doc, k, v)
    db.commit()
    db.refresh(doc)
    return serialize(doc)

@router.delete("/products/{pid}")
async def delete_product(pid: int, _: dict = Depends(require_admin), db: Session = Depends(get_db)):
    db.query(Product).filter(Product.id == pid).delete()
    db.commit()
    return {"ok": True}

@router.get("/orders")
async def admin_list_orders(_: dict = Depends(require_admin), db: Session = Depends(get_db)):
    docs = db.query(Order).order_by(Order.created_at.desc()).limit(500).all()
    res = []
    for d in docs:
        out = serialize(d)
        out["items"] = serialize_list(d.items)
        addr = db.query(Address).filter(Address.id == d.address_id).first()
        out["shipping_address"] = f"{addr.full_name}, {addr.line1}, {addr.city}, {addr.state} {addr.postal_code}" if addr else "Address deleted"
        res.append(out)
    return res

@router.get("/orders/{oid}")
async def admin_get_order(oid: int, _: dict = Depends(require_admin), db: Session = Depends(get_db)):
    doc = db.query(Order).filter(Order.id == oid).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")
    out = serialize(doc)
    out["items"] = serialize_list(doc.items)
    addr = db.query(Address).filter(Address.id == doc.address_id).first()
    out["shipping_address"] = f"{addr.full_name}, {addr.line1}, {addr.city}, {addr.state} {addr.postal_code}" if addr else "Address deleted"
    return out

@router.put("/orders/{oid}/status")
async def update_order_status(oid: int, payload: UpdateOrderStatusInput, _: dict = Depends(require_admin), db: Session = Depends(get_db)):
    doc = db.query(Order).filter(Order.id == oid).first()
    if doc:
        # Restore stock if order is cancelled
        if payload.status == "cancelled" and doc.status != "cancelled":
            for item in doc.items:
                product = db.query(Product).filter(Product.id == item.product_id).with_for_update().first()
                if product:
                    product.stock += item.quantity
                    
        # Deduct stock if order is un-cancelled (moved from cancelled to another status)
        elif doc.status == "cancelled" and payload.status != "cancelled":
            for item in doc.items:
                product = db.query(Product).filter(Product.id == item.product_id).with_for_update().first()
                if product:
                    # Allow negative stock here so admins can force un-cancel
                    product.stock -= item.quantity
                    
        doc.status = payload.status
        db.commit()
    return {"ok": True}

@router.get("/users")
async def admin_list_users(_: dict = Depends(require_admin), db: Session = Depends(get_db)):
    docs = db.query(User).order_by(User.created_at.desc()).limit(500).all()
    res = []
    for d in docs:
        out = serialize(d)
        out.pop("password_hash", None)
        res.append(out)
    return res

@router.put("/users/{uid}/role")
async def update_user_role(uid: int, payload: UpdateUserRoleInput, actor: dict = Depends(require_super), db: Session = Depends(get_db)):
    if payload.role not in ("customer", "support", "admin", "super_admin"):
        raise HTTPException(status_code=400, detail="Invalid role")
    doc = db.query(User).filter(User.id == uid).first()
    if doc:
        doc.role = payload.role
        db.commit()
    return {"ok": True}

@router.get("/coupons")
async def list_coupons(_: dict = Depends(require_admin), db: Session = Depends(get_db)):
    docs = db.query(Coupon).all()
    return serialize_list(docs)

@router.post("/coupons")
async def create_coupon(payload: CouponInput, _: dict = Depends(require_admin), db: Session = Depends(get_db)):
    code = payload.code.upper()
    if db.query(Coupon).filter(Coupon.code == code).first():
        raise HTTPException(status_code=400, detail="Coupon code exists")
    doc = Coupon(**payload.model_dump())
    doc.code = code
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return serialize(doc)

@router.delete("/coupons/{cid}")
async def delete_coupon(cid: int, _: dict = Depends(require_admin), db: Session = Depends(get_db)):
    db.query(Coupon).filter(Coupon.id == cid).delete()
    db.commit()
    return {"ok": True}

@router.get("/feedback")
async def list_feedback(_: dict = Depends(require_admin), db: Session = Depends(get_db)):
    docs = db.query(Feedback).order_by(Feedback.created_at.desc()).limit(500).all()
    return serialize_list(docs)

@router.put("/feedback/{fid}/resolve")
async def resolve_feedback(fid: int, _: dict = Depends(require_admin), db: Session = Depends(get_db)):
    doc = db.query(Feedback).filter(Feedback.id == fid).first()
    if doc:
        doc.resolved = True
        db.commit()
    return {"ok": True}