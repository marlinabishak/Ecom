import React, { useState, useEffect } from 'react';
import { Heart, Trash2, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import api, { getImageUrl } from '../lib/api';

const Wishlist = () => {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      const res = await api.get('/api/me/wishlist');
      setWishlist(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (productId) => {
    try {
      await api.delete(`/api/me/wishlist/${productId}`);
      setWishlist(wishlist.filter(p => p.id !== productId));
    } catch (err) {
      alert("Failed to remove item.");
    }
  };

  const handleAddToCart = async (productId) => {
    try {
      await api.post('/api/me/cart', { product_id: productId, quantity: 1 });
      alert("Added to cart!");
    } catch (err) {
      alert("Failed to add to cart.");
    }
  };

  return (
    <div className="container page-enter" style={{ padding: '4rem 1.5rem', minHeight: '60vh' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>My Wishlist</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Save items you love and buy them later.</p>
        </div>

      {loading ? (
        <div style={{ padding: '4rem', display: 'flex', justifyContent: 'center' }}><div className="spinner"></div></div>
      ) : wishlist.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)' }}>
          <Heart size={48} style={{ margin: '0 auto 1rem auto', color: 'var(--text-muted)' }} />
          <h2 style={{ marginBottom: '1rem' }}>Your wishlist is empty</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Save items you love and buy them later.</p>
          <Link to="/shop" className="btn btn-primary">Explore Products</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlist.map(product => (
            <div key={product.id} className="card flex flex-col h-full">
              <Link to={`/product/${product.slug}`} style={{ display: 'block', height: '200px', overflow: 'hidden' }}>
                <img 
                  src={getImageUrl(product.images?.[0]) || 'https://via.placeholder.com/300'} 
                  alt={product.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </Link>
              <div style={{ padding: '1.5rem', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>{product.name}</h3>
                <div style={{ fontWeight: 700, fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--accent-primary)' }}>
                  ${product.price.toFixed(2)}
                </div>
                <div style={{ marginTop: 'auto', display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => handleAddToCart(product.id)} className="btn btn-primary" style={{ flexGrow: 1, padding: '0.5rem' }}>
                    <ShoppingCart size={18} /> Add to Cart
                  </button>
                  <button onClick={() => handleRemove(product.id)} className="btn btn-secondary" style={{ padding: '0.5rem' }}>
                    <Trash2 size={18} color="var(--danger)" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
};

export default Wishlist;
