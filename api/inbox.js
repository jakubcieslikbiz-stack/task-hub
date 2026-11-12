// Vercel Serverless Function to manage free inbound test inboxes via Webhook.site
// 100% free, no credit card or account required.

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { action, token } = req.method === 'POST' ? req.body || {} : req.query || {};

  try {
    // 1. Create a fresh free inbound email token
    if (action === 'create') {
      const resp = await fetch('https://webhook.site/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!resp.ok) {
        throw new Error(`Błąd tworzenia skrzynki (${resp.status})`);
      }
      const data = await resp.json();
      const uuid = data.uuid;
      return res.status(200).json({
        success: true,
        token: uuid,
        email: `${uuid}@email.webhook.site`,
        expiresAt: data.expires_at,
      });
    }

    // 2. Fetch messages for a specific token
    if (action === 'get') {
      if (!token || typeof token !== 'string') {
        return res.status(400).json({ error: 'Brak parametru token' });
      }

      const cleanToken = token.trim();
      const resp = await fetch(`https://webhook.site/token/${cleanToken}/requests?sorting=newest`, {
        headers: { 'Accept': 'application/json' },
      });

      if (!resp.ok) {
        return res.status(resp.status).json({ error: `Błąd odpytywania skrzynki (${resp.status})` });
      }

      const result = await resp.json();
      const rawRequests = Array.isArray(result?.data) ? result.data : [];

      const messages = rawRequests.map((reqItem) => {
        let parsedBody = reqItem.content || '';
        let subject = 'Wiadomość testowa';
        let sender = 'Nieznany nadawca';

        // Check if headers contain email metadata
        const h = reqItem.headers || {};
        if (h.subject) {
          subject = Array.isArray(h.subject) ? h.subject[0] : h.subject;
        }
        if (h.from) {
          sender = Array.isArray(h.from) ? h.from[0] : h.from;
        }

        // If JSON payload (e.g. simulated or forwarded)
        if (typeof parsedBody === 'string' && parsedBody.trim().startsWith('{')) {
          try {
            const jsonBody = JSON.parse(parsedBody);
            if (jsonBody.subject) subject = jsonBody.subject;
            if (jsonBody.from || jsonBody.sender) sender = jsonBody.from || jsonBody.sender;
            if (jsonBody.content || jsonBody.body || jsonBody.text) {
              parsedBody = jsonBody.content || jsonBody.body || jsonBody.text;
            }
          } catch {
            // Keep original string
          }
        }

        return {
          id: reqItem.uuid || Math.random().toString(),
          createdAt: reqItem.created_at,
          sender,
          subject,
          body: typeof parsedBody === 'string' ? parsedBody : JSON.stringify(parsedBody),
          rawType: reqItem.type || 'email',
        };
      });

      return res.status(200).json({
        success: true,
        total: messages.length,
        messages,
      });
    }

    // 3. Clear messages in the token
    if (action === 'clear') {
      if (!token) return res.status(400).json({ error: 'Brak parametru token' });
      await fetch(`https://webhook.site/token/${token.trim()}/requests`, { method: 'DELETE' });
      return res.status(200).json({ success: true });
    }

    // 4. Simulate sending an email to this token
    if (action === 'simulate') {
      const targetToken = token || (req.body && req.body.token);
      if (!targetToken) return res.status(400).json({ error: 'Brak parametru token' });

      const sampleEmail = req.body?.sample || {
        from: 'Marek Wiśniewski <kontakt@studio-arch.pl>',
        subject: 'Zlecenie: Wizualizacja wnętrz apartamentu w Warszawie',
        content: `Cześć Jakub,\n\nPrzesyłam rzuty i wytyczne do nowego zlecenia. Chodzi o wykonanie 4 fotorealistycznych ujęć apartamentu (salon z aneksem, sypialnia, łazienka i hol) w Warszawie na Mokotowie.\n\nTermin: potrzebujemy gotowych wizualizacji do 28 listopada 2026.\nBudżet na to zlecenie: 4200 zł netto.\n\nW załącznikach na dysku są pliki DWG i model 3D.\n\nPozdrawiam serdecznie,\nMarek Wiśniewski\nStudio Architektury`,
      };

      const resp = await fetch(`https://webhook.site/${targetToken.trim()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sampleEmail),
      });

      return res.status(200).json({ success: true, simulated: sampleEmail });
    }

    return res.status(400).json({ error: 'Nieznana akcja (dozwolone: create, get, clear, simulate)' });
  } catch (err) {
    return res.status(500).json({ error: err?.message || 'Błąd serwera skrzynki' });
  }
}
