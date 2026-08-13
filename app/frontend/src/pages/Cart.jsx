import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { Trash2, ArrowRight } from 'lucide-react';
import { getImageUrl } from '../lib/api';

const Cart = () => {
  const { cart, updateQuantity, removeFromCart } = useCart();
  const navigate = useNavigate();
  
  const items = cart?.items || [];
  const subtotal = cart?.subtotal || 0;

  if (items.length === 0) {
    return (
      <div className="container page-enter" style={{ padding: '6rem 1.5rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1.5rem' }}>Your Cart is Empty</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Looks like you haven't added anything yet.</p>
        <Link to="/shop" className="btn btn-primary">Start Shopping</Link>
      </div>
    );
  }

  return (
    <div className="container page-enter" style={{ padding: '4rem 1.5rem' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>Shopping Cart</h1>
      
      <div className="grid grid-cols-3 gap-12">
        <div style={{ gridColumn: 'span 2' }}>
          <div className="responsive-table" style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', padding: '2rem', border: '1px solid var(--border-light)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-light)', textAlign: 'left' }}>
                  <th style={{ paddingBottom: '1rem', color: 'var(--text-muted)' }}>Product</th>
                  <th style={{ paddingBottom: '1rem', color: 'var(--text-muted)' }}>Quantity</th>
                  <th style={{ paddingBottom: '1rem', color: 'var(--text-muted)', textAlign: 'right' }}>Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.product_id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td data-label="Product" style={{ padding: '1.5rem 0' }}>
                      <div className="flex items-center gap-4">
                        <div style={{ width: '80px', height: '80px', borderRadius: 'var(--radius-md)', overflow: 'hidden', background: 'var(--bg-tertiary)' }}>
                          {item.product.images?.[0] && <img src={getImageUrl(item.product.images[0])} alt={item.product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                        </div>
                        <div style={{ textAlign: 'left' }}>
                          <Link to={`/product/${item.product.slug}`} style={{ fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>
                            {item.product.name}
                          </Link>
                          <div style={{ color: 'var(--text-secondary)' }}>₹{item.product.price}</div>
                        </div>
                      </div>
                    </td>
                    <td data-label="Quantity" style={{ padding: '1.5rem 0' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                        <button onClick={() => updateQuantity(item.product_id, item.quantity - 1)} style={{ padding: '0.5rem 0.75rem' }}>-</button>
                        <span style={{ width: '30px', textAlign: 'center', fontWeight: 600 }}>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.product_id, item.quantity + 1)} style={{ padding: '0.5rem 0.75rem' }}>+</button>
                      </div>
                    </td>
                    <td data-label="Total" style={{ padding: '1.5rem 0', textAlign: 'right', fontWeight: 600, color: 'var(--accent-primary)' }}>
                      ₹{(item.product.price * item.quantity).toFixed(2)}
                    </td>
                    <td data-label="Actions" style={{ padding: '1.5rem 0', textAlign: 'right' }}>
                      <button onClick={() => removeFromCart(item.product_id)} style={{ color: 'var(--text-muted)', padding: '0.5rem' }}>
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div>
          <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', padding: '2rem', border: '1px solid var(--border-light)', position: 'sticky', top: '100px' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Order Summary</h2>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
              <span>Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
              <span>Shipping & Taxes</span>
              <span>Calculated at checkout</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', paddingTop: '1rem', borderTop: '1px solid var(--border-light)', fontWeight: 700, fontSize: '1.25rem' }}>
              <span>Estimated Total</span>
              <span className="text-accent-gradient">₹{subtotal.toFixed(2)}</span>
            </div>
            
            <button className="btn btn-primary" style={{ width: '100%', padding: '1rem' }} onClick={() => navigate('/checkout')}>
              Proceed to Checkout <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
