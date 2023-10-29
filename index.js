require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require("jsonwebtoken");
const cookieParser = require('cookie-parser');
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: ["http://localhost:5173"],
  credentials: true,
}));

const uri = `mongodb+srv://${process.env.DATA_USERNAME}:${process.env.DATA_PASSWORD}@cluster0.evacz3b.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// middlewares 
const logger =  async (req, res, next) => {
  console.log("called", req.host, req.originalUrl)
  next();
}

const verifyToken = async (req, res, next) => {
  const token = req.cookies?.token;
  console.log("value of token in middleware", token);
  if(!token) {
    return res.status(401).send({message: "not authorized!"});
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if(err) {
      console.log(err);
      return res.status(401).send({message: "Unauthenticated"});
    }

    req.user = decoded;
    
    next()
  })
;}

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    const serviceCollection = client.db("carDoctorDB").collection("serviceCollection");
    const productsCollection = client.db("carDoctorDB").collection("productsCollection");
    const bookingsCollection = client.db("carDoctorDB").collection("bookingsCollection");


    //auth related api
    app.post("/jwt",logger , async(req, res) => {
      const user = req.body;
      console.log("This is the user ",user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: "1h"});
      
      res.cookie("token", token, {
        httpOnly: true,
        secure: false,
      }).send({success : true});
    })

    // service related api
    app.get("/services", logger, async (req, res) => {
        const cursor = serviceCollection.find();
        const result = await cursor.toArray();

        res.send(result);
    })

    app.post("/bookings", async (req, res) => {
      const data = req.body;
      
      const result = await bookingsCollection.insertOne(data);
      res.send(result);
    })
    
    app.patch("/bookings/:id", async (req, res) => {
      const id = req.params.id;
      const updateInfo = req.body;
      const filter = {_id: new ObjectId(id)};
      const updateDoc = {
        $set: {
          status: updateInfo.status
        }
      };

      const result = await bookingsCollection.updateOne(filter, updateDoc);
      res.send(result);
    })

    app.get("/bookings", logger, verifyToken,async (req, res) => {
      const userEmail = req.query.email;
      const query = {email : userEmail};
      console.log("This is the user: ",req.user);
      if(req.query.email !== req.user.email) {
        return res.status(403).send({message: "Forbidden access"});
      }
      
      const result = await bookingsCollection.find(query).toArray();
      res.send(result);
    })

    app.delete("/bookings/:id", async (req, res) => {
      const id = req.params.id;

      const  query = {_id: new ObjectId(id)};

      const result = await bookingsCollection.deleteOne(query);
      res.send(result);
    })

    app.get("/services/title", async (req, res) => {

      const option = {
        projection: {title: 1}
      }
       
      const query = {};

      const data = await serviceCollection.find(query, option).toArray();
      res.send(data);
    })

    app.get("/services/:id", logger, async (req, res) => {
      const id = (req.params.id);
      const query = {_id : id};

      const result = await serviceCollection.findOne(query);
      res.send(result);
    })

    app.get("/products", async (req, res) => {
      const cursor = productsCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    })

    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', async (req, res) => {
    res.send("Hello world!");
});

app.listen(port, () => {
    console.log("listening on port " + port);
})