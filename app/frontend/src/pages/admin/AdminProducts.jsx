import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Edit2, Trash2, Search, X, Upload } from 'lucide-react';
import api, { API_BASE_URL, getImageUrl } from '../../lib/api';

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  
  // Form State
  const initialForm = {
    name: '', slug: '', description: '', price: '', compare_price: '',
    stock: 0, category_slug: '', brand: '', featured: false, active: true,
    images: '', tags: ''
  };
  const [formData, setFormData] = useState(initialForm);
  const [formError, setFormError] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

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
      const [prodRes, catRes] = await Promise.all([
        api.get('/api/admin/products'),
        api.get('/api/categories')
      ]);
      setProducts(prodRes.data);
      setCategories(catRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (product = null) => {
    setFormError('');
    if (product) {
      setEditingProduct(product);
      setFormData({
        ...product,
        images: product.images?.join(', ') || '',
        tags: product.tags?.join(', ') || '',
        compare_price: product.compare_price || ''
      });
    } else {
      setEditingProduct(null);
      setFormData(initialForm);
    }
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const uploadData = new FormData();
    uploadData.append('file', file);
    
    setUploadingImage(true);
    try {
      const res = await api.post('/api/admin/upload', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const currentImages = formData.images ? formData.images.split(',').map(s => s.trim()).filter(s => s) : [];
      currentImages.push(res.data.url);
      setFormData({...formData, images: currentImages.join(', ')});
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    
    // Parse strings back to arrays
    const payload = {
      ...formData,
      price: parseFloat(formData.price),
      compare_price: formData.compare_price ? parseFloat(formData.compare_price) : null,
      stock: parseInt(formData.stock, 10),
      images: formData.images ? formData.images.split(',').map(s => s.trim()).filter(Boolean) : [],
      tags: formData.tags ? formData.tags.split(',').map(s => s.trim()).filter(Boolean) : []
    };

    try {
      if (editingProduct) {
        await api.put(`/api/admin/products/${editingProduct.id}`, payload);
      } else {
        await api.post('/api/admin/products', payload);
      }
      setIsModalOpen(false);
      fetchData(); // Refresh table
    } catch (err) {
      setFormError(err.response?.data?.detail || 'An error occurred while saving.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this product? This cannot be undone.")) {
      try {
        await api.delete(`/api/admin/products/${id}`);
        setProducts(products.filter(p => p.id !== id));
      } catch (err) {
        alert("Failed to delete product.");
      }
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-col gap-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 style={{ fontSize: '2rem' }}>Products Management</h1>
          <p style={{ color: 'var(--text-muted)' }}>Create, edit, and manage store inventory.</p>
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          <Plus size={18} /> Add Product
        </button>
      </div>

      <div className="card" style={{ padding: '1.5rem' }}>
        <div className="flex justify-between items-center mb-4">
          <div style={{ position: 'relative', width: '300px' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search products..." 
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
                  <th style={{ padding: '1rem', fontWeight: 600 }}>Product</th>
                  <th style={{ padding: '1rem', fontWeight: 600 }}>Category</th>
                  <th style={{ padding: '1rem', fontWeight: 600 }}>Price</th>
                  <th style={{ padding: '1rem', fontWeight: 600 }}>Stock</th>
                  <th style={{ padding: '1rem', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '1rem', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td data-label="Product" style={{ padding: '1rem' }}>
                      <div className="flex items-center gap-4">
                        <img 
                          src={getImageUrl(p.images?.[0]) || 'https://via.placeholder.com/40'} 
                          alt={p.name} 
                          style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', objectFit: 'cover', background: 'var(--bg-tertiary)' }}
                        />
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ fontWeight: 600 }}>{p.name}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>/{p.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td data-label="Category" style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{p.category_slug}</td>
                    <td data-label="Price" style={{ padding: '1rem', fontWeight: 600 }}>${p.price.toFixed(2)}</td>
                    <td data-label="Stock" style={{ padding: '1rem' }}>
                      <span className={`badge ${p.stock > 10 ? 'badge-success' : p.stock > 0 ? 'badge-warning' : 'badge-danger'}`}>
                        {p.stock}
                      </span>
                    </td>
                    <td data-label="Status" style={{ padding: '1rem' }}>
                      {p.active ? <span className="badge badge-success">Active</span> : <span className="badge badge-danger">Draft</span>}
                    </td>
                    <td data-label="Actions" style={{ padding: '1rem', textAlign: 'right' }}>
                      <button onClick={() => handleOpenModal(p)} style={{ color: 'var(--info)', padding: '0.5rem', marginRight: '0.5rem' }} title="Edit">
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => handleDelete(p.id)} style={{ color: 'var(--danger)', padding: '0.5rem' }} title="Delete">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No products found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal overlay */}
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
            width: '100%', maxWidth: '800px', margin: '0 auto',
            display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)'
          }}>
            <div className="flex justify-between items-center modal-responsive-header" style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-light)' }}>
              <h2 style={{ fontSize: '1.5rem' }}>{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ color: 'var(--text-muted)' }}>
                <X size={24} />
              </button>
            </div>
            
            <div style={{ padding: '1.5rem' }}>
              {formError && (
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
                  {formError}
                </div>
              )}
              
              <form id="product-form" onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Product Name *</label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>URL Slug *</label>
                  <input required type="text" value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value.toLowerCase()})} />
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Category *</label>
                  <select required value={formData.category_slug} onChange={e => setFormData({...formData, category_slug: e.target.value})}>
                    <option value="">Select a category...</option>
                    {categories.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                  </select>
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Price ($) *</label>
                  <input required type="number" step="0.01" min="0" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Compare at Price ($)</label>
                  <input type="number" step="0.01" min="0" value={formData.compare_price} onChange={e => setFormData({...formData, compare_price: e.target.value})} />
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Stock Quantity *</label>
                  <input required type="number" min="0" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} />
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Brand</label>
                  <input type="text" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} />
                </div>
                
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Description *</label>
                  <textarea required rows="4" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
                </div>
                
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Images</label>
                  
                  {formData.images && (
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                      {formData.images.split(',').map(s => s.trim()).filter(s=>s).map((imgUrl, idx) => (
                        <div key={idx} style={{ position: 'relative', width: '80px', height: '80px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border-light)' }}>
                          <img src={imgUrl.startsWith('http') ? imgUrl : `${API_BASE_URL}${imgUrl}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="preview" />
                          <button 
                            type="button" 
                            onClick={() => {
                              const arr = formData.images.split(',').map(s => s.trim()).filter(s=>s);
                              arr.splice(idx, 1);
                              setFormData({...formData, images: arr.join(', ')});
                            }}
                            style={{ position: 'absolute', top: 0, right: 0, background: 'rgba(0,0,0,0.5)', color: '#fff', padding: '0.1rem' }}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.25rem' }}>Upload Local File</label>
                      <input type="file" accept="image/png, image/jpeg, image/webp" onChange={handleImageUpload} disabled={uploadingImage} style={{ padding: '0.5rem', border: '1px dashed var(--border-light)', borderRadius: 'var(--radius-md)', width: '100%' }} />
                      {uploadingImage && <small style={{ color: 'var(--info)' }}>Uploading...</small>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.25rem' }}>Or Paste URLs (comma separated)</label>
                      <input type="text" placeholder="https://..." value={formData.images} onChange={e => setFormData({...formData, images: e.target.value})} />
                    </div>
                  </div>
                </div>
                
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Tags (comma separated)</label>
                  <input type="text" placeholder="new, summer, sale" value={formData.tags} onChange={e => setFormData({...formData, tags: e.target.value})} />
                </div>

                <div style={{ gridColumn: 'span 2', display: 'flex', gap: '2rem', marginTop: '0.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={formData.active} onChange={e => setFormData({...formData, active: e.target.checked})} style={{ width: 'auto' }} />
                    Active (Visible in store)
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={formData.featured} onChange={e => setFormData({...formData, featured: e.target.checked})} style={{ width: 'auto' }} />
                    Featured Product
                  </label>
                </div>
              </form>
            </div>
            
            <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button form="product-form" type="submit" className="btn btn-primary">
                {editingProduct ? 'Save Changes' : 'Create Product'}
              </button>
            </div>
          </div>
        </div>
      , document.body)}
    </div>
  );
};

export default AdminProducts;
