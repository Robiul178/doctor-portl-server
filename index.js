const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const { query } = require('express');
require('dotenv').config();
const port = process.env.PORT || 5000;

const app = express();

//midle were
app.use(cors());
app.use(express.json());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ceo0gle.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });




function verifyJWT(req, res, next) {
    console.log('token inside verify', req.headers.authorization)
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send('authorized access')
    }

    const token = authHeader.split(' ')[1];


    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'forbidden access' })
        }
        req.decoded = decoded;
        next();
    })

}



async function run() {
    try {
        const appointmentOptionCollection = client.db('doctorPortal').collection('appointmentOptions');
        const bookingCollection = client.db('doctorPortal').collection('bookings');
        const usersCollection = client.db('doctorPortal').collection('uders');
        const doctorsCollection = client.db('doctorPortal').collection('doctors');


        //use Aggregate to query multiple collection data 
        app.get('/appointmentOptions', async (req, res) => {
            const date = req.query.date;
            // console.log(date)
            const query = {};
            const options = await appointmentOptionCollection.find(query).toArray();

            const bookingQuery = { apppointment: date }
            console.log(bookingQuery)
            const alreadyBooked = await bookingCollection.find(bookingQuery).toArray();
            options.forEach(option => {
                const optionBooked = alreadyBooked.filter(book => book.treatment === option.name)
                // console.log(optionBooked)
            })

            res.send(options);
        })

        app.get('/appointmentSpecialty', async (req, res) => {
            const query = {}
            const result = await appointmentOptionCollection.find(query).project({ name: 1 }).toArray();
            res.send(result);
        })

        /*
        API name Convention
        *bookings
        *app.get('/bookings') akhane sob bokking pawa jabe
        *app.get("/bookings/:id") specifix kono akta pawar jonno
        *app.post("/bookings") nokut akta object add korte
        app.patch("bookings/:id") id er kono data update korar jonno
        app.delete("bookings/:id") id er kono data delete korar jonno
        */

        app.get('/booking', verifyJWT, async (req, res) => {
            const email = req.query.email;
            const decodedEmail = req.decoded.email;
            if (email !== decodedEmail) {
                return res.status(403).send({ message: 'forbidden access' });
            }
            const query = { email: email };
            const bookings = await bookingCollection.find(query).toArray();
            res.send(bookings)
        })





        app.post('/bookings', async (req, res) => {
            const booking = req.body;
            const result = await bookingCollection.insertOne(booking);
            res.send(result)
        });



        //jwt
        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const query = { email: email }
            const user = await usersCollection.findOne(query);
            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '1h' })
                return res.send({ accessToken: token })
            }
            // console.log(user);
            res.status(403).send({ accessToken: '' })
        })



        // app.put("/users/admin/:id", async (req, res) => {
        //     const id = req.params.id;
        //     const filter = { _id: ObjectId(id) }
        //     const options = { upsert: true };
        //     const updatedDoc = {
        //         $set: {
        //             role: "admin"
        //         }
        //     }
        //     const result = await userCollection.updateOne(filter, updatedDoc, options);
        //     res.send(result);
        // })





        app.put('/users/admin/:id', verifyJWT, async (req, res) => {

            const decodedEmail = req.decoded.email;
            const query = { email: decodedEmail };
            const user = await usersCollection.findOne(query);
            if (user?.role !== 'admin') {
                return res.status(403).send({ message: 'forbidden access' })
            }

            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    role: 'admin'
                }
            }
            const result = await usersCollection.updateOne(filter, updatedDoc, options)
            res.send(result)
        })


        app.get('/users', async (req, res) => {
            const query = {};
            const users = await usersCollection.find(query).toArray();
            res.send(users);
        })

        //
        // app.get('users/admin/:id', async (req, res) => {
        //     const id = req.params.id;
        //     const query = { _id: ObjectId(id) }
        //     const user = await usersCollection.findOne(query);
        //     res.send({ isAdmin: user?.role === 'admin' });
        // })

        //
        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await usersCollection.findOne(query);
            res.send({ isAdmin: user?.role === 'admin' });
        })


        //
        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.send(result);
        })

        app.get('/doctors', async (req, res) => {
            const query = {}
            const doctors = await doctorsCollection.find(query).toArray();
            res.send(doctors)
        })

        app.post('/doctors', async (req, res) => {
            const doctor = req.body;
            const result = await doctorsCollection.insertOne(doctor);
            res.send(result);

        })




    }
    finally {

    }
}
run().catch(console.log());





app.get('/', async (req, res) => {
    res.send('Doctor Portalortal Server is Running')
})
app.listen(port, () => console.log(`doctor Portal running ${port}`));