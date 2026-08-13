import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';

// Layouts
import PublicLayout from './components/layout/PublicLayout.jsx';
import DashboardLayout from './components/layout/DashboardLayout.jsx';

// Public Pages
import Home from './pages/Home.jsx';
import Shop from './pages/Shop.jsx';
import Categories from './pages/Categories.jsx';
import ProductDetail from './pages/ProductDetail.jsx';
import Cart from './pages/Cart.jsx';
import Checkout from './pages/Checkout.jsx';
import Contact from './pages/Contact.jsx';
import { About, Legal, FAQ, RefundPolicy, ShippingPolicy, CookiePolicy, Disclaimer, Careers, Blog } from './pages/Placeholders.jsx';
import Wishlist from './pages/Wishlist.jsx';
import NotFound from './pages/NotFound.jsx';

import Login from './pages/auth/Login.jsx';
import Register from './pages/auth/Register.jsx';
import ForgotPassword from './pages/auth/ForgotPassword.jsx';
import MyAccount from './pages/account/MyAccount.jsx';

import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import AdminProducts from './pages/admin/AdminProducts.jsx';
import AdminCategories from './pages/admin/AdminCategories.jsx';
import AdminCoupons from './pages/admin/AdminCoupons.jsx';
import AdminOrders from './pages/admin/AdminOrders.jsx';
import AdminFeedback from './pages/admin/AdminFeedback.jsx';
import AdminUsers from './pages/admin/AdminUsers.jsx';

import SupportDashboard from './pages/support/SupportDashboard.jsx';
import SupportTickets from './pages/support/SupportTickets.jsx';
import SupportFeedback from './pages/support/SupportFeedback.jsx';

// Route Guards
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="spinner" style={{ margin: '100px auto' }}></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;
  
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/product/:slug" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
          <Route path="/contact" element={<Contact />} />
          
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          
          <Route path="/about" element={<About />} />
          <Route path="/legal" element={<Legal />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/refund-policy" element={<RefundPolicy />} />
          <Route path="/shipping-policy" element={<ShippingPolicy />} />
          <Route path="/cookie-policy" element={<CookiePolicy />} />
          <Route path="/disclaimer" element={<Disclaimer />} />
          <Route path="/careers" element={<Careers />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Route>

        {/* Dashboard Routes */}
        <Route element={<DashboardLayout />}>
          {/* Customer */}
          <Route path="/account" element={<ProtectedRoute><MyAccount /></ProtectedRoute>} />
          
          {/* Admin */}
          <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/products" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><AdminProducts /></ProtectedRoute>} />
          <Route path="/admin/orders" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><AdminOrders /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><AdminUsers /></ProtectedRoute>} />
          <Route path="/admin/categories" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><AdminCategories /></ProtectedRoute>} />
          <Route path="/admin/coupons" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><AdminCoupons /></ProtectedRoute>} />
          <Route path="/admin/feedback" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><AdminFeedback /></ProtectedRoute>} />
          
          {/* Support */}
          <Route path="/support" element={<ProtectedRoute allowedRoles={['support', 'admin', 'super_admin']}><SupportDashboard /></ProtectedRoute>} />
          <Route path="/support/tickets" element={<ProtectedRoute allowedRoles={['support', 'admin', 'super_admin']}><SupportTickets /></ProtectedRoute>} />
          <Route path="/support/feedback" element={<ProtectedRoute allowedRoles={['support', 'admin', 'super_admin']}><SupportFeedback /></ProtectedRoute>} />
          
          {/* 404 Catch-All */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
