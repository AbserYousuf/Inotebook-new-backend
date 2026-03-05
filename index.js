require("dotenv").config({ path: ".env" });
const express = require("express")
const auth = require('./Routes/auth.js')
const notes = require('./Routes/notes.js')
const Connect = require('./Databse.js')
const cors = require('cors')
Connect()
const app = express()
app.use(cors({
    origin: process.env.CLIENT_PORT,
    methods: ["GET", "POST", "DELETE", "PUT", "OPTIONS"],
    allowedHeaders: [
        "Content-Type",
        'authtoken',
        'authorization',
        'Emtoken'
    ],
    credentials: true
})
)
app.use(express.json())
app.use('/api/auth', auth)
app.use('/api/notes', notes)


const port = process.env.PORT
app.listen(port, () => {
    console.log(`The backend is Listening on http://localhost:${port}`)
    console.log(`Frontend Is Listening on ${proccess.env.CLIENT_PORT}`)

})
