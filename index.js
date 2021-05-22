const express = require('express');
const db = require('./connect')

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
    const node = await db.collection('node').find({}).toArray()
    res.json({ node })
});

const port = process.env.PORT || 80;

app.listen(port, () => console.log(`Server running on ${port}, http://localhost:${port}`));