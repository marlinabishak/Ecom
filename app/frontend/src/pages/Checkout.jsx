import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import api, { getImageUrl } from '../lib/api';
import { toast } from 'react-toastify';
import { CheckCircle, Plus, Trash2, MapPin, CreditCard, Gift, ShoppingBag } from 'lucide-react';

const Checkout = () => {
  const { cart, fetchCart } = useCart();
  const navigate = useNavigate();
  
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    label: 'Home', full_name: '', phone: '', line1: '', line2: '', city: '', state: '', postal_code: '', country: 'India'
  });

  const loadAddresses = () => {
    api.get('/api/me/addresses').then(res => {
      setAddresses(res.data);
      if (res.data.length > 0 && !selectedAddress) {
        setSelectedAddress(res.data[0].id.toString());
      }
    });
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  const handleAddAddress = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/api/me/addresses', newAddress);
      toast.success("Address added successfully");
      setShowAddressForm(false);
      setNewAddress({ label: 'Home', full_name: '', phone: '', line1: '', line2: '', city: '', state: '', postal_code: '', country: 'India' });
      loadAddresses();
    } catch(err) {
      toast.error("Failed to add address");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAddress = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this address?")) return;
    try {
      await api.delete(`/api/me/addresses/${id}`);
      toast.success("Address deleted");
      if (selectedAddress === id.toString()) setSelectedAddress('');
      loadAddresses();
    } catch(err) {
      toast.error("Failed to delete address");
    }
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!selectedAddress) {
      toast.error('Please select a shipping address');
      return;
    }
    
    setLoading(true);
    try {
      const res = await api.post('/api/me/checkout', {
        address_id: selectedAddress,
        coupon_code: couponCode || null,
        payment_method: paymentMethod
      });
      
      const { order_id, razorpay_order_id, razorpay_key_id, mocked } = res.data;
      
      if (paymentMethod === 'cod') {
        setSuccess(true);
        fetchCart();
      } else if (mocked) {
        // Automatically verify mock payment
        await api.post('/api/me/checkout/verify', {
          order_id: order_id.toString(),
          razorpay_order_id,
          razorpay_payment_id: 'pay_MOCK12345',
          razorpay_signature: 'mock_signature'
        });
        setSuccess(true);
        fetchCart();
      } else {
        toast.info('Actual Razorpay UI would open here');
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Checkout failed');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="container page-enter" style={{ padding: '6rem 1.5rem', textAlign: 'center' }}>
        <CheckCircle size={64} style={{ color: 'var(--accent-primary)', margin: '0 auto 1.5rem' }} />
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Order Confirmed!</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Thank you for your purchase. Your order is being processed.</p>
        <button className="btn btn-primary" onClick={() => navigate('/account')}>View My Orders</button>
      </div>
    );
  }

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    try {
      setCouponError('');
      const res = await api.get(`/api/me/coupon/${couponCode.trim()}`);
      setAppliedCoupon(res.data);
      toast.success('Coupon applied successfully!');
    } catch (err) {
      setCouponError(err.response?.data?.detail || 'Invalid or expired coupon');
      setAppliedCoupon(null);
    }
  };

  const subtotal = cart?.items?.reduce((acc, item) => acc + (item.product.price * item.quantity), 0) || 0;
  
  // Calculate discount
  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.min_order_amount && subtotal < appliedCoupon.min_order_amount) {
      // Don't apply if below min order amount
      setCouponError(`Minimum order of ₹${appliedCoupon.min_order_amount} required`);
    } else {
      let eligibleSubtotal = subtotal;
      if (appliedCoupon.category_slug) {
        eligibleSubtotal = cart?.items?.reduce((acc, item) => {
          if (item.product.category_slug === appliedCoupon.category_slug) {
             return acc + (item.product.price * item.quantity);
          }
          return acc;
        }, 0) || 0;
      }

      if (eligibleSubtotal === 0 && appliedCoupon.category_slug) {
        setCouponError(`Coupon only valid for ${appliedCoupon.category_slug} category`);
      } else {
        setCouponError('');
        if (appliedCoupon.discount_type === 'percent') {
          discountAmount = eligibleSubtotal * (appliedCoupon.discount_value / 100);
        } else {
          discountAmount = Math.min(appliedCoupon.discount_value, eligibleSubtotal);
        }
      }
    }
  }

  const shipping = subtotal > 1000 ? 0 : 50;
  const subtotalAfterDiscount = Math.max(0, subtotal - discountAmount);
  const tax = subtotalAfterDiscount * 0.05; // 5% tax
  const total = subtotalAfterDiscount + shipping + tax;

  return (
    <div className="container page-enter" style={{ padding: '4rem 1.5rem' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>Checkout</h1>
      
      <div className="grid grid-cols-2 gap-12">
        <div>
          {showAddressForm ? (
            <div className="card" style={{ padding: '2.5rem', marginBottom: '2rem', border: '1px solid var(--border-strong)', boxShadow: '0 8px 30px rgba(0,0,0,0.04)' }}>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <MapPin className="text-accent-primary" /> Add New Address
              </h2>
              <form onSubmit={handleAddAddress} className="flex flex-col gap-4">
                <input type="text" placeholder="Full Name" required value={newAddress.full_name} onChange={e => setNewAddress({...newAddress, full_name: e.target.value})} />
                <input type="text" placeholder="Phone Number" required value={newAddress.phone} onChange={e => setNewAddress({...newAddress, phone: e.target.value})} />
                <input type="text" placeholder="Address Line 1" required value={newAddress.line1} onChange={e => setNewAddress({...newAddress, line1: e.target.value})} />
                <input type="text" placeholder="Address Line 2 (Optional)" value={newAddress.line2} onChange={e => setNewAddress({...newAddress, line2: e.target.value})} />
                <div className="grid grid-cols-2 gap-4">
                  <input type="text" placeholder="City" required value={newAddress.city} onChange={e => setNewAddress({...newAddress, city: e.target.value})} />
                  <input type="text" placeholder="State" required value={newAddress.state} onChange={e => setNewAddress({...newAddress, state: e.target.value})} />
                </div>
                <input type="text" placeholder="Postal Code" required value={newAddress.postal_code} onChange={e => setNewAddress({...newAddress, postal_code: e.target.value})} />
                <div className="flex gap-4 mt-2">
                  <button type="submit" className="btn btn-primary" disabled={loading}>Save Address</button>
                  <button type="button" className="btn" onClick={() => setShowAddressForm(false)}>Cancel</button>
                </div>
              </form>
            </div>
          ) : (
            <form onSubmit={handleCheckout} className="flex flex-col gap-6">
              <div className="card" style={{ padding: '2.5rem', border: '1px solid var(--border-light)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                <div className="flex justify-between items-center mb-6">
                  <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <MapPin className="text-accent-primary" /> Shipping Address
                  </h2>
                  {addresses.length < 3 && (
                    <button type="button" onClick={() => setShowAddressForm(true)} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 1rem', fontSize: '0.9rem' }}>
                      <Plus size={16} /> Add New
                    </button>
                  )}
                </div>
                
                {addresses.length === 0 ? (
                  <div style={{ padding: '3rem 2rem', textAlign: 'center', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-strong)' }}>
                    <div style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>You haven't saved any delivery addresses yet.</div>
                    <button type="button" onClick={() => setShowAddressForm(true)} className="btn btn-primary">
                      <Plus size={18} /> Add New Address
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {addresses.map(addr => (
                      <label key={addr.id} style={{ display: 'flex', gap: '1rem', padding: '1.25rem', border: '2px solid var(--border-light)', borderRadius: 'var(--radius-lg)', cursor: 'pointer', background: selectedAddress === addr.id.toString() ? 'rgba(16,185,129,0.05)' : 'var(--bg-tertiary)', borderColor: selectedAddress === addr.id.toString() ? 'var(--accent-primary)' : 'var(--border-light)', transition: 'all 0.2s ease', position: 'relative' }}>
                        <div style={{ paddingTop: '0.25rem' }}>
                          <input type="radio" name="address" value={addr.id} checked={selectedAddress === addr.id.toString()} onChange={e => setSelectedAddress(e.target.value)} style={{ width: '1.2rem', height: '1.2rem', accentColor: 'var(--accent-primary)' }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: '1.05rem', color: selectedAddress === addr.id.toString() ? 'var(--accent-primary)' : 'inherit' }}>{addr.full_name} <span className="badge badge-info" style={{ marginLeft: '0.5rem' }}>{addr.label}</span></div>
                          <div style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginTop: '0.5rem', lineHeight: 1.5 }}>
                            {addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}<br/>
                            {addr.city}, {addr.state} {addr.postal_code}
                          </div>
                          <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Phone: {addr.phone}</div>
                        </div>
                        <button type="button" onClick={(e) => handleDeleteAddress(addr.id, e)} style={{ position: 'absolute', top: '1rem', right: '1rem', color: 'var(--text-muted)', padding: '0.5rem', borderRadius: '50%' }} className="hover:bg-red-50 hover:text-red-500 transition-colors">
                          <Trash2 size={18} />
                        </button>
                      </label>
                    ))}
                    {addresses.length >= 3 && (
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '0.5rem' }}>
                        Maximum of 3 addresses reached. Delete an address to add a new one.
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="card" style={{ padding: '2.5rem', border: '1px solid var(--border-light)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <CreditCard className="text-accent-primary" /> Payment Method
                </h2>
                <div className="flex flex-col gap-4">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem', border: '2px solid var(--border-light)', borderRadius: 'var(--radius-lg)', cursor: 'pointer', background: paymentMethod === 'razorpay' ? 'rgba(16,185,129,0.05)' : 'var(--bg-tertiary)', borderColor: paymentMethod === 'razorpay' ? 'var(--accent-primary)' : 'var(--border-light)', transition: 'all 0.2s ease' }}>
                    <input type="radio" name="payment" value="razorpay" checked={paymentMethod === 'razorpay'} onChange={e => setPaymentMethod(e.target.value)} style={{ width: '1.2rem', height: '1.2rem', accentColor: 'var(--accent-primary)' }} />
                    <span style={{ fontWeight: 500, fontSize: '1.05rem' }}>Credit Card / UPI / Netbanking (Razorpay)</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem', border: '2px solid var(--border-light)', borderRadius: 'var(--radius-lg)', cursor: 'pointer', background: paymentMethod === 'cod' ? 'rgba(16,185,129,0.05)' : 'var(--bg-tertiary)', borderColor: paymentMethod === 'cod' ? 'var(--accent-primary)' : 'var(--border-light)', transition: 'all 0.2s ease' }}>
                    <input type="radio" name="payment" value="cod" checked={paymentMethod === 'cod'} onChange={e => setPaymentMethod(e.target.value)} style={{ width: '1.2rem', height: '1.2rem', accentColor: 'var(--accent-primary)' }} />
                    <span style={{ fontWeight: 500, fontSize: '1.05rem' }}>Cash on Delivery</span>
                  </label>
                </div>
              </div>
              
              <div className="card" style={{ padding: '2.5rem', marginTop: '2rem', border: '1px solid var(--border-light)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Gift className="text-accent-primary" /> Have a Coupon?
                </h2>
                <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <input 
                      type="text" 
                      className="input" 
                      placeholder="Enter coupon code" 
                      value={couponCode} 
                      onChange={e => setCouponCode(e.target.value)} 
                      style={{ flex: 1 }}
                    />
                    <button type="button" onClick={handleApplyCoupon} className="btn btn-secondary">Apply</button>
                  </div>
                  {couponError && <div style={{ color: 'var(--danger)', fontSize: '0.9rem' }}>{couponError}</div>}
                  {appliedCoupon && !couponError && <div style={{ color: 'var(--accent-primary)', fontSize: '0.9rem' }}>{appliedCoupon.code} applied! (-{appliedCoupon.discount_type === 'percent' ? `${appliedCoupon.discount_value}%` : `₹${appliedCoupon.discount_value}`})</div>}
                </div>
              </div>
            </form>
          )}
        </div>
        
        <div>
          <div className="card" style={{ padding: '2.5rem', position: 'sticky', top: '100px', border: '1px solid var(--border-light)', boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <ShoppingBag className="text-accent-primary" /> Order Summary
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem', maxHeight: '300px', overflowY: 'auto' }}>
              {cart?.items?.map(item => (
                <div key={item.product_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '50px', height: '50px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                      {item.product.images?.[0] && <img src={getImageUrl(item.product.images[0])} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{item.product.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Qty: {item.quantity}</div>
                    </div>
                  </div>
                  <div style={{ fontWeight: 600 }}>₹{(item.product.price * item.quantity).toFixed(2)}</div>
                </div>
              ))}
            </div>
            
            <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', color: 'var(--text-secondary)' }}>
              <div className="flex justify-between"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
              {discountAmount > 0 && !couponError && (
                <div className="flex justify-between" style={{ color: 'var(--accent-primary)' }}>
                  <span>Discount ({appliedCoupon.code})</span>
                  <span>-₹{discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between"><span>Shipping</span><span>{shipping === 0 ? 'Free' : `₹${shipping.toFixed(2)}`}</span></div>
              <div className="flex justify-between"><span>Estimated Tax (5%)</span><span>₹{tax.toFixed(2)}</span></div>
            </div>
            
            <div style={{ borderTop: '1px solid var(--border-light)', marginTop: '1.5rem', paddingTop: '1.5rem', display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 700 }}>
              <span>Total</span>
              <span className="text-accent-gradient">₹{total.toFixed(2)}</span>
            </div>
            
            <button 
              type="button"
              onClick={handleCheckout}
              className="btn btn-primary" 
              style={{ width: '100%', padding: '1.25rem', marginTop: '2rem', fontSize: '1.1rem' }} 
              disabled={loading || cart?.items?.length === 0 || !selectedAddress}
            >
              {loading ? 'Processing securely...' : `Pay ₹${total.toFixed(2)} securely`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
