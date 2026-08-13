# Ecom Commerce Project Documentation

## 1. Complete Project Overview
Ecom Commerce is an enterprise-grade eCommerce boilerplate template. It is designed to be easily extensible, secure, and performant. The architecture separates concerns between a Python/FastAPI headless backend and a React/Vite single-page application frontend.

## 2. Folder Structure
```
ecom/
│
├── app/
│   ├── backend/
│   │   ├── alembic/          # Database migrations folder
│   │   ├── routers/          # FastAPI route handlers (auth, admin, shop)
│   │   ├── db.py             # SQLAlchemy configuration
│   │   ├── models.py         # Pydantic schemas for request validation
│   │   ├── sql_models.py     # SQLAlchemy ORM models
│   │   ├── security.py       # JWT and password hashing utilities
│   │   ├── server.py         # FastAPI application entrypoint
│   │   └── seed.py           # Database seeding script
│   │
│   └── frontend/
│       ├── public/           # Static assets
│       ├── src/
│       │   ├── components/   # Reusable UI components (ProductCard, Layouts)
│       │   ├── context/      # React Context (AuthContext, CartContext, ThemeContext)
│       │   ├── lib/          # Utilities (Axios interceptors in api.js)
│       │   ├── pages/        # Application routes (Home, Shop, Admin Dashboards)
│       │   ├── App.jsx       # Route configuration
│       │   ├── index.css     # Global CSS and Design Tokens (Dark/Light themes)
│       │   └── main.jsx      # React DOM entrypoint
│       └── package.json      # Node.js dependencies
│
├── README.md                 # Setup guide
└── PROJECT_DOCUMENTATION.md  # This document
```

## 3. Technology Stack
- **Frontend**: React 19, Vite, React Router v7, Axios, Lucide React icons, Recharts (Data Visualization).
- **Backend**: FastAPI, SQLAlchemy, Alembic, Bcrypt, PyJWT.
- **Database**: SQLite (configured for local dev, easily swappable to PostgreSQL).

## 4. Authentication Flow & Authorization
- Uses **HttpOnly, Secure, SameSite=None** cookies containing JWT tokens.
- **Role-Based Access Control (RBAC)** is strictly enforced at the API route level using FastAPI dependency injection (`require_admin`, `require_support`).
- Roles available: `super_admin`, `admin`, `support`, `customer`.
- Failed logins implement a lockout mechanism (5 attempts / 15 minutes) to deter brute-force attacks.

## 5. Payment Workflow (Razorpay)
1. Frontend calculates cart total and requests an order from `/api/me/orders` using `payment_method="razorpay"`.
2. Backend validates prices against the database, creates an Order record (`status="pending"`), and calls the Razorpay API to generate a `razorpay_order_id`.
3. Frontend receives the order ID, initializes the Razorpay checkout script, and handles user payment.
4. Upon success, frontend posts the verification payload to `/api/me/orders/verify`. Backend validates the HMAC signature using `RAZORPAY_KEY_SECRET`, updates the order to `paid`, and finalizes the transaction.

## 6. Security Features
- SQL Injection protection via SQLAlchemy ORM.
- XSS and CSRF protection via HttpOnly JWT cookies (no local storage for tokens).
- Strong Password Hashing using `bcrypt`.
- Input validation using strict Pydantic schemas.

## 7. Design Decisions
- **Vanilla CSS**: Used CSS variables instead of utility frameworks (like Tailwind) for maximum customizability and a truly bespoke "glassmorphism" premium feel.
- **Context API**: Native React Context used for global state (Cart, Auth, Theme) instead of Redux to reduce boilerplate.

## 8. Core Business Logic & Workflows

To assist new developers, here is a breakdown of how the most critical backend systems operate:

### A. Coupon Discount Logic (`customer.py -> create_checkout`)
Coupons are NOT tied to a specific `product_id`. Instead, they evaluate the cart based on **Categories**.
1. When a user applies a coupon, the system checks if the coupon has a `category_slug` assigned.
2. If yes, the code loops through the cart, checks each product's `category_slug`, and calculates a `valid_items_total` pool using ONLY those items.
3. The flat or percentage discount is then mathematically applied *only* to that `valid_items_total`, leaving unrelated items in the cart at full price.
4. If no `category_slug` is assigned to the coupon, the discount applies to the entire cart subtotal.

### 6. Key Features Implemented
- **Premium UI/UX**: Full Dark Mode / Light Mode support utilizing CSS variables, responsive design, and glassmorphism elements.
- **Admin Analytics Dashboard**: Interactive visual dashboards (using Recharts) for 30-day revenue trends and top-selling product categories dynamically fueled by database SQL aggregations.
- **Role-based Dashboards**: Dedicated views for Admins (products, orders, coupons, users) and Support Staff (tickets, feedback).
- **Checkout & Orders**: Full cart functionality, dynamic coupon application (percentage and fixed amounts), and Razorpay checkout workflow.
- **Support Ticketing**: Users can open tickets linked to specific orders, and Support/Admin staff can reply to and close them.

### B. Single Source of Truth for Orders
The Admin Dashboard (`AdminOrders.jsx`) and the Customer Dashboard (`MyAccount.jsx`) read from and write to the exact same `orders` table in the database.
- When an Admin changes a status to `"shipped"` via `PUT /api/admin/orders/{id}/status`, it edits the central row.
- The next time the Customer fetches their orders, the UI instantly reflects `"shipped"`. There are no secondary tables or syncing delays.

### C. Inventory Protection & Cancellations
When an order is created, `product.stock` is immediately reduced using a row-level lock (`with_for_update()`) to prevent race conditions (two people buying the last shirt simultaneously).
- If an Admin or User changes the order status to `"cancelled"`, the backend automatically iterates over `doc.items` and adds the quantities back to `product.stock`.
- If an Admin un-cancels an order, it reserves the stock again.

### D. Address Snapshots & Formatting
When an order is placed, it links to an `address_id`. 
- During JSON serialization (`admin_list_orders`), the backend actively fetches that Address row and formats it into a single `shipping_address` string before sending it to the frontend.
- If a user deletes their address later, the backend handles the null reference gracefully and outputs `"Address deleted"` so the API never crashes.

### E. Client-Side Cart State
The shopping cart is intentionally entirely decoupled from the database until the exact moment of checkout. 
- It relies entirely on React's Context API (`CartContext.jsx`) and browser `localStorage`.
- This ensures incredibly fast UI updates and allows anonymous users to build a cart before being forced to log in or register.

### F. Razorpay Signature Verification
To prevent malicious users from spoofing successful payment callbacks, the `/api/me/orders/verify` endpoint does not blindly trust the frontend. 
- It reconstructs the expected HMAC SHA-256 signature using the `RAZORPAY_KEY_SECRET`, the `order_id`, and the `payment_id`.
- The order status is only upgraded to `"paid"` if the generated signature perfectly matches the signature provided by Razorpay.

### G. Subcategory Hierarchy & Product Linking
Products are not linked to categories via standard integer IDs; they use a `category_slug` (e.g., `"mens-t-shirts"`).
- The Category model (`CategoryInput`) supports an optional `parent_slug`.
- This allows infinite nesting of subcategories (e.g., Clothing -> Mens -> T-Shirts) by simply pointing a child's `parent_slug` to the parent's `slug`.

### H. JWT Role-Based Access Control (RBAC)
Security is handled at the FastAPI route level using dependency injection (`Depends()`).
- Endpoints inject `require_admin`, `require_support`, or `get_current_user` from `security.py`.
- These functions intercept the HTTP cookie, decrypt the JWT token, extract the embedded `"role"` string, and immediately throw a 403 Forbidden error if the user attempts to access an unauthorized route.

## 9. Future Enhancement Recommendations
- **Database Switch**: Upgrade from SQLite to PostgreSQL for concurrent transactional workloads.
- **Email Provider**: Connect the password reset and feedback API endpoints to an email provider like SendGrid or AWS SES.
- **Redis Caching**: Implement Redis to cache product catalog requests and handle session rate limiting globally.
