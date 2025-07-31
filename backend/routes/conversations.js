import express from 'express';
import Conversation from '../models/Conversation.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/conversations
// @desc    Get all conversations for current user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, archived = false, search = '' } = req.query;
    
    const query = {
      userId: req.user._id,
      isArchived: archived === 'true'
    };

    // Add search functionality
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { 'messages.content': { $regex: search, $options: 'i' } }
      ];
    }

    const conversations = await Conversation.find(query)
      .sort({ updatedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('title messageCount lastMessage createdAt updatedAt isArchived isPinned tags');

    const total = await Conversation.countDocuments(query);

    res.json({
      conversations,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });

  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      error: 'Server error while fetching conversations'
    });
  }
});

// @route   POST /api/conversations
// @desc    Create a new conversation
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { title, initialMessage } = req.body;

    const conversation = new Conversation({
      userId: req.user._id,
      title: title || 'New Chat'
    });

    // Add initial message if provided
    if (initialMessage) {
      await conversation.addMessage('user', initialMessage);
      await conversation.updateTitleFromFirstMessage();
    }

    await conversation.save();

    res.status(201).json({
      message: 'Conversation created successfully',
      conversation: conversation.getSummary()
    });

  } catch (error) {
    console.error('Create conversation error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        error: errors.join(', ')
      });
    }

    res.status(500).json({
      error: 'Server error while creating conversation'
    });
  }
});

// @route   GET /api/conversations/:id
// @desc    Get a specific conversation with messages
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!conversation) {
      return res.status(404).json({
        error: 'Conversation not found'
      });
    }

    res.json({
      conversation
    });

  } catch (error) {
    console.error('Get conversation error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        error: 'Invalid conversation ID'
      });
    }

    res.status(500).json({
      error: 'Server error while fetching conversation'
    });
  }
});

// @route   PUT /api/conversations/:id
// @desc    Update conversation (title, tags, settings)
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, tags, isArchived, isPinned, settings } = req.body;
    const updates = {};

    if (title !== undefined) updates.title = title;
    if (tags !== undefined) updates.tags = tags;
    if (isArchived !== undefined) updates.isArchived = isArchived;
    if (isPinned !== undefined) updates.isPinned = isPinned;
    if (settings !== undefined) updates.settings = { ...updates.settings, ...settings };

    const conversation = await Conversation.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user._id
      },
      updates,
      { new: true, runValidators: true }
    );

    if (!conversation) {
      return res.status(404).json({
        error: 'Conversation not found'
      });
    }

    res.json({
      message: 'Conversation updated successfully',
      conversation: conversation.getSummary()
    });

  } catch (error) {
    console.error('Update conversation error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        error: errors.join(', ')
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        error: 'Invalid conversation ID'
      });
    }

    res.status(500).json({
      error: 'Server error while updating conversation'
    });
  }
});

// @route   DELETE /api/conversations/:id
// @desc    Delete a conversation
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const conversation = await Conversation.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!conversation) {
      return res.status(404).json({
        error: 'Conversation not found'
      });
    }

    res.json({
      message: 'Conversation deleted successfully'
    });

  } catch (error) {
    console.error('Delete conversation error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        error: 'Invalid conversation ID'
      });
    }

    res.status(500).json({
      error: 'Server error while deleting conversation'
    });
  }
});

// @route   POST /api/conversations/:id/messages
// @desc    Add a message to conversation
// @access  Private
router.post('/:id/messages', auth, async (req, res) => {
  try {
    const { role, content, model } = req.body;

    if (!role || !content) {
      return res.status(400).json({
        error: 'Role and content are required'
      });
    }

    if (!['user', 'assistant'].includes(role)) {
      return res.status(400).json({
        error: 'Role must be either "user" or "assistant"'
      });
    }

    const conversation = await Conversation.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!conversation) {
      return res.status(404).json({
        error: 'Conversation not found'
      });
    }

    await conversation.addMessage(role, content, model);
    
    // Update title from first user message if it's the first message
    if (conversation.messages.length === 1) {
      await conversation.updateTitleFromFirstMessage();
    }

    res.json({
      message: 'Message added successfully',
      conversation: conversation.getSummary()
    });

  } catch (error) {
    console.error('Add message error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        error: errors.join(', ')
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        error: 'Invalid conversation ID'
      });
    }

    res.status(500).json({
      error: 'Server error while adding message'
    });
  }
});

// @route   GET /api/conversations/search
// @desc    Search conversations
// @access  Private
router.get('/search', auth, async (req, res) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;

    if (!q) {
      return res.status(400).json({
        error: 'Search query is required'
      });
    }

    const query = {
      userId: req.user._id,
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { 'messages.content': { $regex: q, $options: 'i' } },
        { tags: { $in: [new RegExp(q, 'i')] } }
      ]
    };

    const conversations = await Conversation.find(query)
      .sort({ updatedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('title messageCount lastMessage createdAt updatedAt isArchived isPinned tags');

    const total = await Conversation.countDocuments(query);

    res.json({
      conversations,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
      query: q
    });

  } catch (error) {
    console.error('Search conversations error:', error);
    res.status(500).json({
      error: 'Server error while searching conversations'
    });
  }
});

export default router; 