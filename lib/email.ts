import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.RESEND_FROM_EMAIL ?? 'notifications@triphoppa.com'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

// ─── Email Templates ──────────────────────────────────────────────────────────

function baseTemplate(content: string) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Triphoppa</title>
</head>
<body style="margin:0;padding:0;background:#f7f5ff;font-family:'DM Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f5ff;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid #e8d5e7;">
          
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#392b75,#96298d);padding:32px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="width:36px;height:36px;background:rgba(255,255,255,0.15);border-radius:10px;display:inline-flex;align-items:center;justify-content:center;margin-right:10px;vertical-align:middle;">
                      <span style="color:#f6ab2d;font-size:18px;font-weight:bold;">T</span>
                    </div>
                    <span style="color:white;font-size:20px;font-weight:bold;vertical-align:middle;">
                      Trip<span style="color:#f6ab2d;">hoppa</span>
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;border-top:1px solid #f7f5ff;text-align:center;">
              <p style="color:#9ca3af;font-size:12px;margin:0;">
                © 2026 Triphoppa · 
                <a href="${APP_URL}" style="color:#96298d;text-decoration:none;">Visit app</a> · 
                <a href="${APP_URL}/bookings" style="color:#96298d;text-decoration:none;">My Bookings</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `
}

// ─── Email Senders ────────────────────────────────────────────────────────────

export async function sendBookingConfirmationEmail({
  to,
  name,
  route,
  departureDate,
  kgBooked,
  totalPrice,
  bookingRef,
  freightMode,
  goodsType,
}: {
  to: string
  name: string
  route: string
  departureDate: string
  kgBooked: number
  totalPrice: number
  bookingRef: string
  freightMode: string
  goodsType: string
}) {
  const content = `
    <h1 style="color:#392b75;font-size:24px;margin:0 0 8px;">Booking Confirmed! 🎉</h1>
    <p style="color:#6b7280;font-size:15px;margin:0 0 32px;">Hi ${name}, your cargo space is reserved.</p>

    <!-- Booking card -->
    <div style="background:#f7f5ff;border-radius:16px;padding:24px;margin-bottom:24px;border:1px solid #e8d5e7;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding-bottom:16px;">
            <span style="background:#96298d;color:white;font-size:11px;font-weight:bold;padding:4px 10px;border-radius:20px;text-transform:uppercase;letter-spacing:0.5px;">
              Confirmed
            </span>
          </td>
        </tr>
        <tr>
          <td>
            <p style="color:#392b75;font-size:22px;font-weight:bold;margin:0 0 4px;">${route}</p>
            <p style="color:#9ca3af;font-size:13px;margin:0;">Booking ref: #${bookingRef}</p>
          </td>
        </tr>
      </table>
    </div>

    <!-- Details -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      ${[
        ['Departure date', departureDate],
        ['Cargo weight', `${kgBooked}kg`],
        ['Freight mode', freightMode],
        ['Goods type', goodsType],
        ['Total paid', `$${totalPrice.toFixed(2)}`],
      ].map(([label, value]) => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #f7f5ff;">
            <span style="color:#9ca3af;font-size:14px;">${label}</span>
          </td>
          <td style="padding:10px 0;border-bottom:1px solid #f7f5ff;text-align:right;">
            <span style="color:#392b75;font-size:14px;font-weight:600;">${value}</span>
          </td>
        </tr>
      `).join('')}
    </table>

    <a href="${APP_URL}/bookings" style="display:block;background:#96298d;color:white;text-align:center;padding:14px;border-radius:12px;text-decoration:none;font-weight:bold;font-size:15px;margin-bottom:16px;">
      View My Bookings →
    </a>

    <p style="color:#9ca3af;font-size:13px;text-align:center;margin:0;">
      Questions? Reply to this email or contact us at support@triphoppa.com
    </p>
  `

  return resend.emails.send({
    from: FROM,
    to,
    subject: `✅ Booking Confirmed — ${route}`,
    html: baseTemplate(content),
  })
}

export async function sendPaymentSuccessEmail({
  to,
  name,
  route,
  totalPrice,
  paymentMethod,
  bookingRef,
}: {
  to: string
  name: string
  route: string
  totalPrice: number
  paymentMethod: string
  bookingRef: string
}) {
  const content = `
    <h1 style="color:#392b75;font-size:24px;margin:0 0 8px;">Payment Successful! 💰</h1>
    <p style="color:#6b7280;font-size:15px;margin:0 0 32px;">Hi ${name}, we received your payment.</p>

    <div style="background:#f0fdf4;border-radius:16px;padding:24px;margin-bottom:24px;border:1px solid #bbf7d0;text-align:center;">
      <p style="color:#16a34a;font-size:36px;font-weight:bold;margin:0 0 4px;">$${totalPrice.toFixed(2)}</p>
      <p style="color:#16a34a;font-size:14px;margin:0;">Paid via ${paymentMethod === 'momo' ? 'MTN Mobile Money' : 'Card'}</p>
    </div>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      ${[
        ['Route', route],
        ['Booking ref', `#${bookingRef}`],
        ['Payment method', paymentMethod === 'momo' ? 'MTN MoMo' : 'Card Payment'],
        ['Status', 'Confirmed & Reserved'],
      ].map(([label, value]) => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #f7f5ff;">
            <span style="color:#9ca3af;font-size:14px;">${label}</span>
          </td>
          <td style="padding:10px 0;border-bottom:1px solid #f7f5ff;text-align:right;">
            <span style="color:#392b75;font-size:14px;font-weight:600;">${value}</span>
          </td>
        </tr>
      `).join('')}
    </table>

    <a href="${APP_URL}/bookings" style="display:block;background:#96298d;color:white;text-align:center;padding:14px;border-radius:12px;text-decoration:none;font-weight:bold;font-size:15px;">
      View My Bookings →
    </a>
  `

  return resend.emails.send({
    from: FROM,
    to,
    subject: `💰 Payment Confirmed — $${totalPrice.toFixed(2)}`,
    html: baseTemplate(content),
  })
}

export async function sendBookingSavedEmail({
  to,
  name,
  route,
  totalPrice,
  bookingRef,
  departureDate,
}: {
  to: string
  name: string
  route: string
  totalPrice: number
  bookingRef: string
  departureDate: string
}) {
  const content = `
    <h1 style="color:#392b75;font-size:24px;margin:0 0 8px;">Booking Saved 🕐</h1>
    <p style="color:#6b7280;font-size:15px;margin:0 0 24px;">Hi ${name}, your booking is saved but space is not yet reserved.</p>

    <div style="background:#fffbeb;border-radius:16px;padding:20px;margin-bottom:24px;border:1px solid #fde68a;">
      <p style="color:#92400e;font-size:14px;font-weight:600;margin:0 0 4px;">⚠️ Space not reserved yet</p>
      <p style="color:#92400e;font-size:13px;margin:0;">
        Your cargo space on <strong>${route}</strong> departing <strong>${departureDate}</strong> 
        is not secured until payment of <strong>$${totalPrice.toFixed(2)}</strong> is completed.
      </p>
    </div>

    <a href="${APP_URL}/bookings" style="display:block;background:#f6ab2d;color:#392b75;text-align:center;padding:14px;border-radius:12px;text-decoration:none;font-weight:bold;font-size:15px;margin-bottom:16px;">
      Complete Payment Now →
    </a>

    <p style="color:#9ca3af;font-size:13px;text-align:center;margin:0;">
      Booking ref: #${bookingRef}
    </p>
  `

  return resend.emails.send({
    from: FROM,
    to,
    subject: `🕐 Complete Your Booking — ${route}`,
    html: baseTemplate(content),
  })
}

export async function sendAdminNewBookingEmail({
  adminEmail,
  customerName,
  customerEmail,
  route,
  kgBooked,
  totalPrice,
  bookingRef,
}: {
  adminEmail: string
  customerName: string
  customerEmail: string
  route: string
  kgBooked: number
  totalPrice: number
  bookingRef: string
}) {
  const content = `
    <h1 style="color:#392b75;font-size:24px;margin:0 0 8px;">New Booking Received 📦</h1>
    <p style="color:#6b7280;font-size:15px;margin:0 0 24px;">A new booking has been created.</p>

    <div style="background:#f7f5ff;border-radius:16px;padding:24px;margin-bottom:24px;border:1px solid #e8d5e7;">
      <table width="100%" cellpadding="0" cellspacing="0">
        ${[
          ['Customer', customerName],
          ['Email', customerEmail],
          ['Route', route],
          ['Cargo', `${kgBooked}kg`],
          ['Total', `$${totalPrice.toFixed(2)}`],
          ['Booking ref', `#${bookingRef}`],
        ].map(([label, value]) => `
          <tr>
            <td style="padding:8px 0;border-bottom:1px solid #e8d5e7;">
              <span style="color:#9ca3af;font-size:14px;">${label}</span>
            </td>
            <td style="padding:8px 0;border-bottom:1px solid #e8d5e7;text-align:right;">
              <span style="color:#392b75;font-size:14px;font-weight:600;">${value}</span>
            </td>
          </tr>
        `).join('')}
      </table>
    </div>

    <a href="${APP_URL}/admin/bookings" style="display:block;background:#392b75;color:white;text-align:center;padding:14px;border-radius:12px;text-decoration:none;font-weight:bold;font-size:15px;">
      View in Admin Panel →
    </a>
  `

  return resend.emails.send({
    from: FROM,
    to: adminEmail,
    subject: `📦 New Booking — ${route} — $${totalPrice.toFixed(2)}`,
    html: baseTemplate(content),
  })
}