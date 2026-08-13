import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../lib/api';
import ProductCard from '../components/ProductCard';

const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [q, setQ] = useState(searchParams.get('q') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [sort, setSort] = useState(searchParams.get('sort') || 'newest');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  useEffect(() => {
    api.get('/api/categories').then(res => setCategories(res.data)).catch(console.error);
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        let url = `/api/products?sort=${sort}`;
        if (category) url += `&category=${category}`;
        if (q) url += `&q=${q}`;
        
        const res = await api.get(url);
        setProducts(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [category, q, sort]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [category, q, sort]);

  const totalPages = Math.ceil(products.length / itemsPerPage);
  const displayedProducts = products.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSearch = (e) => {
    e.preventDefault();
    const newParams = new URLSearchParams(searchParams);
    if (q) newParams.set('q', q); else newParams.delete('q');
    setSearchParams(newParams);
  };

  const handleCategory = (c) => {
    setCategory(c);
    const newParams = new URLSearchParams(searchParams);
    if (c) newParams.set('category', c); else newParams.delete('category');
    setSearchParams(newParams);
  };

  return (
    <div className="container page-enter shop-layout" style={{ padding: '3rem 1.5rem' }}>
      {/* Sidebar Filters */}
      <aside className="shop-sidebar">
        <div style={{ position: 'sticky', top: '100px' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Filters</h2>
          
          <form onSubmit={handleSearch} style={{ marginBottom: '2rem' }}>
            <input 
              type="text" 
              placeholder="Search products..." 
              value={q} 
              onChange={e => setQ(e.target.value)} 
            />
          </form>
          
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>Categories</h3>
            <ul className="shop-categories-list no-scrollbar">
              <li style={{ flexShrink: 0 }}>
                <button 
                  onClick={() => handleCategory('')}
                  style={{ color: category === '' ? 'var(--accent-primary)' : 'var(--text-primary)', fontWeight: category === '' ? 600 : 400, whiteSpace: 'nowrap' }}
                >
                  All Products
                </button>
              </li>
              {categories.map(c => (
                <li key={c.id} style={{ flexShrink: 0 }}>
                  <button 
                    onClick={() => handleCategory(c.slug)}
                    style={{ color: category === c.slug ? 'var(--accent-primary)' : 'var(--text-primary)', fontWeight: category === c.slug ? 600 : 400, whiteSpace: 'nowrap' }}
                  >
                    {c.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </aside>

      {/* Main Grid */}
      <div style={{ flex: 1 }}>
        <div className="flex justify-between items-center filters-responsive" style={{ marginBottom: '2rem', gap: '1rem' }}>
          <h1 style={{ fontSize: '2rem', display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: '0.5rem' }}>
            <span>{category ? categories.find(c => c.slug === category)?.name : 'All Products'}</span>
            <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 400 }}>({products.length} items)</span>
          </h1>
          
          <select value={sort} onChange={e => setSort(e.target.value)} style={{ width: 'auto', background: 'var(--bg-secondary)' }}>
            <option value="newest">Newest Arrivals</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="name">Name: A-Z</option>
          </select>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><div className="spinner"></div></div>
        ) : products.length === 0 ? (
          <div style={{ padding: '4rem', textAlign: 'center', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)' }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>No products found</h3>
            <p style={{ color: 'var(--text-muted)' }}>Try adjusting your search or filter criteria.</p>
          </div>
        ) : (
          <>
            <div className="shop-grid">
              {displayedProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginTop: '4rem' }}>
                <button 
                  className="pagination-btn"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  &larr;
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button 
                    key={page}
                    className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                ))}

                <button 
                  className="pagination-btn"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  &rarr;
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Shop;
