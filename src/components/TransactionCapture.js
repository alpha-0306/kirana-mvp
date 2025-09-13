import React, { useState, useRef } from 'react';
import { Mic, MicOff, Check, X, Plus, Minus } from 'lucide-react';
import { useData } from '../context/DataContext';
import geminiService from '../services/geminiService';

const TransactionCapture = () => {
  const { products, addTransaction } = useData();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [miscAmount, setMiscAmount] = useState(0);
  const [miscProducts, setMiscProducts] = useState([]);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await processAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessing(true);
    }
  };

  const processAudio = async (audioBlob) => {
    try {
      let transcriptionResult;
      
      // Use mock data if API key is not available
      if (!process.env.REACT_APP_GEMINI_API_KEY) {
        transcriptionResult = await geminiService.mockTranscribeAudio();
      } else {
        transcriptionResult = await geminiService.transcribeAudio(audioBlob);
      }

      if (transcriptionResult.amount > 0) {
        // Get product suggestions
        const suggestions = await geminiService.suggestProducts(
          transcriptionResult.amount, 
          products
        );

        setCurrentTransaction({
          ...transcriptionResult,
          suggestions,
          type: 'upi_soundbox'
        });
        setSelectedProducts(suggestions.map(s => ({ ...s, selected: true })));
        calculateMiscAmount(suggestions, transcriptionResult.amount);
        setShowTransactionModal(true);
      } else {
        alert('Could not detect transaction amount. Please try again.');
      }
    } catch (error) {
      console.error('Error processing audio:', error);
      alert('Error processing audio. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const calculateMiscAmount = (selectedProds, totalAmount) => {
    const productTotal = selectedProds
      .filter(p => p.selected)
      .reduce((sum, p) => sum + (p.price * p.quantity), 0);
    
    const miscAmountValue = Math.max(0, totalAmount - productTotal);
    setMiscAmount(miscAmountValue);
    
    // Track what could be in miscellaneous
    const miscProductsList = [];
    
    if (miscAmountValue > 0) {
      // Check if any selected products could have additional quantities
      const selectedProductsWithExtra = selectedProds
        .filter(p => p.selected && p.quantity > 0)
        .map(product => {
          const possibleExtraQuantity = Math.floor(miscAmountValue / product.price);
          if (possibleExtraQuantity > 0) {
            return {
              name: product.name,
              price: product.price,
              extraQuantity: possibleExtraQuantity,
              extraValue: Math.min(possibleExtraQuantity * product.price, miscAmountValue)
            };
          }
          return null;
        })
        .filter(Boolean);
      
      // Also check unselected products that could fit in the misc amount
      const unselectedProducts = selectedProds
        .filter(p => !p.selected || p.quantity === 0)
        .map(product => {
          const possibleQuantity = Math.floor(miscAmountValue / product.price);
          if (possibleQuantity > 0) {
            return {
              name: product.name,
              price: product.price,
              extraQuantity: possibleQuantity,
              extraValue: Math.min(possibleQuantity * product.price, miscAmountValue),
              isUnselected: true
            };
          }
          return null;
        })
        .filter(Boolean);
      
      // Combine and sort by best fit
      const allPossibleItems = [...selectedProductsWithExtra, ...unselectedProducts]
        .sort((a, b) => b.extraValue - a.extraValue)
        .slice(0, 3); // Show top 3 possibilities
      
      setMiscProducts(allPossibleItems);
    } else {
      setMiscProducts([]);
    }
  };

  const updateProductQuantity = (productId, change) => {
    setSelectedProducts(prev => {
      const updated = prev.map(p => {
        if (p.id === productId) {
          const newQuantity = Math.max(0, p.quantity + change);
          
          // Check if this change would exceed the transaction amount
          const tempUpdated = prev.map(tp => 
            tp.id === productId ? { ...tp, quantity: newQuantity, selected: newQuantity > 0 } : tp
          );
          const tempTotal = tempUpdated
            .filter(tp => tp.selected)
            .reduce((sum, tp) => sum + (tp.price * tp.quantity), 0);
          
          // Don't allow if it exceeds the transaction amount
          if (tempTotal > currentTransaction.amount) {
            return p; // Return unchanged
          }
          
          return { ...p, quantity: newQuantity, selected: newQuantity > 0 };
        }
        return p;
      });
      calculateMiscAmount(updated, currentTransaction.amount);
      return updated;
    });
  };

  const setProductQuantityDirect = (productId, newQuantity) => {
    const quantity = Math.max(0, parseInt(newQuantity) || 0);
    
    setSelectedProducts(prev => {
      const updated = prev.map(p => {
        if (p.id === productId) {
          // Check if this change would exceed the transaction amount
          const tempUpdated = prev.map(tp => 
            tp.id === productId ? { ...tp, quantity: quantity, selected: quantity > 0 } : tp
          );
          const tempTotal = tempUpdated
            .filter(tp => tp.selected)
            .reduce((sum, tp) => sum + (tp.price * tp.quantity), 0);
          
          // Don't allow if it exceeds the transaction amount
          if (tempTotal > currentTransaction.amount) {
            return p; // Return unchanged
          }
          
          return { ...p, quantity: quantity, selected: quantity > 0 };
        }
        return p;
      });
      calculateMiscAmount(updated, currentTransaction.amount);
      return updated;
    });
  };

  const toggleProductSelection = (productId) => {
    setSelectedProducts(prev => {
      const updated = prev.map(p => {
        if (p.id === productId) {
          const newSelected = !p.selected;
          const newQuantity = newSelected ? Math.max(1, p.quantity) : 0;
          
          // Check if selecting this product would exceed the transaction amount
          if (newSelected) {
            const tempUpdated = prev.map(tp => 
              tp.id === productId ? { ...tp, selected: true, quantity: newQuantity } : tp
            );
            const tempTotal = tempUpdated
              .filter(tp => tp.selected)
              .reduce((sum, tp) => sum + (tp.price * tp.quantity), 0);
            
            if (tempTotal > currentTransaction.amount) {
              return p; // Return unchanged if it would exceed
            }
          }
          
          return { 
            ...p, 
            selected: newSelected,
            quantity: newQuantity
          };
        }
        return p;
      });
      calculateMiscAmount(updated, currentTransaction.amount);
      return updated;
    });
  };

  const confirmTransaction = () => {
    const finalProducts = selectedProducts.filter(p => p.selected && p.quantity > 0);
    
    const transaction = {
      amount: currentTransaction.amount,
      transcription: currentTransaction.transcription,
      language: currentTransaction.language,
      payerInfo: currentTransaction.payerInfo,
      products: finalProducts,
      miscAmount: miscAmount,
      type: currentTransaction.type || 'upi_soundbox'
    };

    addTransaction(transaction);
    
    // Reset state
    setShowTransactionModal(false);
    setCurrentTransaction(null);
    setSelectedProducts([]);
    setMiscAmount(0);
    setMiscProducts([]);
    
    alert('Transaction recorded successfully! 🎉');
  };

  const cancelTransaction = () => {
    setShowTransactionModal(false);
    setCurrentTransaction(null);
    setSelectedProducts([]);
    setMiscAmount(0);
    setMiscProducts([]);
  };

  // Manual transaction entry
  const [manualAmount, setManualAmount] = useState('');
  
  const handleManualEntry = async () => {
    const amount = parseFloat(manualAmount);
    if (amount > 0) {
      const suggestions = await geminiService.suggestProducts(amount, products);
      
      setCurrentTransaction({
        amount,
        transcription: `Manual entry: ₹${amount}`,
        language: 'manual',
        payerInfo: null,
        suggestions,
        type: 'manual_entry'
      });
      setSelectedProducts(suggestions.map(s => ({ ...s, selected: true })));
      calculateMiscAmount(suggestions, amount);
      setShowTransactionModal(true);
      setManualAmount('');
    }
  };

  return (
    <div>
      <h1 className="mb-20">Transaction Capture</h1>
      
      <div className="grid grid-2">
        {/* UPI Soundbox Recording */}
        <div className="card text-center">
          <h3 className="mb-20">🔊 UPI Soundbox Recording</h3>
          <p className="mb-20" style={{ color: '#666' }}>
            Tap the microphone when your UPI soundbox announces a payment
          </p>
          
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isProcessing}
            className={`recording-btn ${isRecording ? 'recording' : ''}`}
            style={{ 
              width: '100px', 
              height: '100px', 
              fontSize: '24px',
              margin: '20px auto'
            }}
          >
            {isProcessing ? '⏳' : isRecording ? <MicOff /> : <Mic />}
          </button>
          
          <div style={{ marginTop: '20px' }}>
            {isRecording && (
              <p className="text-danger">🔴 Recording... Tap to stop</p>
            )}
            {isProcessing && (
              <p className="text-warning">Processing audio...</p>
            )}
            {!isRecording && !isProcessing && (
              <p style={{ color: '#666' }}>Ready to record</p>
            )}
          </div>
        </div>

        {/* Manual Entry */}
        <div className="card">
          <h3 className="mb-20">✏️ Manual Entry</h3>
          <p className="mb-20" style={{ color: '#666' }}>
            Enter transaction amount manually if needed
          </p>
          
          <div className="form-group">
            <label>Amount (₹)</label>
            <input
              type="number"
              value={manualAmount}
              onChange={(e) => setManualAmount(e.target.value)}
              placeholder="Enter amount"
              min="0"
              step="0.01"
            />
          </div>
          
          <button
            onClick={handleManualEntry}
            className="btn btn-primary"
            disabled={!manualAmount || parseFloat(manualAmount) <= 0}
            style={{ width: '100%' }}
          >
            Process Transaction
          </button>
        </div>
      </div>

      {/* Transaction Confirmation Modal */}
      {showTransactionModal && currentTransaction && (
        <div className="modal">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2 className="modal-title">₹{currentTransaction.amount} Received</h2>
              <button onClick={cancelTransaction} className="close-btn">
                <X />
              </button>
            </div>

            <div className="mb-20">
              <p><strong>Transcription:</strong> {currentTransaction.transcription}</p>
              {currentTransaction.payerInfo && (
                <p><strong>From:</strong> {currentTransaction.payerInfo}</p>
              )}
            </div>

            <h4 className="mb-20">Select Products Sold:</h4>
            
            <div className="mb-20">
              <button
                onClick={() => {
                  // Add all products as options for manual selection
                  const allProductOptions = products.map(p => ({
                    ...p,
                    quantity: 0,
                    selected: false,
                    confidence: 0.5
                  }));
                  
                  // Merge with existing suggestions, avoiding duplicates
                  const existingIds = selectedProducts.map(sp => sp.id);
                  const newProducts = allProductOptions.filter(p => !existingIds.includes(p.id));
                  
                  setSelectedProducts(prev => [...prev, ...newProducts]);
                }}
                className="btn btn-secondary"
                style={{ fontSize: '14px', padding: '8px 16px' }}
              >
                + Add More Products
              </button>
            </div>
            
            <div className="product-grid">
              {selectedProducts.map(product => (
                <div 
                  key={product.id} 
                  className={`product-card ${product.selected ? 'selected' : ''}`}
                  onClick={() => toggleProductSelection(product.id)}
                >
                  {products.find(p => p.id === product.id)?.image ? (
                    <img 
                      src={products.find(p => p.id === product.id).image} 
                      alt={product.name} 
                      className="product-image" 
                    />
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
                  
                  {product.selected && (
                    <div className="mt-10">
                      <div className="flex-center gap-5 mb-5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateProductQuantity(product.id, -1);
                          }}
                          className="btn btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '12px' }}
                        >
                          <Minus size={12} />
                        </button>
                        
                        <input
                          type="number"
                          value={product.quantity}
                          onChange={(e) => {
                            e.stopPropagation();
                            setProductQuantityDirect(product.id, e.target.value);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          style={{ 
                            width: '50px', 
                            textAlign: 'center', 
                            padding: '4px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontSize: '12px'
                          }}
                          min="0"
                        />
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateProductQuantity(product.id, 1);
                          }}
                          className="btn btn-primary"
                          style={{ padding: '4px 8px', fontSize: '12px' }}
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      <div style={{ fontSize: '11px', color: '#666' }}>
                        Total: ₹{product.price * product.quantity}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-20">
              <div className="flex-between">
                <span>Products Total:</span>
                <span>₹{selectedProducts
                  .filter(p => p.selected)
                  .reduce((sum, p) => sum + (p.price * p.quantity), 0)
                }</span>
              </div>
              
              {miscAmount > 0 && (
                <div>
                  <div className="flex-between text-warning">
                    <span>Miscellaneous:</span>
                    <span>₹{miscAmount}</span>
                  </div>
                  {miscProducts.length > 0 && (
                    <div style={{ 
                      fontSize: '12px', 
                      color: '#856404', 
                      marginTop: '5px',
                      fontStyle: 'italic'
                    }}>
                      Possible items: {miscProducts.map(mp => 
                        `${mp.extraQuantity}x ${mp.name}${mp.isUnselected ? ' (not selected)' : ' (additional)'} (₹${mp.extraValue})`
                      ).join(', ')}
                    </div>
                  )}
                  {miscProducts.length === 0 && miscAmount > 0 && (
                    <div style={{ 
                      fontSize: '12px', 
                      color: '#856404', 
                      marginTop: '5px',
                      fontStyle: 'italic'
                    }}>
                      Unaccounted amount - possibly sold-out items, tips, or unlisted products
                    </div>
                  )}
                </div>
              )}
              
              <hr style={{ margin: '10px 0' }} />
              
              <div className="flex-between" style={{ fontWeight: 'bold', fontSize: '18px' }}>
                <span>Total:</span>
                <span>₹{currentTransaction.amount}</span>
              </div>
            </div>

            <div className="flex gap-10 mt-20">
              <button onClick={cancelTransaction} className="btn btn-secondary">
                <X size={18} style={{ marginRight: '8px' }} />
                Cancel
              </button>
              
              <button 
                onClick={confirmTransaction} 
                className="btn btn-success"
                style={{ flex: 1 }}
              >
                <Check size={18} style={{ marginRight: '8px' }} />
                Confirm Sale
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionCapture;