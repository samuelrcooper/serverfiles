const express = require('express')
const morgan = require('morgan')
const cors = require('cors')

require('dotenv').config()
// require('./config/database')
console.log(require('crypto').randomBytes(32).toString('hex'))
const app = express()

// ROUTES
const genRoutes          = require('./routes/generator')
// const dogRoutes           = require('./routes/dogs')

// MIDDLEWARE
app.use(morgan('dev'))
app.use(cors({ credentials: true, origin: process.env.CLIENT_URL }))

// API
app.use('/api/gen', genRoutes)
// app.use('/api/dogs', dogRoutes)


const port = process.env.PORT || 3001

app.listen(port, () => console.log(`Server is running on port ${port}`))