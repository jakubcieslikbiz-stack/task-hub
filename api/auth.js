// Vercel Serverless Function: Backendowa autoryzacja JC Studio TaskHub
import crypto from 'crypto';

// Domyślny skrót SHA-256 dla loginu głównego: 92qVahT6tqysoDYWwPna
const REQUIRED_LOGIN_HASH = '8d296bbb2d705962d78a4f50186f5fcf80e4a3cfac336ebf2ed8e3db2360ca2e';

// Klucz serwerowy do podpisywania tokenów sesyjnych JWT
const JWT_SECRET =
  process.env.AUTH_SECRET ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  'jc-studio-taskhub-backend-secret-hmac-key-2026';

// Prosta pamięć podręczna do ochrony przed atakami brute-force (IP rate-limiting)
const failedAttempts = new Map();

function isRateLimited(ip) {
  if (!ip) return false;
  const record = failedAttempts.get(ip);
  if (!record) return false;

  const now = Date.now();
  if (now > record.resetAt) {
    failedAttempts.delete(ip);
    return false;
  }

  return record.count >= 5;
}

function recordFailedAttempt(ip) {
  if (!ip) return;
  const now = Date.now();
  const record = failedAttempts.get(ip) || { count: 0, resetAt: now + 15 * 60 * 1000 };
  record.count += 1;
  record.resetAt = now + 15 * 60 * 1000; // 15 minut blokady po serii błędów
  failedAttempts.set(ip, record);
}

function clearFailedAttempts(ip) {
  if (ip) failedAttempts.delete(ip);
}

// Pomocnik do podpisu JWT
function signJwt(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(header + '.' + data)
    .digest('base64url');
  return `${header}.${data}.${signature}`;
}

// Pomocnik do weryfikacji JWT
function verifyJwt(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [h, d, s] = parts;

  const expectedSig = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(h + '.' + d)
    .digest('base64url');

  if (s !== expectedSig) return null;

  try {
    const payload = JSON.parse(Buffer.from(d, 'base64url').toString('utf8'));
    if (payload.exp && Date.now() / 1000 > payload.exp) {
      return null; // Token wygasł
    }
    return payload;
  } catch {
    return null;
  }
}

// Pobiera poświadczenia z Supabase
const FALLBACK_SUPABASE_URL = 'https://uaqmfuvqqmlkhjyufvyq.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhcW1mdXZxcW1sa2hqeXVmdnlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM5OTUzNTcsImV4cCI6MjEwOTU3MTM1N30.3DnRobGK1NRZE7MCOnONRlnL-Zp0qlCgMe_ZcEV-WqA';

async function getStoredAuthCredentials() {
  const supabaseUrl =
    process.env.VITE_SUPABASE_URL ||
    process.env.VITE_SUPABASE_PROJECT_URL ||
    process.env.SUPABASE_URL ||
    FALLBACK_SUPABASE_URL;

  const supabaseKey =
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    FALLBACK_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Brak konfiguracji bazy Supabase na serwerze.');
  }

  const res = await fetch(`${supabaseUrl}/rest/v1/taskhub_state?key=eq.auth&select=data`, {
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Błąd odpytania bazy: ${res.status}`);
  }

  const rows = await res.json();
  if (Array.isArray(rows) && rows.length > 0 && rows[0].data) {
    return rows[0].data;
  }
  return null;
}

// Zapisuje nowe poświadczenia w Supabase
async function saveAuthCredentialsToSupabase(newCreds) {
  const supabaseUrl =
    process.env.VITE_SUPABASE_URL ||
    process.env.VITE_SUPABASE_PROJECT_URL ||
    process.env.SUPABASE_URL ||
    FALLBACK_SUPABASE_URL;

  const supabaseKey =
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    FALLBACK_SUPABASE_ANON_KEY;

  const res = await fetch(`${supabaseUrl}/rest/v1/taskhub_state`, {
    method: 'POST',
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates',
    },
    body: JSON.stringify({
      key: 'auth',
      data: newCreds,
      updated_at: new Date().toISOString(),
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Błąd zapisu w bazie: ${txt}`);
  }
}

export default async function handler(req, res) {
  // Nagłówki CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Content-Type, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const clientIp =
    req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown-client';

  try {
    const { action, login, password, currentPassword, newPassword, token } = req.body || {};

    // 1. Sprawdzenie statusu konfiguracji hasła
    if (action === 'status') {
      const creds = await getStoredAuthCredentials();
      return res.status(200).json({ isConfigured: Boolean(creds?.hash && creds?.salt) });
    }

    // 2. Weryfikacja aktywnego tokena sesji
    if (action === 'verify-token') {
      const payload = verifyJwt(token);
      if (!payload) {
        return res.status(401).json({ valid: false, error: 'Sesja wygasła lub jest nieprawidłowa' });
      }
      return res.status(200).json({ valid: true, user: payload.user });
    }

    // 3. Logowanie na backendzie
    if (action === 'login') {
      // Sprawdź ochronę przed brute-force
      if (isRateLimited(clientIp)) {
        return res.status(429).json({
          error: 'Zbyt wiele nieudanych prób logowania. Odczekaj 15 minut.',
        });
      }

      if (!login || !password) {
        return res.status(400).json({ error: 'Podaj login oraz hasło' });
      }

      // Weryfikacja loginu po stronie backendu (SHA-256)
      const inputLoginHash = crypto.createHash('sha256').update(login.trim()).digest('hex');
      const creds = await getStoredAuthCredentials();

      const expectedLoginHash = creds?.loginHash || REQUIRED_LOGIN_HASH;
      if (inputLoginHash.toLowerCase() !== expectedLoginHash.toLowerCase()) {
        recordFailedAttempt(clientIp);
        return res.status(401).json({ error: 'Nieprawidłowy login lub hasło' });
      }

      if (!creds || !creds.hash || !creds.salt) {
        return res.status(400).json({ error: 'Baza nie zawiera jeszcze skonfigurowanego hasła' });
      }

      // Weryfikacja hasła po stronie backendu (PBKDF2 SHA-256 100k iteracji)
      const computedHash = crypto
        .pbkdf2Sync(password, Buffer.from(creds.salt, 'hex'), 100000, 32, 'sha256')
        .toString('hex');

      // Bezpieczne porównanie w stałym czasie (ochrona przed timing attacks)
      const hashA = Buffer.from(computedHash, 'hex');
      const hashB = Buffer.from(creds.hash, 'hex');

      if (hashA.length !== hashB.length || !crypto.timingSafeEqual(hashA, hashB)) {
        recordFailedAttempt(clientIp);
        return res.status(401).json({ error: 'Nieprawidłowy login lub hasło' });
      }

      // Sukces logowania na backendzie! Wyczyść licznik błędów
      clearFailedAttempts(clientIp);

      // Jeśli w bazie brakowało jeszcze hasza loginu, zaktualizuj go w locie
      if (!creds.loginHash) {
        creds.loginHash = expectedLoginHash;
        await saveAuthCredentialsToSupabase(creds).catch(() => {});
      }

      // Wystaw podpisany token sesyjny ważny 24 godziny
      const exp = Math.floor(Date.now() / 1000) + 24 * 60 * 60;
      const sessionToken = signJwt({
        sub: 'jc-studio-master',
        user: 'master',
        exp,
      });

      return res.status(200).json({
        success: true,
        token: sessionToken,
        expiresAt: exp * 1000,
      });
    }

    // 4. Zmiana hasła na backendzie
    if (action === 'change-password') {
      const payload = verifyJwt(token);
      if (!payload) {
        return res.status(401).json({ error: 'Brak uprawnień. Zaloguj się ponownie.' });
      }

      if (!currentPassword || !newPassword || newPassword.length < 4) {
        return res.status(400).json({ error: 'Nowe hasło musi mieć co najmniej 4 znaki.' });
      }

      const creds = await getStoredAuthCredentials();
      if (!creds || !creds.hash || !creds.salt) {
        return res.status(400).json({ error: 'Brak skonfigurowanego hasła w bazie' });
      }

      const currentHash = crypto
        .pbkdf2Sync(currentPassword, Buffer.from(creds.salt, 'hex'), 100000, 32, 'sha256')
        .toString('hex');

      if (currentHash.toLowerCase() !== creds.hash.toLowerCase()) {
        return res.status(401).json({ error: 'Aktualne hasło jest nieprawidłowe' });
      }

      // Wygeneruj nową unikalną 16-bajtową sól i nowy skrót
      const newSalt = crypto.randomBytes(16).toString('hex');
      const newHash = crypto
        .pbkdf2Sync(newPassword, Buffer.from(newSalt, 'hex'), 100000, 32, 'sha256')
        .toString('hex');

      const updatedCreds = {
        loginHash: creds.loginHash || REQUIRED_LOGIN_HASH,
        hash: newHash,
        salt: newSalt,
        updatedAt: new Date().toISOString(),
      };

      await saveAuthCredentialsToSupabase(updatedCreds);

      return res.status(200).json({ success: true });
    }

    return res.status(400).json({ error: 'Nieobsługiwana akcja' });
  } catch (err) {
    console.error('Backend Auth Error:', err);
    return res.status(500).json({ error: err?.message || 'Błąd serwera autoryzacji' });
  }
}
