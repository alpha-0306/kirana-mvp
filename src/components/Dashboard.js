import React from 'react';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Package, AlertTriangle, ShoppingCart } from 'lucide-react';
import { useData } from '../context/DataContext';

const Dashboard = () => {
  const {
    getTotalSalesToday,
    getTopSellingProduct,
    getLowStockItems,
    getRevenueData,
    shopData
  } = useData();

  const todaysSales = getTotalSalesToday();
  const topProduct = getTopSellingProduct();
  const lowStockItems = getLowStockItems();
  const revenueData = getRevenueData();

  return (
    <div>
      <div className="flex-between mb-20">
        <div>
          <h1>Welcome back! 👋</h1>
          <p style={{ color: '#666' }}>{shopData?.name} - {shopData?.type}</p>
        </div>
        <div className="flex gap-10">
          <Link to="/sales" className="btn btn-secondary">
            📋 Sales Log
          </Link>
          <Link to="/transactions" className="btn btn-primary">
            <ShoppingCart size={18} style={{ marginRight: '8px' }} />
            Record Sale
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">₹{todaysSales}</div>
          <div className="stat-label">Today's Sales</div>
        </div>
        
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
          <div className="stat-value">{topProduct}</div>
          <div className="stat-label">Top Selling Product</div>
        </div>
        
        <div className="stat-card" style={{ 
          background: lowStockItems.length > 0 
            ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' 
            : 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' 
        }}>
          <div className="stat-value">{lowStockItems.length}</div>
          <div className="stat-label">Low Stock Alerts</div>
        </div>
      </div>

      <div className="grid grid-2">
        {/* Revenue Chart */}
        <div className="card">
          <h3 className="mb-20">
            <TrendingUp size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            Revenue Trend (Last 7 Days)
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => [`₹${value}`, 'Revenue']} />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#007bff" 
                strokeWidth={3}
                dot={{ fill: '#007bff', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Low Stock Alerts */}
        <div className="card">
          <h3 className="mb-20">
            <AlertTriangle size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            Stock Alerts
          </h3>
          
          {lowStockItems.length === 0 ? (
            <div className="text-center" style={{ padding: '40px', color: '#666' }}>
              <Package size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
              <p>All products are well stocked! 🎉</p>
            </div>
          ) : (
            <div>
              {lowStockItems.map(item => (
                <div key={item.id} className="flex-between" style={{ 
                  padding: '12px', 
                  backgroundColor: '#fff3cd', 
                  borderRadius: '8px', 
                  marginBottom: '10px',
                  border: '1px solid #ffeaa7'
                }}>
                  <div>
                    <div style={{ fontWeight: '600' }}>{item.name}</div>
                    <div style={{ fontSize: '14px', color: '#856404' }}>
                      Only {item.stock} left
                    </div>
                  </div>
                  <div style={{ color: '#dc3545', fontWeight: '600' }}>
                    Low Stock
                  </div>
                </div>
              ))}
              
              <Link to="/inventory" className="btn btn-primary" style={{ width: '100%', marginTop: '15px' }}>
                Manage Inventory
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card mt-20">
        <h3 className="mb-20">Quick Actions</h3>
        <div className="grid grid-3">
          <Link to="/transactions" className="btn btn-success">
            <ShoppingCart size={18} style={{ marginRight: '8px' }} />
            Record New Sale
          </Link>
          
          <Link to="/inventory" className="btn btn-primary">
            <Package size={18} style={{ marginRight: '8px' }} />
            Update Inventory
          </Link>
          
          <Link to="/chat" className="btn btn-secondary">
            💬 Ask Assistant
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;