const express = require('express')
const cors = require('cors');
const jwt = require("jsonwebtoken")
const cookieParsar = require('cookie-parser')
const app = express();
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;



app.use(cors());
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
    const bookingCollection = client.db('carRental').collection('myBooking');
    await carsCollection.deleteMany({})
    await carsCollection.insertMany(cars)


    //GET data
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

    // Recently Added
    app.get('/recently-added', async(req, res)=>{
        const result = await carsCollection
        .find({})
        .sort({date: -1})
        .limit(6)
        .toArray()
        res.send(result)
    })
    // PUT: Update car by ID
    app.put('/cars/:id', async (req, res) => {
        const id = req.params.id;
        const updatedData = req.body;
        const filter = { _id: new ObjectId(id) };
        const updateDoc = {
            $set: {
            carModel: updatedData.carModel,
            dailyRentalPrice: updatedData.dailyRentalPrice,
            availability: updatedData.availability,
            vehicleRegistrationNumber: updatedData.vehicleRegistrationNumber,
            features: updatedData.features,
            description: updatedData.description,
            imageUrl: updatedData.imageUrl,
            location: updatedData.location,
            }
        };

        const result = await carsCollection.updateOne(filter, updateDoc);
        const updatedCar = await carsCollection.findOne(filter);
        res.send(updatedCar);
    });


    // DELETE: Delete car by ID
    app.delete('/cars/:id', async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };

        const result = await carsCollection.deleteOne(query);
        res.send(result) ;
    });

    //Booking car
    app.get('/my-booking', async(req, res)=>{
        const allBooking = await bookingCollection.find().toArray();
        res.send(allBooking);
    })

    app.post('/my-booking', async(req, res)=>{
        const newBooking = req.body;
        const result = await bookingCollection.insertOne(newBooking);
        res.send(result);
    })
    app.get('/my-booking/:id', async(req, res)=>{
        const id = req.params.id;
        const query = {_id : new ObjectId(id)}
        const result = await bookingCollection.findOne(query);
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