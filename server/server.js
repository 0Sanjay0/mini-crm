require('dotenv').config()
const express = require('express')
const cors = require('cors')
const connectDB = require('./config/db')

const app = express()

const allowed = (process.env.CLIENT_URL || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)
app.use(cors({ origin: allowed.length ? allowed : true }))
app.use(express.json())

app.get('/api/health', (req, res) => res.json({ status: 'ok' }))

app.use('/api/auth', require('./routes/auth'))
app.use('/api/users', require('./routes/users'))
app.use('/api/leads', require('./routes/leads'))
app.use('/api/companies', require('./routes/companies'))
app.use('/api/tasks', require('./routes/tasks'))
app.use('/api/dashboard', require('./routes/dashboard'))

app.get('/', (req, res) =>
  res.json({ message: 'Mini CRM API', health: '/api/health' }),
)

app.use((req, res) => res.status(404).json({ message: 'Route not found' }))

// Central error handler
app.use((err, req, res, next) => {
  console.error(err)
  if (err.name === 'ValidationError')
    return res.status(400).json({ message: err.message })
  if (err.name === 'CastError')
    return res.status(400).json({ message: 'Invalid id' })
  res.status(err.status || 500).json({ message: err.message || 'Server error' })
})

const PORT = process.env.PORT || 5000
connectDB()
  .then(() =>
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`)),
  )
  .catch((err) => {
    console.error('DB connection failed:', err.message)
    process.exit(1)
  })
