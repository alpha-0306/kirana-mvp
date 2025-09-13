import React, { useState } from 'react';
import { Edit, Save, X, AlertTriangle, Package, Plus } from 'lucide-react';
import { useData } from '../context/DataContext';

const Inventory = () => {
  const { inventory, updateInventory, products, saveProducts } = useData();
  const [editingItem, setEditingItem] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    stock: '',
    reorderThreshold: 5,
    image: null
  });

  const startEditing = (item) => {
    setEditingItem(item.id);
    setEditValues({
      stock: item.stock,
      reorderThreshold: item.reorderThreshold,
      expiryDate: item.expiryDate || ''
    });
  };

  const saveEdit = () => {
    const updatedInventory = inventory.map(item => {
      if (item.id === editingItem) {
        return {
          ...item,
          stock: parseInt(editValues.stock) || 0,
          reorderThreshold: parseInt(editValues.reorderThreshold) || 5,
          expiryDate: editValues.expiryDate || null
        };
      }
      return item;
    });
    
    updateInventory(updatedInventory);
    setEditingItem(null);
    setEditValues({});
  };

  const cancelEdit = () => {
    setEditingItem(null);
    setEditValues({});
  };

  const addNewProduct = () => {
    if (newProduct.name && newProduct.price) {
      const productId = Date.now();
      
      // Add to products
      const updatedProducts = [...products, {
        id: productId,
        name: newProduct.name,
        price: parseFloat(newProduct.price),
        initialStock: parseInt(newProduct.stock) || 0,
        image: newProduct.image || null
      }];
      saveProducts(updatedProducts);
      
      // Add to inventory
      const newInventoryItem = {
        id: productId,
        name: newProduct.name,
        price: parseFloat(newProduct.price),
        stock: parseInt(newProduct.stock) || 0,
        reorderThreshold: parseInt(newProduct.reorderThreshold) || 5,
        expiryDate: null
      };
      
      updateInventory([...inventory, newInventoryItem]);
      
      // Reset form
      setNewProduct({
        name: '',
        price: '',
        stock: '',
        reorderThreshold: 5,
        image: null
      });
      setShowAddProduct(false);
    }
  };

  const getStockStatus = (item) => {
    if (item.stock === 0) return { status: 'out', color: '#dc3545', text: 'Out of Stock' };
    if (item.stock <= item.reorderThreshold) return { status: 'low', color: '#ffc107', text: 'Low Stock' };
    return { status: 'good', color: '#28a745', text: 'In Stock' };
  };

  const lowStockCount = inventory.filter(item => item.stock <= item.reorderThreshold).length;
  const outOfStockCount = inventory.filter(item => item.stock === 0).length;

  return (
    <div>
      <div className="flex-between mb-20">
        <div>
          <h1>Inventory Management</h1>
          <p style={{ color: '#666' }}>
            {inventory.length} products • {lowStockCount} low stock • {outOfStockCount} out of stock
          </p>
        </div>
        <button 
          onClick={() => setShowAddProduct(true)}
          className="btn btn-primary"
        >
          <Plus size={18} style={{ marginRight: '8px' }} />
          Add Product
        </button>
      </div>

      {/* Stock Overview */}
      <div className="stats-grid mb-20">
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
          <div className="stat-value">{inventory.length}</div>
          <div className="stat-label">Total Products</div>
        </div>
        
        <div className="stat-card" style={{ 
          background: lowStockCount > 0 
            ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' 
            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
        }}>
          <div className="stat-value">{lowStockCount}</div>
          <div className="stat-label">Low Stock Items</div>
        </div>
        
        <div className="stat-card" style={{ 
          background: outOfStockCount > 0 
            ? 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)' 
            : 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' 
        }}>
          <div className="stat-value">{outOfStockCount}</div>
          <div className="stat-label">Out of Stock</div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="card">
        <h3 className="mb-20">
          <Package size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
          Product Inventory
        </h3>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e0e0e0' }}>
                <th style={{ padding: '12px', textAlign: 'left' }}>Product</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Price</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Stock</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Reorder At</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Expiry</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map(item => {
                const stockStatus = getStockStatus(item);
                const isEditing = editingItem === item.id;
                
                return (
                  <tr key={item.id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: '600' }}>{item.name}</div>
                    </td>
                    
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      ₹{item.price}
                    </td>
                    
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      {isEditing ? (
                        <input
                          type="number"
                          value={editValues.stock}
                          onChange={(e) => setEditValues({...editValues, stock: e.target.value})}
                          style={{ width: '80px', padding: '4px', textAlign: 'center' }}
                          min="0"
                        />
                      ) : (
                        <span style={{ 
                          fontWeight: 'bold',
                          color: stockStatus.color
                        }}>
                          {item.stock}
                        </span>
                      )}
                    </td>
                    
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      {isEditing ? (
                        <input
                          type="number"
                          value={editValues.reorderThreshold}
                          onChange={(e) => setEditValues({...editValues, reorderThreshold: e.target.value})}
                          style={{ width: '80px', padding: '4px', textAlign: 'center' }}
                          min="0"
                        />
                      ) : (
                        item.reorderThreshold
                      )}
                    </td>
                    
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <span style={{ 
                        color: stockStatus.color,
                        fontWeight: '600',
                        fontSize: '12px'
                      }}>
                        {stockStatus.status === 'low' && <AlertTriangle size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />}
                        {stockStatus.text}
                      </span>
                    </td>
                    
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      {isEditing ? (
                        <input
                          type="date"
                          value={editValues.expiryDate}
                          onChange={(e) => setEditValues({...editValues, expiryDate: e.target.value})}
                          style={{ padding: '4px' }}
                        />
                      ) : (
                        item.expiryDate ? new Date(item.expiryDate).toLocaleDateString('en-IN') : '-'
                      )}
                    </td>
                    
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      {isEditing ? (
                        <div className="flex gap-10 justify-center">
                          <button onClick={saveEdit} className="btn btn-success" style={{ padding: '4px 8px' }}>
                            <Save size={14} />
                          </button>
                          <button onClick={cancelEdit} className="btn btn-secondary" style={{ padding: '4px 8px' }}>
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => startEditing(item)} 
                          className="btn btn-primary" 
                          style={{ padding: '4px 8px' }}
                        >
                          <Edit size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddProduct && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Add New Product</h2>
              <button onClick={() => setShowAddProduct(false)} className="close-btn">
                <X />
              </button>
            </div>

            <div className="form-group">
              <label>Product Name *</label>
              <input
                type="text"
                value={newProduct.name}
                onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                placeholder="Enter product name"
              />
            </div>

            <div className="grid grid-2">
              <div className="form-group">
                <label>Price (₹) *</label>
                <input
                  type="number"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="form-group">
                <label>Initial Stock</label>
                <input
                  type="number"
                  value={newProduct.stock}
                  onChange={(e) => setNewProduct({...newProduct, stock: e.target.value})}
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Reorder Threshold</label>
              <input
                type="number"
                value={newProduct.reorderThreshold}
                onChange={(e) => setNewProduct({...newProduct, reorderThreshold: e.target.value})}
                placeholder="5"
                min="0"
              />
            </div>

            <div className="form-group">
              <label>Product Image (Optional)</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                      setNewProduct(prev => ({
                        ...prev,
                        image: e.target.result
                      }));
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
              {newProduct.image && (
                <div style={{ marginTop: '10px' }}>
                  <img 
                    src={newProduct.image} 
                    alt="Preview" 
                    style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }}
                  />
                </div>
              )}
            </div>

            <div className="flex gap-10 mt-20">
              <button 
                onClick={() => setShowAddProduct(false)} 
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button 
                onClick={addNewProduct} 
                className="btn btn-primary"
                style={{ flex: 1 }}
                disabled={!newProduct.name || !newProduct.price}
              >
                Add Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;