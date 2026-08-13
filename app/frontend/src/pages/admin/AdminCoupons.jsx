import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Trash2, Search, X } from 'lucide-react';
import api from '../../lib/api';

const AdminCoupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  
  const [restrictionType, setRestrictionType] = useState('none');
  const [productSearch, setProductSearch] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  
  const initialForm = { code: '', description: '', discount_type: 'percent', discount_value: '', min_order_amount: '0', active: true, category_slug: '', product_id: '', expires_at: '' };
  const [formData, setFormData] = useState(initialForm);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isModalOpen]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [couponRes, catRes, prodRes] = await Promise.all([
        api.get('/api/admin/coupons'),
        api.get('/api/categories'),
        api.get('/api/admin/products')
      ]);
      setCoupons(couponRes.data);
      setCategories(catRes.data);
      setProducts(prodRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = () => {
    setFormError('');
    setFormData(initialForm);
    setRestrictionType('none');
    setProductSearch('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    
    const payload = {
      ...formData,
      code: formData.code.toUpperCase(),
      discount_value: parseFloat(formData.discount_value),
      min_order_amount: parseFloat(formData.min_order_amount)
    };
    
    if (restrictionType !== 'category') delete payload.category_slug;
    if (restrictionType !== 'product') delete payload.product_id;
    else if (payload.product_id) payload.product_id = parseInt(payload.product_id);
    
    if (!payload.expires_at) {
      delete payload.expires_at;
    } else {
      payload.expires_at = new Date(payload.expires_at).toISOString();
    }

    try {
      await api.post('/api/admin/coupons', payload);
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      setFormError(err.response?.data?.detail || 'An error occurred while creating.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this coupon?")) {
      try {
        await api.delete(`/api/admin/coupons/${id}`);
        setCoupons(coupons.filter(c => c.id !== id));
      } catch (err) {
        alert("Failed to delete coupon.");
      }
    }
  };

  const filtered = coupons.filter(c => 
    c.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-col gap-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 style={{ fontSize: '2rem' }}>Coupon Management</h1>
          <p style={{ color: 'var(--text-muted)' }}>Generate and manage promotional discount codes.</p>
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          <Plus size={18} /> Generate Coupon
        </button>
      </div>

      <div className="card" style={{ padding: '1.5rem' }}>
        <div className="flex justify-between items-center mb-4">
          <div style={{ position: 'relative', width: '300px' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search codes..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2.5rem' }}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '4rem', display: 'flex', justifyContent: 'center' }}><div className="spinner"></div></div>
        ) : (
          <div className="responsive-table">
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '1rem', fontWeight: 600 }}>Code</th>
                  <th style={{ padding: '1rem', fontWeight: 600 }}>Discount</th>
                  <th style={{ padding: '1rem', fontWeight: 600 }}>Min. Order</th>
                  <th style={{ padding: '1rem', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '1rem', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td data-label="Code" style={{ padding: '1rem', fontWeight: 700, letterSpacing: '0.1em' }}>{c.code}</td>
                    <td data-label="Discount" style={{ padding: '1rem' }}>
                      {c.discount_type === 'percent' ? `${c.discount_value}% OFF` : `$${c.discount_value.toFixed(2)} OFF`}
                    </td>
                    <td data-label="Min. Order" style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                      ${c.min_order_amount.toFixed(2)}
                    </td>
                    <td data-label="Status" style={{ padding: '1rem' }}>
                      {c.active ? <span className="badge badge-success">Active</span> : <span className="badge badge-danger">Disabled</span>}
                    </td>
                    <td data-label="Actions" style={{ padding: '1rem', textAlign: 'right' }}>
                      <button onClick={() => handleDelete(c.id)} style={{ color: 'var(--danger)', padding: '0.5rem' }} title="Delete">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No coupons found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && createPortal(
        <div 
          onClick={() => setIsModalOpen(false)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
            background: 'rgba(0,0,0,0.6)', zIndex: 100,
            overflowY: 'auto', padding: '3rem 1rem'
          }}
        >
          <div onClick={e => e.stopPropagation()} className="card" style={{ 
            width: '100%', maxWidth: '500px', margin: '0 auto',
            display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)'
          }}>
            <div className="flex justify-between items-center modal-responsive-header" style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-light)' }}>
              <h2 style={{ fontSize: '1.5rem' }}>Generate Coupon</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ color: 'var(--text-muted)' }}><X size={24} /></button>
            </div>
            
            <div style={{ padding: '1.5rem' }}>
              {formError && <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>{formError}</div>}
              
              <form id="coupon-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Coupon Code *</label>
                  <input required type="text" placeholder="e.g. SUMMER20" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Description</label>
                  <input type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Type *</label>
                    <select required value={formData.discount_type} onChange={e => setFormData({...formData, discount_type: e.target.value})}>
                      <option value="percent">Percentage (%)</option>
                      <option value="fixed">Fixed Amount ($)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Discount Value *</label>
                    <input required type="number" min="0" step="0.01" value={formData.discount_value} onChange={e => setFormData({...formData, discount_value: e.target.value})} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Min Order Amount</label>
                    <input type="number" min="0" step="0.01" value={formData.min_order_amount} onChange={e => setFormData({...formData, min_order_amount: e.target.value})} />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Restriction Type</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '1.5rem', background: 'var(--bg-secondary)', padding: '0.25rem', borderRadius: 'var(--radius-md)' }}>
                      <label style={{ 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem', textAlign: 'center',
                        cursor: 'pointer', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem',
                        background: restrictionType === 'none' ? 'var(--bg-primary)' : 'transparent',
                        boxShadow: restrictionType === 'none' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                        fontWeight: restrictionType === 'none' ? 600 : 400,
                        color: restrictionType === 'none' ? 'var(--text-primary)' : 'var(--text-secondary)',
                        transition: 'all 0.2s'
                      }}>
                        <input type="radio" name="restriction" checked={restrictionType === 'none'} onChange={() => setRestrictionType('none')} style={{ display: 'none' }} /> Entire Cart
                      </label>
                      <label style={{ 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem', textAlign: 'center',
                        cursor: 'pointer', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem',
                        background: restrictionType === 'category' ? 'var(--bg-primary)' : 'transparent',
                        boxShadow: restrictionType === 'category' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                        fontWeight: restrictionType === 'category' ? 600 : 400,
                        color: restrictionType === 'category' ? 'var(--text-primary)' : 'var(--text-secondary)',
                        transition: 'all 0.2s'
                      }}>
                        <input type="radio" name="restriction" checked={restrictionType === 'category'} onChange={() => setRestrictionType('category')} style={{ display: 'none' }} /> Specific Category
                      </label>
                      <label style={{ 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem', textAlign: 'center',
                        cursor: 'pointer', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem',
                        background: restrictionType === 'product' ? 'var(--bg-primary)' : 'transparent',
                        boxShadow: restrictionType === 'product' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                        fontWeight: restrictionType === 'product' ? 600 : 400,
                        color: restrictionType === 'product' ? 'var(--text-primary)' : 'var(--text-secondary)',
                        transition: 'all 0.2s'
                      }}>
                        <input type="radio" name="restriction" checked={restrictionType === 'product'} onChange={() => setRestrictionType('product')} style={{ display: 'none' }} /> Specific Product
                      </label>
                    </div>
                  </div>
                  
                  {restrictionType === 'category' && (
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Select Category</label>
                      <select required value={formData.category_slug} onChange={e => setFormData({...formData, category_slug: e.target.value})}>
                        <option value="">-- Choose Category --</option>
                        {categories.map(c => <option key={c.id} value={c.slug}>{c.name}</option>)}
                      </select>
                    </div>
                  )}
                  
                  {restrictionType === 'product' && (
                    <div style={{ gridColumn: '1 / -1', position: 'relative' }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Select Product</label>
                      
                      {formData.product_id ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'var(--bg-secondary)', border: '1px solid var(--accent-primary)', borderRadius: 'var(--radius-md)' }}>
                          <span style={{ fontWeight: 500 }}>{products.find(p => p.id === formData.product_id)?.name || 'Product Selected'}</span>
                          <button type="button" onClick={() => setFormData({...formData, product_id: ''})} style={{ color: 'var(--text-muted)' }}><X size={18} /></button>
                        </div>
                      ) : (
                        <div style={{ position: 'relative' }}>
                          <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                          <input 
                            type="text" 
                            placeholder="Type product name to search..." 
                            value={productSearch}
                            onChange={e => { setProductSearch(e.target.value); setShowProductDropdown(true); }}
                            onFocus={() => setShowProductDropdown(true)}
                            style={{ paddingLeft: '2.5rem' }}
                          />
                          {showProductDropdown && productSearch && (
                            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg-primary)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', marginTop: '0.5rem', maxHeight: '200px', overflowY: 'auto', zIndex: 10 }}>
                              {products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase())).map(p => (
                                <div 
                                  key={p.id} 
                                  onClick={() => { setFormData({...formData, product_id: p.id}); setShowProductDropdown(false); setProductSearch(''); }}
                                  style={{ padding: '0.75rem 1rem', cursor: 'pointer', borderBottom: '1px solid var(--border-light)' }}
                                  onMouseOver={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                                >
                                  {p.name}
                                </div>
                              ))}
                              {products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase())).length === 0 && (
                                <div style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>No products found.</div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={formData.active} onChange={e => setFormData({...formData, active: e.target.checked})} style={{ width: 'auto' }} />
                    <span style={{ fontWeight: 500 }}>Active</span>
                  </label>
                </div>
              </form>
            </div>
            
            <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'flex-end', gap: '1rem', background: 'var(--bg-tertiary)' }}>
              <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">Cancel</button>
              <button type="submit" form="coupon-form" className="btn btn-primary" disabled={saving}>
                {saving ? 'Generating...' : 'Generate Coupon'}
              </button>
            </div>
          </div>
        </div>
      , document.body)}
    </div>
  );
};

export default AdminCoupons;
