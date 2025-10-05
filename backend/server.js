import express from "express"
import cors from "cors"
import mongoose from "mongoose"
import { User } from "./models/register.js"

const app = express()
const port = 3000

let a = await mongoose.connect('mongodb://localhost:27017/iChats');
console.log("Connected to MongoDB");

app.use(cors())
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.post('/api/register', (req, res) => {
  res.json({message: "Registration successful"});
  console.log("Registration endpoint hit");
  console.log(req.body);  
  const test = new User(req.body);
  test.save().then(() => console.log("User saved to database")).catch(err => console.log("Error saving user:", err));
})

app.get('/api/register', (req, res) => {
  res.send('GET request to the register endpoint');
})


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
