/**
 * worker/index.js
 *
 * Entry point for the GiraChavePro standalone job worker.
 *
 * Starts:
 *   1. An Express server with a GET /health endpoint (anti-sleep for Render free tier)
 *   2. The processing loop (polls Supabase queue every 30s)
 *
 * ─── ANTI-SLEEP SETUP (REQUIRED for Render free tier) ─────────────────────
 *  Render spins down free services after 15 minutes of inactivity.
 *  To keep this worker alive 24/7:
 *
 *  1. Deploy this worker on Render → note your public URL, e.g.:
 *     https://gira-chave-worker.onrender.com
 *
 *  2. Create a free account at https://cron-job.org
 *
 *  3. Add a new cron job with:
 *     URL:      https://gira-chave-worker.onrender.com/health
 *     Interval: Every 10 minutes
 *
 *  That's it. cron-job.org pings /health every 10 minutes, preventing sleep.
 * ──────────────────────────────────────────────────────────────────────────
 */

import 'dotenv/config'
import express from 'express'
import { startWorkerLoop } from './worker-loop.js'

const PORT = process.env.PORT || 3001
const app = express()

// ── Health check endpoint ─────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'gira-chave-worker',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  })
})

// ── Start server ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[worker] Health server listening on port ${PORT}`)
  console.log(`[worker] GET /health → anti-sleep ping target for cron-job.org`)

  // Start polling loop after server is ready
  startWorkerLoop()
})
