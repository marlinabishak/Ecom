import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { getImageUrl } from '../lib/api';
import { useCart } from '../context/CartContext';
import { ShoppingCart, Heart, Shield, Truck, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'react-toastify';

const ProductDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    api.get(`/api/products/${slug}`)
      .then(res => { setProduct(res.data); setLoading(false); })
      .catch(() => { navigate('/404'); });
  }, [slug, navigate]);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '8rem' }}><div className="spinner"></div></div>;
  if (!product) return null;

  const images = product.images?.length > 0 ? product.images : ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1000&q=80'];

  const nextImage = () => setCurrentImageIndex((prev) => (prev + 1) % images.length);
  const prevImage = () => setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);

  return (
    <div className="container page-enter py-responsive" style={{ paddingLeft: '1.5rem', paddingRight: '1.5rem' }}>
      <div className="grid grid-cols-2 gap-responsive" style={{ alignItems: 'start' }}>
        
        {/* Images Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', maxWidth: '550px', justifySelf: 'center' }}>
          <div style={{ position: 'relative', borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: '#ffffff', aspectRatio: '1/1', maxHeight: '450px', width: '100%', display: 'flex', justifySelf: 'center', justifyContent: 'center', alignItems: 'center', padding: '2rem', border: '1px solid var(--border-light)' }}>
            <img src={getImageUrl(images[currentImageIndex])} alt={product.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', transition: 'opacity 0.3s' }} />
            
            {images.length > 1 && (
              <>
                <button onClick={prevImage} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', color: 'white', borderRadius: '50%', padding: '0.5rem' }}>
                  <ChevronLeft size={24} />
                </button>
                <button onClick={nextImage} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', color: 'white', borderRadius: '50%', padding: '0.5rem' }}>
                  <ChevronRight size={24} />
                </button>
              </>
            )}
          </div>
          
          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-4 no-scrollbar" style={{ overflowX: 'auto', paddingBottom: '0.5rem', marginTop: '0.5rem' }}>
              {images.map((img, idx) => (
                <div 
                  key={idx} 
                  onClick={() => setCurrentImageIndex(idx)}
                  style={{ 
                    width: '90px', height: '90px', flexShrink: 0, borderRadius: 'var(--radius-md)', background: '#fff', cursor: 'pointer', overflow: 'hidden',
                    border: currentImageIndex === idx ? '2px solid var(--accent-primary)' : '1px solid var(--border-light)',
                    display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '0.5rem', opacity: currentImageIndex === idx ? 1 : 0.6,
                    transition: 'all 0.2s'
                  }}
                >
                  <img src={getImageUrl(img)} alt={`${product.name} thumbnail`} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Info Column */}
        <div className="flex flex-col">
          <div style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem', fontWeight: 600 }}>
            {product.brand || product.category_slug}
          </div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', lineHeight: 1.2 }}>{product.name}</h1>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
            <span style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent-primary)' }}>₹{product.price}</span>
            {product.compare_price && (
              <span style={{ fontSize: '1.25rem', textDecoration: 'line-through', color: 'var(--text-muted)' }}>₹{product.compare_price}</span>
            )}
          </div>

          <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: 1.8 }}>
            {product.description}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '3rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} style={{ padding: '1rem 1.25rem', color: 'var(--text-primary)' }}>-</button>
              <span style={{ fontSize: '1.1rem', width: '30px', textAlign: 'center', fontWeight: 600 }}>{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)} style={{ padding: '1rem 1.25rem', color: 'var(--text-primary)' }}>+</button>
            </div>
            
            <button 
              className="btn btn-primary" 
              style={{ flex: 1, padding: '1rem', fontSize: '1.1rem' }}
              onClick={() => addToCart(product.id, quantity)}
            >
              <ShoppingCart size={20} /> Add to Cart
            </button>
            
            <button 
              className="btn btn-secondary" 
              style={{ padding: '1rem' }}
              onClick={() => {
                api.post('/api/me/wishlist', { product_id: product.id.toString() })
                   .then(() => toast.success('Added to wishlist'))
                   .catch(() => toast.error('Please login first'));
              }}
            >
              <Heart size={20} />
            </button>
          </div>
          
          <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="flex items-center gap-3" style={{ color: 'var(--text-secondary)' }}>
              <Truck size={20} className="text-accent-primary" /> Free shipping on orders over ₹999
            </div>
            <div className="flex items-center gap-3" style={{ color: 'var(--text-secondary)' }}>
              <Shield size={20} className="text-accent-primary" /> 1 Year Manufacturer Warranty
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
