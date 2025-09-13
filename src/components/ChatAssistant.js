import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff } from 'lucide-react';
import { useData } from '../context/DataContext';
import geminiService from '../services/geminiService';

const ChatAssistant = () => {
  const { shopData, products, transactions, inventory } = useData();
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'assistant',
      content: `नमस्ते! मैं आपका Smart Shop Assistant हूँ। आप मुझसे अपनी दुकान के बारे में कुछ भी पूछ सकते हैं।

Hello! I'm your Smart Shop Assistant. You can ask me anything about your shop in English, Hindi, or Kannada.

ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ Smart Shop Assistant. ನೀವು ನಿಮ್ಮ ಅಂಗಡಿಯ ಬಗ್ಗೆ ಏನು ಬೇಕಾದರೂ ಕೇಳಬಹುದು.`,
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (messageText = inputMessage) => {
    if (!messageText.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: messageText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const context = {
        shopData,
        products,
        transactions,
        inventory
      };

      const response = await geminiService.chatWithAssistant(messageText, context);
      
      const assistantMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await processVoiceInput(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting voice recording:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processVoiceInput = async (audioBlob) => {
    try {
      let transcriptionResult;
      
      if (!process.env.REACT_APP_GEMINI_API_KEY) {
        // Mock transcription for demo
        transcriptionResult = {
          transcription: "आज कितना बेचा?", // "How much did I sell today?"
          amount: 0,
          language: 'hindi'
        };
      } else {
        transcriptionResult = await geminiService.transcribeAudio(audioBlob);
      }

      if (transcriptionResult.transcription) {
        await sendMessage(transcriptionResult.transcription);
      }
    } catch (error) {
      console.error('Voice processing error:', error);
      alert('Error processing voice input. Please try again.');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickQuestions = [
    { text: "आज कितना बेचा?", translation: "How much did I sell today?" },
    { text: "कौन सा product सबसे ज्यादा बिका?", translation: "Which product sold the most?" },
    { text: "Stock में क्या कम है?", translation: "What's low in stock?" },
    { text: "इस हफ्ते का revenue कितना है?", translation: "What's this week's revenue?" },
    { text: "Vada Pav कितने बचे हैं?", translation: "How many Vada Pav are left?" }
  ];

  return (
    <div>
      <h1 className="mb-20">💬 Chat Assistant</h1>
      
      <div className="card">
        <div className="chat-container">
          <div className="chat-messages">
            {messages.map(message => (
              <div
                key={message.id}
                className={`chat-message ${message.type}`}
              >
                <div style={{ whiteSpace: 'pre-wrap' }}>
                  {message.content}
                </div>
                <div style={{ 
                  fontSize: '11px', 
                  opacity: 0.7, 
                  marginTop: '5px' 
                }}>
                  {message.timestamp.toLocaleTimeString('en-IN', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="chat-message assistant">
                <div>Thinking... 🤔</div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about your shop... (English/Hindi/Kannada)"
              disabled={isLoading}
            />
            
            <button
              onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
              className={`recording-btn ${isRecording ? 'recording' : ''}`}
              disabled={isLoading}
              title="Voice input"
            >
              {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
            
            <button
              onClick={() => sendMessage()}
              className="btn btn-primary"
              disabled={!inputMessage.trim() || isLoading}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Questions */}
      <div className="card mt-20">
        <h3 className="mb-20">Quick Questions</h3>
        <div className="grid grid-2">
          {quickQuestions.map((question, index) => (
            <button
              key={index}
              onClick={() => sendMessage(question.text)}
              className="btn btn-secondary"
              style={{ 
                textAlign: 'left', 
                padding: '12px',
                height: 'auto',
                whiteSpace: 'normal'
              }}
              disabled={isLoading}
            >
              <div style={{ fontWeight: '600' }}>{question.text}</div>
              <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px' }}>
                {question.translation}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Usage Tips */}
      <div className="card mt-20">
        <h3 className="mb-20">💡 Usage Tips</h3>
        <div className="grid grid-3">
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>📊</div>
            <div style={{ fontWeight: '600', marginBottom: '5px' }}>Sales Analytics</div>
            <div style={{ fontSize: '14px', color: '#666' }}>
              Ask about daily, weekly sales, top products, revenue trends
            </div>
          </div>
          
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>📦</div>
            <div style={{ fontWeight: '600', marginBottom: '5px' }}>Inventory Help</div>
            <div style={{ fontSize: '14px', color: '#666' }}>
              Check stock levels, get reorder suggestions, track products
            </div>
          </div>
          
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>🗣️</div>
            <div style={{ fontWeight: '600', marginBottom: '5px' }}>Voice Support</div>
            <div style={{ fontSize: '14px', color: '#666' }}>
              Speak in Hindi, English, or Kannada for hands-free interaction
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatAssistant;