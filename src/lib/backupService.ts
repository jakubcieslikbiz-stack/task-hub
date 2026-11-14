import type { Task, MonthlyCosts, FixedBillItem, MonthlyBillsData } from '../types';
import { sendEmailWithAttachment, getStoredRecipientEmail } from './email';

export const STORAGE_KEY_LAST_BACKUP = 'taskhub_last_backup_email_month';

export interface BackupStats {
  totalTasks: number;
  activeTasks: number;
  completedTasks: number;
  notesCount: number;
  fixedBillsCount: number;
  fileSizeBytes: number;
  fileSizeFormatted: string;
}

export interface BackupDataPayload {
  tasks: Task[];
  notes: any[];
  costs: MonthlyCosts;
  fixedBills?: FixedBillItem[];
  monthlyBills?: MonthlyBillsData;
  portfolio?: any[];
}

/**
 * Return stored month in format 'YYYY-MM' when the backup was last emailed
 */
export function getLastBackupSentMonth(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEY_LAST_BACKUP);
}

/**
 * Save month in format 'YYYY-MM'
 */
export function setLastBackupSentMonth(ym: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_LAST_BACKUP, ym);
  }
}

/**
 * Format bytes to readable string (e.g. 14.5 KB)
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
}

/**
 * Unicode-safe conversion of string to Base64 in Browser & Node
 */
export function toBase64Unicode(str: string): string {
  if (typeof window !== 'undefined' && typeof window.btoa === 'function') {
    const utf8Bytes = new TextEncoder().encode(str);
    let binary = '';
    const len = utf8Bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(utf8Bytes[i]);
    }
    return window.btoa(binary);
  }
  return Buffer.from(str, 'utf8').toString('base64');
}

/**
 * Build clean JSON backup file payload and base64 string
 */
export function createBackupPayload(data: BackupDataPayload): {
  jsonString: string;
  base64: string;
  filename: string;
  stats: BackupStats;
} {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const filename = `taskhub-backup-${dateStr}.json`;

  const backupObject = {
    version: 1,
    source: 'TaskHub Cloud JC Studio',
    exportedAt: now.toISOString(),
    tasks: data.tasks || [],
    notes: data.notes || [],
    costs: data.costs || { zus: 1600, tax: 1500, other: 0 },
    fixedBills: data.fixedBills || [],
    monthlyBills: data.monthlyBills || {},
    portfolio: data.portfolio || [],
  };

  const jsonString = JSON.stringify(backupObject, null, 2);
  const base64 = toBase64Unicode(jsonString);

  const totalTasks = (data.tasks || []).length;
  const activeTasks = (data.tasks || []).filter(
    (t) => t.status === 'in_progress' || t.status === 'todo'
  ).length;
  const completedTasks = (data.tasks || []).filter(
    (t) => t.status === 'done' || t.status === 'paid'
  ).length;
  const notesCount = (data.notes || []).length;
  const fixedBillsCount = (data.fixedBills || []).length;

  const fileSizeBytes = new TextEncoder().encode(jsonString).length;

  return {
    jsonString,
    base64,
    filename,
    stats: {
      totalTasks,
      activeTasks,
      completedTasks,
      notesCount,
      fixedBillsCount,
      fileSizeBytes,
      fileSizeFormatted: formatBytes(fileSizeBytes),
    },
  };
}

/**
 * Build beautiful Dark Luxury Kindra email HTML and send with backup JSON attachment
 */
export async function sendBackupEmail({
  data,
  toEmail,
  isAutomated = false,
}: {
  data: BackupDataPayload;
  toEmail?: string;
  isAutomated?: boolean;
}): Promise<{ success: boolean; error?: string; filename?: string; stats?: BackupStats }> {
  const recipient = toEmail || getStoredRecipientEmail();
  const { base64, filename, stats } = createBackupPayload(data);

  const now = new Date();
  const formattedDate = now.toLocaleDateString('pl-PL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const formattedTime = now.toLocaleTimeString('pl-PL', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const subject = isAutomated
    ? `📦 [TaskHub] Miesięczna kopia zapasowa (${formattedDate} • Połowa miesiąca)`
    : `📦 [TaskHub] Kopia zapasowa bazy danych (${formattedDate})`;

  const badgeText = isAutomated ? 'Automatyczna kopia • Połowa miesiąca (15)' : 'Kopia na żądanie';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Kopia zapasowa TaskHub</title>
      </head>
      <body style="margin: 0; padding: 24px; background-color: #0b0806; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f5ede4;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #140f0c; border: 1px solid #2e231c; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 35px -5px rgba(0, 0, 0, 0.7);">
          <!-- Header -->
          <tr>
            <td style="padding: 28px 32px; background: linear-gradient(135deg, #24160c 0%, #140f0c 100%); border-bottom: 1px solid #2e231c;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td>
                    <span style="font-size: 11px; font-weight: 700; color: #d99b5a; text-transform: uppercase; letter-spacing: 1.5px; display: block; margin-bottom: 4px;">TaskHub • JC Studio</span>
                    <h1 style="margin: 0; font-size: 22px; font-weight: 600; color: #f5ede4;">📦 Kopia Zapasowa Bazy</h1>
                  </td>
                  <td align="right">
                    <span style="background-color: #2e1c10; color: #d99b5a; border: 1px solid #4a2e1c; padding: 6px 12px; border-radius: 9999px; font-size: 11px; font-weight: 600;">${badgeText}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 30px;">
              <p style="margin: 0 0 18px 0; color: #c7b8aa; font-size: 14px; line-height: 1.6;">
                Cześć Jakub! Poniżej przesyłam comiesięczną kopię zapasową Twoich danych z TaskHub. Prosty, lekki plik w formacie JSON został dołączony w załączniku do tej wiadomości.
              </p>

              <!-- Statistics Grid -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #1a130e; border: 1px solid #2e231c; border-radius: 14px; margin: 20px 0;">
                <tr>
                  <td style="padding: 16px 20px; border-bottom: 1px solid #2e231c; width: 50%;">
                    <span style="display: block; font-size: 10px; color: #8c7b6d; text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">Data utworzenia</span>
                    <span style="font-size: 14px; font-weight: 600; color: #f5ede4;">📅 ${formattedDate}, ${formattedTime}</span>
                  </td>
                  <td style="padding: 16px 20px; border-bottom: 1px solid #2e231c; width: 50%;">
                    <span style="display: block; font-size: 10px; color: #8c7b6d; text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">Rozmiar pliku</span>
                    <span style="font-size: 14px; font-weight: 700; color: #7ec29a; font-family: monospace;">🗂️ ${stats.fileSizeFormatted}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px 20px; width: 50%;">
                    <span style="display: block; font-size: 10px; color: #8c7b6d; text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">Zlecenia & Zadania</span>
                    <span style="font-size: 14px; font-weight: 600; color: #d99b5a;">💼 ${stats.totalTasks} (Aktywne: ${stats.activeTasks})</span>
                  </td>
                  <td style="padding: 16px 20px; width: 50%;">
                    <span style="display: block; font-size: 10px; color: #8c7b6d; text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">Notatki & Rachunki</span>
                    <span style="font-size: 14px; font-weight: 600; color: #f5ede4;">📝 ${stats.notesCount} notatek, ${stats.fixedBillsCount} opłat</span>
                  </td>
                </tr>
              </table>

              <!-- Attachment Box -->
              <div style="background-color: #211710; border-left: 4px solid #d99b5a; padding: 14px 18px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; color: #f5ede4; font-size: 13px; font-weight: 600;">
                  📎 Załączony plik: <code style="font-family: monospace; color: #d99b5a;">${filename}</code>
                </p>
                <p style="margin: 4px 0 0 0; color: #a8998b; font-size: 12px; line-height: 1.5;">
                  Plik zawiera kompletny stan aplikacji (zlecenia, notatki, koszty, opłaty stałe i portfolio).
                </p>
              </div>

              <!-- How to Restore -->
              <div style="background-color: #140f0c; border: 1px dashed #3d2f24; padding: 14px 18px; border-radius: 10px; margin: 20px 0;">
                <p style="margin: 0 0 6px 0; color: #d99b5a; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                  ℹ️ Jak przywrócić dane w razie awarii:
                </p>
                <ol style="margin: 0; padding-left: 18px; color: #a8998b; font-size: 12px; line-height: 1.6;">
                  <li>Pobierz załącznik <code style="color: #f5ede4;">${filename}</code> na swój komputer lub telefon.</li>
                  <li>Otwórz TaskHub i wejdź w zakładkę <strong>Ustawienia ⚙ -> Kopia Zapasowa & Pamięć</strong>.</li>
                  <li>Kliknij przycisk <strong>„Wgraj kopię z pliku”</strong> i wskaż pobrany plik JSON.</li>
                </ol>
              </div>

              <div style="margin-top: 28px; text-align: center; border-top: 1px solid #241c16; pt: 20px;">
                <p style="color: #7a6b5e; font-size: 11px; margin: 16px 0 0 0;">
                  Automatyczny system kopii zapasowej <strong>TaskHub Cloud</strong> • JC Studio
                </p>
              </div>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  const result = await sendEmailWithAttachment({
    to: recipient,
    subject,
    html,
    attachments: [
      {
        filename,
        content: base64,
      },
    ],
  });

  if (!result.success) {
    return {
      success: false,
      error: result.error || 'Nie udało się wysłać wiadomości z kopią zapasową.',
      filename,
      stats,
    };
  }

  return {
    success: true,
    filename,
    stats,
  };
}

/**
 * Check if today is the middle of the month (day >= 15) and if backup was not sent yet this month.
 * If conditions are met, sends backup automatically and records the month to prevent re-sending.
 */
export async function checkAndAutoSendMonthlyBackup(
  data: BackupDataPayload
): Promise<{ triggered: boolean; message?: string }> {
  if (typeof window === 'undefined') return { triggered: false };

  const now = new Date();
  const curYear = now.getFullYear();
  const curMonth = now.getMonth() + 1; // 1 - 12
  const curDate = now.getDate();
  const currentYm = `${curYear}-${String(curMonth).padStart(2, '0')}`;

  // Trigger only on or after the 15th of the month
  if (curDate < 15) {
    return { triggered: false };
  }

  const lastSentMonth = getLastBackupSentMonth();
  if (lastSentMonth === currentYm) {
    // Already sent for this month
    return { triggered: false };
  }

  // Need at least some data loaded before creating a backup
  if (!data.tasks || data.tasks.length === 0) {
    return { triggered: false };
  }

  try {
    const res = await sendBackupEmail({
      data,
      isAutomated: true,
    });

    if (res.success) {
      setLastBackupSentMonth(currentYm);
      const polishMonths = [
        'stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca',
        'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia'
      ];
      return {
        triggered: true,
        message: `Wysłano miesięczną kopię zapasową bazy za ${polishMonths[curMonth - 1]} na Twój e-mail! 📦`,
      };
    }
  } catch (err) {
    console.warn('Błąd automatycznej wysyłki kopii zapasowej:', err);
  }

  return { triggered: false };
}
