import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, ShoppingCart, Package, MessageCircle, FileText } from 'lucide-react';

const Navbar = () => {
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/transactions', label: 'Record Sale', icon: ShoppingCart },
    { path: '/sales', label: 'Sales Log', icon: FileText },
    { path: '/inventory', label: 'Inventory', icon: Package },
    { path: '/chat', label: 'Assistant', icon: MessageCircle }
  ];

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <div className="navbar-brand">
          🏪 Smart Shop
        </div>
        <div className="navbar-nav">
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={location.pathname === item.path ? 'active' : ''}
              >
                <Icon size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;