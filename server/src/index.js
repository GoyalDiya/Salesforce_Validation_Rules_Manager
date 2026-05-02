import express from 'express'
import session from 'express-session'
import morgan from 'morgan'
import cors from 'cors'
import cookieParser from 'cookie-parser'

import config from './config.js'
import authRouter from './routes/auth.js'
import meRouter from './routes/me.js'

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

app.use(
  session({
    name: 'svrm.sid',
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: config.isProduction,
      maxAge: 1000 * 60 * 60 * 24, // 24 hours
    },
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

app.use('/auth', authRouter)
app.use('/api/me', meRouter)

app.use((req, res) => {
  res.status(404).json({ error: { message: 'Not found', path: req.path } })
})

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[error]', err)
  const status = err.status || 500
  res.status(status).json({
    error: {
      message: err.message || 'Internal Server Error',
      code: err.code,
    },
  })
})

app.listen(config.port, () => {
  console.log(`[server] Listening on http://localhost:${config.port}`)
  console.log(`[server] CORS allowed origin: ${config.clientOrigin}`)
})
