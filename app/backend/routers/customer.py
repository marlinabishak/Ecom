"""Customer routes: cart, wishlist, addresses, orders."""
from datetime import datetime, timezone
import os
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db import get_db
from models import CartItemInput, WishlistInput, AddressInput, CheckoutInput, VerifyPaymentInput, UpdateProfileInput
from security import get_current_user
from sql_models import User, CartItem, Product, WishlistItem, Address, Order, OrderItem, Coupon
from utils import serialize, serialize_list

router = APIRouter(prefix="/api/me", tags=["customer"])

@router.put("/profile")
async def update_profile(payload: UpdateProfileInput, user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    doc = db.query(User).filter(User.id == int(user["id"])).first()
    if payload.name is not None:
        doc.name = payload.name
    if payload.phone is not None:
        doc.phone = payload.phone
    db.commit()
    db.refresh(doc)
    return serialize(doc)

def _get_cart_docs(db: Session, user_id: int):
    items = db.query(CartItem).filter(CartItem.user_id == user_id).all()
    products_out = []
    subtotal = 0.0
    for it in items:
        p = db.query(Product).filter(Product.id == it.product_id).first()
        if p:
            products_out.append({
                "product_id": str(p.id),
                "quantity": it.quantity,
                "product": serialize(p),
            })
            subtotal += p.price * it.quantity
    return {"items": products_out, "subtotal": subtotal}

@router.get("/cart")
async def get_cart(user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    return _get_cart_docs(db, int(user["id"]))

@router.post("/cart")
async def add_to_cart(payload: CartItemInput, user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    p = db.query(Product).filter(Product.id == int(payload.product_id)).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
        
    it = db.query(CartItem).filter(CartItem.user_id == int(user["id"]), CartItem.product_id == int(payload.product_id)).first()
    if it:
        it.quantity = max(1, it.quantity + payload.quantity)
    else:
        new_it = CartItem(user_id=int(user["id"]), product_id=int(payload.product_id), quantity=payload.quantity)
        db.add(new_it)
    db.commit()
    return _get_cart_docs(db, int(user["id"]))

@router.put("/cart/{product_id}")
async def update_cart_item(product_id: int, payload: CartItemInput, user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    if payload.quantity <= 0:
        db.query(CartItem).filter(CartItem.user_id == int(user["id"]), CartItem.product_id == product_id).delete()
    else:
        it = db.query(CartItem).filter(CartItem.user_id == int(user["id"]), CartItem.product_id == product_id).first()
        if it:
            it.quantity = payload.quantity
    db.commit()
    return _get_cart_docs(db, int(user["id"]))

@router.delete("/cart/{product_id}")
async def remove_from_cart(product_id: int, user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(CartItem).filter(CartItem.user_id == int(user["id"]), CartItem.product_id == product_id).delete()
    db.commit()
    return _get_cart_docs(db, int(user["id"]))

@router.delete("/cart")
async def clear_cart(user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(CartItem).filter(CartItem.user_id == int(user["id"])).delete()
    db.commit()
    return {"items": [], "subtotal": 0}

@router.get("/wishlist")
async def get_wishlist(user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    items = db.query(WishlistItem).filter(WishlistItem.user_id == int(user["id"])).all()
    products = []
    for it in items:
        p = db.query(Product).filter(Product.id == it.product_id).first()
        if p:
            products.append(serialize(p))
    return products

@router.post("/wishlist")
async def add_wishlist(payload: WishlistInput, user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    it = db.query(WishlistItem).filter(WishlistItem.user_id == int(user["id"]), WishlistItem.product_id == int(payload.product_id)).first()
    if not it:
        db.add(WishlistItem(user_id=int(user["id"]), product_id=int(payload.product_id)))
        db.commit()
    return {"ok": True}

@router.delete("/wishlist/{product_id}")
async def remove_wishlist(product_id: int, user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(WishlistItem).filter(WishlistItem.user_id == int(user["id"]), WishlistItem.product_id == product_id).delete()
    db.commit()
    return {"ok": True}

@router.get("/addresses")
async def list_addresses(user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    docs = db.query(Address).filter(Address.user_id == int(user["id"])).all()
    return serialize_list(docs)

@router.post("/addresses")
async def add_address(payload: AddressInput, user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    count = db.query(Address).filter(Address.user_id == int(user["id"])).count()
    if count >= 3:
        raise HTTPException(status_code=400, detail="Maximum 3 addresses allowed")

    if payload.is_default:
        db.query(Address).filter(Address.user_id == int(user["id"])).update({"is_default": False})
    
    doc = Address(**payload.model_dump())
    doc.user_id = int(user["id"])
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return serialize(doc)

@router.delete("/addresses/{aid}")
async def delete_address(aid: int, user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    doc = db.query(Address).filter(Address.id == aid, Address.user_id == int(user["id"])).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Address not found")
    db.delete(doc)
    db.commit()
    return {"ok": True}

@router.get("/orders")
async def list_my_orders(user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    docs = db.query(Order).filter(Order.user_id == int(user["id"])).order_by(Order.created_at.desc()).limit(200).all()
    res = []
    for d in docs:
        out = serialize(d)
        out["items"] = serialize_list(d.items)
        addr = db.query(Address).filter(Address.id == d.address_id).first()
        out["shipping_address"] = f"{addr.full_name}, {addr.line1}, {addr.city}, {addr.state} {addr.postal_code}" if addr else "Address deleted"
        res.append(out)
    return res

@router.get("/orders/{oid}")
async def get_my_order(oid: int, user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    doc = db.query(Order).filter(Order.id == oid, Order.user_id == int(user["id"])).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Order not found")
    out = serialize(doc)
    out["items"] = serialize_list(doc.items)
    addr = db.query(Address).filter(Address.id == doc.address_id).first()
    out["shipping_address"] = f"{addr.full_name}, {addr.line1}, {addr.city}, {addr.state} {addr.postal_code}" if addr else "Address deleted"
    return out

@router.put("/orders/{oid}/cancel")
async def cancel_my_order(oid: int, user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    doc = db.query(Order).filter(Order.id == oid, Order.user_id == int(user["id"])).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Order not found")
    if doc.status not in ["pending", "processing"]:
        raise HTTPException(status_code=400, detail=f"Cannot cancel order in '{doc.status}' status")
        
    doc.status = "cancelled"
    
    # Restore stock for the items
    for item in doc.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if product:
            product.stock += item.quantity
            
    db.commit()
    return {"status": "success", "message": "Order cancelled successfully"}

@router.post("/checkout")
async def create_checkout(payload: CheckoutInput, user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    import os, uuid
    cart = _get_cart_docs(db, int(user["id"]))
    if not cart["items"]:
        raise HTTPException(status_code=400, detail="Cart is empty")
        
    address = db.query(Address).filter(Address.id == int(payload.address_id), Address.user_id == int(user["id"])).first()
    if not address:
        raise HTTPException(status_code=400, detail="Address not found")

    subtotal = cart["subtotal"]
    discount = 0.0
    coupon_applied = None
    
    if payload.coupon_code:
        c = db.query(Coupon).filter(Coupon.code == payload.coupon_code.upper(), Coupon.active == True).first()
        if c:
            now = datetime.now(timezone.utc).replace(tzinfo=None)
            if c.expires_at and c.expires_at < now:
                raise HTTPException(status_code=400, detail="Coupon has expired")
            if subtotal < c.min_order_amount:
                raise HTTPException(status_code=400, detail=f"Minimum order amount is {c.min_order_amount}")
            
            if c.product_id:
                valid_items_total = 0
                for item in cart["items"]:
                    if item["product_id"] == c.product_id:
                        valid_items_total += item["price"] * item["quantity"]
                
                if valid_items_total == 0:
                    raise HTTPException(status_code=400, detail="Coupon only valid for a specific product not in your cart")
                
                if c.discount_type == "percent":
                    discount = round(valid_items_total * (c.discount_value / 100), 2)
                else:
                    discount = min(float(c.discount_value), valid_items_total)
            elif c.category_slug:
                valid_items_total = 0
                for item in cart["items"]:
                    product = db.query(Product).filter(Product.id == item["product_id"]).first()
                    if product and product.category_slug == c.category_slug:
                        valid_items_total += item["price"] * item["quantity"]
                
                if valid_items_total == 0:
                    raise HTTPException(status_code=400, detail=f"Coupon only valid for category: {c.category_slug}")
                
                if c.discount_type == "percent":
                    discount = round(valid_items_total * (c.discount_value / 100), 2)
                else:
                    discount = min(float(c.discount_value), valid_items_total)
            else:
                if c.discount_type == "percent":
                    discount = round(subtotal * (c.discount_value / 100), 2)
                else:
                    discount = min(float(c.discount_value), subtotal)
                    
            coupon_applied = c.code

    shipping = 0 if subtotal >= 999 else 99
    tax = round((subtotal - discount) * 0.05, 2)
    total = round(subtotal - discount + shipping + tax, 2)

    order_number = f"ORD-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[-6:].upper()}"
    
    order = Order(
        user_id=int(user["id"]),
        order_number=order_number,
        address_id=address.id,
        subtotal=subtotal,
        discount=discount,
        coupon=coupon_applied,
        shipping=shipping,
        tax=tax,
        total=total,
        status="pending",
        payment_method=payload.payment_method,
        payment_status="pending",
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    
    for it in cart["items"]:
        product_id = int(it["product_id"])
        product = db.query(Product).filter(Product.id == product_id).with_for_update().first()
        
        if not product:
            raise HTTPException(status_code=400, detail=f"Product not found")
            
        if product.stock < it["quantity"]:
            raise HTTPException(status_code=400, detail=f"Not enough stock for {product.name}")
            
        product.stock -= it["quantity"]
        
        image = (it["product"]["images"] or [""])[0] if "images" in it["product"] else ""
        order_item = OrderItem(
            order_id=order.id,
            product_id=product_id,
            name=it["product"]["name"],
            price=it["product"]["price"],
            quantity=it["quantity"],
            image=image
        )
        db.add(order_item)
    db.commit()

    key_id = os.environ.get("RAZORPAY_KEY_ID", "")
    key_secret = os.environ.get("RAZORPAY_KEY_SECRET", "")
    razorpay_order_id = f"order_MOCK_{order.id}"
    
    if key_id and not key_id.startswith("rzp_test_REPLACE"):
        try:
            import razorpay
            client = razorpay.Client(auth=(key_id, key_secret))
            rz_order = client.order.create({"amount": int(total * 100), "currency": "INR", "receipt": order_number, "payment_capture": 1})
            razorpay_order_id = rz_order["id"]
        except Exception as e:
            print(f"[razorpay] fallback to mock: {e}")

    order.razorpay_order_id = razorpay_order_id
    db.commit()

    if payload.payment_method == "cod":
        db.query(CartItem).filter(CartItem.user_id == int(user["id"])).delete()
        db.commit()

    return {
        "order_id": order.id,
        "order_number": order_number,
        "total": total,
        "razorpay_order_id": razorpay_order_id,
        "razorpay_key_id": key_id or "MOCK_KEY",
        "currency": "INR",
        "mocked": key_id.startswith("rzp_test_REPLACE") or not key_id,
    }

@router.post("/checkout/verify")
async def verify_payment(payload: VerifyPaymentInput, user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    import os, hmac, hashlib
    order = db.query(Order).filter(Order.id == int(payload.order_id), Order.user_id == int(user["id"])).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    key_secret = os.environ.get("RAZORPAY_KEY_SECRET", "")
    verified = False
    if key_secret and not key_secret.startswith("REPLACE_WITH"):
        body = f"{payload.razorpay_order_id}|{payload.razorpay_payment_id}".encode()
        expected = hmac.new(key_secret.encode(), body, hashlib.sha256).hexdigest()
        verified = hmac.compare_digest(expected, payload.razorpay_signature)
    else:
        verified = True

    new_status = "paid" if verified else "failed"
    order.status = new_status
    order.payment_status = new_status
    order.razorpay_payment_id = payload.razorpay_payment_id
    if verified:
        order.paid_at = datetime.now(timezone.utc)
        
        # Clear cart
        db.query(CartItem).filter(CartItem.user_id == int(user["id"])).delete()
        
        # Decrement stock
        for it in order.items:
            p = db.query(Product).filter(Product.id == it.product_id).first()
            if p:
                p.stock = max(0, p.stock - it.quantity)

    db.commit()
    return {"success": verified, "status": new_status}

@router.get("/coupon/{code}")
async def validate_coupon(code: str, user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    c = db.query(Coupon).filter(Coupon.code == code.upper(), Coupon.active == True).first()
    if not c:
        raise HTTPException(status_code=404, detail="Invalid coupon")
    return serialize(c)