import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { X, Trash2, ShoppingBag } from 'lucide-react';
import { getImageUrl } from '../lib/api';

const CartDrawer = () => {
  const { cart, isCartOpen, toggleCart, updateQuantity, removeFromCart } = useCart();
  const navigate = useNavigate();

  if (!isCartOpen) return null;

  const items = cart?.items || [];
  const subtotal = cart?.subtotal || 0;

  return (
    <>
      <div 
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99, backdropFilter: 'blur(4px)' }}
        onClick={toggleCart}
      />
      <div 
        className="glass-panel"
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, width: '400px', maxWidth: '100vw',
          zIndex: 100, borderRadius: 0, borderRight: 'none', borderTop: 'none', borderBottom: 'none',
          display: 'flex', flexDirection: 'column', animation: 'slideInRight 0.3s forwards'
        }}
      >
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShoppingBag size={20} /> Your Cart
          </h2>
          <button onClick={toggleCart} style={{ color: 'var(--text-muted)' }}>
            <X size={24} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {items.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '2rem' }}>
              <ShoppingBag size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
              <p>Your cart is empty.</p>
              <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => { toggleCart(); navigate('/shop'); }}>
                Continue Shopping
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.product_id} style={{ display: 'flex', gap: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-light)' }}>
                <div style={{ width: '80px', height: '80px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                  {item.product.images?.[0] ? (
                    <img src={getImageUrl(item.product.images[0])} alt={item.product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No Img</div>
                  )}
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.product.name}</div>
                  <div style={{ color: 'var(--accent-primary)', fontWeight: 600, marginTop: '0.25rem' }}>₹{item.product.price}</div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                      <button onClick={() => updateQuantity(item.product_id, item.quantity - 1)} style={{ padding: '0.2rem 0.5rem', color: 'var(--text-primary)' }}>-</button>
                      <span style={{ fontSize: '0.8rem', width: '20px', textAlign: 'center' }}>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.product_id, item.quantity + 1)} style={{ padding: '0.2rem 0.5rem', color: 'var(--text-primary)' }}>+</button>
                    </div>
                    <button onClick={() => removeFromCart(item.product_id)} style={{ color: 'var(--danger)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                      <Trash2 size={14} /> Remove
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-light)', background: 'var(--bg-secondary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 600 }}>
              <span>Subtotal:</span>
              <span className="text-accent-gradient">₹{subtotal.toFixed(2)}</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Taxes and shipping calculated at checkout.</p>
            <button 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '1rem' }}
              onClick={() => { toggleCart(); navigate('/checkout'); }}
            >
              Checkout Now
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </>
  );
};

export default CartDrawer;
