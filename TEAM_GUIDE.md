# Ecom Commerce - Team Guide

Welcome to the Ecom Commerce project! This guide is designed for beginners and new team members to quickly understand how our platform works, how to run it locally, and what each user role is allowed to do.

---

## 1. How to Run the Project Locally

The project is split into two parts: the **Backend** (Python/FastAPI) and the **Frontend** (React/Vite). You need to run both at the same time in two separate terminal windows.

### Starting the Backend (Terminal 1)
The backend handles the database, APIs, and security.
1. Open a terminal and navigate to the backend folder:
   ```bash
   cd app/backend
   ```
2. Activate your virtual environment (if you have one), then start the server:
   ```bash
   uvicorn server:app --reload
   ```
*The backend will now be running at `http://127.0.0.1:8000`.*

### Starting the Frontend (Terminal 2)
The frontend is the visual website that users interact with.
1. Open a new terminal and navigate to the frontend folder:
   ```bash
   cd app/frontend
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
*The frontend will provide a local URL (usually `http://localhost:5173`). Open this in your browser to view the site!*

---

## 2. Default Test Accounts & Passwords

When the backend starts for the first time, it automatically creates sample accounts for testing. Here are the default credentials you can use to log in and test different features:

| Role | Email Address | Password |
| :--- | :--- | :--- |
| **Super Admin** | `test_super@shop.com` | `password` |
| **Admin** | `test_admin@shop.com` | `password` |
| **Support Rep** | `test_support@shop.com` | `password` |
| **Customer** | `test_customer@shop.com` | `password` |

*(Note: These credentials are defined in the `app/backend/.env` file. If you ever need to change the default test passwords, you can do so there and restart the backend.)*

---

## 3. Role-Based Access Control (What can each role do?)

Our system uses **Role-Based Access Control (RBAC)**. This means the system looks at "who" is logged in and restricts what pages and buttons they are allowed to see.

Here is a breakdown of exactly what each role can do:

### 👤 Customer (`test_customer@shop.com`)
*This is the standard user role assigned to anyone who creates an account on the website.*
- **Capabilities:**
  - Browse products, add them to the cart, and checkout.
  - Manage their own profile (change name, reset password).
  - Add and edit their own shipping addresses.
  - View their personal order history.
  - Submit support tickets or contact forms.
- **Restrictions:** They cannot access any dashboard pages (`/admin` or `/support`).

### 🎧 Support Executive (`test_support@shop.com`)
*This role is for customer service representatives.*
- **Capabilities:**
  - Everything a Customer can do.
  - Access the **Support Dashboard** (`/support`).
  - View and respond to Customer Support Tickets.
  - View Customer Feedback submissions.
- **Restrictions:** They cannot add products, edit categories, or view overall financial data. 

### 💼 Admin (`test_admin@shop.com`)
*This role is for store managers who handle day-to-day business operations.*
- **Capabilities:**
  - Everything a Support Executive can do.
  - Access the **Admin Dashboard** (`/admin`).
  - **Products:** Add new products, update pricing, and manage inventory stock.
  - **Orders:** View all customer orders and update order statuses (e.g., from "Pending" to "Shipped").
  - **Categories & Coupons:** Create promotional codes and organize product categories.
- **Restrictions:** They cannot promote other users to Admin status.

### 👑 Super Admin (`test_super@shop.com`)
*This is the highest level of access, reserved for the business owners or lead developers.*
- **Capabilities:**
  - Everything an Admin can do.
  - **User Management:** They have access to the "Users" panel in the Admin Dashboard, allowing them to view all registered users and promote regular users to "Support" or "Admin" roles.
  - Full, unrestricted access to the entire platform.

---

## 4. Testing the "Forgot Password" OTP Feature

We have built a secure OTP (One-Time Password) system for password resets! 

**How to test it locally without an email server:**
1. Go to the login screen and click **Forgot Password**.
2. Enter `user@shop.com`.
3. Check the terminal where your **Backend** is running. The system intercepts the email and prints the 6-digit code directly in the terminal!
4. Copy that code, enter it in the website, and set your new password.

*(To send real emails to real inboxes, just add `SMTP_EMAIL` and `SMTP_PASSWORD` to your `app/backend/.env` file).*
