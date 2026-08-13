# AI Context & Routing Map

This document is designed to help AI coding assistants (like Copilot, Cursor, or ChatGPT) instantly understand the project architecture, file structure, and routing layers of the **Ecom Commerce** platform.

## 1. High-Level Architecture

* **Frontend**: React 19 + Vite (Single Page Application). State is managed via Context API. Styling is pure Vanilla CSS (`index.css`).
* **Backend**: Python + FastAPI. Uses SQLAlchemy for ORM and SQLite for development.
* **Authentication**: Cookie-based JWT tokens (HttpOnly, Secure). Role-based access control (RBAC) enforced via FastAPI dependency injection.

---

## 2. Frontend Routing Map (`app/frontend/src/App.jsx`)

The frontend uses `react-router-dom`. Routes are protected by a `<ProtectedRoute>` wrapper that checks the user's `role`.

### Public Routes (No Auth Required)
* `/` -> `Home.jsx`
* `/shop` -> `Shop.jsx`
* `/product/:slug` -> `ProductDetail.jsx`
* `/cart` -> `Cart.jsx`
* `/checkout` -> `Checkout.jsx`
* `/contact` -> `Contact.jsx`
* `/login` -> `auth/Login.jsx`
* `/register` -> `auth/Register.jsx`
* `/forgot-password` -> `auth/ForgotPassword.jsx`
* `/wishlist` -> `Wishlist.jsx`

### Customer Routes (Requires `user`, `support`, `admin`, or `super_admin`)
* `/account` -> `account/MyAccount.jsx`

### Support Routes (Requires `support`, `admin`, or `super_admin`)
* `/support` -> `support/SupportDashboard.jsx`
* `/support/tickets` -> `support/SupportTickets.jsx`
* `/support/feedback` -> `support/SupportFeedback.jsx`

### Admin Routes (Requires `admin` or `super_admin`)
* `/admin` -> `admin/AdminDashboard.jsx`
* `/admin/products` -> `admin/AdminProducts.jsx`
* `/admin/categories` -> `admin/AdminCategories.jsx`
* `/admin/coupons` -> `admin/AdminCoupons.jsx`
* `/admin/orders` -> `admin/AdminOrders.jsx`
* `/admin/feedback` -> `admin/AdminFeedback.jsx`

### Super Admin Routes (Requires `super_admin`)
* `/admin/users` -> `admin/AdminUsers.jsx`

---

## 3. Backend API Routing Map (`app/backend/routers/`)

All backend logic is split into modular routers.

### 🔐 Auth (`routers/auth.py`)
* `POST /api/auth/register` - Create new user
* `POST /api/auth/login` - Authenticate and set JWT cookies
* `POST /api/auth/logout` - Clear JWT cookies
* `POST /api/auth/forgot-password` - Generate OTP
* `POST /api/auth/reset-password` - Verify OTP and update password

### 🛒 Shop (Public) (`routers/shop.py`)
* `GET /api/shop/products` - List all products
* `GET /api/shop/products/{slug}` - Get single product details
* `GET /api/shop/categories` - List product categories
* `POST /api/shop/contact` - Submit feedback/support request

### 👤 Customer (`routers/customer.py`)
* `GET / POST / PUT / DELETE /api/me/cart` - Cart Management
* `GET / POST / DELETE /api/me/wishlist` - Wishlist Management
* `GET / POST / DELETE /api/me/addresses` - Address Management
* `GET /api/me/orders` - View personal order history
* `POST /api/me/checkout` - Create order and initialize Razorpay
* `POST /api/me/checkout/verify` - Verify Razorpay HMAC signature

### 🎧 Support (`routers/support.py`) - Requires Support Role
* `GET /api/support/tickets` - View all tickets
* `GET /api/support/tickets/{id}` - View specific ticket thread
* `POST /api/support/tickets/{id}/reply` - Reply to customer ticket
* `PUT /api/support/tickets/{id}/status` - Update ticket status
* `GET /api/support/feedback` - Read contact form submissions

### 💼 Admin (`routers/admin.py`) - Requires Admin Role
* `GET /api/admin/stats` - Fetch dashboard analytics
* `CRUD /api/admin/products` - Product management
* `CRUD /api/admin/categories` - Category management
* `CRUD /api/admin/coupons` - Discount code management
* `GET / PUT /api/admin/orders` - Manage order statuses
* `PUT /api/admin/feedback/{id}/resolve` - Mark feedback resolved

### 👑 Super Admin (Inside `routers/admin.py`) - Requires Super Admin Role
* `GET /api/admin/users` - View all users
* `PUT /api/admin/users/{id}/role` - Promote user to Admin/Support

---

## 4. Database Schema Map (`app/backend/sql_models.py`)

* **User**: `id`, `email`, `password_hash`, `role` (customer|support|admin|super_admin).
* **Product**: `id`, `name`, `slug`, `price`, `stock`, `category_id`.
* **Category**: `id`, `name`, `slug`.
* **Order**: `id`, `user_id`, `status`, `total`, `razorpay_order_id`.
* **OrderItem**: `id`, `order_id`, `product_id`, `quantity`, `price`.
* **Coupon**: `id`, `code`, `discount_type`, `discount_value`, `active`.
* **Ticket**: `id`, `user_id`, `subject`, `status`.
* **TicketMessage**: `id`, `ticket_id`, `message`, `is_staff_reply`.
* **Feedback**: `id`, `name`, `email`, `message`, `resolved`.

## 5. Security & Dependencies
* Passwords hashed via `bcrypt` in `security.py`.
* FastAPI dependencies (`Depends(get_db)`, `Depends(get_current_user)`) ensure database sessions and authentication contexts are injected safely into route handlers.
