/**
 * Moduł bezpieczeństwa JC Studio TaskHub
 *
 * Zabezpieczenie dostępu hasłem z użyciem kryptograficznego haszowania
 * PBKDF2 (Password-Based Key Derivation Function 2) + HMAC-SHA-256 (100 000 iteracji)
 * z unikalną losową solą (salt).
 *
 * Gwarancja bezpieczeństwa:
 * - Hasło NIGDY nie jest zapisywane w postaci jawnej (ani w kodzie, ani w localStorage, ani w bazie).
 * - Zapisywany jest wyłącznie jednokierunkowy skrót kryptograficzny (hash) oraz sól (salt).
 * - Zabezpieczenie przed atakami słownikowymi i rainbow tables.
 */

export interface AuthCredentials {
  loginHash?: string;
  hash: string;
  salt: string;
  updatedAt: string;
}

const STORAGE_KEY_CREDS = 'taskhub_auth_credentials';
const STORAGE_KEY_SESSION = 'taskhub_auth_session';
const STORAGE_KEY_TOKEN = 'taskhub_auth_token';
const STORAGE_KEY_REMEMBER = 'taskhub_remember_until';

/**
 * Zwraca aktywny token sesyjny JWT (jeśli istnieje)
 */
export function getAuthToken(): string | null {
  try {
    return sessionStorage.getItem(STORAGE_KEY_TOKEN) || localStorage.getItem(STORAGE_KEY_TOKEN);
  } catch {
    return null;
  }
}

/**
 * Zapisuje token sesyjny JWT
 */
export function setAuthToken(token: string): void {
  try {
    sessionStorage.setItem(STORAGE_KEY_TOKEN, token);
  } catch {}
}

/**
 * Logowanie przez backendową funkcję Vercel Serverless (/api/auth)
 */
export async function backendLogin(
  login: string,
  password: string
): Promise<{ success: boolean; token: string }> {
  try {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'login',
        login: login.trim(),
        password,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Nieprawidłowy login lub hasło.');
    }

    if (data.token) {
      setAuthToken(data.token);
    }
    setSessionAuthenticated();
    return { success: true, token: data.token };
  } catch (err: any) {
    throw err;
  }
}

/**
 * Zmiana hasła przez backendową funkcję Vercel Serverless (/api/auth)
 */
export async function backendChangePassword(
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const token = getAuthToken();
  const res = await fetch('/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'change-password',
      token,
      currentPassword,
      newPassword,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Błąd podczas zmiany hasła na serwerze.');
  }
}

/**
 * Domyślny skrót SHA-256 dla loginu głównego studia (nie ujawniamy loginu jawnym tekstem w kodzie)
 */
export const DEFAULT_LOGIN_HASH =
  '8d296bbb2d705962d78a4f50186f5fcf80e4a3cfac336ebf2ed8e3db2360ca2e';

/**
 * Oblicza jednokierunkowy skrót SHA-256 z tekstu (np. z loginu)
 */
export async function sha256Hex(text: string): Promise<string> {
  const cryptoObj = window.crypto || (globalThis as any).crypto;
  if (!cryptoObj || !cryptoObj.subtle) {
    throw new Error('Środowisko nie obsługuje Web Crypto API.');
  }
  const enc = new TextEncoder();
  const data = enc.encode(text.trim());
  const hashBuffer = await cryptoObj.subtle.digest('SHA-256', data);
  return bufferToHex(hashBuffer);
}

/**
 * Weryfikuje wprowadzony login z kryptograficznym haszem
 */
export async function verifyLogin(
  inputLogin: string,
  expectedHash: string = DEFAULT_LOGIN_HASH
): Promise<boolean> {
  if (!inputLogin || !inputLogin.trim()) return false;
  try {
    const hash = await sha256Hex(inputLogin.trim());
    return hash.toLowerCase() === expectedHash.toLowerCase();
  } catch {
    return false;
  }
}

/**
 * Pobiera zapamiętany login na zaufanym urządzeniu
 */
export function getSavedLogin(): string {
  return '';
}

export function saveSavedLogin(_login: string): void {
  // Nie zapisujemy loginu na urządzeniu
}

/**
 * Konwertuje ciąg bajtów na ciąg szesnastkowy (hex)
 */
function bufferToHex(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Konwertuje ciąg szesnastkowy (hex) na Uint8Array
 */
function hexToBytes(hex: string): Uint8Array {
  const cleanHex = hex.trim();
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Generuje kryptograficzny skrót (hash) dla hasła z solą przy użyciu PBKDF2 + SHA-256 (100k iteracji)
 */
export async function hashPassword(
  password: string,
  existingSaltHex?: string
): Promise<{ hash: string; salt: string }> {
  const cryptoObj = window.crypto || (globalThis as any).crypto;
  if (!cryptoObj || !cryptoObj.subtle) {
    throw new Error('Środowisko nie obsługuje Web Crypto API.');
  }

  const enc = new TextEncoder();
  const salt = existingSaltHex
    ? hexToBytes(existingSaltHex)
    : cryptoObj.getRandomValues(new Uint8Array(16));

  const keyMaterial = await cryptoObj.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  const derivedKey = await cryptoObj.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as any,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'HMAC', hash: 'SHA-256', length: 256 },
    true,
    ['sign']
  );

  const exported = await cryptoObj.subtle.exportKey('raw', derivedKey);
  const hashHex = bufferToHex(exported);
  const saltHex = bufferToHex(salt);

  return { hash: hashHex, salt: saltHex };
}

/**
 * Weryfikuje wprowadzone hasło z zapisanym haszem i solą
 */
export async function verifyPassword(
  inputPassword: string,
  credentials: AuthCredentials
): Promise<boolean> {
  if (!inputPassword || !credentials || !credentials.hash || !credentials.salt) {
    return false;
  }
  try {
    const { hash } = await hashPassword(inputPassword, credentials.salt);
    return hash.toLowerCase() === credentials.hash.toLowerCase();
  } catch (err) {
    console.error('Błąd weryfikacji hasła:', err);
    return false;
  }
}

/**
 * Pobiera zapisane poświadczenia (hash i sól) z localStorage
 */
export function getStoredCredentials(): AuthCredentials | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CREDS);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.hash === 'string' && typeof parsed.salt === 'string') {
      return parsed as AuthCredentials;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Zapisuje poświadczenia (hash i sól) w localStorage
 */
export function saveStoredCredentials(creds: AuthCredentials): void {
  try {
    localStorage.setItem(STORAGE_KEY_CREDS, JSON.stringify(creds));
  } catch (err) {
    console.warn('Nie udało się zapisać poświadczeń w localStorage:', err);
  }
}

/**
 * Sprawdza czy użytkownik jest obecnie uwierzytelniony w aktywnej sesji
 */
export function isSessionAuthenticated(): boolean {
  try {
    return sessionStorage.getItem(STORAGE_KEY_SESSION) === 'true';
  } catch {
    return false;
  }
}

/**
 * Ustawia status zalogowania dla bieżącej sesji
 */
export function setSessionAuthenticated(): void {
  try {
    sessionStorage.setItem(STORAGE_KEY_SESSION, 'true');
    localStorage.removeItem(STORAGE_KEY_REMEMBER);
  } catch (err) {
    console.warn('Błąd zapisu sesji:', err);
  }
}

/**
 * Wylogowuje / blokuje panel
 */
export function clearSessionAuthentication(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY_SESSION);
    sessionStorage.removeItem(STORAGE_KEY_TOKEN);
    localStorage.removeItem(STORAGE_KEY_TOKEN);
    localStorage.removeItem(STORAGE_KEY_REMEMBER);
  } catch (err) {
    console.warn('Błąd czyszczenia sesji:', err);
  }
}
