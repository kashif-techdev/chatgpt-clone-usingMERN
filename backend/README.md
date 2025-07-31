# ChatGPT Clone Backend API

A complete backend API for the ChatGPT clone with user authentication, conversation management, and AI integration.

## 🚀 Features

- **User Authentication** - JWT-based authentication with bcrypt password hashing
- **Conversation Management** - Full CRUD operations for chat conversations
- **AI Integration** - OpenAI GPT-4 integration with conversation context
- **Search Functionality** - Search conversations by title and content
- **Pagination** - Efficient data loading with pagination support
- **Error Handling** - Comprehensive error handling and validation

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- OpenAI API key

## 🛠️ Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create environment file:**
   ```bash
   cp .env.example .env
   ```

3. **Configure environment variables:**
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://127.0.0.1:27017/chatgpt_clone
   JWT_SECRET=your-super-secret-jwt-key
   OPENAI_API_KEY=your-openai-api-key
   ```

4. **Start the server:**
   ```bash
   npm run dev
   ```

## 📚 API Endpoints

### Authentication Routes

#### `POST /api/auth/register`
Register a new user.

**Request Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "token": "jwt-token-here",
  "user": {
    "_id": "user-id",
    "username": "john_doe",
    "email": "john@example.com",
    "avatar": "JD",
    "plan": "free",
    "preferences": {
      "theme": "auto",
      "language": "en"
    }
  }
}
```

#### `POST /api/auth/login`
Login user.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

#### `GET /api/auth/me`
Get current user profile (requires authentication).

#### `PUT /api/auth/profile`
Update user profile (requires authentication).

#### `POST /api/auth/logout`
Logout user (requires authentication).

### Conversation Routes

#### `GET /api/conversations`
Get all conversations for current user.

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)
- `archived` - Filter archived conversations (default: false)
- `search` - Search in titles and content

#### `POST /api/conversations`
Create a new conversation.

**Request Body:**
```json
{
  "title": "New Chat",
  "initialMessage": "Hello, how can you help me?"
}
```

#### `GET /api/conversations/:id`
Get a specific conversation with messages.

#### `PUT /api/conversations/:id`
Update conversation (title, tags, settings).

#### `DELETE /api/conversations/:id`
Delete a conversation.

#### `POST /api/conversations/:id/messages`
Add a message to conversation.

**Request Body:**
```json
{
  "role": "user",
  "content": "Hello!",
  "model": "gpt-4o-mini"
}
```

#### `GET /api/conversations/search`
Search conversations.

**Query Parameters:**
- `q` - Search query (required)
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)

### Chat Route

#### `POST /api/chat`
Send a message to AI and get response.

**Request Body:**
```json
{
  "message": "Hello, how are you?",
  "conversationId": "conversation-id",
  "userId": "user-id"
}
```

**Response:**
```json
{
  "reply": "Hello! I'm doing well, thank you for asking. How can I help you today?",
  "conversationId": "conversation-id"
}
```

## 🔐 Authentication

All protected routes require a JWT token in the Authorization header:

```
Authorization: Bearer <jwt-token>
```

## 📊 Database Models

### User Model
```javascript
{
  _id: ObjectId,
  username: String (unique, required),
  email: String (unique, required),
  password: String (hashed, required),
  avatar: String (auto-generated initials),
  plan: String (free/plus/pro),
  isActive: Boolean,
  lastLogin: Date,
  preferences: {
    theme: String (light/dark/auto),
    language: String
  },
  timestamps: true
}
```

### Conversation Model
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  title: String (required),
  messages: [{
    role: String (user/assistant),
    content: String,
    timestamp: Date,
    tokens: Number,
    model: String
  }],
  isArchived: Boolean,
  isPinned: Boolean,
  tags: [String],
  totalTokens: Number,
  model: String,
  settings: {
    temperature: Number,
    maxTokens: Number
  },
  timestamps: true
}
```

## 🚨 Error Handling

The API returns consistent error responses:

```json
{
  "error": "Error message here"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `429` - Rate Limited
- `500` - Server Error

## 🔧 Development

### Running in Development Mode
```bash
npm run dev
```

### Running in Production Mode
```bash
npm start
```

### Health Check
```bash
GET /api/health
```

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment | `development` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017/chatgpt_clone` |
| `JWT_SECRET` | JWT signing secret | Required |
| `OPENAI_API_KEY` | OpenAI API key | Required |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License. 