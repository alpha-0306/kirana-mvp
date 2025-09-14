# Smart Shop Assistant - Hackathon MVP

A comprehensive web application for Indian shopkeepers to track sales, manage inventory, and get AI-powered insights from UPI transactions using Gemini APIs.

## 🚀 Features

### 1. **Onboarding**
- Simple shop setup (name, type)
- Product catalog creation with images
- Initial inventory setup

### 2. **UPI Transaction Capture**
- **Voice Recording**: Capture UPI soundbox alerts via microphone
- **AI Transcription**: Extract transaction amounts using Gemini API
- **Smart Product Suggestions**: AI-powered product recommendations based on amount
- **Manual Entry**: Fallback for manual transaction entry
- **Multi-language Support**: English, Hindi, Kannada

### 3. **Inventory Management**
- Real-time stock tracking
- Low stock alerts
- Manual stock adjustments
- Expiry date tracking
- Add new products on-the-fly

### 4. **Dashboard**
- Today's sales overview
- Top-selling products
- Revenue trends (7-day chart)
- Stock alerts
- Quick action buttons

### 5. **AI Chat Assistant**
- **Voice & Text Input**: Ask questions in English, Hindi, or Kannada
- **Context-Aware**: Knows your shop data, inventory, and sales
- **Smart Insights**: Get business insights and recommendations
- **Quick Questions**: Pre-built common queries

## 🛠️ Tech Stack

- **Frontend**: React 18, React Router
- **AI Integration**: Google Gemini API
- **Charts**: Recharts
- **Icons**: Lucide React
- **Storage**: Local Storage (no backend required)
- **Audio**: Web Audio API for voice recording

## 📋 Prerequisites

- Node.js 16+ and npm
- Modern web browser with microphone access
- Google Gemini API key

## 🚀 Quick Start

### 1. Clone and Install
```bash
git clone <repository-url>
cd shopkeeper-mvp
npm install
```

### 2. Setup Environment
```bash
# Copy the example environment file
cp .env.example .env

# Add your Gemini API key to .env
REACT_APP_GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Get Gemini API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy and paste it into your `.env` file

### 4. Start Development Server
```bash
npm start
```

The app will open at `http://localhost:3000`

## 📱 Usage Guide

### First Time Setup
1. **Shop Details**: Enter your shop name and type
2. **Add Products**: Create your product catalog with names, prices, and stock
3. **Complete Setup**: Your shop is ready!

### Recording UPI Transactions
1. Go to **Sales** tab
2. Click the microphone button when your UPI soundbox announces a payment
3. The AI will transcribe and extract the amount
4. Confirm the products sold from the suggested list
5. Transaction is automatically logged and inventory updated

### Managing Inventory
1. Go to **Inventory** tab
2. View current stock levels and alerts
3. Edit stock quantities, reorder thresholds, and expiry dates
4. Add new products as needed

### Using Chat Assistant
1. Go to **Assistant** tab
2. Ask questions like:
   - "आज कितना बेचा?" (How much did I sell today?)
   - "Which product is selling the most?"
   - "Stock में क्या कम है?" (What's low in stock?)
3. Use voice input for hands-free interaction

## 🎯 UPI Soundbox Messages Supported

The app recognizes these common UPI alert patterns:

**English:**
- "You have received ₹[AMOUNT] via [APP]"
- "Payment of ₹[AMOUNT] received"
- "Transaction of ₹[AMOUNT] successful"

**Hindi:**
- "आपको [APP] के माध्यम से ₹[AMOUNT] प्राप्त हुए"
- "₹[AMOUNT] का भुगतान प्राप्त हुआ"

**Kannada:**
- "[APP] ಮೂಲಕ ನಿಮಗೆ ₹[AMOUNT] ಸ್ವೀಕರಿಸಲಾಗಿದೆ"
- "₹[AMOUNT] ರ ಪಾವತಿ ಸ್ವೀಕರಿಸಲಾಗಿದೆ"

## 🔧 Development Features

### Mock Mode
If no Gemini API key is provided, the app runs in mock mode with:
- Simulated transcription results
- Basic product suggestions
- Limited chat responses

### Data Persistence
- All data stored in browser's localStorage
- No external database required
- Data persists between sessions

### Responsive Design
- Mobile-friendly interface
- Touch-optimized controls
- Works on tablets and phones

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Netlify/Vercel
1. Build the project: `npm run build`
2. Upload the `build` folder to your hosting service
3. Set environment variable `REACT_APP_GEMINI_API_KEY` in your hosting dashboard

## 🔒 Privacy & Security

- All data stored locally in browser
- No data sent to external servers (except Gemini API calls)
- Audio recordings processed in real-time, not stored
- API key stored in environment variables

## 🐛 Troubleshooting

### Microphone Not Working
- Check browser permissions for microphone access
- Ensure you're using HTTPS (required for microphone API)
- Try refreshing the page

### API Errors
- Verify your Gemini API key is correct
- Check your internet connection
- Ensure you have API quota remaining

### Data Loss
- Data is stored in localStorage
- Clearing browser data will reset the app
- Export important data before clearing browser storage

## 🤝 Contributing

This is a hackathon MVP. For improvements:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - feel free to use this for your hackathon or commercial projects!

---

**Built with ❤️ for Indian Shopkeepers**

*Empowering small businesses with AI-powered sales and inventory management*
