require('dotenv').config()

// Ensure fetch is available for libraries like OpenAI and node-fetch
if (typeof global.fetch !== 'function') {
  global.fetch = require('node-fetch')
}

const express = require('express')
const cors = require('cors')

const summarizeRouter = require('./Routes/summarize')

const app = express()

app.use(cors())
app.use(express.json())

app.use('/api', summarizeRouter)

const PORT = process.env.PORT || 5001
app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`)
}).on('error', (err) => {
  console.error('Failed to start backend server:', err.message)
})
