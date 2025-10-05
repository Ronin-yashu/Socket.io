import express from "express"
import cors from "cors"
const app = express()
const port = 3000

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.use(cors())

app.use(express.json());

app.post('/api/register', (req, res) => {
  res.json({message: "Registration successful"});
  console.log("Registration endpoint hit");
  console.log(req.body);  
})

app.get('/api/register', (req, res) => {
  res.send('GET request to the register endpoint');
})


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
