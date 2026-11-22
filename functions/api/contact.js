// Cloudflare Pages Function: POST /api/contact
// Sends estimate requests by email through Resend (https://resend.com).
// Set these in Cloudflare Pages > Settings > Variables and Secrets:
//   RESEND_API_KEY  (secret)        - your Resend API key
//   CONTACT_TO      (optional)      - where leads go (default info@sg-homeimprovement.com)
//   CONTACT_FROM    (optional)      - verified sender, e.g. "Website <leads@sg-homeimprovement.com>"

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const esc = s => String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export async function onRequestPost({ request, env }) {
  let data;
  try { data = await request.json(); } catch { return json({ ok: false, message: 'Invalid request.' }, 400); }

  if (data.company) return json({ ok: true, message: 'Thank you!' }); // honeypot: bots fill this
  const name = (data.name || '').trim(), phone = (data.phone || '').trim(), email = (data.email || '').trim();
  const details = (data.details || '').trim(), type = (data.projectType || '').trim();
  if (!name || !phone || !email || !details) return json({ ok: false, message: 'Please fill in all required fields.' }, 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ ok: false, message: 'Please enter a valid email address.' }, 400);
  if (details.length > 5000) return json({ ok: false, message: 'Message is too long.' }, 400);

  if (!env.RESEND_API_KEY) return json({ ok: false, message: 'Email is not configured yet.' }, 503);

  const html = `<h2>New estimate request</h2>
    <p><b>Name:</b> ${esc(name)}<br><b>Phone:</b> ${esc(phone)}<br><b>Email:</b> ${esc(email)}<br><b>Project type:</b> ${esc(type || 'Not specified')}</p>
    <p><b>Details:</b><br>${esc(details).replace(/\n/g, '<br>')}</p>`;

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: env.CONTACT_FROM || 'Schwartz Group Website <onboarding@resend.dev>',
      to: [env.CONTACT_TO || 'info@sg-homeimprovement.com'],
      reply_to: email,
      subject: `Estimate request: ${type || 'General'} — ${name}`,
      html,
    }),
  });
  if (!r.ok) return json({ ok: false, message: 'Could not send right now.' }, 502);
  return json({ ok: true, message: `Thank you, ${name.split(' ')[0]}! We received your request and will get back to you shortly.` });
}
