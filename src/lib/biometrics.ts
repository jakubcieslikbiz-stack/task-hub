/**
 * Moduł biometrii (Face ID / Touch ID / Windows Hello) dla JC Studio TaskHub
 * Wykorzystuje natywne WebAuthn API przeglądarki i platform authenticator
 */

const STORAGE_KEY_BIO_CRED = 'taskhub_biometric_cred_id';

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Sprawdza, czy urządzenie obsługuje biometrię (Face ID, Touch ID, Windows Hello)
 */
export async function isBiometricsAvailable(): Promise<boolean> {
  if (
    typeof window === 'undefined' ||
    !window.PublicKeyCredential ||
    !navigator.credentials
  ) {
    return false;
  }

  try {
    if (PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) {
      const isAvailable =
        await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      return isAvailable;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Sprawdza, czy na tym urządzeniu zarejestrowano już klucz biometryczny
 */
export function hasBiometricCredential(): boolean {
  try {
    return Boolean(localStorage.getItem(STORAGE_KEY_BIO_CRED));
  } catch {
    return false;
  }
}

/**
 * Rejestruje klucz biometryczny (wywołuje natywny skan Face ID / Touch ID)
 */
export async function registerBiometricCredential(username: string = 'JC Studio Master'): Promise<boolean> {
  if (!navigator.credentials) return false;

  const challenge = new Uint8Array(32);
  window.crypto.getRandomValues(challenge);

  const userId = new Uint8Array(16);
  window.crypto.getRandomValues(userId);

  try {
    const credential = (await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: {
          name: 'JC Studio TaskHub',
          id: window.location.hostname === 'localhost' ? undefined : window.location.hostname,
        },
        user: {
          id: userId,
          name: username,
          displayName: 'JC Studio Master',
        },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 }, // ES256 (najpopularniejszy na iOS/Android)
          { type: 'public-key', alg: -257 }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform', // Wymusza wbudowane Face ID / Touch ID
          userVerification: 'required',
          requireResidentKey: false,
        },
        timeout: 60000,
      },
    })) as PublicKeyCredential | null;

    if (credential && credential.rawId) {
      const b64Id = bufferToBase64(credential.rawId);
      localStorage.setItem(STORAGE_KEY_BIO_CRED, b64Id);
      return true;
    }
    return false;
  } catch (err: any) {
    console.warn('Biometric registration cancelled or failed:', err);
    return false;
  }
}

/**
 * Loguje za pomocą Face ID / Touch ID
 */
export async function authenticateWithBiometrics(): Promise<boolean> {
  if (!navigator.credentials) return false;

  const storedId = localStorage.getItem(STORAGE_KEY_BIO_CRED);
  if (!storedId) return false;

  const challenge = new Uint8Array(32);
  window.crypto.getRandomValues(challenge);

  try {
    const rawIdBuffer = base64ToBuffer(storedId);

    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge,
        allowCredentials: [
          {
            type: 'public-key',
            id: rawIdBuffer,
          },
        ],
        userVerification: 'required',
        timeout: 60000,
      },
    });

    return Boolean(assertion);
  } catch (err: any) {
    console.warn('Biometric authentication cancelled or failed:', err);
    return false;
  }
}

/**
 * Usuwa zapisaną rejestrację biometrii z tego urządzenia
 */
export function removeBiometricCredential(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_BIO_CRED);
  } catch {}
}
