import dotenv from "dotenv"
dotenv.config()
import express from "express"
import cors from "cors"
import mongoose from "mongoose"
import { User } from "./models/register.js"
import { Message } from "./models/message.js"
import jwt from "jsonwebtoken"
import auth from "./middleware/auth.js"
import rateLimit from 'express-rate-limit';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import { createServer } from 'http';
import { Server } from 'socket.io';

const jwt_secret = process.env.JWT_SECRET;
console.log("the jwt from env is ",jwt);

const app = express()
const port = 3000

const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST']
  },
  maxHttpBufferSize: 10e6 // 10MB for file uploads
});

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error: No token provided'));
  }
  try {
    const decoded = jwt.verify(token, jwt_secret);
    socket.userId = decoded.id;
    socket.username = decoded.username;
    next();
  } catch (err) {
    return next(new Error('Authentication error: Invalid token'));
  }
});

const clientOptions = { serverApi: { version: '1', strict: true, deprecationErrors: true } };
try {
  await mongoose.connect(process.env.ATLAS_URI, clientOptions);
  await mongoose.connection.db.admin().command({ ping: 1 });
  console.log("Pinged your deployment. You successfully connected to MongoDB!");
  console.log("Connected to MongoDB");
} catch (err) {
  console.error("Failed to connect to MongoDB", err);
}

const corsOptions = {
  origin: 'http://localhost:5173',
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' })); // Increase limit for file uploads
app.use(express.urlencoded({ limit: '10mb', extended: true }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    message: 'Too many login attempts from this IP, please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
});

const onlineUsers = new Map();

const broadcastOnlineUsers = (ioInstance) => {
  const allOnlineUserIds = Array.from(onlineUsers.keys());
  ioInstance.sockets.sockets.forEach(s => {
    const listForRecipient = allOnlineUserIds.filter(id => id !== s.userId);
    s.emit('getOnlineUsers', listForRecipient);
  });
};

io.on('connection', (socket) => {
  const { userId, username } = socket;
  onlineUsers.set(userId, socket.id);
  console.log(`[SOCKET] User connected: ${username} (${userId})`);

  broadcastOnlineUsers(io);

  // ----------------------------------------------------
  // MESSAGE HANDLER - Supports text, images, and files
  // ----------------------------------------------------
  socket.on('sendMessage', async (messagePayload) => {
    const recipientId = messagePayload.recipientId;
    const recipientSocketId = onlineUsers.get(recipientId);

    // Construct the message object
    const fullMessage = {
      senderId: userId,
      senderUsername: username,
      recipientId: recipientId,
      content: messagePayload.content,
      timestamp: messagePayload.timestamp || new Date().toISOString(),
      type: messagePayload.type || 'text',
      fileName: messagePayload.fileName || null,
      fileType: messagePayload.fileType || null,
      fileSize: messagePayload.fileSize || null
    };

    console.log(`[MESSAGE] ${username} -> ${recipientId} (${fullMessage.type})`);

    try {
      // Save message to database
      const savedMessage = await Message.create({
        senderId: userId,
        senderUsername: username,
        recipientId: recipientId,
        content: messagePayload.content,
        type: messagePayload.type || 'text',
        fileName: messagePayload.fileName || null,
        fileType: messagePayload.fileType || null,
        fileSize: messagePayload.fileSize || null,
        timestamp: new Date(messagePayload.timestamp || Date.now()),
        delivered: recipientSocketId ? true : false,
        read: false
      });

      // Add the database ID to the message
      fullMessage._id = savedMessage._id.toString();

      // Send back to sender
      socket.emit('receiveMessage', fullMessage);

      // Send to recipient if online
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('receiveMessage', fullMessage);
        console.log(`[MESSAGE] Delivered to recipient`);
      } else {
        console.log(`[MESSAGE] Recipient ${recipientId} is offline - message stored in DB`);
      }
    } catch (error) {
      console.error('[MESSAGE] Error saving message:', error);
      socket.emit('messageError', { error: 'Failed to send message' });
    }
  });

  // Request offline messages
  socket.on('requestOfflineMessages', async () => {
    try {
      const offlineMessages = await Message.find({
        recipientId: userId,
        delivered: false
      }).sort({ timestamp: 1 });

      if (offlineMessages.length > 0) {
        console.log(`[OFFLINE] Sending ${offlineMessages.length} offline messages to ${username}`);

        offlineMessages.forEach(msg => {
          socket.emit('receiveMessage', {
            _id: msg._id.toString(),
            senderId: msg.senderId.toString(),
            senderUsername: msg.senderUsername,
            recipientId: msg.recipientId.toString(),
            content: msg.content,
            type: msg.type,
            fileName: msg.fileName,
            fileType: msg.fileType,
            fileSize: msg.fileSize,
            timestamp: msg.timestamp
          });
        });

        // Mark as delivered
        await Message.updateMany(
          { recipientId: userId, delivered: false },
          { delivered: true }
        );
      }
    } catch (error) {
      console.error('[OFFLINE] Error fetching offline messages:', error);
    }
  });

  // ----------------------------------------------------
  // CALL HANDLERS - Voice and Video calls
  // ----------------------------------------------------
  socket.on('callUser', ({ to, callType }) => {
    const recipientSocketId = onlineUsers.get(to);

    if (recipientSocketId) {
      console.log(`[CALL] ${username} calling ${to} (${callType})`);
      io.to(recipientSocketId).emit('incomingCall', {
        from: userId,
        fromUsername: username,
        callType: callType
      });
    } else {
      socket.emit('callFailed', { message: 'User is offline' });
    }
  });

  socket.on('answerCall', ({ to, answer }) => {
    const recipientSocketId = onlineUsers.get(to);

    if (recipientSocketId) {
      console.log(`[CALL] ${username} answered call from ${to}`);
      io.to(recipientSocketId).emit('callAnswered', {
        from: userId,
        answer: answer
      });
    }
  });

  socket.on('endCall', ({ to }) => {
    const recipientSocketId = onlineUsers.get(to);

    if (recipientSocketId) {
      console.log(`[CALL] ${username} ended call with ${to}`);
      io.to(recipientSocketId).emit('callEnded', {
        from: userId
      });
    }
  });

  socket.on('rejectCall', ({ to }) => {
    const recipientSocketId = onlineUsers.get(to);

    if (recipientSocketId) {
      console.log(`[CALL] ${username} rejected call from ${to}`);
      io.to(recipientSocketId).emit('callRejected', {
        from: userId
      });
    }
  });

  // WebRTC signaling
  socket.on('iceCandidate', ({ to, candidate }) => {
    const recipientSocketId = onlineUsers.get(to);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('iceCandidate', {
        from: userId,
        candidate: candidate
      });
    }
  });

  socket.on('offer', ({ to, offer }) => {
    const recipientSocketId = onlineUsers.get(to);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('offer', {
        from: userId,
        offer: offer
      });
    }
  });

  socket.on('answer', ({ to, answer }) => {
    const recipientSocketId = onlineUsers.get(to);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('answer', {
        from: userId,
        answer: answer
      });
    }
  });

  // ----------------------------------------------------
  // DISCONNECT HANDLER
  // ----------------------------------------------------
  socket.on('disconnect', () => {
    console.log(`[SOCKET] User disconnected: ${username}`);
    onlineUsers.delete(userId);
    broadcastOnlineUsers(io);
  });
});

// REST API ROUTES

app.get('/', generalLimiter, (req, res) => {
  res.send('Hello World! Welcome to iChats Backend');
})

app.get('/api/Home', auth, (req, res) => {
  res.json({ message: `Hello ${req.user.username}, you are now E2EE` });
});

app.post('/api/register', authLimiter, async (req, res) => {
  console.log("Registration endpoint hit");
  console.log(req.body);
  try {
    const newUser = new User(req.body);
    await newUser.save();
    res.status(201).json({ message: 'User created successfully!' });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(409).json({
        message: `Registration failed This ${field} is already registered.`,
        errors: {
          [field]: `This ${field} is already registered.`
        }
      });
    }
    if (error.name === 'ValidationError') {
      let errors = {};
      for (let field in error.errors) {
        errors[field] = error.errors[field].message;
      }
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors
      });
    }
    console.error(error);
    res.status(500).json({ message: 'An unexpected server error occurred.' });
  }
});

app.post('/api/login', authLimiter, async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }
    if (user.is2FAEnabled) {
      const twoFaToken = jwt.sign(
        { id: user._id, type: '2fa_stage' },
        jwt_secret,
        { expiresIn: '5m' }
      );
      return res.status(202).json({
        message: '2FA required. Please submit your code.',
        twoFaToken: twoFaToken
      });
    }
    const token = jwt.sign({ id: user._id, username: user.username }, jwt_secret, { expiresIn: '1h' });
    return res.status(200).json({
      message: 'Login successful!',
      token: token,
      user: {
        username: user.username,
        id: user._id.toString()
      }
    });
  } catch (error) {
    console.error("Login Server Error:", error);
    res.status(500).json({ message: 'An unexpected server error occurred.' });
  }
});

app.get('/api/2fa/generate', auth, async (req, res) => {
  try {
    const secret = speakeasy.generateSecret({
      name: `iChats (${req.user.username})`,
    });
    await User.findByIdAndUpdate(req.user.id, { twoFactorSecret: secret.base32 });
    const otpAuthUrl = secret.otpauth_url;
    const qrCodeImage = await qrcode.toDataURL(otpAuthUrl);
    res.status(200).json({
      message: 'Scan the QR code to set up 2FA.',
      qrCodeImage: qrCodeImage
    });
  } catch (error) {
    console.error("2FA Generate Error:", error);
    res.status(500).json({ message: 'Could not generate 2FA secret.' });
  }
});

app.post('/api/2fa/enable', auth, async (req, res) => {
  const { token } = req.body;
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.is2FAEnabled) {
      return res.status(400).json({ message: '2FA already enabled or user not found.' });
    }
    const isVerified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: token,
    });
    if (!isVerified) {
      return res.status(401).json({ message: 'Invalid 2FA code.' });
    }
    await User.findByIdAndUpdate(user._id, { is2FAEnabled: true });
    res.status(200).json({ message: '2FA successfully enabled! Account secured.' });
  } catch (error) {
    console.error("2FA Enable Error:", error);
    res.status(500).json({ message: 'Could not enable 2FA.' });
  }
});

app.post('/api/2fa/authenticate', async (req, res) => {
  const { twoFaToken, code } = req.body;
  if (!twoFaToken || !code) {
    return res.status(400).json({ message: 'Token and code are required.' });
  }
  try {
    const decoded = jwt.verify(twoFaToken, jwt_secret);
    if (decoded.type !== '2fa_stage') {
      return res.status(401).json({ message: 'Invalid 2FA session token.' });
    }
    const user = await User.findById(decoded.id);
    const isVerified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: code,
    });
    if (!isVerified) {
      return res.status(401).json({ message: 'Invalid 2FA code.' });
    }
    const token = jwt.sign({ id: user._id, username: user.username }, jwt_secret, { expiresIn: '1h' });
    res.status(200).json({
      message: '2FA verified. Login complete!',
      token: token,
      user: {
        username: user.username,
        id: user._id.toString()
      }
    });
  } catch (error) {
    console.error("2FA Authentication Error:", error);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: '2FA session expired. Please log in again.' });
    }
    res.status(500).json({ message: 'Server error during 2FA verification.' });
  }
});

app.post('/api/users/lookup', auth, async (req, res) => {
  const { userIds } = req.body;
  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    return res.status(400).json({ message: 'User IDs array required.' });
  }
  try {
    const users = await User.find({
      _id: { $in: userIds }
    }).select('username is2FAEnabled twoFactorSecret');
    const filteredUsers = users.filter(u => u._id.toString() !== req.user.id);
    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error("User Lookup Error:", error);
    res.status(500).json({ message: 'Failed to retrieve user details.' });
  }
});

// MESSAGE HISTORY ROUTES
app.get('/api/messages/:recipientId', auth, async (req, res) => {
  const { recipientId } = req.params;
  const userId = req.user.id;

  try {
    const messages = await Message.find({
      $or: [
        { senderId: userId, recipientId: recipientId },
        { senderId: recipientId, recipientId: userId }
      ]
    })
      .sort({ timestamp: 1 })
      .limit(100);

    // Mark messages as delivered
    await Message.updateMany(
      { recipientId: userId, senderId: recipientId, delivered: false },
      { delivered: true }
    );

    res.status(200).json(messages);
  } catch (error) {
    console.error("Fetch Messages Error:", error);
    res.status(500).json({ message: 'Failed to fetch messages.' });
  }
});

app.post('/api/messages/read', auth, async (req, res) => {
  const { messageIds } = req.body;
  const userId = req.user.id;

  try {
    await Message.updateMany(
      { _id: { $in: messageIds }, recipientId: userId },
      { read: true }
    );
    res.status(200).json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error("Mark Read Error:", error);
    res.status(500).json({ message: 'Failed to mark messages as read.' });
  }
});
// ADD THESE ROUTES TO YOUR server.js (after the existing routes, before server.listen)

// FORGOT PASSWORD ROUTES

// Step 1: Check Username and Account Type
app.post('/api/forgot/check-username', async (req, res) => {
  const { username } = req.body;
  
  try {
    // Find user by username
    const user = await User.findOne({ username });
    
    if (!user) {
      return res.status(404).json({ message: 'Username not found. Please check and try again.' });
    }

    // Return account type and phone number
    res.status(200).json({
      message: 'Account found',
      accountType: user.myRadioGroup, // 'Forgot' or 'NoForgot'
      phoneNumber: user.number,
      username: user.username
    });
  } catch (error) {
    console.error('Check Username Error:', error);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// Step 2: Request OTP
app.post('/api/forgot/request-otp', authLimiter, async (req, res) => {
  const { username, phoneNumber } = req.body;
  
  try {
    // Find user by username
    const user = await User.findOne({ username });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Check if account allows recovery
    if (user.myRadioGroup === 'NoForgot') {
      return res.status(403).json({ 
        message: 'This is a SECURE ACCOUNT without recovery option. Password cannot be reset.' 
      });
    }

    // Verify phone number matches
    if (user.number !== phoneNumber) {
      return res.status(400).json({ message: 'Phone number does not match account.' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Create OTP token (expires in 10 minutes)
    const otpToken = jwt.sign(
      { username, phoneNumber, otp, type: 'otp_verification' },
      jwt_secret,
      { expiresIn: '10m' }
    );

    // TODO: Send OTP via SMS service (Twilio, AWS SNS, etc.)
    // For now, we'll log it to console (REMOVE IN PRODUCTION)
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📱 OTP for ${username} (${phoneNumber}): ${otp}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    res.status(200).json({
      message: `OTP sent to ${phoneNumber}. Valid for 10 minutes. (Check server console in development)`,
      otpToken: otpToken
    });
  } catch (error) {
    console.error('Request OTP Error:', error);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// Step 3: Verify OTP
app.post('/api/forgot/verify-otp', async (req, res) => {
  const { otpToken, otp } = req.body;

  if (!otpToken || !otp) {
    return res.status(400).json({ message: 'OTP token and code required.' });
  }

  try {
    const decoded = jwt.verify(otpToken, jwt_secret);

    if (decoded.type !== 'otp_verification') {
      return res.status(401).json({ message: 'Invalid OTP token.' });
    }

    if (decoded.otp !== otp) {
      return res.status(401).json({ message: 'Invalid OTP. Please try again.' });
    }

    res.status(200).json({
      message: 'OTP verified successfully! You can now reset your password.',
    });
  } catch (error) {
    console.error('Verify OTP Error:', error);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'OTP expired. Please request a new one.' });
    }
    res.status(500).json({ message: 'Server error during OTP verification.' });
  }
});

// Step 4: Reset Password
app.post('/api/forgot/reset-password', async (req, res) => {
  const { otpToken, username, newPassword } = req.body;

  if (!otpToken || !username || !newPassword) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  try {
    // Verify OTP token
    const decoded = jwt.verify(otpToken, jwt_secret);

    if (decoded.type !== 'otp_verification' || decoded.username !== username) {
      return res.status(401).json({ message: 'Invalid verification token.' });
    }

    // Find user
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Update password (will be hashed by the pre-save hook in User model)
    user.password = newPassword;
    await user.save();

    console.log(`✅ Password reset successful for user: ${username}`);

    res.status(200).json({
      message: 'Password reset successfully! You can now log in with your new password.',
    });
  } catch (error) {
    console.error('Reset Password Error:', error);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Verification expired. Please start over.' });
    }
    res.status(500).json({ message: 'Server error during password reset.' });
  }
});

server.listen(port, () => {
  console.log(`Express and Socket.IO listening on port ${port}`);
});