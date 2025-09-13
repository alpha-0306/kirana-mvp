import React, { createContext, useContext, useState, useEffect } from 'react';

const DataContext = createContext();

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider = ({ children }) => {
  const [shopData, setShopData] = useState(null);
  const [products, setProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [inventory, setInventory] = useState([]);

  useEffect(() => {
    // Load data from localStorage
    const savedShopData = localStorage.getItem('shopData');
    const savedProducts = localStorage.getItem('products');
    const savedTransactions = localStorage.getItem('transactions');
    const savedInventory = localStorage.getItem('inventory');

    if (savedShopData) setShopData(JSON.parse(savedShopData));
    if (savedProducts) setProducts(JSON.parse(savedProducts));
    if (savedTransactions) setTransactions(JSON.parse(savedTransactions));
    if (savedInventory) setInventory(JSON.parse(savedInventory));
  }, []);

  const saveShopData = (data) => {
    setShopData(data);
    localStorage.setItem('shopData', JSON.stringify(data));
  };

  const saveProducts = (productList) => {
    setProducts(productList);
    localStorage.setItem('products', JSON.stringify(productList));
    
    // Update inventory with new products
    const newInventory = productList.map(product => {
      const existingItem = inventory.find(item => item.id === product.id);
      return existingItem || {
        id: product.id,
        name: product.name,
        price: product.price,
        stock: product.initialStock || 0,
        reorderThreshold: 5,
        expiryDate: null
      };
    });
    setInventory(newInventory);
    localStorage.setItem('inventory', JSON.stringify(newInventory));
  };

  const addTransaction = (transaction) => {
    const newTransaction = {
      ...transaction,
      id: Date.now(),
      timestamp: new Date().toISOString(),
      date: new Date().toDateString(),
      transactionType: transaction.type === 'upi_soundbox' ? 'UPI' : 'Cash',
      method: transaction.type === 'upi_soundbox' ? 'Audio Capture' : 'Manual Entry'
    };
    
    const updatedTransactions = [newTransaction, ...transactions];
    setTransactions(updatedTransactions);
    localStorage.setItem('transactions', JSON.stringify(updatedTransactions));

    // Update inventory
    if (transaction.products && transaction.products.length > 0) {
      const updatedInventory = inventory.map(item => {
        const soldProduct = transaction.products.find(p => p.id === item.id);
        if (soldProduct) {
          return {
            ...item,
            stock: Math.max(0, item.stock - soldProduct.quantity)
          };
        }
        return item;
      });
      setInventory(updatedInventory);
      localStorage.setItem('inventory', JSON.stringify(updatedInventory));
    }
  };

  const updateInventory = (updatedInventory) => {
    setInventory(updatedInventory);
    localStorage.setItem('inventory', JSON.stringify(updatedInventory));
  };

  const getTodaysSales = () => {
    const today = new Date().toDateString();
    return transactions.filter(t => t.date === today);
  };

  const getTotalSalesToday = () => {
    return getTodaysSales().reduce((total, t) => total + t.amount, 0);
  };

  const getTopSellingProduct = () => {
    const productSales = {};
    transactions.forEach(transaction => {
      if (transaction.products) {
        transaction.products.forEach(product => {
          productSales[product.name] = (productSales[product.name] || 0) + product.quantity;
        });
      }
    });
    
    const topProduct = Object.entries(productSales).reduce((a, b) => 
      productSales[a[0]] > productSales[b[0]] ? a : b, ['', 0]
    );
    
    return topProduct[0] || 'No sales yet';
  };

  const getLowStockItems = () => {
    return inventory.filter(item => item.stock <= item.reorderThreshold);
  };

  const getRevenueData = () => {
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = date.toDateString();
      
      const dayTransactions = transactions.filter(t => t.date === dateString);
      const dayRevenue = dayTransactions.reduce((total, t) => total + t.amount, 0);
      
      last7Days.push({
        date: date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
        revenue: dayRevenue
      });
    }
    return last7Days;
  };

  const value = {
    shopData,
    products,
    transactions,
    inventory,
    saveShopData,
    saveProducts,
    addTransaction,
    updateInventory,
    getTodaysSales,
    getTotalSalesToday,
    getTopSellingProduct,
    getLowStockItems,
    getRevenueData
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};