/**
 * worker/services/notifications.js
 *
 * All post-processing notification logic:
 *   - In-app notifications via Supabase (user_notifications table)
 *   - Email notifications via Resend
 *   - Telegram founder alerts
 *
 * Adapted from:
 *   - utils/createNotification.js
 *   - lib/email.js (sendEmail, EMAIL_TEMPLATES.PHOTO_READY, STAGING_READY, emailHelpers)
 *   - lib/alerts.js
 */

import { Resend } from 'resend'
import { supabase } from '../lib/supabase.js'

const APP_URL = process.env.APP_URL || 'https://www.girachavepro.com'
const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}`

// Telegram debounce (in-memory, resets on restart — acceptable for a worker)
const _recentAlerts = new Map()

// ── In-app notification ───────────────────────────────────────────────────────

async function createInAppNotification(userId, type, title, message, link = null, metadata = null) {
  const { error } = await supabase
    .from('user_notifications')
    .insert({
      user_id: userId,
      type,
      title,
      message,
      link,
      metadata,
      read: false,
      archived: false,
    })

  if (error) {
    console.error('[notifications] Erro ao criar notificação in-app:', error.message)
  }
}

// ── Email ─────────────────────────────────────────────────────────────────────

async function sendEmail(to, subject, html) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[notifications] RESEND_API_KEY não configurada — email ignorado')
    return
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'GiraChavePro <noreply@girachavepro.com>',
      to,
      subject,
      html,
    })
  } catch (err) {
    console.error('[notifications] Erro ao enviar email:', err.message)
  }
}

function jobReadyEmailHtml(userName, serviceLabel, galleryUrl) {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:20px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;">
        <tr><td style="background:linear-gradient(135deg,#c85a35,#a04128);padding:32px 30px;text-align:center;">
          <h1 style="margin:0;color:#fff;font-size:24px;">🔑 GiraChavePro</h1>
        </td></tr>
        <tr><td style="padding:32px 30px;">
          <h2 style="margin:0 0 16px;color:#1a202c;">✅ ${serviceLabel} concluído!</h2>
          <p style="color:#4a5568;font-size:16px;line-height:1.6;">
            Olá, <strong>${userName}</strong>! Seu processamento foi concluído com sucesso.
            Acesse sua galeria para ver o resultado.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;">
            <tr><td align="center">
              <a href="${galleryUrl}"
                 style="display:inline-block;background:linear-gradient(135deg,#c85a35,#a04128);color:#fff;
                        text-decoration:none;padding:14px 36px;border-radius:6px;font-size:16px;font-weight:600;">
                Ver na Galeria
              </a>
            </td></tr>
          </table>
          <p style="color:#718096;font-size:13px;">Bons negócios! 🏠</p>
        </td></tr>
        <tr><td style="background:#f7fafc;padding:20px 30px;text-align:center;border-top:1px solid #e2e8f0;">
          <p style="margin:0;color:#a0aec0;font-size:12px;">© ${new Date().getFullYear()} GiraChavePro. Todos os direitos reservados.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function jobFailedEmailHtml(userName, serviceLabel) {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:20px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;">
        <tr><td style="background:linear-gradient(135deg,#e53e3e,#c53030);padding:32px 30px;text-align:center;">
          <h1 style="margin:0;color:#fff;font-size:24px;">⚠️ GiraChavePro</h1>
        </td></tr>
        <tr><td style="padding:32px 30px;">
          <h2 style="margin:0 0 16px;color:#1a202c;">Processamento não concluído</h2>
          <p style="color:#4a5568;font-size:16px;line-height:1.6;">
            Olá, <strong>${userName}</strong>! Infelizmente seu <strong>${serviceLabel}</strong>
            não pôde ser concluído após 3 tentativas. Seus créditos foram reembolsados.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;">
            <tr><td align="center">
              <a href="${APP_URL}/gallery"
                 style="display:inline-block;background:linear-gradient(135deg,#c85a35,#a04128);color:#fff;
                        text-decoration:none;padding:14px 36px;border-radius:6px;font-size:16px;font-weight:600;">
                Tentar Novamente
              </a>
            </td></tr>
          </table>
          <p style="color:#718096;font-size:13px;">Se o problema persistir, entre em contato com nosso suporte.</p>
        </td></tr>
        <tr><td style="background:#f7fafc;padding:20px 30px;text-align:center;border-top:1px solid #e2e8f0;">
          <p style="margin:0;color:#a0aec0;font-size:12px;">© ${new Date().getFullYear()} GiraChavePro. Todos os direitos reservados.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// ── Telegram ──────────────────────────────────────────────────────────────────

async function sendTelegramAlert(text, debounceKey = null, debounceMs = 0) {
  if (!process.env.TELEGRAM_TOKEN || !process.env.TELEGRAM_CHAT_ID) return

  if (debounceKey && debounceMs > 0) {
    const last = _recentAlerts.get(debounceKey) ?? 0
    if (Date.now() - last < debounceMs) return
    _recentAlerts.set(debounceKey, Date.now())
  }

  try {
    await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: process.env.TELEGRAM_CHAT_ID,
        text,
        parse_mode: 'Markdown',
      }),
    })
  } catch (err) {
    console.error('[notifications] Telegram error:', err.message)
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Notify user that their job is complete (in-app + email + Telegram).
 */
export async function notifyJobComplete({ userId, service, jobId, roomType, style, creditsUsed }) {
  const serviceLabels = {
    'virtual-staging': 'Virtual Staging',
    'limpar-baguncca': 'Limpeza Virtual',
    'foto-revista': 'Foto Turbinada',
  }
  const serviceType = service === 'foto-revista' ? 'foto' : 'staging'
  const label = serviceLabels[service] ?? service
  const galleryUrl = `${APP_URL}/gallery`

  // 1. In-app notification
  await createInAppNotification(
    userId,
    'processing_complete',
    service === 'foto-revista' ? 'Foto Turbinada!' : 'Virtual Staging Completo!',
    `Seu processamento (#${jobId.slice(0, 8)}) foi concluído com sucesso!`,
    galleryUrl,
    { service_type: serviceType, job_id: jobId }
  )

  // 2. Telegram founder alert — always fires first, independently of everything
  try {
    const now = new Date()
    const date = now.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
    const time = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })
    const roomLine = roomType ? `\n🚪 *Cômodo:* ${roomType}` : ''
    const styleLine = style ? `\n🎨 *Estilo:* ${style}` : ''

    await sendTelegramAlert(
      `✅ *GiraChavePro*\n👤 ${userId}\n` +
      `✅ Processamento concluído\n━━━━━━━━━━━━━━━\n` +
      `🔧 *Serviço:* ${label}` + roomLine + styleLine +
      `\n💳 *Créditos usados:* ${creditsUsed ?? '?'}` +
      `\n📅 *Data:* ${date} às ${time}`
    )
  } catch (err) {
    console.error('[notifications] Telegram error:', err.message)
  }

  // 3. Email (fetch profile for name/email)
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name, email_notifications')
      .eq('id', userId)
      .single()

    if (profile?.email && profile.email_notifications !== false) {
      const name = profile.full_name || profile.email.split('@')[0]
      await sendEmail(
        profile.email,
        `✅ ${label} pronto!`,
        jobReadyEmailHtml(name, label, galleryUrl)
      )
    }
  } catch (err) {
    console.error('[notifications] Erro ao buscar perfil para email:', err.message)
  }
}

/**
 * Notify user that their job failed permanently (in-app + email + Telegram).
 */
export async function notifyJobFailed({ userId, service, jobId, errorMessage }) {
  const label = service === 'foto-revista' ? 'Foto Turbinada' : 'Virtual Staging'

  // 1. In-app notification
  await createInAppNotification(
    userId,
    'system',
    'Processamento falhou',
    `Não foi possível processar seu job (#${jobId.slice(0, 8)}) após 3 tentativas.`,
    `${APP_URL}/gallery`,
    { service, job_id: jobId }
  )

  // 2. Email
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name, email_notifications')
      .eq('id', userId)
      .single()

    if (profile?.email && profile.email_notifications !== false) {
      const name = profile.full_name || profile.email.split('@')[0]
      await sendEmail(
        profile.email,
        `❌ Falha no processamento: ${label}`,
        jobFailedEmailHtml(name, label)
      )
    }
  } catch (err) {
    console.error('[notifications] Erro ao buscar perfil para email de falha:', err.message)
  }

  // 3. Telegram
  await sendTelegramAlert(
    `🔴 *GiraChavePro*\n` +
    `Falha definitiva!\nServiço: *${service}*\nJob: \`${jobId.slice(0, 8)}\`\nErro: ${errorMessage?.slice(0, 200) ?? 'desconhecido'}`,
    `failed:${userId}`,
    5 * 60 * 1000 // debounce 5 min
  )
}
