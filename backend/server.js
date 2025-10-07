import express from "express"
import cors from "cors"
import mongoose from "mongoose"
import { User } from "./models/register.js"
import jwt from "jsonwebtoken"
import auth from "./middleware/auth.js"
import rateLimit from 'express-rate-limit';
import speakeasy from 'speakeasy'; 
import qrcode from 'qrcode';

const app = express()
const port = 3000

const jwt_secret = 'your_jwt_secret_key_which_is_very_secure_and_long';
const ATLAS_URI = 'mongodb+srv://yashujaat880_db_user:u2rNWSIzuUt7IOuH@ichats.z28quig.mongodb.net/?retryWrites=true&w=majority&appName=iChats';
const clientOptions = { serverApi: { version: '1', strict: true, deprecationErrors: true } };
try {
  await mongoose.connect(ATLAS_URI, clientOptions);
  // console.log(a);
  console.log("Connected to MongoDB");
} catch (err) {
  console.error("Failed to connect to MongoDB", err);
}

const corsOptions = {
  origin: 'http://localhost:5173',
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

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

app.get('/',generalLimiter, (req, res) => {
  // res.sendFile("../frontend/iChats/public/index.html", { root: process.cwd() });
  res.send('Hello World! Welcome to iChats Backend');
})

app.get('/api/Home',auth, (req, res) => {
  res.json({ message: `Hello ${req.user.username}, you are now E2EE` }); 
  // chats:[]
});

app.post('/api/register',authLimiter, async (req, res) => {
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
            user: { username: user.username }
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
            return res.status(401).json({ message: 'Invalid 2FA code. Access denied.' });
        }
        const token = jwt.sign({ id: user._id, username: user.username }, jwt_secret, { expiresIn: '1h' });
        res.status(200).json({ 
            message: '2FA verified. Login complete!',
            token: token 
        });
    } catch (error) {
        console.error("2FA Authentication Error:", error);
        if (error.name === 'TokenExpiredError') {
             return res.status(401).json({ message: '2FA session expired. Please log in again.' });
        }
        res.status(500).json({ message: 'Server error during 2FA verification.' });
    }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
