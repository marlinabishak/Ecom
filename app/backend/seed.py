"""Seed default users + sample catalog data for SQLAlchemy. Idempotent."""
import os
from datetime import datetime, timezone
from db import SessionLocal
from sql_models import User, Category, Product
from security import hash_password, verify_password

SAMPLE_CATEGORIES = [
    {"name": "Watches", "slug": "watches", "description": "Premium timepieces.",
     "image": "https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=800&q=80"},
    {"name": "Apparel", "slug": "apparel", "description": "Modern fashion for every day.",
     "image": "https://images.unsplash.com/photo-1715541448446-3369e1cc0ee9?w=800&q=80"},
    {"name": "Accessories", "slug": "accessories", "description": "Curated accessories.",
     "image": "https://images.unsplash.com/photo-1662893992324-397132d77dbd?w=800&q=80"},
    {"name": "Electronics", "slug": "electronics", "description": "Tech that delights.",
     "image": "https://images.unsplash.com/photo-1518444065439-e933c06ce9cd?w=800&q=80"},
]

SAMPLE_PRODUCTS = [
    {"name": "Chronos Automatic Watch", "slug": "chronos-automatic-watch",
     "description": "Precision Swiss movement, sapphire crystal, 316L steel case.",
     "price": 24999, "compare_price": 29999, "stock": 15, "category_slug": "watches", "brand": "Chronos", "featured": True,
     "images": ["https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=1200&q=80"]},
    {"name": "Meridian Chronograph", "slug": "meridian-chronograph",
     "description": "Chronograph with brown leather strap.",
     "price": 18999, "stock": 20, "category_slug": "watches", "brand": "Meridian", "featured": True,
     "images": ["https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?w=1200&q=80"]},
    {"name": "Silver Link Bracelet Watch", "slug": "silver-link-bracelet-watch",
     "description": "Elegant round face with polished link bracelet.",
     "price": 14999, "stock": 25, "category_slug": "watches", "brand": "Chronos", "featured": False,
     "images": ["https://images.unsplash.com/photo-1582150264904-e0bea5ef0ad1?w=1200&q=80"]},
    {"name": "Obsidian Dive Watch", "slug": "obsidian-dive-watch",
     "description": "Water resistant up to 300m with glowing indices.",
     "price": 34999, "compare_price": 39999, "stock": 5, "category_slug": "watches", "brand": "AquaMarine", "featured": True,
     "images": ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&q=80"]},

    {"name": "Minimalist Black Tee", "slug": "minimalist-black-tee",
     "description": "Heavyweight organic cotton, boxy fit.",
     "price": 1499, "compare_price": 1999, "stock": 100, "category_slug": "apparel", "brand": "Studio Noir", "featured": True,
     "images": ["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=1200&q=80"]},
    {"name": "Merino Wool Sweater", "slug": "merino-wool-sweater",
     "description": "Sustainably sourced merino wool sweater.",
     "price": 4999, "stock": 40, "category_slug": "apparel", "brand": "Nord", "featured": False,
     "images": ["https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=1200&q=80"]},
    {"name": "Classic Denim Jacket", "slug": "classic-denim-jacket",
     "description": "Vintage wash denim jacket with silver buttons.",
     "price": 6999, "compare_price": 7999, "stock": 35, "category_slug": "apparel", "brand": "Indigo", "featured": True,
     "images": ["https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=1200&q=80"]},
    {"name": "Oxford Button-Down Shirt", "slug": "oxford-button-down-shirt",
     "description": "Breathable cotton oxford shirt, perfect for casual or office wear.",
     "price": 3499, "stock": 80, "category_slug": "apparel", "brand": "Studio Noir", "featured": False,
     "images": ["https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=1200&q=80"]},
    {"name": "Performance Running Shorts", "slug": "performance-running-shorts",
     "description": "Lightweight, sweat-wicking material with a zip pocket.",
     "price": 2499, "stock": 120, "category_slug": "apparel", "brand": "Aero", "featured": False,
     "images": ["https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=1200&q=80"]},
    {"name": "Fleece Zip-Up Hoodie", "slug": "fleece-zip-up-hoodie",
     "description": "Ultra-soft interior for cold morning commutes.",
     "price": 4499, "stock": 60, "category_slug": "apparel", "brand": "Nord", "featured": True,
     "images": ["https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=1200&q=80"]},

    {"name": "Leather Weekender Bag", "slug": "leather-weekender-bag",
     "description": "Full-grain leather bag with brass hardware.",
     "price": 8999, "compare_price": 10999, "stock": 12, "category_slug": "accessories", "brand": "Atelier", "featured": True,
     "images": ["https://images.unsplash.com/photo-1547949003-9792a18a2601?w=1200&q=80"]},
    {"name": "Aviator Sunglasses", "slug": "aviator-sunglasses",
     "description": "UV400 protection with titanium frame.",
     "price": 3499, "stock": 60, "category_slug": "accessories", "brand": "Solar", "featured": False,
     "images": ["https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=1200&q=80"]},
    {"name": "Polarized Wayfarer Sunglasses", "slug": "polarized-wayfarer-sunglasses",
     "description": "Classic matte black frames with glare reduction.",
     "price": 2999, "stock": 85, "category_slug": "accessories", "brand": "Solar", "featured": True,
     "images": ["https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=1200&q=80"]},
    {"name": "Minimalist Cardholder", "slug": "minimalist-cardholder",
     "description": "Slim leather cardholder fits perfectly in your front pocket.",
     "price": 1499, "stock": 150, "category_slug": "accessories", "brand": "Atelier", "featured": False,
     "images": ["https://images.unsplash.com/photo-1627123424574-724758594e93?w=1200&q=80"]},
    {"name": "Woven Leather Belt", "slug": "woven-leather-belt",
     "description": "Hand-woven braided belt with an adjustable fit.",
     "price": 1999, "stock": 70, "category_slug": "accessories", "brand": "Atelier", "featured": False,
     "images": ["https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=1200&q=80"]},
    {"name": "Canvas Tote Bag", "slug": "canvas-tote-bag",
     "description": "Durable cotton canvas with reinforced stitching.",
     "price": 999, "stock": 200, "category_slug": "accessories", "brand": "EcoCarry", "featured": True,
     "images": ["https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=1200&q=80"]},

    {"name": "Wireless ANC Headphones", "slug": "wireless-anc-headphones",
     "description": "Over-ear wireless headphones with 40h battery life.",
     "price": 12999, "compare_price": 15999, "stock": 30, "category_slug": "electronics", "brand": "Sonic", "featured": True,
     "images": ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200&q=80"]},
    {"name": "Smart Home Speaker", "slug": "smart-home-speaker",
     "description": "Voice-controlled smart speaker with rich sound.",
     "price": 8999, "stock": 45, "category_slug": "electronics", "brand": "Nova", "featured": True,
     "images": ["https://images.unsplash.com/photo-1543512214-318c7553f230?w=1200&q=80"]},
    {"name": "Mechanical Gaming Keyboard", "slug": "mechanical-gaming-keyboard",
     "description": "RGB backlit keyboard with tactile switches.",
     "price": 12999, "stock": 25, "category_slug": "electronics", "brand": "Apex", "featured": False,
     "images": ["https://images.unsplash.com/photo-1595225476474-87563907a212?w=1200&q=80"]},
    {"name": "Ultra-Thin Power Bank", "slug": "ultra-thin-power-bank",
     "description": "10000mAh capacity in a sleek, pocket-friendly design.",
     "price": 2499, "stock": 90, "category_slug": "electronics", "brand": "ChargeX", "featured": False,
     "images": ["https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=1200&q=80"]},
    {"name": "Noise-Isolating Earbuds", "slug": "noise-isolating-earbuds",
     "description": "Compact wireless earbuds with deep bass.",
     "price": 5999, "stock": 75, "category_slug": "electronics", "brand": "Sonic", "featured": True,
     "images": ["https://images.unsplash.com/photo-1518444065439-e933c06ce9cd?w=1200&q=80"]},
    {"name": "4K Action Camera", "slug": "4k-action-camera",
     "description": "Waterproof camera capturing 4K video at 60fps.",
     "price": 18999, "compare_price": 22999, "stock": 18, "category_slug": "electronics", "brand": "Vivid", "featured": True,
     "images": ["https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=1200&q=80"]},
]

def _seed_user(db, email: str, password: str, name: str, role: str):
    existing = db.query(User).filter(User.email == email).first()
    hashed = hash_password(password)
    if not existing:
        u = User(email=email, password_hash=hashed, name=name, role=role)
        db.add(u)
    elif not verify_password(password, existing.password_hash) or existing.role != role:
        existing.password_hash = hashed
        existing.role = role
        existing.name = name

def seed_all():
    db = SessionLocal()
    try:
        # 1. Users
        _seed_user(db, os.environ.get("SUPER_ADMIN_EMAIL", "test_super@shop.com"), os.environ.get("SUPER_ADMIN_PASSWORD", "password"), "Super Admin", "super_admin")
        _seed_user(db, os.environ.get("ADMIN_EMAIL", "test_admin@shop.com"), os.environ.get("ADMIN_PASSWORD", "password"), "Store Admin", "admin")
        _seed_user(db, os.environ.get("SUPPORT_EMAIL", "test_support@shop.com"), os.environ.get("SUPPORT_PASSWORD", "password"), "Support Exec", "support")
        _seed_user(db, os.environ.get("DEMO_USER_EMAIL", "test_customer@shop.com"), os.environ.get("DEMO_USER_PASSWORD", "password"), "Demo Customer", "customer")
        
        # 2. Categories
        category_map = {}
        for cat in SAMPLE_CATEGORIES:
            existing = db.query(Category).filter(Category.slug == cat["slug"]).first()
            if not existing:
                existing = Category(**cat)
                db.add(existing)
                db.flush()  # Ensures ID is assigned if needed before final commit
            else:
                for key, val in cat.items():
                    setattr(existing, key, val)
            category_map[cat["slug"]] = existing

        db.commit()

        # 3. Products
        for p in SAMPLE_PRODUCTS:
            p_data = p.copy()
            cat_slug = p_data.pop("category_slug", None)
            
            # Map category_id or category relationship dynamically depending on your model definition
            if hasattr(Product, "category_id") and cat_slug in category_map:
                p_data["category_id"] = category_map[cat_slug].id
            elif hasattr(Product, "category_slug"):
                p_data["category_slug"] = cat_slug

            existing = db.query(Product).filter(Product.slug == p_data["slug"]).first()
            if not existing:
                pr = Product(**p_data)
                db.add(pr)
            else:
                # Update all provided keys so seed data stays synchronized
                for key, val in p_data.items():
                    setattr(existing, key, val)
                
        db.commit()
        print("Database seeded successfully.")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_all()