import { GoogleGenerativeAI } from '@google/generative-ai';

class GeminiService {
  constructor() {
    this.apiKey = process.env.REACT_APP_GEMINI_API_KEY;
    if (!this.apiKey) {
      console.warn('Gemini API key not found. Please add REACT_APP_GEMINI_API_KEY to your .env file');
    }
    this.genAI = this.apiKey ? new GoogleGenerativeAI(this.apiKey) : null;
  }

  async transcribeAudio(audioBlob) {
    if (!this.genAI) {
      throw new Error('Gemini API key not configured');
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
      // Convert blob to base64
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      
      const prompt = `
        Transcribe this audio which is a UPI transaction alert from an Indian payment soundbox. 
        The audio might be in English, Hindi, or Kannada. 
        Extract the transaction amount in rupees and return it as a JSON object with:
        {
          "transcription": "full transcribed text",
          "amount": number (amount in rupees),
          "language": "detected language",
          "payerInfo": "payer name or UPI ID if mentioned, otherwise null"
        }
      `;

      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            mimeType: audioBlob.type,
            data: base64Audio
          }
        }
      ]);

      const response = await result.response;
      const text = response.text();
      
      try {
        return JSON.parse(text);
      } catch (e) {
        // Fallback parsing if JSON is malformed
        const amountMatch = text.match(/₹?(\d+)/);
        return {
          transcription: text,
          amount: amountMatch ? parseInt(amountMatch[1]) : 0,
          language: 'unknown',
          payerInfo: null
        };
      }
    } catch (error) {
      console.error('Transcription error:', error);
      throw error;
    }
  }

  async suggestProducts(amount, products, transactionHistory = []) {
    if (!this.genAI) {
      // Fallback logic without AI
      return this.fallbackProductSuggestion(amount, products);
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
      const productList = products.map(p => `${p.name}: ₹${p.price}`).join(', ');
      const recentTransactions = transactionHistory.slice(0, 10).map(t => 
        `₹${t.amount} -> ${t.products?.map(p => p.name).join(', ') || 'Unknown'}`
      ).join('\n');

      const prompt = `
        A customer paid ₹${amount} at an Indian shop. 
        Available products: ${productList}
        Recent transaction patterns:
        ${recentTransactions}

        Suggest the most likely product combination that matches this amount.
        Consider:
        1. Exact price matches first
        2. Common combinations that sum to this amount
        3. Past purchase patterns
        4. Typical Indian shop buying behavior

        Return a JSON array of suggested products:
        [
          {
            "id": "product_id",
            "name": "product_name",
            "price": price_per_unit,
            "quantity": suggested_quantity,
            "confidence": confidence_score_0_to_1
          }
        ]

        If the amount exceeds the suggested products' total, the remaining should be handled as miscellaneous.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      try {
        const suggestions = JSON.parse(text);
        return Array.isArray(suggestions) ? suggestions : [suggestions];
      } catch (e) {
        return this.fallbackProductSuggestion(amount, products);
      }
    } catch (error) {
      console.error('Product suggestion error:', error);
      return this.fallbackProductSuggestion(amount, products);
    }
  }

  fallbackProductSuggestion(amount, products) {
    const suggestions = [];
    
    // 1. Exact price match
    const exactMatch = products.find(p => p.price === amount);
    if (exactMatch) {
      suggestions.push([{
        id: exactMatch.id,
        name: exactMatch.name,
        price: exactMatch.price,
        quantity: 1,
        confidence: 0.95
      }]);
    }

    // 2. Single product with exact quantity
    for (const product of products) {
      if (product.price > 0 && amount % product.price === 0) {
        const quantity = amount / product.price;
        if (quantity > 0 && quantity <= 10) { // Reasonable quantity limit
          suggestions.push([{
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: quantity,
            confidence: 0.9
          }]);
        }
      }
    }

    // 3. Two-product combinations that sum exactly to amount
    for (let i = 0; i < products.length; i++) {
      for (let j = i + 1; j < products.length; j++) {
        const product1 = products[i];
        const product2 = products[j];
        
        // Try different quantity combinations
        for (let q1 = 1; q1 <= 5; q1++) {
          for (let q2 = 1; q2 <= 5; q2++) {
            const total = (product1.price * q1) + (product2.price * q2);
            if (total === amount) {
              suggestions.push([
                {
                  id: product1.id,
                  name: product1.name,
                  price: product1.price,
                  quantity: q1,
                  confidence: 0.8
                },
                {
                  id: product2.id,
                  name: product2.name,
                  price: product2.price,
                  quantity: q2,
                  confidence: 0.8
                }
              ]);
            }
          }
        }
      }
    }

    // 4. Best single product fit (closest without exceeding)
    const sortedProducts = products
      .filter(p => p.price <= amount)
      .sort((a, b) => b.price - a.price);
    
    if (sortedProducts.length > 0) {
      const bestProduct = sortedProducts[0];
      const maxQuantity = Math.floor(amount / bestProduct.price);
      if (maxQuantity > 0) {
        suggestions.push([{
          id: bestProduct.id,
          name: bestProduct.name,
          price: bestProduct.price,
          quantity: maxQuantity,
          confidence: 0.6
        }]);
      }
    }

    // Remove duplicates and return top 5 combinations
    const uniqueSuggestions = suggestions
      .filter((combo, index, self) => {
        const comboKey = combo.map(p => `${p.id}-${p.quantity}`).sort().join('|');
        return index === self.findIndex(c => 
          c.map(p => `${p.id}-${p.quantity}`).sort().join('|') === comboKey
        );
      })
      .sort((a, b) => {
        const aTotal = a.reduce((sum, p) => sum + (p.price * p.quantity), 0);
        const bTotal = b.reduce((sum, p) => sum + (p.price * p.quantity), 0);
        const aConfidence = a.reduce((sum, p) => sum + p.confidence, 0) / a.length;
        const bConfidence = b.reduce((sum, p) => sum + p.confidence, 0) / b.length;
        
        // Prefer exact matches, then by confidence
        if (aTotal === amount && bTotal !== amount) return -1;
        if (bTotal === amount && aTotal !== amount) return 1;
        return bConfidence - aConfidence;
      })
      .slice(0, 5);

    // Flatten the first suggestion as default, keep others as alternatives
    return uniqueSuggestions.length > 0 ? uniqueSuggestions[0] : [];
  }

  async chatWithAssistant(message, context) {
    if (!this.genAI) {
      return "Sorry, I need the Gemini API key to be configured to help you. Please add your API key to the .env file.";
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
      const { shopData, products, transactions, inventory } = context;
      
      const contextPrompt = `
        You are a helpful assistant for an Indian shopkeeper. Respond in a friendly, conversational tone.
        You can respond in English, Hindi, or Kannada based on the user's language preference.
        
        Shop Details:
        - Name: ${shopData?.name || 'Shop'}
        - Type: ${shopData?.type || 'General Store'}
        
        Current Inventory:
        ${inventory.map(item => `${item.name}: ${item.stock} units (₹${item.price} each)`).join('\n')}
        
        Recent Transactions (last 5):
        ${transactions.slice(0, 5).map(t => 
          `₹${t.amount} - ${t.products?.map(p => `${p.quantity}x ${p.name}`).join(', ') || 'Unknown'} (${new Date(t.timestamp).toLocaleString('en-IN')})`
        ).join('\n')}
        
        Today's Sales: ₹${transactions.filter(t => t.date === new Date().toDateString()).reduce((sum, t) => sum + t.amount, 0)}
        
        User Question: ${message}
        
        Provide helpful, accurate information based on the shop data. Keep responses concise and practical.
      `;

      const result = await model.generateContent(contextPrompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Chat error:', error);
      return "Sorry, I'm having trouble processing your request right now. Please try again.";
    }
  }

  // Mock transcription for testing without API key
  mockTranscribeAudio(mockAmount = null) {
    const mockMessages = [
      { text: "You have received ₹35 via PhonePe", amount: 35 },
      { text: "Payment of ₹50 received", amount: 50 },
      { text: "₹25 received via UPI", amount: 25 },
      { text: "Transaction of ₹100 successful", amount: 100 },
      { text: "आपको PhonePe के माध्यम से ₹40 प्राप्त हुए", amount: 40 }
    ];
    
    const randomMessage = mockMessages[Math.floor(Math.random() * mockMessages.length)];
    
    return Promise.resolve({
      transcription: randomMessage.text,
      amount: mockAmount || randomMessage.amount,
      language: 'hindi',
      payerInfo: null
    });
  }
}

export default new GeminiService();