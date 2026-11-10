import React, { useState, useEffect } from 'react';
import {
  Lock,
  Unlock,
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  Sparkles,
  User,
  ScanFace,
} from 'lucide-react';
import {
  hashPassword,
  verifyPassword,
  verifyLogin,
  DEFAULT_LOGIN_HASH,
  sha256Hex,
  saveStoredCredentials,
  setSessionAuthenticated,
  type AuthCredentials,
} from '../lib/auth';
import {
  isBiometricsAvailable,
  hasBiometricCredential,
  registerBiometricCredential,
  authenticateWithBiometrics,
} from '../lib/biometrics';

interface LockScreenProps {
  storedCredentials: AuthCredentials | null;
  onAuthenticated: () => void;
  onSaveCredentials: (creds: AuthCredentials) => Promise<void> | void;
}

export const LockScreen: React.FC<LockScreenProps> = ({
  storedCredentials,
  onAuthenticated,
  onSaveCredentials,
}) => {
  const isFirstTimeSetup = !storedCredentials;

  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isBioAvailable, setIsBioAvailable] = useState(false);
  const [hasBioCred, setHasBioCred] = useState(() => hasBiometricCredential());
  const [enableBioOnLogin, setEnableBioOnLogin] = useState(true);
  const [isBioLoading, setIsBioLoading] = useState(false);

  const autoTriggeredRef = React.useRef(false);

  useEffect(() => {
    let active = true;

    async function checkAndAutoTriggerBio() {
      const avail = await isBiometricsAvailable();
      if (!active) return;
      setIsBioAvailable(avail);

      const hasCred = hasBiometricCredential();
      setHasBioCred(hasCred);

      // Automatyczne wywołanie Face ID od razu po otwarciu aplikacji na telefonie!
      if (avail && hasCred && !isFirstTimeSetup && !autoTriggeredRef.current) {
        autoTriggeredRef.current = true;
        setTimeout(async () => {
          if (!active) return;
          try {
            setIsBioLoading(true);
            const ok = await authenticateWithBiometrics();
            if (ok && active) {
              setSessionAuthenticated();
              onAuthenticated();
              return;
            }
          } catch (e) {
            console.log('Automatyczny Face ID wymaga pierwszego dotknięcia ekranu:', e);
          } finally {
            if (active) setIsBioLoading(false);
          }
        }, 120);
      }
    }

    checkAndAutoTriggerBio();

    return () => {
      active = false;
    };
  }, [isFirstTimeSetup, onAuthenticated]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);

  const triggerErrorShake = (message: string) => {
    setError(message);
    setIsShaking(true);
    if (navigator.vibrate) {
      try {
        navigator.vibrate([40, 60, 40]);
      } catch (_) {}
    }
    setTimeout(() => setIsShaking(false), 600);
  };

  const handleBiometricUnlock = async () => {
    setError(null);
    setIsBioLoading(true);
    try {
      const ok = await authenticateWithBiometrics();
      if (ok) {
        setSessionAuthenticated();
        onAuthenticated();
      } else {
        triggerErrorShake('Weryfikacja Face ID anulowana lub nieudana.');
      }
    } catch {
      triggerErrorShake('Błąd weryfikacji biometrycznej.');
    } finally {
      setIsBioLoading(false);
    }
  };

  const handleSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (storedCredentials) {
      triggerErrorShake('Hasło zostało już utworzone w chmurze. Odblokuj panel podając hasło.');
      return;
    }

    if (!login.trim()) {
      triggerErrorShake('Podaj login.');
      return;
    }

    const isLoginValid = await verifyLogin(login, DEFAULT_LOGIN_HASH);
    if (!isLoginValid) {
      triggerErrorShake('Nieprawidłowy login.');
      return;
    }

    if (password.length < 4) {
      triggerErrorShake('Hasło musi mieć co najmniej 4 znaki.');
      return;
    }

    if (password !== confirmPassword) {
      triggerErrorShake('Wpisane hasła nie są identyczne.');
      return;
    }

    setIsLoading(true);
    try {
      // Wygeneruj unikalną sól i skrót PBKDF2 (100k iteracji SHA-256)
      const { hash, salt } = await hashPassword(password);
      const loginHash = await sha256Hex(login.trim());
      const newCreds: AuthCredentials = {
        loginHash,
        hash,
        salt,
        updatedAt: new Date().toISOString(),
      };

      saveStoredCredentials(newCreds);
      await onSaveCredentials(newCreds);
      setSessionAuthenticated();
      onAuthenticated();
    } catch (err: any) {
      triggerErrorShake(err?.message || 'Błąd podczas tworzenia hasła.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storedCredentials) return;
    setError(null);

    if (!login.trim()) {
      triggerErrorShake('Podaj login.');
      return;
    }

    if (!password.trim()) {
      triggerErrorShake('Podaj hasło dostępu.');
      return;
    }

    setIsLoading(true);
    try {
      const expectedLoginHash = storedCredentials.loginHash || DEFAULT_LOGIN_HASH;
      const isLoginValid = await verifyLogin(login, expectedLoginHash);
      if (!isLoginValid) {
        triggerErrorShake('Nieprawidłowy login lub hasło.');
        return;
      }

      const isValid = await verifyPassword(password, storedCredentials);
      if (isValid) {
        if (!storedCredentials.loginHash) {
          const updatedCreds = {
            ...storedCredentials,
            loginHash: expectedLoginHash,
          };
          saveStoredCredentials(updatedCreds);
          void onSaveCredentials(updatedCreds);
        }

        if (enableBioOnLogin && isBioAvailable && !hasBioCred) {
          try {
            const bioRegistered = await registerBiometricCredential(login.trim());
            if (bioRegistered) {
              setHasBioCred(true);
            }
          } catch (e) {
            console.warn('Rejestracja Face ID:', e);
          }
        }

        setSessionAuthenticated();
        onAuthenticated();
      } else {
        triggerErrorShake('Nieprawidłowy login lub hasło.');
        setPassword('');
      }
    } catch (err: any) {
      triggerErrorShake(err?.message || 'Błąd podczas weryfikacji hasła.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0c0907] text-[#f5ede4] select-none">
      {/* Background ambient luxury glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#d99b5a]/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#7ec29a]/10 rounded-full blur-3xl" />
      </div>

      <div
        className={`w-full max-w-md glass-panel border border-[#382b20] rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 transition-transform ${
          isShaking ? 'animate-wiggle' : ''
        }`}
      >
        {/* Studio Badge / Crest */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-[#1e1713] border border-[#423326] flex items-center justify-center text-[#d99b5a] shadow-inner mb-4 relative">
            {isFirstTimeSetup ? (
              <KeyRound className="w-8 h-8 text-[#d99b5a]" />
            ) : (
              <Lock className="w-8 h-8 text-[#d99b5a]" />
            )}
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#7ec29a] border-2 border-[#140f0c]" />
          </div>

          <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#d99b5a] font-semibold">
            JC Studio • Security
          </span>
          <h1 className="text-xl sm:text-2xl font-light text-[#f5ede4] mt-1 tracking-tight">
            {isFirstTimeSetup ? 'Zabezpiecz dostęp' : 'Panel Zablokowany'}
          </h1>
          <p className="text-xs text-[#9e8f82] mt-1.5 max-w-xs leading-relaxed">
            {isFirstTimeSetup
              ? 'Utwórz hasło główne do ochrony swoich projektów, finansów i danych klientów.'
              : 'Wprowadź hasło główne, aby odblokować aplikację i przejść do swoich zadań.'}
          </p>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mb-5 p-3 rounded-2xl bg-[#2a1411] border border-[#52231c] flex items-center gap-2.5 text-xs text-[#f19b8c] animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 text-[#e07a68] flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Biometric login button if already registered on this device */}
        {!isFirstTimeSetup && isBioAvailable && hasBioCred && (
          <div className="mb-4">
            <button
              type="button"
              disabled={isBioLoading}
              onClick={handleBiometricUnlock}
              className="w-full py-3.5 px-4 rounded-2xl bg-[#d99b5a]/15 hover:bg-[#d99b5a]/25 border border-[#d99b5a]/40 text-[#f5ede4] text-xs font-medium flex items-center justify-center gap-2.5 transition-all shadow-lg active:scale-98 cursor-pointer disabled:opacity-50 group"
            >
              {isBioLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#d99b5a]" />
              ) : (
                <ScanFace className="w-4 h-4 text-[#d99b5a] group-hover:scale-110 transition-transform" />
              )}
              <span>Zaloguj za pomocą Face ID / Biometrii</span>
            </button>

            <div className="flex items-center gap-3 my-3">
              <div className="flex-1 h-px bg-[#2e231c]" />
              <span className="text-[10px] text-[#7a6b5e] uppercase tracking-wider font-mono">
                lub hasłem
              </span>
              <div className="flex-1 h-px bg-[#2e231c]" />
            </div>
          </div>
        )}

        {/* Form with full W3C autofill attributes for Apple Keychain & Google Password Manager */}
        <form
          method="post"
          action="#"
          autoComplete="on"
          onSubmit={isFirstTimeSetup ? handleSetupSubmit : handleUnlockSubmit}
          className="space-y-4"
        >
          <div>
            <label htmlFor="username" className="block text-xs font-mono uppercase text-[#9e8f82] mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#d99b5a]" />
              Login
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              autoFocus={!login}
              autoComplete="username webauthn"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              placeholder="Wprowadź login..."
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl glass-input text-sm font-mono placeholder-[#7a6b5e] focus:border-[#d99b5a] transition-all"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-mono uppercase text-[#9e8f82] mb-1.5 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-[#d99b5a]" />
              {isFirstTimeSetup ? 'Nowe hasło główne' : 'Hasło dostępu'}
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                autoFocus={Boolean(login)}
                autoComplete={isFirstTimeSetup ? 'new-password' : 'current-password webauthn'}
                placeholder="Wprowadź hasło..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl glass-input text-sm pr-11 font-mono placeholder-[#7a6b5e] focus:border-[#d99b5a] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9e8f82] hover:text-[#f5ede4] transition-colors p-1"
                title={showPassword ? 'Ukryj hasło' : 'Pokaż hasło'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Repeat password field during first setup */}
          {isFirstTimeSetup && (
            <div>
              <label htmlFor="confirm-password" className="block text-xs font-mono uppercase text-[#9e8f82] mb-1.5">
                Powtórz hasło
              </label>
              <input
                id="confirm-password"
                name="confirm-password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
                placeholder="Wpisz ponownie to samo hasło..."
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl glass-input text-sm font-mono placeholder-[#7a6b5e] focus:border-[#d99b5a] transition-all"
              />
            </div>
          )}

          {/* Optional Face ID activation toggle if available on device */}
          {!isFirstTimeSetup && isBioAvailable && !hasBioCred && (
            <div className="pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-[#d99b5a] hover:text-[#f1c38e] transition-colors select-none">
                <input
                  type="checkbox"
                  checked={enableBioOnLogin}
                  onChange={(e) => setEnableBioOnLogin(e.target.checked)}
                  className="w-4 h-4 rounded border-[#382b20] bg-[#140f0c] text-[#d99b5a] focus:ring-0 accent-[#d99b5a] cursor-pointer"
                />
                <span className="flex items-center gap-1.5 font-medium">
                  <ScanFace className="w-3.5 h-3.5 shrink-0" />
                  Włącz logowanie Face ID na tym telefonie
                </span>
              </label>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-2xl bg-[#f5ede4] hover:bg-white text-[#120e0a] text-sm font-semibold shadow-lg shadow-black/40 flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#120e0a]" />
                <span>Weryfikacja hasha...</span>
              </>
            ) : isFirstTimeSetup ? (
              <>
                <Sparkles className="w-4 h-4 text-[#120e0a]" />
                <span>Zapisz hasło i wejdź</span>
              </>
            ) : (
              <>
                <Unlock className="w-4 h-4 text-[#120e0a]" />
                <span>Odblokuj TaskHub</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
