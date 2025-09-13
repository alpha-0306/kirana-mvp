import React, { useState } from 'react';
import { Calendar, Filter, Download, Eye, X, Mic, Edit } from 'lucide-react';
import { useData } from '../context/DataContext';

const SalesLog = () => {
  const { transactions } = useData();
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  // Filter transactions
  const filteredTransactions = transactions.filter(transaction => {
    const dateMatch = !selectedDate || transaction.date === new Date(selectedDate).toDateString();
    const typeMatch = selectedType === 'all' || 
      (selectedType === 'upi' && transaction.transactionType === 'UPI') ||
      (selectedType === 'cash' && transaction.transactionType === 'Cash');
    
    return dateMatch && typeMatch;
  });

  // Calculate totals
  const totalAmount = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);
  const upiTransactions = filteredTransactions.filter(t => t.transactionType === 'UPI');
  const cashTransactions = filteredTransactions.filter(t => t.transactionType === 'Cash');
  const upiTotal = upiTransactions.reduce((sum, t) => sum + t.amount, 0);
  const cashTotal = cashTransactions.reduce((sum, t) => sum + t.amount, 0);

  const viewTransactionDetails = (transaction) => {
    setSelectedTransaction(transaction);
    setShowTransactionModal(true);
  };

  const exportData = () => {
    const csvContent = [
      ['Date', 'Time', 'Amount', 'Type', 'Method', 'Products', 'Transcription'].join(','),
      ...filteredTransactions.map(t => [
        new Date(t.timestamp).toLocaleDateString('en-IN'),
        new Date(t.timestamp).toLocaleTimeString('en-IN'),
        t.amount,
        t.transactionType,
        t.method,
        t.products?.map(p => `${p.quantity}x ${p.name}`).join('; ') || 'N/A',
        `"${t.transcription || 'N/A'}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-log-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="flex-between mb-20">
        <div>
          <h1>📋 Sales Log</h1>
          <p style={{ color: '#666' }}>
            {filteredTransactions.length} transactions • ₹{totalAmount} total
          </p>
        </div>
        <button onClick={exportData} className="btn btn-secondary">
          <Download size={18} style={{ marginRight: '8px' }} />
          Export CSV
        </button>
      </div>

      {/* Summary Cards */}
      <div className="stats-grid mb-20">
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
          <div className="stat-value">₹{totalAmount}</div>
          <div className="stat-label">Total Sales</div>
        </div>
        
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
          <div className="stat-value">₹{upiTotal}</div>
          <div className="stat-label">UPI Transactions ({upiTransactions.length})</div>
        </div>
        
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
          <div className="stat-value">₹{cashTotal}</div>
          <div className="stat-label">Cash Transactions ({cashTransactions.length})</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-20">
        <h3 className="mb-20">
          <Filter size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
          Filters
        </h3>
        
        <div className="grid grid-2">
          <div className="form-group">
            <label>
              <Calendar size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
              Filter by Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
          
          <div className="form-group">
            <label>Transaction Type</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <option value="all">All Transactions</option>
              <option value="upi">UPI Only</option>
              <option value="cash">Cash Only</option>
            </select>
          </div>
        </div>
        
        {(selectedDate || selectedType !== 'all') && (
          <button
            onClick={() => {
              setSelectedDate('');
              setSelectedType('all');
            }}
            className="btn btn-secondary mt-10"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Transactions Table */}
      <div className="card">
        <h3 className="mb-20">Transaction History</h3>
        
        {filteredTransactions.length === 0 ? (
          <div className="text-center" style={{ padding: '40px', color: '#666' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
            <p>No transactions found for the selected filters</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e0e0e0' }}>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Date & Time</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Amount</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Type</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Method</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Products</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map(transaction => (
                  <tr key={transaction.id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: '600' }}>
                        {new Date(transaction.timestamp).toLocaleDateString('en-IN')}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {new Date(transaction.timestamp).toLocaleTimeString('en-IN')}
                      </div>
                    </td>
                    
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <span style={{ 
                        fontWeight: 'bold', 
                        fontSize: '16px',
                        color: '#28a745'
                      }}>
                        ₹{transaction.amount}
                      </span>
                    </td>
                    
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        backgroundColor: transaction.transactionType === 'UPI' ? '#e3f2fd' : '#f3e5f5',
                        color: transaction.transactionType === 'UPI' ? '#1976d2' : '#7b1fa2'
                      }}>
                        {transaction.transactionType}
                      </span>
                    </td>
                    
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <div className="flex-center gap-10">
                        {transaction.method === 'Audio Capture' && (
                          <Mic size={14} style={{ color: '#dc3545' }} />
                        )}
                        {transaction.method === 'Manual Entry' && (
                          <Edit size={14} style={{ color: '#007bff' }} />
                        )}
                        <span style={{ fontSize: '12px' }}>
                          {transaction.method}
                        </span>
                      </div>
                    </td>
                    
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontSize: '14px' }}>
                        {transaction.products && transaction.products.length > 0 ? (
                          <div>
                            {transaction.products.slice(0, 2).map((product, index) => (
                              <div key={index} style={{ marginBottom: '2px' }}>
                                {product.quantity}x {product.name}
                              </div>
                            ))}
                            {transaction.products.length > 2 && (
                              <div style={{ color: '#666', fontSize: '12px' }}>
                                +{transaction.products.length - 2} more...
                              </div>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: '#666', fontStyle: 'italic' }}>
                            No products specified
                          </span>
                        )}
                        {transaction.miscAmount > 0 && (
                          <div style={{ fontSize: '12px', color: '#ffc107' }}>
                            Misc: ₹{transaction.miscAmount}
                          </div>
                        )}
                      </div>
                    </td>
                    
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <button
                        onClick={() => viewTransactionDetails(transaction)}
                        className="btn btn-primary"
                        style={{ padding: '4px 8px', fontSize: '12px' }}
                      >
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Transaction Details Modal */}
      {showTransactionModal && selectedTransaction && (
        <div className="modal">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Transaction Details</h2>
              <button onClick={() => setShowTransactionModal(false)} className="close-btn">
                <X />
              </button>
            </div>

            <div className="grid grid-2 mb-20">
              <div>
                <strong>Amount:</strong> ₹{selectedTransaction.amount}
              </div>
              <div>
                <strong>Type:</strong> {selectedTransaction.transactionType}
              </div>
              <div>
                <strong>Method:</strong> {selectedTransaction.method}
              </div>
              <div>
                <strong>Date:</strong> {new Date(selectedTransaction.timestamp).toLocaleString('en-IN')}
              </div>
            </div>

            {selectedTransaction.transcription && selectedTransaction.method === 'Audio Capture' && (
              <div className="mb-20">
                <h4 className="mb-10">
                  <Mic size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                  Audio Transcription
                </h4>
                <div style={{ 
                  backgroundColor: '#f8f9fa', 
                  padding: '15px', 
                  borderRadius: '8px',
                  border: '1px solid #e9ecef',
                  fontStyle: 'italic'
                }}>
                  "{selectedTransaction.transcription}"
                </div>
                {selectedTransaction.language && (
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                    Language: {selectedTransaction.language}
                  </div>
                )}
              </div>
            )}

            {selectedTransaction.payerInfo && (
              <div className="mb-20">
                <strong>Payer Info:</strong> {selectedTransaction.payerInfo}
              </div>
            )}

            {selectedTransaction.products && selectedTransaction.products.length > 0 && (
              <div className="mb-20">
                <h4 className="mb-10">Products Sold</h4>
                <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
                  {selectedTransaction.products.map((product, index) => (
                    <div key={index} className="flex-between" style={{ marginBottom: '8px' }}>
                      <span>{product.quantity}x {product.name}</span>
                      <span>₹{product.price * product.quantity}</span>
                    </div>
                  ))}
                  
                  <hr style={{ margin: '10px 0' }} />
                  
                  <div className="flex-between" style={{ fontWeight: 'bold' }}>
                    <span>Products Total:</span>
                    <span>₹{selectedTransaction.products.reduce((sum, p) => sum + (p.price * p.quantity), 0)}</span>
                  </div>
                  
                  {selectedTransaction.miscAmount > 0 && (
                    <>
                      <div className="flex-between" style={{ color: '#ffc107' }}>
                        <span>Miscellaneous:</span>
                        <span>₹{selectedTransaction.miscAmount}</span>
                      </div>
                      <hr style={{ margin: '10px 0' }} />
                      <div className="flex-between" style={{ fontWeight: 'bold', fontSize: '16px' }}>
                        <span>Grand Total:</span>
                        <span>₹{selectedTransaction.amount}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            <button 
              onClick={() => setShowTransactionModal(false)} 
              className="btn btn-primary"
              style={{ width: '100%' }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesLog;