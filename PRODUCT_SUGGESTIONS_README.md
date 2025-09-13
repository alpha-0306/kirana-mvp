# Product Suggestions System - Technical Documentation

## Overview

The Smart Shop Assistant uses an intelligent product suggestion system that analyzes UPI transaction amounts and recommends the most likely product combinations that match the payment received. This system works both with AI (Gemini API) and has a sophisticated fallback algorithm.

## How It Works

### 1. **Input Processing**
When a UPI transaction is captured (via audio or manual entry), the system:
- Extracts the transaction amount (e.g., ₹35, ₹50, ₹100)
- Passes this amount along with the shop's product catalog to the suggestion engine
- Considers historical transaction patterns for better accuracy

### 2. **AI-Powered Suggestions (Gemini API)**
When Gemini API is available, the system:
- Sends a contextual prompt with the amount, product list, and recent transaction history
- Asks Gemini to suggest the most likely product combinations
- Considers Indian shopping patterns and common purchase behaviors
- Returns suggestions with confidence scores

### 3. **Fallback Algorithm (No API Required)**
When Gemini API is unavailable, the system uses a sophisticated fallback algorithm with multiple strategies:

#### **Strategy 1: Exact Price Match**
```
Transaction: ₹25
Products: Vada Pav (₹25), Tea (₹10), Samosa (₹15)
Suggestion: 1x Vada Pav (₹25) - Confidence: 95%
```

#### **Strategy 2: Exact Quantity Match**
```
Transaction: ₹50
Products: Tea (₹10), Vada Pav (₹25)
Suggestions: 
- 5x Tea (₹50) - Confidence: 90%
- 2x Vada Pav (₹50) - Confidence: 90%
```

#### **Strategy 3: Two-Product Combinations**
```
Transaction: ₹35
Products: Tea (₹10), Vada Pav (₹25), Samosa (₹15)
Suggestions:
- 1x Vada Pav + 1x Tea (₹35) - Confidence: 80%
- 2x Samosa + 1x Tea (₹40) - Would exceed, not suggested
```

#### **Strategy 4: Best Fit (Closest Without Exceeding)**
```
Transaction: ₹45
Products: Vada Pav (₹25), Tea (₹10), Samosa (₹15)
Suggestion: 1x Vada Pav + 2x Tea (₹45) - Confidence: 60%
```

## Real-World Examples

### Example 1: Tea Stall
**Products:**
- Tea: ₹10
- Coffee: ₹15
- Biscuit: ₹5
- Samosa: ₹12

**Transaction: ₹30**
**Suggestions:**
1. 3x Tea (₹30) - Most likely for a tea stall
2. 2x Coffee (₹30) - Alternative
3. 1x Tea + 1x Samosa + 2x Biscuit (₹32) - Exceeds, not shown

### Example 2: Snack Shop
**Products:**
- Vada Pav: ₹25
- Pav Bhaji: ₹40
- Cold Drink: ₹20
- Chips: ₹10

**Transaction: ₹45**
**Suggestions:**
1. 1x Vada Pav + 1x Cold Drink (₹45) - Perfect match
2. 1x Pav Bhaji + 1x Chips (₹50) - Exceeds, not shown

### Example 3: General Store
**Products:**
- Bread: ₹25
- Milk: ₹30
- Eggs (dozen): ₹60
- Sugar (1kg): ₹45

**Transaction: ₹55**
**Suggestions:**
1. 1x Bread + 1x Milk (₹55) - Exact match
2. 1x Sugar + 1x Bread (₹70) - Exceeds, not shown

## Key Features

### **Smart Constraints**
- **Never Exceeds Amount**: Suggestions never total more than the transaction amount
- **Reasonable Quantities**: Limits quantities to realistic numbers (max 10 of any item)
- **Confidence Scoring**: Each suggestion has a confidence score based on likelihood

### **Combination Logic**
- **Exact Matches Prioritized**: Perfect amount matches get highest confidence
- **Common Combinations**: Considers typical Indian shopping patterns
- **Historical Learning**: Uses past transaction data to improve suggestions

### **User Control**
- **Manual Override**: Users can modify quantities or add/remove products
- **Add More Products**: Option to manually select products not in suggestions
- **Miscellaneous Handling**: Remaining amount automatically classified as "misc"

## Algorithm Priority Order

1. **Exact single product match** (Confidence: 95%)
2. **Exact quantity multiples** (Confidence: 90%)
3. **Two-product exact combinations** (Confidence: 80%)
4. **Three-product combinations** (Confidence: 70%)
5. **Best single product fit** (Confidence: 60%)

## Validation Rules

### **Amount Validation**
```javascript
// Prevent exceeding transaction amount
const productTotal = selectedProducts
  .filter(p => p.selected)
  .reduce((sum, p) => sum + (p.price * p.quantity), 0);

if (productTotal > transactionAmount) {
  // Reject the change
  return previousState;
}
```

### **Quantity Limits**
```javascript
// Reasonable quantity limits
const maxQuantity = Math.min(
  10, // Maximum 10 of any item
  Math.floor(transactionAmount / productPrice) // Can't exceed what amount allows
);
```

## Integration with Transaction Flow

### **Step 1: Audio Capture**
```
UPI Soundbox: "You have received ₹35 via PhonePe"
↓
Gemini Transcription: { amount: 35, transcription: "..." }
```

### **Step 2: Product Suggestion**
```
Input: amount=35, products=[{Tea: ₹10}, {Vada Pav: ₹25}]
↓
Suggestions: [
  { id: 'vada_pav', quantity: 1, price: 25 },
  { id: 'tea', quantity: 1, price: 10 }
] // Total: ₹35
```

### **Step 3: User Confirmation**
```
User Interface:
☑️ 1x Vada Pav (₹25)
☑️ 1x Tea (₹10)
━━━━━━━━━━━━━━━━━━━━
Products Total: ₹35
Miscellaneous: ₹0
━━━━━━━━━━━━━━━━━━━━
Grand Total: ₹35 ✓
```

### **Step 4: Transaction Logging**
```javascript
{
  amount: 35,
  products: [
    { id: 'vada_pav', name: 'Vada Pav', quantity: 1, price: 25 },
    { id: 'tea', name: 'Tea', quantity: 1, price: 10 }
  ],
  miscAmount: 0,
  transcription: "You have received ₹35 via PhonePe",
  type: 'upi_soundbox'
}
```

## Error Handling

### **No Valid Combinations**
If no products can fit within the amount:
```
Transaction: ₹5
Products: All items > ₹5
Result: Empty suggestions, full amount goes to "miscellaneous"
```

### **API Failures**
If Gemini API fails:
```
Gemini API Error → Fallback Algorithm → Basic Suggestions
```

### **Invalid Amounts**
```javascript
if (amount <= 0) {
  showError("Invalid transaction amount");
  return;
}
```

## Performance Optimizations

### **Caching**
- Recent suggestions cached for similar amounts
- Product combinations pre-calculated for common amounts

### **Limits**
- Maximum 5 suggestion combinations shown
- Algorithm stops after finding 10 valid combinations
- Timeout after 2 seconds for complex calculations

## Future Enhancements

### **Machine Learning**
- Learn from user corrections to improve suggestions
- Seasonal pattern recognition (cold drinks in summer)
- Time-based suggestions (breakfast items in morning)

### **Advanced Combinations**
- Support for 3+ product combinations
- Bulk discount considerations
- Customer preference learning

---

This system ensures that shopkeepers get intelligent, accurate product suggestions that match their actual sales patterns while maintaining simplicity and reliability.