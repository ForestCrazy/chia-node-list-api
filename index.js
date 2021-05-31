const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multiparty = require('multiparty');
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
        try {
            const DatabaseName = cachedDb.collection('node').countDocuments()
            return cachedDb
        } catch (except) {
            console.log(except)
        }
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

function checkLastHeightBlock(node_input, node_db = {}) {
    if (node_input.hasOwnProperty('node_height')) {
        if (/^-?\d+$/.test(parseInt(node_input.node_height[0]))) {
            node_input.node_height = parseInt(node_input.node_height[0])
        } else {
            node_input.node_height = false
        }
    } else {
        node_input.node_height = false
    }
    if (node_db.hasOwnProperty('node_height')) {
        if (node_input.height) {
            if (node_input.node_height >= node_db.node_height) {
                return node_input.node_height
            } else {
                return node_db.node_height
            }
        } else {
            return node_db.node_height
        }
    } else {
        if (node_input.node_height) {
            return parseInt(node_input.node_height)
        } else {
            return 0
        }
    }
}

const app = express();

app.use(cors())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

app.all('/', (req, res) => {
    res.json({
        msg: 'path not found. API Document https://github.com/ForestCrazy/chia-node-list-api/blob/main/README.md'
    })
})

app.get('/node', async(req, res) => {
    res.statusCode = 200
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate')
    var limit = 100
    if (parseInt(req.query.limit) != limit && /^-?\d+$/.test(req.query.limit)) {
        limit = parseInt(req.query.limit)
    }
    try {
        var db = await connectToDatabase(process.env.MONGODB_URI)
        const node = await db.collection('node').find({}).sort({ last_active: -1 }).limit(limit).toArray()
        res.json(node)
    } catch (except) {
        res.statusCode = 530
        res.json({
            msg: 'failed to connect to database',
            success: true
        })
    }
});

app.post('/node', async(req, res) => {
    res.statusCode = 200
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate')
    try {
        var db = await connectToDatabase(process.env.MONGODB_URI)
        let form = new multiparty.Form();

        form.parse(req, async function(err, fields, files) {
            if (fields) {
                if (fields.node_ip[0] !== undefined && fields.node_port[0] !== undefined) {
                    if (/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(fields.node_ip[0]) && /^-?\d+$/.test(fields.node_port[0])) {
                        const node = await db.collection('node').find({
                            node_ip: fields.node_ip[0]
                        }).toArray()
                        if (node.length > 0) {
                            res.json({
                                msg: 'this node is already inserted',
                                success: false
                            })
                        } else {
                            await db.collection('node').insert({
                                node_ip: fields.node_ip[0],
                                node_port: parseInt(fields.node_port[0]),
                                node_height: checkLastHeightBlock(fields),
                                last_active: Math.floor(new Date().getTime() / 1000)
                            });
                            res.json({
                                msg: 'insert node successfully',
                                timestamp: Math.floor(new Date().getTime() / 1000),
                                success: true
                            })
                        }
                    } else {
                        res.statusCode = 400
                        res.json({
                            code: 1011,
                            msg: 'ip pattern is not match or port is not number',
                            success: false
                        })
                    }
                } else {
                    res.statusCode = 400
                    res.json({
                        code: 1010,
                        msg: 'form data is null',
                        success: false
                    })
                }
            } else {
                res.statusCode = 400
                res.json({
                    code: 1010,
                    msg: 'form data is null',
                    success: false
                })
            }
        });
    } catch (except) {
        res.statusCode = 531
        res.json({
            msg: 'failed to insert node into database',
            success: false
        })
    }
});

app.patch('/node', async(req, res) => {
    res.statusCode = 200
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate')
    try {
        var db = await connectToDatabase(process.env.MONGODB_URI)
        let form = new multiparty.Form();

        form.parse(req, async function(err, fields, files) {
            if (fields) {
                if (fields.node_ip[0] !== undefined && fields.node_port[0] !== undefined) {
                    if (/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(fields.node_ip[0]) && /^-?\d+$/.test(fields.node_port[0])) {
                        const node = await db.collection('node').find({
                            node_ip: fields.node_ip[0],
                            node_port: fields.node_port[0]
                        }).toArray()
                        if (node.length > 0) {
                            const UpdateNode = await db.collection('node').update({
                                node_ip: fields.node_ip[0],
                                node_port: parseInt(fields.node_port[0])
                            }, {
                                node_ip: fields.node_ip[0],
                                node_port: parseInt(fields.node_port[0]),
                                node_height: checkLastHeightBlock(fields, node),
                                last_active: Math.floor(new Date().getTime() / 1000)
                            }, {
                                upsert: false
                            })
                            res.json({
                                msg: 'active node success',
                                success: true
                            })
                        } else {
                            res.json({
                                msg: 'this node is not found',
                                success: false
                            })
                        }
                    } else {
                        res.statusCode = 400
                        res.json({
                            code: 1011,
                            msg: 'ip pattern is not match or port is not number',
                            success: false
                        })
                    }
                } else {
                    res.statusCode = 400
                    res.json({
                        code: 1010,
                        msg: 'form data is null',
                        success: false
                    })
                }
            } else {
                res.statusCode = 400
                res.json({
                    code: 1010,
                    msg: 'form data is null',
                    success: false
                })
            }
        });
    } catch (except) {
        res.statusCode = 532
        res.json({
            msg: 'failed to active node',
            success: false
        })
    }
})

app.put('/node', async(req, res) => {
    res.statusCode = 200
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate')
    try {
        var db = await connectToDatabase(process.env.MONGODB_URI)
        let form = new multiparty.Form();

        form.parse(req, async function(err, fields, files) {
            if (fields) {
                if (fields.node_ip[0] !== undefined && fields.node_port[0] !== undefined) {
                    if (/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(fields.node_ip[0]) && /^-?\d+$/.test(fields.node_port[0])) {
                        const node = await db.collection('node').findOne({
                            node_ip: fields.node_ip[0],
                            node_port: fields.node_port[0]
                        }, {})
                        await db.collection('node').update({
                            node_ip: fields.node_ip[0]
                        }, {
                            node_ip: fields.node_ip[0],
                            node_port: parseInt(fields.node_port[0]),
                            node_height: checkLastBlockHeight(fields, node),
                            last_active: Math.floor(new Date().getTime() / 1000)
                        }, {
                            upsert: true
                        })
                        res.json({
                            msg: 'active node success',
                            success: true
                        })
                    } else {
                        res.statusCode = 400
                        res.json({
                            code: 1011,
                            msg: 'ip pattern is not match or port is not number',
                            success: false
                        })
                    }
                } else {
                    res.statusCode = 400
                    res.json({
                        code: 1010,
                        msg: 'form data is null',
                        success: false
                    })
                }
            } else {
                res.statusCode = 400
                res.json({
                    code: 1010,
                    msg: 'form data is null',
                    success: false
                })
            }
        });
    } catch (except) {
        res.statusCode = 533
        res.json({
            msg: 'failed to active this node',
            success: false
        })
    }
})

app.use((req, res, next) => {
    res.json({
        msg: 'path not found. API Document https://github.com/ForestCrazy/chia-node-list-api/blob/main/README.md'
    })
});

const port = process.env.PORT || 80;

app.listen(port, () => console.log(`Server running on ${port}`));