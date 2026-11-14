// Vercel Serverless Function / Cron Job to create monthly mid-month backup and email it
import { createClient } from '@supabase/supabase-js';

const DEFAULT_RECIPIENT_EMAIL = 'jakub.cieslik.biz@gmail.com';
const DEFAULT_KEY_B64 = 'cmVfZWkzVFpXTFdfR01Cd1VqTlZWUXRWWUw1b2Q0Z3E3dFpE';
const DEFAULT_RESEND_KEY = Buffer.from(DEFAULT_KEY_B64, 'base64').toString('utf8');

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
    return res.status(200).end();
  }

  try {
    const supabaseUrl =
      process.env.VITE_SUPABASE_SUPABASE_URL ||
      process.env.VITE_SUPABASE_URL ||
      process.env.SUPABASE_URL ||
      process.env.VITE_SUPABASE_PROJECT_URL ||
      '';

    const supabaseAnonKey =
      process.env.VITE_SUPABASE_SUPABASE_ANON_KEY ||
      process.env.VITE_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      process.env.VITE_SUPABASE_KEY ||
      '';

    let tasks = [];
    let notes = [];
    let costs = { zus: 1600, tax: 1500, other: 0 };
    let fixedBills = [];
    let monthlyBills = {};
    let portfolio = [];

    // Try fetching live state from Supabase
    if (supabaseUrl && supabaseAnonKey) {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const { data, error } = await supabase.from('taskhub_state').select('*');

      if (!error && Array.isArray(data)) {
        for (const item of data) {
          if (item.key === 'tasks' && Array.isArray(item.data)) tasks = item.data;
          if (item.key === 'notes' && Array.isArray(item.data)) notes = item.data;
          if (item.key === 'costs' && item.data) costs = item.data;
          if (item.key === 'fixed_bills' && Array.isArray(item.data)) fixedBills = item.data;
          if (item.key === 'monthly_bills' && item.data) monthlyBills = item.data;
          if (item.key === 'portfolio' && Array.isArray(item.data)) portfolio = item.data;
        }
      }
    }

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const filename = `taskhub-backup-${dateStr}.json`;

    const backupObject = {
      version: 1,
      source: 'TaskHub Cloud Cron Backup',
      exportedAt: now.toISOString(),
      tasks,
      notes,
      costs,
      fixedBills,
      monthlyBills,
      portfolio,
    };

    const jsonString = JSON.stringify(backupObject, null, 2);
    const base64Content = Buffer.from(jsonString, 'utf8').toString('base64');
    const fileSizeBytes = Buffer.byteLength(jsonString, 'utf8');
    const fileSizeFormatted = `${(fileSizeBytes / 1024).toFixed(1)} KB`;

    const resendApiKey =
      process.env.RESEND_API_KEY ||
      process.env.VITE_RESEND_API_KEY ||
      DEFAULT_RESEND_KEY;

    const recipient =
      process.env.BACKUP_RECIPIENT_EMAIL ||
      process.env.RESEND_RECIPIENT_EMAIL ||
      DEFAULT_RECIPIENT_EMAIL;

    const formattedDate = now.toLocaleDateString('pl-PL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const html = `
      <div style="margin: 0; padding: 24px; background-color: #0b0806; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #f5ede4;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #140f0c; border: 1px solid #2e231c; border-radius: 20px; overflow: hidden; padding: 30px;">
          <h2 style="color: #d99b5a; margin-top: 0;">📦 Miesięczna Kopia Zapasowa TaskHub (Połowa Miesiąca)</h2>
          <p style="color: #c7b8aa; font-size: 14px; line-height: 1.6;">
            Cześć Jakub! Poniżej comiesięczna, lekka kopia zapasowa Twojej bazy TaskHub wygenerowana w połowie miesiąca (15-tego).
          </p>
          <ul style="color: #f5ede4; font-size: 13px; line-height: 1.8;">
            <li>Data wygenerowania: <strong>${formattedDate}</strong></li>
            <li>Rozmiar pliku JSON: <strong>${fileSizeFormatted}</strong></li>
            <li>Liczba zleceń: <strong>${tasks.length}</strong></li>
            <li>Liczba notatek: <strong>${notes.length}</strong></li>
            <li>Opłaty stałe: <strong>${fixedBills.length}</strong></li>
          </ul>
          <p style="color: #7a6b5e; font-size: 12px; margin-top: 24px;">
            Plik JSON znajduje się w załączniku. Możesz go zaimportować w aplikacji w Ustawienia -> Kopia Zapasowa.
          </p>
        </div>
      </div>
    `;

    const resendResp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'TaskHub <onboarding@resend.dev>',
        to: [recipient],
        subject: `📦 [TaskHub] Miesięczna kopia zapasowa (${formattedDate} • Połowa miesiąca)`,
        html,
        attachments: [
          {
            filename,
            content: base64Content,
          },
        ],
      }),
    });

    const data = await resendResp.json();
    if (!resendResp.ok) {
      return res.status(resendResp.status).json({ success: false, error: data });
    }

    return res.status(200).json({
      success: true,
      emailId: data.id,
      recipient,
      filename,
      size: fileSizeFormatted,
      tasksCount: tasks.length,
    });
  } catch (error) {
    return res.status(500).json({ error: error?.message || 'Błąd generowania kopii' });
  }
}
