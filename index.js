require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

app.use(express.json());
app.use(cors());

const uri = `mongodb+srv://${process.env.DATA_USERNAME}:${process.env.DATA_PASSWORD}@cluster0.evacz3b.mongodb.net/?retryWrites=true&w=majority`;

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
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    const serviceCollection = client.db("carDoctorDB").collection("serviceCollection");
    const productsCollection = client.db("carDoctorDB").collection("productsCollection");
    const bookingsCollection = client.db("carDoctorDB").collection("bookingsCollection");

    app.get("/services" , async (req, res) => {
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

    app.get("/bookings",async (req, res) => {
      const userEmail = req.query.email;
      const query = {email : userEmail};
      
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

    app.get("/services/:id", async (req, res) => {
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