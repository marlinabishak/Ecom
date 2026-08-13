import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { getImageUrl } from '../lib/api';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const image = getImageUrl(product.images?.[0]) || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80';

  return (
    <div className="card" style={{ position: 'relative', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Link to={`/product/${product.slug}`} style={{ display: 'block', width: '100%', aspectRatio: '1/1', overflow: 'hidden', background: '#ffffff', position: 'relative' }}>
        <img 
          src={image} 
          alt={product.name} 
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'contain', transition: 'transform var(--transition-normal)' }} 
          onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
        />
      </Link>
      
      {product.compare_price && (
        <div style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'var(--danger)', color: '#fff', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', fontWeight: 600 }}>
          SALE
        </div>
      )}
      
      <div className="product-card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
          {product.brand || product.category_slug}
        </div>
        <Link to={`/product/${product.slug}`} className="product-card-title" style={{ fontWeight: 600, marginBottom: '0.5rem', flex: 1 }}>
          {product.name}
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span className="product-card-price" style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>₹{product.price}</span>
            {product.compare_price && (
              <span className="product-card-compare" style={{ textDecoration: 'line-through', color: 'var(--text-muted)' }}>
                ₹{product.compare_price}
              </span>
            )}
          </div>
          <button 
            className="btn btn-primary" 
            style={{ padding: '0.5rem', borderRadius: '50%' }}
            onClick={() => addToCart(product.id, 1)}
            title="Add to Cart"
          >
            <ShoppingCart size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
