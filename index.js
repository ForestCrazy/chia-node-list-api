const express = require('express');
// Import Dependencies
const url = require('url')
const MongoClient = require('mongodb').MongoClient
require('dotenv').config()

// Create cached connection variable
let cachedDb = null

// A function for connecting to MongoDB,
// taking a single parameter of the connection string
async function connectToDatabase(uri) {
    // If the database connection is cached,
    // use it instead of creating a new connection
    if (cachedDb) {
        return cachedDb
    }

    // If no connection is cached, create a new one
    const client = await MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })

    // Select the database through the connection,
    // using the database path of the connection string
    const db = await client.db(url.parse(uri).pathname.substr(1))

    // Cache the database connection and return the connection
    cachedDb = db
    return db
}

const app = express();

app.all('/', (req, res) => {
    res.json({
        "err": 'path not found. <a href="./">API Document</a>'
    })
})

app.get('/node', async(req, res) => {
    res.statusCode = 200
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate')
    const db = await connectToDatabase(process.env.MONGODB_URI)
    const node = await db.collection('node').find({}).toArray()['node']
    res.json({ node })
});

const port = process.env.PORT || 80;

app.listen(port, () => console.log(`Server running on ${port}, http://localhost:${port}`));