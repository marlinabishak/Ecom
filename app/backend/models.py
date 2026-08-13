"""Pydantic request/response models."""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime


# ---------- Auth ----------
class RegisterInput(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: str = Field(min_length=1)


class LoginInput(BaseModel):
    email: EmailStr
    password: str


class ForgotInput(BaseModel):
    email: EmailStr


class VerifyOTPInput(BaseModel):
    email: EmailStr
    otp: str

class ResetInput(BaseModel):
    email: EmailStr
    otp: str
    password: str = Field(min_length=6)


class ChangePasswordInput(BaseModel):
    current_password: str
    new_password: str = Field(min_length=6)


# ---------- User ----------
class UpdateProfileInput(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None


class AddressInput(BaseModel):
    label: str
    full_name: str
    phone: str
    line1: str
    line2: Optional[str] = ""
    city: str
    state: str
    postal_code: str
    country: str = "India"
    is_default: bool = False


class UpdateUserRoleInput(BaseModel):
    role: str  # customer|support|admin|super_admin


# ---------- Product / Category ----------
class CategoryInput(BaseModel):
    name: str
    slug: str
    description: Optional[str] = ""
    image: Optional[str] = ""
    parent_slug: Optional[str] = None


class ProductInput(BaseModel):
    name: str
    slug: str
    description: str
    price: float
    compare_price: Optional[float] = None
    stock: int = 0
    category_slug: str
    images: List[str] = []
    brand: Optional[str] = ""
    featured: bool = False
    active: bool = True
    tags: List[str] = []


# ---------- Cart / Order ----------
class CartItemInput(BaseModel):
    product_id: str
    quantity: int = 1


class CheckoutInput(BaseModel):
    address_id: str
    coupon_code: Optional[str] = None
    payment_method: str = "razorpay"  # razorpay|cod


class VerifyPaymentInput(BaseModel):
    order_id: str
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


class UpdateOrderStatusInput(BaseModel):
    status: str  # pending|paid|shipped|delivered|cancelled|refunded


# ---------- Coupons ----------
class CouponInput(BaseModel):
    code: str
    description: Optional[str] = ""
    discount_type: str = "percent"  # percent|flat
    discount_value: float
    min_order_amount: float = 0
    active: bool = True
    expires_at: Optional[datetime] = None
    category_slug: Optional[str] = None
    product_id: Optional[int] = None


# ---------- Feedback / Ticket ----------
class FeedbackInput(BaseModel):
    name: str
    email: EmailStr
    subject: str
    message: str


class TicketInput(BaseModel):
    subject: str
    message: str
    order_id: Optional[str] = None


class TicketReplyInput(BaseModel):
    message: str


class UpdateTicketStatusInput(BaseModel):
    status: str  # open|in_progress|resolved|closed


# ---------- Wishlist ----------
class WishlistInput(BaseModel):
    product_id: str