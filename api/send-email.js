// Vercel Serverless Function to dispatch emails via Resend

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { to, subject, html, apiKey: clientApiKey, scheduled_at } = req.body || {};

    const apiKey =
      process.env.RESEND_API_KEY ||
      clientApiKey ||
      (typeof process.env.VITE_RESEND_API_KEY === 'string' ? process.env.VITE_RESEND_API_KEY : '');

    if (!apiKey) {
      return res.status(400).json({ error: 'Brak klucza Resend API' });
    }

    if (!to || !subject || !html) {
      return res.status(400).json({ error: 'Brak wymaganych pól (to, subject, html)' });
    }

    const payload = {
      from: 'TaskHub <onboarding@resend.dev>',
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    };

    if (scheduled_at) {
      payload.scheduled_at = scheduled_at;
    }

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await resendResponse.json();

    if (!resendResponse.ok) {
      return res.status(resendResponse.status).json(data);
    }

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error?.message || 'Błąd serwera pocztowego' });
  }
}
