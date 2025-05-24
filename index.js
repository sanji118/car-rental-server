const express = require('express')
const cors = require('cors');
const jwt = require("jsonwebtoken")
const cookieParsar = require('cookie-parser')
const app = express();
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;



app.use(cors({
    origin: ['http://localhost:5000'],
    credentials: true
}));
app.use(express.json());







const cars = require("./cars.json")
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.95qfhdq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
async function run() {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
    

    const carsCollection = client.db('carRental').collection('cars');
    await carsCollection.insertMany(cars)
    app.get('/cars', async(req, res)=>{
        const allCars = await carsCollection.find().toArray();
        res.send(allCars);
    })

    app.post('/cars', async(req, res)=>{
        const newCar = req.body;
        const result = await carsCollection.insertOne(newCar);
        res.send(result);
    })
    app.get('/cars/:id', async(req, res)=>{
        const id = req.params.id;
        const query = {_id : new ObjectId(id)}
        const result = await carsCollection.findOne(query);
        res.json(result);
    })
    


  } finally {
    // Ensures that the client will close when you finish/error
    //await client.close();
  }
}
run().catch(console.dir);







app.get('/', (req, res) =>{
    res.send("DriverRental server is running !")
})

app.listen(port, ()=>{
    console.log(`server is running on port : ${port}`)
})