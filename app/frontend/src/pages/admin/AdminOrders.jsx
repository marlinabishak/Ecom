import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, Eye, X, Truck, CheckCircle, Package, Download } from 'lucide-react';
import api, { getImageUrl } from '../../lib/api';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    if (selectedOrder) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [selectedOrder]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/orders');
      setOrders(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await api.put(`/api/admin/orders/${orderId}/status`, { status: newStatus });
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (err) {
      alert("Failed to update status.");
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to cancel this order? Product stock will be automatically restored.")) return;
    try {
      await api.put(`/api/admin/orders/${orderId}/status`, { status: 'cancelled' });
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o));
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: 'cancelled' });
      }
    } catch (err) {
      console.error(err);
      alert("Failed to cancel order.");
    }
  };

  const filtered = orders.filter(o => {
    const matchesSearch = o.id.toString().includes(searchTerm) || (o.user_id && o.user_id.toString().includes(searchTerm));
    if (!matchesSearch) return false;
    
    if (startDate) {
      if (new Date(o.created_at) < new Date(startDate)) return false;
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      if (new Date(o.created_at) > end) return false;
    }
    return true;
  });

  const exportToCSV = () => {
    if (filtered.length === 0) {
      alert("No orders to export.");
      return;
    }

    const headers = [
      "Order ID", "Date", "Customer ID", "Shipping Address",
      "Payment Method", "Payment Status", "Order Status",
      "Product ID", "Product Name", "Quantity", "Item Price", "Total Item Price"
    ];

    const rows = [];
    filtered.forEach(order => {
      const dateStr = new Date(order.created_at).toLocaleDateString();
      const addr = (order.shipping_address || "No address provided.").replace(/,/g, ' '); // Clean commas for CSV
      
      if (order.items && order.items.length > 0) {
        order.items.forEach(item => {
          rows.push([
            order.id, dateStr, order.user_id, addr,
            order.payment_method, order.payment_status, order.status,
            item.product_id, `"${item.name}"`, item.quantity, item.price, (item.price * item.quantity).toFixed(2)
          ]);
        });
      } else {
        rows.push([
          order.id, dateStr, order.user_id, addr,
          order.payment_method, order.payment_status, order.status,
          "", "No Items", 0, 0, 0
        ]);
      }
    });

    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.join(","))
    ].join("\r\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    let fileName = 'orders_export';
    if (startDate && endDate) {
      fileName += `_from_${startDate}_to_${endDate}`;
    } else if (startDate) {
      fileName += `_from_${startDate}`;
    } else if (endDate) {
      fileName += `_to_${endDate}`;
    } else {
      fileName += '_all_dates';
    }
    
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${fileName}.csv`;
    link.setAttribute("download", `${fileName}.csv`);
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-col gap-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 style={{ fontSize: '2rem' }}>Orders Management</h1>
          <p style={{ color: 'var(--text-muted)' }}>View and update customer orders and fulfillment status.</p>
        </div>
      </div>

      <div className="card" style={{ padding: '1.5rem' }}>
        <div className="flex justify-between items-center mb-4 filters-responsive" style={{ flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ position: 'relative', width: '300px', maxWidth: '100%' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search by Order ID..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2.5rem', width: '100%' }}
            />
          </div>
          
          <div className="flex items-center gap-4 filters-responsive" style={{ flexWrap: 'wrap' }}>
            <div className="flex items-center gap-2">
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>From:</span>
              <input 
                type="date" 
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                style={{ padding: '0.4rem 0.8rem', width: '100%' }}
              />
            </div>
            <div className="flex items-center gap-2">
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>To:</span>
              <input 
                type="date" 
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                style={{ padding: '0.4rem 0.8rem', width: '100%' }}
              />
            </div>
            <button onClick={exportToCSV} className="btn btn-primary flex items-center justify-center gap-2" style={{ padding: '0.5rem 1rem' }}>
              <Download size={18} /> Export CSV
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '4rem', display: 'flex', justifyContent: 'center' }}><div className="spinner"></div></div>
        ) : (
          <div className="responsive-table">
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '1rem', fontWeight: 600 }}>Order #</th>
                  <th style={{ padding: '1rem', fontWeight: 600 }}>Date</th>
                  <th style={{ padding: '1rem', fontWeight: 600 }}>Customer ID</th>
                  <th style={{ padding: '1rem', fontWeight: 600 }}>Total</th>
                  <th style={{ padding: '1rem', fontWeight: 600 }}>Payment</th>
                  <th style={{ padding: '1rem', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '1rem', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(o => (
                  <tr key={o.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td data-label="Order #" style={{ padding: '1rem', fontWeight: 600 }}>#{o.id}</td>
                    <td data-label="Date" style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                      {new Date(o.created_at).toLocaleDateString()}
                    </td>
                    <td data-label="Customer ID" style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{o.user_id}</td>
                    <td data-label="Total" style={{ padding: '1rem', fontWeight: 600 }}>₹{o.total?.toFixed(2)}</td>
                    <td data-label="Payment" style={{ padding: '1rem' }}>
                      <span className={`badge ${o.payment_method === 'cod' ? 'badge-warning' : 'badge-info'}`}>
                        {o.payment_method === 'cod' ? 'COD' : 'Paid Online'}
                      </span>
                    </td>
                    <td data-label="Status" style={{ padding: '1rem' }}>
                      <select 
                        value={o.status}
                        onChange={(e) => handleStatusChange(o.id, e.target.value)}
                        style={{ padding: '0.25rem 0.5rem', width: 'auto', fontSize: '0.8rem', fontWeight: 600 }}
                      >
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="refunded">Refunded</option>
                      </select>
                    </td>
                    <td data-label="Actions" style={{ padding: '1rem', textAlign: 'right' }}>
                      <button onClick={() => setSelectedOrder(o)} style={{ color: 'var(--info)', padding: '0.5rem' }} title="View Details">
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No orders found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && createPortal(
        <div 
          onClick={() => setSelectedOrder(null)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
            background: 'rgba(0,0,0,0.6)', zIndex: 100,
            overflowY: 'auto', padding: '3rem 1rem'
          }}
        >
          <div onClick={e => e.stopPropagation()} className="card" style={{ 
            width: '100%', maxWidth: '600px', margin: '0 auto',
            display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)'
          }}>
            <div className="flex justify-between items-center modal-responsive-header" style={{ marginBottom: '1.5rem', padding: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <h2 style={{ fontSize: '1.5rem' }}>Order Details #{selectedOrder.id}</h2>
                <div className={`badge badge-${selectedOrder.status === 'delivered' ? 'success' : selectedOrder.status === 'cancelled' ? 'error' : 'warning'}`}>
                  {selectedOrder.status}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '100%', justifyContent: 'space-between' }}>
                {selectedOrder.status !== 'cancelled' ? (
                  <button onClick={() => handleCancelOrder(selectedOrder.id)} className="btn btn-outline" style={{ borderColor: 'var(--error)', color: 'var(--error)', padding: '0.4rem 1rem' }}>
                    Cancel Order
                  </button>
                ) : <div></div>}
                <button onClick={() => setSelectedOrder(null)} className="btn btn-ghost" style={{ padding: '0.5rem' }}>
                  <X size={24} />
                </button>
              </div>
            </div>
            
            <div style={{ padding: '1.5rem' }}>
              <div className="modal-responsive-split" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ flex: 1, paddingRight: '1rem' }}>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Shipping Address</h3>
                  <div style={{ padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                    <p style={{ whiteSpace: 'pre-line', color: 'var(--text-secondary)' }}>
                      {selectedOrder.shipping_address || 'No address provided.'}
                    </p>
                  </div>
                </div>
                <div style={{ flex: 1, paddingLeft: '1rem' }}>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Payment Info</h3>
                  <div style={{ padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div><span style={{ color: 'var(--text-secondary)' }}>Method:</span> <span className={`badge ${selectedOrder.payment_method === 'cod' ? 'badge-warning' : 'badge-info'}`}>{selectedOrder.payment_method === 'cod' ? 'Cash on Delivery' : 'Razorpay'}</span></div>
                    <div><span style={{ color: 'var(--text-secondary)' }}>Status:</span> <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{selectedOrder.payment_status}</span></div>
                    {selectedOrder.payment_method !== 'cod' && selectedOrder.razorpay_payment_id && (
                      <div style={{ wordBreak: 'break-all' }}><span style={{ color: 'var(--text-secondary)' }}>Payment ID:</span> <span style={{ fontSize: '0.85rem' }}>{selectedOrder.razorpay_payment_id}</span></div>
                    )}
                  </div>
                </div>
              </div>
              
              <div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Order Items</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {selectedOrder.items?.map(item => (
                    <div key={item.id} className="flex justify-between items-center" style={{ padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                      <div className="flex gap-4 items-center">
                        {item.image && (
                          <div style={{ width: '60px', height: '60px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                            <img src={getImageUrl(item.image)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: 600 }}>{item.name}</div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', gap: '1rem' }}>
                            <span>Qty: {item.quantity}</span>
                            <span>Product ID: #{item.product_id}</span>
                          </div>
                        </div>
                      </div>
                      <div style={{ fontWeight: 600 }}>₹{(item.price * item.quantity).toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-between items-center" style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>Total</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent-primary)' }}>₹{selectedOrder.total?.toFixed(2)}</div>
              </div>
            </div>
          </div>
        </div>
      , document.body)}
    </div>
  );
};

export default AdminOrders;
