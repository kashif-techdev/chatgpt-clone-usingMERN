import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  tokens: {
    type: Number,
    default: 0
  },
  model: {
    type: String,
    default: 'gpt-4o-mini'
  }
}, {
  timestamps: true
});

const conversationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  messages: [messageSchema],
  isArchived: {
    type: Boolean,
    default: false
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String,
    trim: true
  }],
  totalTokens: {
    type: Number,
    default: 0
  },
  model: {
    type: String,
    default: 'gpt-4o-mini'
  },
  settings: {
    temperature: {
      type: Number,
      default: 0.7,
      min: 0,
      max: 2
    },
    maxTokens: {
      type: Number,
      default: 1000
    }
  }
}, {
  timestamps: true
});

// Index for faster queries
conversationSchema.index({ userId: 1, createdAt: -1 });
conversationSchema.index({ userId: 1, isArchived: 1 });
conversationSchema.index({ userId: 1, isPinned: 1 });

// Virtual for message count
conversationSchema.virtual('messageCount').get(function() {
  return this.messages.length;
});

// Method to add message
conversationSchema.methods.addMessage = function(role, content, model = 'gpt-4o-mini') {
  this.messages.push({
    role,
    content,
    model,
    timestamp: new Date()
  });
  this.model = model;
  return this.save();
};

// Method to update title from first user message
conversationSchema.methods.updateTitleFromFirstMessage = function() {
  const firstUserMessage = this.messages.find(msg => msg.role === 'user');
  if (firstUserMessage && !this.title) {
    this.title = firstUserMessage.content.substring(0, 50) + (firstUserMessage.content.length > 50 ? '...' : '');
  }
  return this.save();
};

// Method to get conversation summary
conversationSchema.methods.getSummary = function() {
  return {
    id: this._id,
    title: this.title,
    messageCount: this.messageCount,
    lastMessage: this.messages[this.messages.length - 1],
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    isArchived: this.isArchived,
    isPinned: this.isPinned,
    tags: this.tags
  };
};

const Conversation = mongoose.model('Conversation', conversationSchema);

export default Conversation; 