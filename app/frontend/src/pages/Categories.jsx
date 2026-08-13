import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LayoutGrid, ArrowRight } from 'lucide-react';
import api from '../lib/api';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/categories')
      .then(res => {
        setCategories(res.data);
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  return (
    <div className="container page-enter" style={{ padding: '4rem 1.5rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>Browse Categories</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto' }}>
          Explore our wide selection of premium products organized by category.
        </p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <div className="spinner"></div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-6">
          {categories.map(category => (
            <Link 
              key={category.id} 
              to={`/shop?category=${category.slug}`}
              className="card"
              style={{ 
                padding: '3rem 2rem', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                textAlign: 'center',
                gap: '1.5rem',
                transition: 'transform var(--transition-normal), border-color var(--transition-normal)',
              }}
              onMouseOver={e => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
              onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border-light)'}
            >
              <div style={{ 
                width: '80px', 
                height: '80px', 
                borderRadius: '50%', 
                background: 'var(--bg-secondary)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: 'var(--accent-primary)'
              }}>
                <LayoutGrid size={32} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{category.name}</h3>
                <p style={{ color: 'var(--text-muted)' }}>{category.description || 'Explore products in this category'}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-primary)', fontWeight: 600, marginTop: '1rem' }}>
                View Collection <ArrowRight size={16} />
              </div>
            </Link>
          ))}
        </div>
      )}

      {!loading && categories.length === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          No categories found. Check back later!
        </div>
      )}
    </div>
  );
};

export default Categories;
