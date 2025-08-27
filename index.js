require('dotenv').config();
const http = require("http");
const express = require("express");
const path = require("path");
const { Server } = require("socket.io");
const mongoose = require('mongoose');
const session = require('express-session');
const User = require('./models/user');
const router = require('./routes/user');
const port = process.env.PORT || 9000;

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Session configuration
const sessionMiddleware = session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    name: 'sessionId',
    cookie: { 
        secure: process.env.NODE_ENV === 'production', // HTTPS only in production
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        httpOnly: true, // Prevent XSS attacks
        sameSite: 'lax'
    }
});

app.use(sessionMiddleware);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Serve static files with authentication check
app.use('/public', (req, res, next) => {
    if (req.path === '/index.html' || req.path === '/') {
        return requireAuth(req, res, next);
    }
    next();
}, express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");

// Authentication middleware
const requireAuth = (req, res, next) => {
    if (req.session && req.session.userId) {
        return next();
    } else {
        return res.redirect('/signin');
    }
};

// WebSocket authentication middleware
const requireSocketAuth = (socket, next) => {
    if (socket.request.session && socket.request.session.userId) {
        return next();
    }
    return next(new Error('Authentication error'));
};

// Add logging middleware for all requests (development only)
if (process.env.NODE_ENV !== 'production') {
    app.use((req, res, next) => {
        console.log(`${req.method} ${req.url}`);
        next();
    });
}

app.use(router);
//  || 'mongodb://localhost:27017/blogIt'
//MongoDB setup
mongoose
.connect(process.env.MONGODB_URI)
.then(() => {
  console.log('Connected to MongoDB');
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1); // Exit if database connection fails
});

// Socket.io with session integration
io.use((socket, next) => {
    sessionMiddleware(socket.request, socket.request.res || {}, next);
});

// Apply authentication middleware to WebSocket connections
io.use(requireSocketAuth);

io.on("connection", (socket) => {
    console.log('User connected');
    
    // Get session from handshake
    const session = socket.request.session;
    
    // Handle joining chat with user data
    socket.on('join-chat', async (userData, callback) => {
        try {
            // First check if we have user data from the session
            if (session.userId) {
                const user = await User.findById(session.userId);
                if (user) {
                    socket.userId = user._id.toString();
                    socket.userName = user.fullName;
                    console.log(`${socket.userName} is online 🟢`);
                 
                    if (typeof callback === 'function') {
                        callback({
                            success: true,
                            userId: socket.userId,
                            userName: socket.userName
                        });
                    }
                    return;
                }
            }
            
            // Fallback to user data from client if available
            if (userData && userData.userId) {
                const user = await User.findById(userData.userId);
                if (user) {
                    socket.userId = user._id.toString();
                    socket.userName = user.fullName;a
                    console.log(`${socket.userName} (${socket.userId}) joined the chat from client data`);
                    
                    // Update session
                    session.userId = user._id;
                    session.user = {
                        id: user._id,
                        fullName: user.fullName,
                        email: user.email
                    };
                    await session.save();
                    
                    if (typeof callback === 'function') {
                        callback({
                            success: true,
                            userId: socket.userId,
                            userName: socket.userName
                        });
                    }
                    return;
                }
            }
            
            // If we get here, no valid user data was found
            console.log('No valid user data for connection');
            if (typeof callback === 'function') {
                callback({
                    success: false,
                    error: 'Authentication required'
                });
            }
        } catch (error) {
            console.error('Error in join-chat:', error);
            if (typeof callback === 'function') {
                callback({
                    success: false,
                    error: 'Server error during authentication'
                });
            }
        }
    });

    socket.on("user-message", async (message, callback) => {
        // Ensure message is a string
        const messageStr = message && typeof message === 'object' ? 
                         (message.text || JSON.stringify(message)) : 
                         String(message || '');
        
        const sanitizedMessage = messageStr.toString().trim().substring(0, 1000);
        
        if (!sanitizedMessage) {
            if (typeof callback === 'function') {
                callback({ success: false, error: 'Message cannot be empty' });
            }
            return;
        }
        
        // If user is not properly authenticated, reject the message
        if (!socket.userId) {
            console.log('Message rejected - no user data');
            if (typeof callback === 'function') {
                callback({ success: false, error: 'Authentication required' });
            }
            return;
        }
        
        // Use the socket's user data which should be set during join-chat
        const userId = socket.userId;
        const userName = socket.userName || 'Anonymous';
        
        // Create a timestamp
        const now = new Date();
        const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        // Prepare message data
        const msgData = {
            text: sanitizedMessage,
            time: timeString,
            userName: userName,
            userId: userId,
            timestamp: now.getTime(),
            socketId: socket.id,
            tempId: message.tempId // Forward the tempId if it exists
        };
        
        // console.log('=== SENDING MESSAGE DATA ===');
        // console.log('Message text:', msgData.text);
        // console.log('Time:', msgData.time);
        // console.log('User:', msgData.userName);
        // console.log('Temp ID:', msgData.tempId);
        // console.log('===========================');
        
        try {
            // Broadcast to all clients including sender (for consistency)
            io.emit("message", msgData);
            
            // console.log('Message broadcasted to all clients');
            
            // Send confirmation back to sender
            if (typeof callback === 'function') {
                callback({ 
                    success: true, 
                    message: 'Message sent',
                    messageData: msgData
                });
            }
            
        } catch (error) {
            console.error('Error broadcasting message:', error);
            if (typeof callback === 'function') {
                callback({ 
                    success: false, 
                    error: 'Failed to send message' 
                });
            }
        }
    });

    socket.on("disconnect", () => {
        // User disconnected
    });
});



// Protected routes
app.get("/", requireAuth, async (req, res) => {
    try {
        // Ensure we have user data, fetch from database if needed
        let userData = {
            userId: req.session.userId,
            userName: 'Anonymous',
            email: ''
        };

        if (req.session.user) {
            userData = {
                userId: req.session.user.id || req.session.userId,
                userName: req.session.user.fullName || 'Anonymous',
                email: req.session.user.email || ''
            };
        } 
        
        if ((!userData.userName || userData.userName === 'Anonymous') && req.session.userId) {
            // Fallback: fetch user from database if session user data is missing
            try {
                const user = await User.findById(req.session.userId);
                if (user) {
                    userData = {
                        userId: user._id.toString(),
                        userName: user.fullName,
                        email: user.email
                    };
                    // Update session with user data
                    req.session.user = userData;
                    await req.session.save();
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
            }
        }
        
        console.log('Sending user data to client:', userData);
        
        // Read the HTML file asynchronously
        const fs = require('fs').promises;
        let html = await fs.readFile(path.join(__dirname, "public", "index.html"), 'utf8');
        
        // Inject user data into the HTML
        const userDataScript = `
            <script>
                window.currentUser = ${JSON.stringify(userData)};
                console.log('Current user data loaded:', window.currentUser);
            </script>
        `;
        html = html.replace('</head>', userDataScript + '\n</head>');
        
        // Safely inject user data into the HTML
        const safeUserData = JSON.stringify(userData).replace(/</g, '\\u003c');
        html = html.replace('</head>', `
        <script>
            window.userData = ${safeUserData};
        </script>
        </head>
    `);
        
        res.send(html);
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
});

server.listen(port, () => console.log(`Server started at http://localhost:${port}`));
