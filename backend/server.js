import express from "express"
import cors from "cors"
import mongoose from "mongoose"
import { User } from "./models/register.js"
import jwt from "jsonwebtoken"
import auth from "./middleware/auth.js"

const app = express()
const port = 3000

const jwt_secret = 'your_jwt_secret_key_which_is_very_secure_and_long';

try {
  await mongoose.connect('mongodb://localhost:27017/iChats');
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

app.get('/', (req, res) => {
  // res.sendFile("../frontend/iChats/public/index.html", { root: process.cwd() });
  res.send('Hello World! Welcome to iChats Backend');
})

app.get('/api/chats/my-list',auth, (req, res) => {
  res.json({ message: `Hello ${req.user.username}, you are now E2EE` }); 
  // chats:[]
});

app.post('/api/register', async (req, res) => {
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

app.post('/api/login', async (req, res) => {
  console.log("Login endpoint hit");
  console.log(req.body);
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid username or password.' });
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

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
