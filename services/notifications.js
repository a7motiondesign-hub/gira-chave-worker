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
      from: process.env.EMAIL_FROM || 'GiraChavePro <suporte@girachavepro.com>',
      to,
      subject,
      html,
    })
  } catch (err) {
    console.error('[notifications] Erro ao enviar email:', err.message)
  }
}

function jobReadyEmailHtml(userName, serviceLabel, galleryUrl) {
  const logoUrl = 'https://res.cloudinary.com/dxhkprfxw/image/upload/w_360/v1773840741/girachavepro_logo_email.png'
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background-color:#1E1611;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#1E1611;">
    <tr><td align="center" style="padding:24px 0;">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#1E1611;border-radius:8px;overflow:hidden;">
        <!-- Header -->
        <tr><td style="background-color:#1E1611;padding:32px 30px;text-align:center;">
          <img src="${logoUrl}" alt="GiraChavePro" width="180" style="display:block;margin:0 auto;border:0;max-width:180px;">
        </td></tr>
        <!-- Content -->
        <tr><td style="padding:36px 40px;background-color:#FFFFFF;">
          <h2 style="margin:0 0 16px;color:#1A1A1A;font-size:22px;font-weight:700;font-family:Arial,Helvetica,sans-serif;">✅ ${serviceLabel} concluído!</h2>
          <p style="color:#3D3D3D;font-size:15px;line-height:1.65;margin:0 0 24px;font-family:Arial,Helvetica,sans-serif;">
            Olá, <strong>${userName}</strong>! Seu processamento foi concluído com sucesso.
            Acesse sua galeria para ver e baixar o resultado.
          </p>
          <!--[if mso]>
          <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word"
            href="${galleryUrl}" style="height:48px;v-text-anchor:middle;width:240px;" arcsize="17%"
            strokecolor="#A04128" fillcolor="#C85A35">
            <w:anchorlock/><center style="color:#FFFFFF;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;">Ver na Galeria →</center>
          </v:roundrect>
          <![endif]-->
          <!--[if !mso]><!-->
          <table cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;margin:0 auto 28px;">
            <tr>
              <td align="center" bgcolor="#C85A35" style="background-color:#C85A35;border:2px solid #A04128;border-radius:8px;">
                <a href="${galleryUrl}" target="_blank" style="display:inline-block;padding:14px 36px;font-size:15px;font-weight:700;font-family:Arial,Helvetica,sans-serif;color:#FFFFFF;text-decoration:none;border-radius:8px;-webkit-text-size-adjust:none;mso-hide:all;">
                  Ver na Galeria →
                </a>
              </td>
            </tr>
          </table>
          <!--<![endif]-->
          <hr style="border:none;border-top:1px solid #E2E8F0;margin:20px 0;">
          <p style="color:#718096;font-size:13px;margin:0;font-family:Arial,Helvetica,sans-serif;">Bons negócios! 🏡</p>
        </td></tr>
        <!-- Affiliate strip -->
        <tr><td align="center" style="background-color:#2A1F17;border-top:1px solid #3A2E25;border-bottom:1px solid #3A2E25;padding:14px 30px;">
          <span style="font-family:Arial,sans-serif;font-size:13px;color:#C4A882;">
            💰 <strong>Faça você também uma renda extra!</strong>
            <a href="${APP_URL}/indicar" style="color:#C85A35;font-weight:700;text-decoration:underline;">Clique agora →</a>
          </span>
        </td></tr>
        <!-- Footer -->
        <tr><td align="center" style="background-color:#1E1611;padding:24px 40px;text-align:center;">
          <p style="margin:0 0 4px;font-size:14px;font-weight:700;color:#C4A882;font-family:Arial,Helvetica,sans-serif;"><strong>GiraChavePro</strong></p>
          <p style="margin:4px 0;font-size:12px;color:#8A7A6A;line-height:1.5;font-family:Arial,Helvetica,sans-serif;">
            <a href="mailto:suporte@girachavepro.com" style="color:#C85A35;">suporte@girachavepro.com</a>
          </p>
          <p style="margin:4px 0;font-size:12px;color:#8A7A6A;line-height:1.5;font-family:Arial,Helvetica,sans-serif;">
            <a href="${APP_URL}/privacidade" style="color:#8A7A6A;">Política de Privacidade</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function jobFailedEmailHtml(userName, serviceLabel) {
  const logoUrl = 'https://res.cloudinary.com/dxhkprfxw/image/upload/w_360/v1773840741/girachavepro_logo_email.png'
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background-color:#1E1611;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#1E1611;">
    <tr><td align="center" style="padding:24px 0;">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#1E1611;border-radius:8px;overflow:hidden;">
        <!-- Header -->
        <tr><td style="background-color:#1E1611;padding:32px 30px;text-align:center;">
          <img src="${logoUrl}" alt="GiraChavePro" width="180" style="display:block;margin:0 auto;border:0;max-width:180px;">
        </td></tr>
        <!-- Content -->
        <tr><td style="padding:36px 40px;background-color:#FFFFFF;">
          <h2 style="margin:0 0 16px;color:#1A1A1A;font-size:22px;font-weight:700;font-family:Arial,Helvetica,sans-serif;">Processamento não concluído</h2>
          <p style="color:#3D3D3D;font-size:15px;line-height:1.65;margin:0 0 16px;font-family:Arial,Helvetica,sans-serif;">
            Olá, <strong>${userName}</strong>! Infelizmente seu <strong>${serviceLabel}</strong>
            não pôde ser concluído após 3 tentativas.
          </p>
          <div style="background:#FFF5F5;border-left:4px solid #C53030;border-radius:4px;padding:14px 18px;margin:16px 0 24px;">
            <p style="margin:0;font-size:14px;color:#C53030;font-weight:600;font-family:Arial,Helvetica,sans-serif;">
              💳 Seus créditos foram reembolsados automaticamente.
            </p>
          </div>
          <!--[if mso]>
          <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word"
            href="${APP_URL}/gallery" style="height:48px;v-text-anchor:middle;width:240px;" arcsize="17%"
            strokecolor="#A04128" fillcolor="#C85A35">
            <w:anchorlock/><center style="color:#FFFFFF;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;">Tentar Novamente</center>
          </v:roundrect>
          <![endif]-->
          <!--[if !mso]><!-->
          <table cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;margin:0 auto 28px;">
            <tr>
              <td align="center" bgcolor="#C85A35" style="background-color:#C85A35;border:2px solid #A04128;border-radius:8px;">
                <a href="${APP_URL}/gallery" target="_blank" style="display:inline-block;padding:14px 36px;font-size:15px;font-weight:700;font-family:Arial,Helvetica,sans-serif;color:#FFFFFF;text-decoration:none;border-radius:8px;-webkit-text-size-adjust:none;mso-hide:all;">
                  Tentar Novamente
                </a>
              </td>
            </tr>
          </table>
          <!--<![endif]-->
          <p style="color:#718096;font-size:13px;margin:0;font-family:Arial,Helvetica,sans-serif;">
            Dúvidas? Fale conosco em
            <a href="mailto:suporte@girachavepro.com" style="color:#C85A35;text-decoration:none;">suporte@girachavepro.com</a>
          </p>
        </td></tr>
        <!-- Affiliate strip -->
        <tr><td align="center" style="background-color:#2A1F17;border-top:1px solid #3A2E25;border-bottom:1px solid #3A2E25;padding:14px 30px;">
          <span style="font-family:Arial,sans-serif;font-size:13px;color:#C4A882;">
            💰 <strong>Faça você também uma renda extra!</strong>
            <a href="${APP_URL}/indicar" style="color:#C85A35;font-weight:700;text-decoration:underline;">Clique agora →</a>
          </span>
        </td></tr>
        <!-- Footer -->
        <tr><td align="center" style="background-color:#1E1611;padding:24px 40px;text-align:center;">
          <p style="margin:0 0 4px;font-size:14px;font-weight:700;color:#C4A882;font-family:Arial,Helvetica,sans-serif;"><strong>GiraChavePro</strong></p>
          <p style="margin:4px 0;font-size:12px;color:#8A7A6A;line-height:1.5;font-family:Arial,Helvetica,sans-serif;">
            <a href="mailto:suporte@girachavepro.com" style="color:#C85A35;">suporte@girachavepro.com</a>
          </p>
          <p style="margin:4px 0;font-size:12px;color:#8A7A6A;line-height:1.5;font-family:Arial,Helvetica,sans-serif;">
            <a href="${APP_URL}/privacidade" style="color:#8A7A6A;">Política de Privacidade</a>
          </p>
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
    'virtual-staging': 'HyperSpace Staging™',
    'limpar-baguncca': 'CleanStage IA™',
    'foto-revista': 'Lumina HDR 2026™',
    'video-ia': 'NeuroVoice™',
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

  // 2. Fetch profile + plan before Telegram alert
  let profile = null
  let planName = ''
  try {
    const { data } = await supabase
      .from('profiles')
      .select('email, full_name, email_notifications, plan_id')
      .eq('id', userId)
      .single()
    profile = data
    if (profile?.plan_id) {
      const { data: planData } = await supabase
        .from('plans')
        .select('display_name')
        .eq('id', profile.plan_id)
        .single()
      planName = planData?.display_name || ''
    }
  } catch (err) {
    console.error('[notifications] Erro ao buscar perfil:', err.message)
  }

  // 3. Telegram founder alert
  try {
    const now = new Date()
    const date = now.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
    const time = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })
    const roomLine = roomType ? `\n🚪 *Cômodo:* ${roomType}` : ''
    const styleLine = style ? `\n🎨 *Estilo:* ${style}` : ''
    const userLine = profile?.email
      ? `\n👤 ${profile.email}${planName ? ` · *${planName}*` : ''}`
      : `\n👤 \`${userId.slice(0, 8)}...\``

    await sendTelegramAlert(
      `✅ *GiraChavePro*` + userLine + `\n` +
      `✅ Processamento concluído\n━━━━━━━━━━━━━━━\n` +
      `🔧 *Serviço:* ${label}` + roomLine + styleLine +
      `\n💳 *Créditos usados:* ${creditsUsed ?? '?'}` +
      `\n📅 *Data:* ${date} às ${time}`
    )
  } catch (err) {
    console.error('[notifications] Telegram error:', err.message)
  }

  // 4. Email (reuse already-fetched profile)
  try {
    if (profile?.email && profile.email_notifications !== false) {
      const name = profile.full_name || profile.email.split('@')[0]
      await sendEmail(
        profile.email,
        `✅ ${label} pronto!`,
        jobReadyEmailHtml(name, label, galleryUrl)
      )
    }
  } catch (err) {
    console.error('[notifications] Erro ao enviar email:', err.message)
  }
}

/**
 * Notify user that their job failed permanently (in-app + email + Telegram).
 */
export async function notifyJobFailed({ userId, service, jobId, errorMessage }) {
  const serviceLabels = {
    'virtual-staging': 'HyperSpace Staging™',
    'limpar-baguncca': 'CleanStage IA™',
    'foto-revista': 'Lumina HDR 2026™',
    'video-ia': 'NeuroVoice™',
  }
  const label = serviceLabels[service] ?? service

  // 1. In-app notification
  await createInAppNotification(
    userId,
    'system',
    'Processamento falhou',
    `Não foi possível processar seu job (#${jobId.slice(0, 8)}) após 3 tentativas.`,
    `${APP_URL}/gallery`,
    { service, job_id: jobId }
  )

  // 2. Fetch profile + plan before alerts
  let profile = null
  let planName = ''
  try {
    const { data } = await supabase
      .from('profiles')
      .select('email, full_name, email_notifications, plan_id')
      .eq('id', userId)
      .single()
    profile = data
    if (profile?.plan_id) {
      const { data: planData } = await supabase
        .from('plans')
        .select('display_name')
        .eq('id', profile.plan_id)
        .single()
      planName = planData?.display_name || ''
    }
  } catch (err) {
    console.error('[notifications] Erro ao buscar perfil:', err.message)
  }

  // 3. Email (use already-fetched profile)
  try {
    if (profile?.email && profile.email_notifications !== false) {
      const name = profile.full_name || profile.email.split('@')[0]
      await sendEmail(
        profile.email,
        `❌ Falha no processamento: ${label}`,
        jobFailedEmailHtml(name, label)
      )
    }
  } catch (err) {
    console.error('[notifications] Erro ao enviar email de falha:', err.message)
  }

  // 4. Telegram
  const userLine = profile?.email
    ? `\n👤 ${profile.email}${planName ? ` · *${planName}*` : ''}`
    : `\n👤 \`${userId.slice(0, 8)}...\``
  await sendTelegramAlert(
    `🔴 *GiraChavePro*` + userLine + `\n` +
    `Falha definitiva!\nServiço: *${label}*\nJob: \`${jobId.slice(0, 8)}\`\nErro: ${errorMessage?.slice(0, 200) ?? 'desconhecido'}`,
    `failed:${userId}`,
    5 * 60 * 1000 // debounce 5 min
  )
}
