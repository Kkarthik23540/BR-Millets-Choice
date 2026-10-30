import crypto from 'node:crypto';
import nodemailer from 'nodemailer';
import { config, emailConfigured } from './config.js';
import { pool, inTransaction } from './db.js';

const transporter = emailConfigured
  ? nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpSecure,
    auth: config.smtpUser ? { user: config.smtpUser, pass: config.smtpPassword } : undefined,
  })
  : null;

function payloadKey() {
  return crypto.createHash('sha256').update(config.sessionSecret).digest();
}

export function sealEmailPayload(payload) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', payloadKey(), iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(payload), 'utf8'), cipher.final()]);
  return {
    encrypted: true,
    iv: iv.toString('base64'),
    tag: cipher.getAuthTag().toString('base64'),
    data: encrypted.toString('base64'),
  };
}

function openEmailPayload(payload) {
  if (!payload.encrypted) throw new Error('Refusing to send an unencrypted email payload.');
  const decipher = crypto.createDecipheriv('aes-256-gcm', payloadKey(), Buffer.from(payload.iv, 'base64'));
  decipher.setAuthTag(Buffer.from(payload.tag, 'base64'));
  const json = Buffer.concat([
    decipher.update(Buffer.from(payload.data, 'base64')),
    decipher.final(),
  ]).toString('utf8');
  return JSON.parse(json);
}

export async function enqueueEmail(client, { userId = null, recipient, template, payload }) {
  if (!await emailIsAllowed(client, userId, template)) return;
  await client.query(
    `INSERT INTO email_jobs (user_id, recipient, template, payload)
     VALUES ($1, $2, $3, $4::jsonb)`,
    [userId, recipient, template, JSON.stringify(sealEmailPayload(payload))],
  );
  if (emailConfigured) {
    void flushPendingEmails().catch((err) => console.error('Immediate email dispatch error:', err.message));
  }
}

const preferenceForTemplate = {
  order_received: 'orderUpdates',
  order_update: 'orderUpdates',
  payment_update: 'orderUpdates',
  enquiry_received: 'enquiryAcknowledgements',
  back_in_stock: 'backInStock',
  promotion: 'promotions',
  welcome: 'promotions',
};

export async function emailIsAllowed(client, userId, template) {
  const preference = preferenceForTemplate[template];
  if (!userId || !preference) return true;
  const result = await client.query(
    'SELECT email_preferences FROM users WHERE id = $1',
    [userId],
  );
  return result.rows[0]?.email_preferences?.[preference] !== false;
}

function emailContent(template, payload) {
  const safe = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char]);
  const amount = (paise) => `₹${(Number(paise ?? 0) / 100).toFixed(2)}`;
  const link = safe(payload.link);
  const title = template === 'verify' ? 'Verify your email address'
    : template === 'password_reset' ? 'Reset your password'
      : template === 'order_received' ? 'We received your order request'
        : template === 'order_update' ? 'Your order has been updated'
          : template === 'payment_update' ? 'Your payment status has been updated'
            : template === 'enquiry_received' ? 'We received your enquiry'
          : template === 'back_in_stock' ? 'A product option is available again'
            : template === 'admin_alert' ? String(payload.title ?? 'BR Millet Choice alert')
            : template === 'password_changed' ? 'Your password was changed'
            : template === 'welcome' ? 'Welcome to BR Millet Choice'
              : 'A BR Millet Choice update';
  const message = template === 'order_received'
    ? `Your order request ${safe(payload.orderNumber)} has been received. It is awaiting availability confirmation.`
    : template === 'order_update'
      ? `Order ${safe(payload.orderNumber)} status: ${safe(payload.status)}.`
      : template === 'payment_update'
        ? `Payment status for order ${safe(payload.orderNumber)}: ${safe(payload.status)}.`
      : template === 'enquiry_received'
        ? 'Thank you for contacting BR Millet Choice. Your enquiry has been received.'
      : template === 'back_in_stock'
        ? `${safe(payload.productName)} (${safe(payload.packSize)}) is available again.`
      : template === 'admin_alert'
        ? safe(payload.body)
      : template === 'password_changed'
        ? 'The password for your BR Millet Choice account has been changed. If you did not make this change, contact the business.'
      : template === 'welcome'
        ? `Hello ${safe(payload.name)}, welcome to BR Millet Choice.`
        : 'Use the secure link below to continue. If you did not request this, you can ignore this message.';
  const items = Array.isArray(payload.items) ? payload.items : [];
  const orderLines = items.map((item) => `${item.productName} · ${item.packSize} × ${item.quantity} — ${amount(item.lineTotalPaise)}`);
  const orderHtml = template === 'order_received' && items.length
    ? `<h3>Order summary</h3><ul>${items.map((item) => `<li>${safe(item.productName)} · ${safe(item.packSize)} × ${safe(item.quantity)} — ${amount(item.lineTotalPaise)}</li>`).join('')}</ul><p>Subtotal: <strong>${amount(payload.subtotalPaise)}</strong><br>Delivery: ${amount(payload.deliveryFeePaise)}<br>Total requested: <strong>${amount(payload.totalPaise)}</strong></p><p>Payment status: ${safe(payload.paymentStatus)}</p>`
    : '';
  const address = payload.address
    ? `${payload.address.recipient_name}, ${payload.address.phone}, ${payload.address.line1}${payload.address.line2 ? `, ${payload.address.line2}` : ''}, ${payload.address.city}, ${payload.address.state} ${payload.address.postal_code}`
    : '';
  const addressHtml = template === 'order_received' && address
    ? `<h3>Delivery address supplied</h3><p>${safe(address)}</p>`
    : '';
  const html = `<!doctype html><html lang="en"><body style="margin:0;padding:0;background-color:#f3f5ef;font-family:Arial,Helvetica,sans-serif;color:#243b2c"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f3f5ef"><tr><td align="center" style="padding:32px 16px"><table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background-color:#ffffff;border:1px solid #e1e7dc;border-radius:12px"><tr><td style="padding:22px 32px;border-bottom:1px solid #e8ede5"><p style="margin:0;color:#315c3c;font-size:20px;line-height:1.3;font-weight:bold">BR Millet Choice</p><p style="margin:5px 0 0;color:#718174;font-size:11px;line-height:1.4;letter-spacing:2px">PURE MILLETS · HEALTHY LIVING</p></td></tr><tr><td style="padding:28px 32px 32px"><h1 style="margin:0 0 16px;color:#213b2c;font-size:24px;line-height:1.3">${safe(title)}</h1><p style="margin:0 0 22px;color:#43594a;font-size:16px;line-height:1.65">${message}</p>${orderHtml}${addressHtml}${link ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0"><tr><td align="center" bgcolor="#315c3c" style="border-radius:7px"><a href="${link}" style="display:inline-block;padding:13px 22px;color:#ffffff;font-size:15px;line-height:1.3;font-weight:bold;text-decoration:none">Continue securely</a></td></tr></table>` : ''}<p style="margin:24px 0 0;padding-top:16px;border-top:1px solid #e8ede5;color:#718174;font-size:13px;line-height:1.6">This is a transactional message from BR Millet Choice.</p></td></tr></table><p style="margin:16px 0 0;color:#718174;font-size:12px;line-height:1.5">© BR Millet Choice</p></td></tr></table></body></html>`;
  const orderText = template === 'order_received' && items.length
    ? `\n\nOrder summary:\n${orderLines.join('\n')}\nSubtotal: ${amount(payload.subtotalPaise)}\nDelivery: ${amount(payload.deliveryFeePaise)}\nTotal requested: ${amount(payload.totalPaise)}\nPayment status: ${payload.paymentStatus}${address ? `\nDelivery address supplied: ${address}` : ''}`
    : '';
  return {
    subject: `${title} | BR Millet Choice`,
    html,
    text: `${title}\n\n${message}${orderText}${payload.link ? `\n\n${payload.link}` : ''}`,
  };
}

async function processOneEmail() {
  if (!transporter) return;
  const client = await pool.connect();
  let job;
  try {
    await client.query('BEGIN');
    const claimed = await client.query(
      `SELECT id, user_id, recipient, template, payload, attempts
       FROM email_jobs
       WHERE (status = 'queued' AND next_attempt_at <= NOW())
          OR (status = 'processing' AND updated_at < NOW() - INTERVAL '5 minutes')
       ORDER BY created_at
       LIMIT 1
       FOR UPDATE SKIP LOCKED`,
    );
    if (!claimed.rowCount) {
      await client.query('COMMIT');
      return;
    }
    job = claimed.rows[0];
    if (!await emailIsAllowed(client, job.user_id, job.template)) {
      await client.query(
        `UPDATE email_jobs SET status = 'suppressed', payload = '{}'::jsonb,
         last_error = 'Recipient email preference is disabled.', updated_at = NOW()
         WHERE id = $1`,
        [job.id],
      );
      await client.query('COMMIT');
      return;
    }
    await client.query(
      `UPDATE email_jobs SET status = 'processing', attempts = attempts + 1, updated_at = NOW() WHERE id = $1 RETURNING attempts`,
      [job.id],
    );
    job.attempts = claimed.rows[0].attempts + 1;
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  let sendResult;
  try {
    const content = emailContent(job.template, openEmailPayload(job.payload));
    sendResult = await transporter.sendMail({
      from: config.smtpFrom,
      to: job.recipient,
      subject: content.subject,
      text: content.text,
      html: content.html,
    });
  } catch (error) {
    const attempt = Number(job.attempts);
    const exhausted = attempt >= 5;
    const delaySeconds = Math.min(3600, 30 * (2 ** Math.min(attempt, 7)));
    await inTransaction(async (transaction) => {
      await transaction.query(
        `UPDATE email_jobs
         SET status = $2,
             next_attempt_at = NOW() + ($3 * INTERVAL '1 second'),
             last_error = $4,
             updated_at = NOW()
         WHERE id = $1`,
        [job.id, exhausted ? 'failed' : 'queued', delaySeconds, String(error.message).slice(0, 300)],
      );
      await transaction.query(
        `INSERT INTO email_delivery_attempts (email_job_id, attempt_number, status, error_message)
         VALUES ($1, $2, 'failed', $3)
         ON CONFLICT (email_job_id, attempt_number) DO NOTHING`,
        [job.id, attempt, String(error.message).slice(0, 300)],
      );
    });
    console.error(`Email job ${job.id} ${exhausted ? 'failed' : 'will retry'}: ${error.message}`);
    return false;
  }

  try {
    await inTransaction(async (transaction) => {
      await transaction.query(
        `UPDATE email_jobs
         SET status = 'sent', provider_reference = $2, payload = '{}'::jsonb,
             last_error = NULL, updated_at = NOW()
         WHERE id = $1`,
        [job.id, sendResult.messageId ?? null],
      );
      await transaction.query(
        `INSERT INTO email_delivery_attempts (email_job_id, attempt_number, status, provider_reference)
         VALUES ($1, $2, 'accepted', $3)
         ON CONFLICT (email_job_id, attempt_number) DO NOTHING`,
        [job.id, job.attempts, sendResult.messageId ?? null],
      );
    });
    return true;
  } catch (error) {
    console.error(`SMTP accepted email job ${job.id}, but its result could not be persisted: ${error.message}`);
    return true;
  }
}

export async function flushPendingEmails(max = 5) {
  if (!transporter) return;
  for (let i = 0; i < max; i++) {
    const processed = await processOneEmail();
    if (!processed) break;
  }
}

let workerBusy = false;
export function startEmailWorker() {
  if (!transporter) {
    console.warn('Transactional email is disabled: SMTP_HOST and SMTP_FROM are required. No messages will be reported as sent.');
    return () => {};
  }
  const timer = setInterval(async () => {
    if (workerBusy) return;
    workerBusy = true;
    try {
      await processOneEmail();
    } catch (error) {
      console.error('Email queue worker error:', error.message);
    } finally {
      workerBusy = false;
    }
  }, 3000);
  timer.unref();
  return () => clearInterval(timer);
}
