const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken')
require('dotenv').config()
const port = process.env.PORT || 5000;


//middleware
app.use(cors());
app.use(express.json());


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.t86vw4m.mongodb.net/?appName=Cluster0`;

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
   
   
    const userCollection = client.db("medicraftDb").collection("users");
    const blogCollection = client.db("medicraftDb").collection("blog");
    const medicineCollection = client.db("medicraftDb").collection("medicine");
    const doctorCollection = client.db("medicraftDb").collection("doctor");
    const cartCollection = client.db("medicraftDb").collection("carts");

// jwt add
  
app.post('/jwt',async(req,res) =>{
  const user = req.body;
  const token = jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{
    expiresIn:'1h'});
    res.send({token});
})
// middle ware

const verifyToken =(req,res,next)=>{
  console.log("inside verify",req.headers.authorization);
  if(!req.headers.authorization){
    return res.status(401).send({massage:'unauthorized access'})
  }
  const token = req.headers.authorization.split(' ')[1];
  jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(err,decoded)=>{
    if(err){
      return res.status(401).send({message:'unauthorized  access'})
    }
    req.decoded = decoded;
    next();
  })
  // next();
 }
//user verify token after verify token
// const verifyAdmin = async(req,res,next)=>{
//   const email = req.decoded.email;
//   const query = {email:email};
//   const user = await userCollection.findOne(query);
//   const isAdmin = user?.role === 'admin';
//   if(!isAdmin){
//    return res.status(403).send({message : 'forbidden access'});
//   }
//   next();
//  }



    // databse connection
    app.get('/blog',async(req,res)=>{
 const result = await blogCollection.find().toArray();
 res.send(result);

    })


    app.get('/doctor',async(req,res)=>{
      const result = await doctorCollection.find().toArray();
      res.send(result);
     
         })

    // app.get('/medicine',async(req,res)=>{
    //   const result = await medicineCollection.find().toArray();
    //   res.send(result);
     
    //      })


//try

app.get('/medicine', async (req, res) => {
  const search = req.query.search || "";

  let query = {};
  if (search) {
    query = {
      $or: [
        { brand_name: { $regex: search, $options: 'i' } },
        { generic_name: { $regex: search, $options: 'i' } }
      ]
    }
  }

  try {
    const result = await medicineCollection.find(query).toArray();
    res.send(result);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching medicines');
  }
});


//carts colletcion
// start from hare
app.post('/carts', async (req, res) => {
  const cartItem = req.body;
  const result = await cartCollection.insertOne(cartItem);
  res.send(result);
});


app.get('/carts',async(req,res)=>{
  const email = req.query.email;
  const query = {email:email}
  const result = await cartCollection.find(query).toArray();
  res.send(result);
 });

//deleted carts
app.delete('/carts/:id',async(req,res)=>{
  const id = req.params.id;
  const query ={_id: new ObjectId(id) }
  const result = await cartCollection.deleteOne(query);
  res.send(result);
 })

// users
app.post('/users',async (req, res) => {
  const user = req.body;
  //inser email if user doesn't exist
  const query ={email:user.email}
  const existingUser = await userCollection.findOne(query);
  const result = await userCollection.insertOne(user);
  if(existingUser){
    return res.send({message:'user already exist1',insertedId : null})
  }
  res.send(result);
});
// here we add token for user

app.get('/users',verifyToken,async(req,res)=>{
// console.log(req.headers);

  // console.log("called");
  const result = await userCollection.find().toArray();
  res.send(result)
})
// here using admin dashboard
app.get('/users/admin/:email',verifyToken,async(req,res)=>{

  const email = req.params.email;
  if(email !== req.decoded.email){
    return res.status(403).send({message:"forbidden access"})
  }
  const query={email:email};
  const user = await userCollection.findOne(query);
  let admin = false;
  if(user){
    admin = user?.role === 'admin';
    
  }
  res.send({ admin })

})


// user delete
app.delete('/users/:id',async(req,res)=>{
  const id = req.params.id;
  const query = {_id:new ObjectId(id)}
  const result = await userCollection.deleteOne(query);
  res.send(result)
})
// patch admin for 
app.patch('/users/admin/:id',async(req,res)=>{
  const id = req.params.id;
  const filter ={_id: new ObjectId(id)};
  const updateDoc ={
  
    $set:{
      role:'admin'
    }
  
  }
  const result = await userCollection.updateOne(filter,updateDoc);
  res.send(result);
  
  
  })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/',(req,res)=>{
res.send('boss is sitting')


})

app.listen(port,()=>{
    console.log(`bistro boss ${port}`);
    
})