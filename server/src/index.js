import express from 'express'
import session from 'express-session'
import morgan from 'morgan'
import cors from 'cors'
import cookieParser from 'cookie-parser'

import config from './config.js'
import authRouter from './routes/auth.js'
import meRouter from './routes/me.js'
import rulesRouter from './routes/rules.js'
import errorHandler from './middleware/errorHandler.js'

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
app.use('/api/validation-rules', rulesRouter)

app.use((req, res) => {
  res.status(404).json({ error: { message: 'Not found', path: req.path } })
})

app.use(errorHandler)

app.listen(config.port, () => {
  console.log(`[server] Listening on http://localhost:${config.port}`)
  console.log(`[server] CORS allowed origin: ${config.clientOrigin}`)
})
