import React, { useState, useEffect } from 'react';
import { Users, ShoppingBag, DollarSign, Activity, AlertTriangle, MessageSquare, BarChart, PieChart as PieChartIcon } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import api from '../../lib/api';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/admin/stats')
      .then(res => setStats(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div style={{ padding: '4rem', display: 'flex', justifyContent: 'center' }}><div className="spinner"></div></div>;
  }

  const metrics = [
    { label: 'Total Revenue', value: `₹${stats?.revenue?.toLocaleString() || 0}`, icon: <DollarSign size={24} />, color: 'var(--accent-primary)' },
    { label: 'Total Orders', value: stats?.total_orders || 0, icon: <ShoppingBag size={24} />, color: 'var(--info)' },
    { label: 'Total Customers', value: stats?.total_customers || 0, icon: <Users size={24} />, color: 'var(--warning)' },
    { label: 'Open Tickets', value: stats?.open_tickets || 0, icon: <Activity size={24} />, color: '#8b5cf6' },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Admin Dashboard</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Live overview of your store's performance.</p>
      </div>

      <div className="grid grid-cols-4 gap-6">
        {metrics.map(stat => (
          <div key={stat.label} className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', background: `${stat.color}22`, color: stat.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {stat.icon}
            </div>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>{stat.label}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stat.value}</div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-3 gap-6">
        <div className="card" style={{ padding: '2rem', gridColumn: 'span 2' }}>
          <div className="flex items-center gap-2 mb-6">
            <BarChart className="text-accent-primary" />
            <h2 style={{ fontSize: '1.25rem' }}>Sales (Last 30 Days)</h2>
          </div>
          <div style={{ width: '100%', height: 300 }}>
            {stats?.daily_sales?.length > 0 ? (
              <ResponsiveContainer>
                <AreaChart data={stats.daily_sales} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-strong)" opacity={0.5} />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(val) => val.split('-').slice(1).join('/')} 
                    stroke="var(--text-muted)" 
                    tick={{ fill: 'var(--text-muted)', fontSize: 12 }} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <YAxis 
                    stroke="var(--text-muted)" 
                    tick={{ fill: 'var(--text-muted)', fontSize: 12 }} 
                    axisLine={false} 
                    tickLine={false} 
                    tickFormatter={(val) => `₹${val}`}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-strong)', borderRadius: 'var(--radius-md)' }}
                    itemStyle={{ color: 'var(--accent-primary)', fontWeight: 600 }}
                    formatter={(value) => [`₹${value}`, 'Revenue']}
                    labelStyle={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}
                  />
                  <Area type="monotone" dataKey="total" stroke="var(--accent-primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                No recent sales data.
              </div>
            )}
          </div>
        </div>
        
        <div className="flex flex-col gap-6">
          <div className="card" style={{ padding: '2rem', flex: 1 }}>
            <div className="flex items-center gap-2 mb-4">
              <PieChartIcon className="text-info" />
              <h2 style={{ fontSize: '1.25rem' }}>Top Categories</h2>
            </div>
            <div style={{ width: '100%', height: 200 }}>
              {stats?.top_categories?.length > 0 ? (
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={stats.top_categories}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {stats.top_categories.map((entry, index) => {
                        const COLORS = ['var(--accent-primary)', 'var(--info)', 'var(--warning)', '#8b5cf6', 'var(--danger)'];
                        return <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />;
                      })}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-strong)', borderRadius: 'var(--radius-md)' }}
                      itemStyle={{ color: 'var(--text-primary)', fontWeight: 600 }}
                      formatter={(value) => [`₹${value}`, 'Revenue']}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36} 
                      wrapperStyle={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                  No category data.
                </div>
              )}
            </div>
          </div>
          
          <div className="card" style={{ padding: '1.5rem' }}>
             <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Action Alerts</h2>
             <div className="flex flex-col gap-3">
               <div style={{ padding: '0.75rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.75rem', borderLeft: '4px solid var(--warning)' }}>
                 <AlertTriangle size={20} style={{ color: 'var(--warning)' }} />
                 <div>
                   <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Low Stock</div>
                   <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{stats?.low_stock || 0} items need restocking</div>
                 </div>
               </div>
               
               <div style={{ padding: '0.75rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.75rem', borderLeft: '4px solid var(--info)' }}>
                 <MessageSquare size={20} style={{ color: 'var(--info)' }} />
                 <div>
                   <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Pending Feedback</div>
                   <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{stats?.pending_feedback || 0} unread messages</div>
                 </div>
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
