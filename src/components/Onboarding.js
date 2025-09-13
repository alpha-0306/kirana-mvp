import React, { useState } from 'react';
import { Plus, Upload, X } from 'lucide-react';

const Onboarding = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [shopData, setShopData] = useState({
    name: '',
    type: 'General Store'
  });
  const [products, setProducts] = useState([]);
  const [currentProduct, setCurrentProduct] = useState({
    name: '',
    price: '',
    initialStock: '',
    image: null
  });

  const shopTypes = [
    'General Store',
    'Grocery Store',
    'Medical Store',
    'Electronics Shop',
    'Clothing Store',
    'Restaurant/Cafe',
    'Stationery Shop',
    'Other'
  ];

  const handleShopSubmit = (e) => {
    e.preventDefault();
    if (shopData.name.trim()) {
      setStep(2);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCurrentProduct(prev => ({
          ...prev,
          image: e.target.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const addProduct = (e) => {
    e.preventDefault();
    if (currentProduct.name && currentProduct.price) {
      const newProduct = {
        id: Date.now(),
        name: currentProduct.name,
        price: parseFloat(currentProduct.price),
        initialStock: parseInt(currentProduct.initialStock) || 0,
        image: currentProduct.image
      };
      
      setProducts([...products, newProduct]);
      setCurrentProduct({
        name: '',
        price: '',
        initialStock: '',
        image: null
      });
    }
  };

  const removeProduct = (id) => {
    setProducts(products.filter(p => p.id !== id));
  };

  const completeOnboarding = () => {
    localStorage.setItem('shopData', JSON.stringify(shopData));
    localStorage.setItem('products', JSON.stringify(products));
    
    // Initialize inventory
    const initialInventory = products.map(product => ({
      id: product.id,
      name: product.name,
      price: product.price,
      stock: product.initialStock,
      reorderThreshold: 5,
      expiryDate: null
    }));
    localStorage.setItem('inventory', JSON.stringify(initialInventory));
    localStorage.setItem('transactions', JSON.stringify([]));
    
    onComplete();
  };

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: '600px', margin: '50px auto' }}>
        <div className="text-center mb-20">
          <h1>🏪 Welcome to Smart Shop Assistant</h1>
          <p>Let's set up your shop in just 2 simple steps</p>
        </div>

        {step === 1 && (
          <div>
            <h2 className="mb-20">Step 1: Shop Details</h2>
            <form onSubmit={handleShopSubmit}>
              <div className="form-group">
                <label>Shop Name *</label>
                <input
                  type="text"
                  value={shopData.name}
                  onChange={(e) => setShopData({...shopData, name: e.target.value})}
                  placeholder="Enter your shop name"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Shop Type</label>
                <select
                  value={shopData.type}
                  onChange={(e) => setShopData({...shopData, type: e.target.value})}
                >
                  {shopTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                Next: Add Products
              </button>
            </form>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="mb-20">Step 2: Add Your Products</h2>
            
            <form onSubmit={addProduct} className="mb-20">
              <div className="grid grid-2">
                <div className="form-group">
                  <label>Product Name *</label>
                  <input
                    type="text"
                    value={currentProduct.name}
                    onChange={(e) => setCurrentProduct({...currentProduct, name: e.target.value})}
                    placeholder="e.g., Vada Pav, Cold Drink"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Price (₹) *</label>
                  <input
                    type="number"
                    value={currentProduct.price}
                    onChange={(e) => setCurrentProduct({...currentProduct, price: e.target.value})}
                    placeholder="25"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-2">
                <div className="form-group">
                  <label>Initial Stock</label>
                  <input
                    type="number"
                    value={currentProduct.initialStock}
                    onChange={(e) => setCurrentProduct({...currentProduct, initialStock: e.target.value})}
                    placeholder="50"
                    min="0"
                  />
                </div>
                
                <div className="form-group">
                  <label>Product Image (Optional)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </div>
              </div>
              
              <button type="submit" className="btn btn-success">
                <Plus size={18} style={{ marginRight: '8px' }} />
                Add Product
              </button>
            </form>

            {products.length > 0 && (
              <div>
                <h3 className="mb-20">Added Products ({products.length})</h3>
                <div className="product-grid">
                  {products.map(product => (
                    <div key={product.id} className="product-card">
                      <button
                        onClick={() => removeProduct(product.id)}
                        className="close-btn"
                        style={{ position: 'absolute', top: '5px', right: '5px' }}
                      >
                        <X size={16} />
                      </button>
                      
                      {product.image ? (
                        <img src={product.image} alt={product.name} className="product-image" />
                      ) : (
                        <div className="product-image" style={{ 
                          backgroundColor: '#f0f0f0', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          fontSize: '24px'
                        }}>
                          📦
                        </div>
                      )}
                      
                      <div className="product-name">{product.name}</div>
                      <div className="product-price">₹{product.price}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        Stock: {product.initialStock}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-10 mt-20">
              <button
                onClick={() => setStep(1)}
                className="btn btn-secondary"
              >
                Back
              </button>
              
              <button
                onClick={completeOnboarding}
                className="btn btn-primary"
                style={{ flex: 1 }}
                disabled={products.length === 0}
              >
                Complete Setup
              </button>
            </div>
            
            {products.length === 0 && (
              <p className="text-center" style={{ color: '#666', marginTop: '10px' }}>
                Add at least one product to continue
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Onboarding;