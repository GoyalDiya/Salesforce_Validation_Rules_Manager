import express from 'express'
import morgan from 'morgan'
import cors from 'cors'
import cookieParser from 'cookie-parser'

import config from './config.js'

const app = express()

app.use(morgan('dev'))
app.use(express.json())
app.use(cookieParser())
app.use(
  cors({
    origin: config.clientOrigin,
    credentials: true,
  })
)

app.get('/health', (req, res) => {
  res.json({
    ok: true,
    service: 'salesforce-validation-rules-manager',
    env: config.nodeEnv,
    timestamp: new Date().toISOString(),
  })
})

app.use((req, res) => {
  res.status(404).json({ error: { message: 'Not found', path: req.path } })
})

app.listen(config.port, () => {
  console.log(`[server] Listening on http://localhost:${config.port}`)
  console.log(`[server] CORS allowed origin: ${config.clientOrigin}`)
})
