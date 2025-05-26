const express = require('express')
const cors = require('cors');
const jwt = require("jsonwebtoken")
const cookieParser = require('cookie-parser')
const app = express();
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;


app.use(cookieParser());
app.use(cors({
    origin: ['http://localhost:5173'],
    credentials: true
}));
app.use(express.json());



const logger = (req, res, next) =>{
    //console.log('inside the logger');
    next();
}

const verifyJWT = (req, res, next)=>{
    const token = req.cookies?.token;
    //console.log("token recieved", token)
    if (!token) {
        return res.status(401).send({ message: 'Unauthorized No token' });
    }
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded)=>{
        if (err) {
            return res.status(401).send({ message: 'Unauthorized  Invalid token' });
        }
        req.user = decoded;
        next();
    })
}







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
    //await client.connect();
    //await client.db("admin").command({ ping: 1 });
    //console.log("Pinged your deployment. You successfully connected to MongoDB!");
    

    const carsCollection = client.db('carRental').collection('cars');
    const bookingCollection = client.db('carRental').collection('myBooking');
    //await carsCollection.deleteMany({})
    //await carsCollection.insertMany(cars)


    //auth related APIs
    app.post('/jwt', async(req, res)=>{
        const user = req.body;
        const token = jwt.sign({ userEmail: user.email }, process.env.JWT_SECRET, {expiresIn: '1d'});
        res.cookie('token', token,{
            httpOnly: true,
            secure: false,
            sameSite: 'lax'
        })
        .send({sucess: true, token});
    })

    //GET data car related
    app.get('/cars', async (req, res) => {
        try {
            const { userEmail } = req.query;
            let filter = {};
            if (userEmail) {
            filter.userEmail = userEmail;
            }
            const cars = await carsCollection.find(filter).toArray();
            res.json(cars);
        } catch (err) {
            //console.error(err);
            res.status(500).json({ message: 'Server error' });
        }
    });


    app.get('/my-cars', verifyJWT, async (req, res) => {
        const userEmail = req.user.userEmail;
        const userCars = await carsCollection.find({ userEmail }).toArray();
        res.send(userCars);
    });

    app.post('/cars', verifyJWT, async(req, res)=>{
        const newCar = req.body;
        newCar.userEmail = req.user.userEmail;
        newCar.date = new Date();
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
    app.get('/my-booking', verifyJWT, async (req, res) => {
        const userEmail = req.user.userEmail;
        try {
            const allBooking = await bookingCollection.find({ userEmail }).toArray();
            res.send(allBooking);
        } catch (err) {
            //console.error(err);
            res.status(500).send({ error: "Failed to fetch bookings" });
        }
    });


    app.patch('/my-booking/:id', async (req, res) => {
        const { startDate, endDate } = req.body;
        const { id } = req.params;

        try {
            const result = await bookingCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: { 
                startDate: new Date(startDate), 
                endDate: new Date(endDate) 
                } 
            }
            );
            res.send({ success: true, result });
        } catch (err) {
            res.status(500).send({ success: false, error: err.message });
        }
    });

    app.patch('/my-booking/:id/cancel', async (req, res) => {
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) };
        const updateDoc = {
            $set: {
                status: 'cancelled'
            }
        }
        const result = await bookingCollection.updateOne(filter, updateDoc);
        res.send({ success: true, result });
        
    });




    app.post('/my-booking',verifyJWT, async (req, res) => {
        const newBooking = req.body;
        newBooking.userEmail = req.user.userEmail;
        newBooking.bookingCount = 1;
        const result = await bookingCollection.insertOne(newBooking);
        res.send(result);
    });
    app.put('/my-booking/:id/increment', async (req, res) => {
        const id = req.params.id;
        const result = await bookingCollection.updateOne(
            { _id: new ObjectId(id) },
            { $inc: { bookingCount: 1 } }
        );
        res.send(result);
    });

    app.delete('/my-booking/:id', async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await bookingCollection.deleteOne(query);
        res.send(result) ;
    });
    


    //auth logout
    app.post('/logout', (req, res)=>{
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        }).send({success: true})
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