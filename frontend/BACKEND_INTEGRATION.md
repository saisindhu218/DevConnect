# Backend Integration Guide for DevConnect

## Overview
This frontend is designed to work with your existing MERN backend. Below are the integration points and instructions.

## API Endpoints Required

### Authentication
- `POST /register` - User registration
  - Body: `{ firstName, lastName, username, email, password }`
  
- `POST /auth/login` - User login
  - Body: `{ username, password }`
  - Response: `{ accessToken, user: {...} }`
  - Should set HttpOnly cookie named `jwt` with refresh token

- `GET /auth/refresh` - Refresh access token
  - Reads `jwt` cookie
  - Response: `{ accessToken, user: {...} }`

- `POST /logout` - User logout
  - Clears `jwt` cookie

### Users
- `GET /api/users` - Get all users (protected)
  - Query params: `?page=1&limit=10`
  
- `GET /api/users/check-username?username=<username>` - Check username availability
  - Response: `{ available: boolean }`
  
- `GET /api/users/check-email?email=<email>` - Check email availability
  - Response: `{ available: boolean }`

- `POST /api/users/follow/:id` - Follow/unfollow user (protected)

- `GET /api/users/followers` - Get followers (protected)

- `GET /api/users/following` - Get following users (protected)

### Profile
- `GET /profile/:username` - Get user profile
  - Response: User data with posts and notifications

- `PUT /profile/:username/edit` - Update profile (protected)

### Posts
- `GET /api/posts` - Get posts feed (protected)
  - Query params: `?page=1&limit=10&userIds=<comma-separated-ids>`
  - Response: `{ posts: [...], totalPages, currentPage }`

- `POST /api/posts` - Create post (protected)
  - Body: `{ body, tags?, media?: { images: [], videos: [] } }`

- `PUT /api/posts/:id` - Update post (protected)

- `DELETE /api/posts/:id` - Delete post (protected)

- `POST /api/posts/:id/like` - Like/unlike post (protected)

- `POST /api/posts/:id/comment` - Add comment (protected)
  - Body: `{ text }`

## CORS Configuration

Your backend must allow requests from the frontend origin. Example configuration:

```javascript
const corsOptions = {
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
```

## Cookie Settings

When setting the refresh token cookie on login:

```javascript
res.cookie('jwt', refreshToken, {
  httpOnly: true,
  secure: false,        // Set to true in production with HTTPS
  sameSite: 'Lax',     // Allows cookie across ports on localhost
  maxAge: 7*24*60*60*1000  // 7 days
});
```

## Environment Variables

Create a `.env` file in your backend:

```
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/devconnect_db
ACCESS_TOKEN_SECRET=your_access_token_secret_here
REFRESH_TOKEN_SECRET=your_refresh_token_secret_here
CLIENT_URL=http://localhost:5173
```

## Frontend Configuration

Update the API base URL in the frontend if your backend runs on a different port:

1. Open `src/pages/Login.tsx` and update the fetch URL:
   ```javascript
   const response = await fetch("http://localhost:5000/auth/login", {
     // ...
   });
   ```

2. Update all other API calls in:
   - `src/pages/Register.tsx`
   - `src/components/dashboard/CreatePost.tsx`
   - `src/components/dashboard/PostFeed.tsx`
   - `src/pages/Network.tsx`

## Testing the Integration

1. Start your backend server:
   ```bash
   cd server
   npm start
   ```

2. Start the frontend:
   ```bash
   npm run dev
   ```

3. Navigate to `http://localhost:5173`

4. Test the following flows:
   - Register a new account
   - Login with credentials
   - View dashboard
   - Create a post
   - Browse network
   - View profile

## Data Models Expected

### User Model
```javascript
{
  username: String,
  email: String,
  password: String, // hashed
  firstName: String,
  lastName: String,
  role: String, // default: 'user'
  avatar: String,
  bio: String,
  location: String,
  skills: [String],
  github: String,
  linkedin: String,
  portfolio: String,
  followers: [{ type: ObjectId, ref: 'User' }],
  following: [{ type: ObjectId, ref: 'User' }],
  posts: [{ type: ObjectId, ref: 'Post' }],
  refreshToken: String
}
```

### Post Model
```javascript
{
  author: { type: ObjectId, ref: 'User' },
  body: String,
  tags: [String],
  media: {
    images: [String],
    videos: [String]
  },
  likes: [{ type: ObjectId, ref: 'User' }],
  comments: [{
    author: { type: ObjectId, ref: 'User' },
    text: String,
    createdAt: Date
  }],
  featured: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

## Socket.io Setup (for Collaborate feature)

To enable real-time collaboration:

1. Install Socket.io on backend:
   ```bash
   npm install socket.io
   ```

2. Set up Socket.io server:
   ```javascript
   const io = require('socket.io')(server, {
     cors: {
       origin: 'http://localhost:5173',
       credentials: true
     }
   });

   io.on('connection', (socket) => {
     socket.on('joinRoom', ({ roomId, user }) => {
       socket.join(roomId);
       io.to(roomId).emit('participants:update', { /* participant data */ });
     });

     socket.on('editor:change', ({ roomId, delta, version }) => {
       socket.to(roomId).emit('editor:change', { delta, version });
     });

     socket.on('chat:message', ({ roomId, userId, message, timestamp }) => {
       io.to(roomId).emit('chat:message', { userId, message, timestamp });
     });
   });
   ```

3. Install Socket.io client on frontend:
   ```bash
   npm install socket.io-client
   ```

## Troubleshooting

### CORS Issues
- Ensure `credentials: true` is set in both frontend fetch calls and backend CORS config
- Check that the origin URL matches exactly (including protocol and port)

### Cookie Not Being Set
- Verify `sameSite: 'Lax'` is set on the cookie
- Check browser DevTools > Application > Cookies to see if cookie exists
- Ensure `credentials: 'include'` is in all frontend API calls

### 401 Unauthorized Errors
- Check that the Authorization header is being sent: `Authorization: Bearer <token>`
- Verify the access token is stored in localStorage after login
- Test the `/auth/refresh` endpoint to ensure token refresh works

## Production Deployment

When deploying to production:

1. Update CORS to use production domain
2. Set `secure: true` on cookies (requires HTTPS)
3. Update all fetch URLs to use production backend URL
4. Set appropriate environment variables on hosting platform
