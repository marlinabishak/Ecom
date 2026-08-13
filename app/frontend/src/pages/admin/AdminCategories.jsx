import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Edit, Trash2, Search, X, Upload } from 'lucide-react';
import api, { API_BASE_URL } from '../../lib/api';

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  
  const initialForm = { name: '', slug: '', description: '', image: '', parent_slug: '' };
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
      const res = await api.get('/api/categories');
      setCategories(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (category = null) => {
    setFormError('');
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name || '',
        slug: category.slug || '',
        description: category.description || '',
        image: category.image || '',
        parent_slug: category.parent_slug || ''
      });
    } else {
      setEditingCategory(null);
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
      setFormData({...formData, image: res.data.url});
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    
    try {
      if (editingCategory) {
        await api.put(`/api/admin/categories/${editingCategory.id}`, formData);
      } else {
        await api.post('/api/admin/categories', formData);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      setFormError(err.response?.data?.detail || 'An error occurred while saving.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this category? Products in this category might break.")) {
      try {
        await api.delete(`/api/admin/categories/${id}`);
        setCategories(categories.filter(c => c.id !== id));
      } catch (err) {
        alert("Failed to delete category.");
      }
    }
  };

  const filtered = categories.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-col gap-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 style={{ fontSize: '2rem' }}>Categories Management</h1>
          <p style={{ color: 'var(--text-muted)' }}>Organize your products into logical categories.</p>
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          <Plus size={18} /> Add Category
        </button>
      </div>

      <div className="card" style={{ padding: '1.5rem' }}>
        <div className="flex justify-between items-center mb-4">
          <div style={{ position: 'relative', width: '300px' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search categories..." 
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
                  <th style={{ padding: '1rem', fontWeight: 600 }}>Name</th>
                  <th style={{ padding: '1rem', fontWeight: 600 }}>Slug</th>
                  <th style={{ padding: '1rem', fontWeight: 600 }}>Description</th>
                  <th style={{ padding: '1rem', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td data-label="Name" style={{ padding: '1rem', fontWeight: 600 }}>{c.name}</td>
                    <td data-label="Slug" style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{c.slug}</td>
                    <td data-label="Description" style={{ padding: '1rem', color: 'var(--text-muted)' }}>{c.description || '-'}</td>
                    <td data-label="Actions" style={{ padding: '1rem', textAlign: 'right' }}>
                      <button onClick={() => handleOpenModal(c)} style={{ color: 'var(--info)', padding: '0.5rem', marginRight: '0.5rem' }} title="Edit">
                        <Edit size={18} />
                      </button>
                      <button onClick={() => handleDelete(c.id)} style={{ color: 'var(--danger)', padding: '0.5rem' }} title="Delete">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan="4" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No categories found.
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
              <h2 style={{ fontSize: '1.5rem' }}>{editingCategory ? 'Edit Category' : 'Add Category'}</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ color: 'var(--text-muted)' }}><X size={24} /></button>
            </div>
            
            <div style={{ padding: '1.5rem' }}>
              {formError && <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>{formError}</div>}
              
              <form id="category-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Category Name *</label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>URL Slug *</label>
                  <input required type="text" value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value.toLowerCase()})} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Description</label>
                  <textarea rows="3" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Category Image</label>
                  
                  {formData.image && (
                    <div style={{ position: 'relative', width: '100px', height: '100px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border-light)', marginBottom: '1rem' }}>
                      <img src={formData.image.startsWith('http') ? formData.image : `${API_BASE_URL}${formData.image}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="preview" />
                      <button 
                        type="button" 
                        onClick={() => setFormData({...formData, image: ''})}
                        style={{ position: 'absolute', top: 0, right: 0, background: 'rgba(0,0,0,0.5)', color: '#fff', padding: '0.1rem' }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.25rem' }}>Upload Local File</label>
                      <input type="file" accept="image/png, image/jpeg, image/webp" onChange={handleImageUpload} disabled={uploadingImage} style={{ padding: '0.5rem', border: '1px dashed var(--border-light)', borderRadius: 'var(--radius-md)', width: '100%' }} />
                      {uploadingImage && <small style={{ color: 'var(--info)' }}>Uploading...</small>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.25rem' }}>Or Paste URL</label>
                      <input type="text" placeholder="https://..." value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} />
                    </div>
                  </div>
                </div>
              </form>
            </div>
            
            <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button form="category-form" type="submit" className="btn btn-primary">Save Changes</button>
            </div>
          </div>
        </div>
      , document.body)}
    </div>
  );
};

export default AdminCategories;
