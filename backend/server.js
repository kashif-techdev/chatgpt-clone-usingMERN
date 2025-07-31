import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import mongoose from 'mongoose';
import OpenAI from 'openai';

// Import routes
import authRoutes from './routes/auth.js';
import conversationRoutes from './routes/conversations.js';

// Import models
import User from './models/User.js';
import Conversation from './models/Conversation.js';

dotenv.config();
const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/chatgpt_clone')
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// OpenAI Setup
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/conversations', conversationRoutes);

// Root Route
app.get('/', (req, res) => {
  res.json({
    message: '🚀 ChatGPT Clone API is running...',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      conversations: '/api/conversations',
      chat: '/api/chat'
    }
  });
});

// Enhanced Chat API Route with conversation support
app.post('/api/chat', async (req, res) => {
  try {
    const { message, conversationId, userId } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // Get conversation context if conversationId is provided
    let conversationContext = [];
    if (conversationId && userId) {
      const conversation = await Conversation.findOne({
        _id: conversationId,
        userId: userId
      });
      
      if (conversation) {
        // Get last 10 messages for context
        const recentMessages = conversation.messages.slice(-10);
        conversationContext = recentMessages.map(msg => ({
          role: msg.role,
          content: msg.content
        }));
      }
    }

    // Prepare messages for OpenAI
    const messages = [
      ...conversationContext,
      { role: "user", content: message }
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages,
      max_tokens: 1000,
      temperature: 0.7,
    });

    const aiResponse = completion.choices[0].message.content;

    // Save to conversation if conversationId is provided
    if (conversationId && userId) {
      const conversation = await Conversation.findOne({
        _id: conversationId,
        userId: userId
      });
      
      if (conversation) {
        await conversation.addMessage('user', message);
        await conversation.addMessage('assistant', aiResponse);
      }
    }

    res.json({ 
      reply: aiResponse,
      conversationId: conversationId || null
    });
  } catch (error) {
    console.error("OpenAI API Error:", error);
    
    if (error.response?.status === 401) {
      return res.status(401).json({ error: "Invalid OpenAI API key" });
    }
    
    if (error.response?.status === 429) {
      return res.status(429).json({ error: "Rate limit exceeded. Please try again later." });
    }
    
    res.status(500).json({ error: "Something went wrong with the AI service" });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🌍 Server running on http://localhost:${PORT}`);
  console.log(`📚 API Documentation available at http://localhost:${PORT}`);
  console.log(`🔍 Health check at http://localhost:${PORT}/api/health`);
});
