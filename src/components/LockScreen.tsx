import React, { useState } from 'react';
import {
  Lock,
  Unlock,
  KeyRound,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Sparkles,
} from 'lucide-react';
import {
  hashPassword,
  verifyPassword,
  saveStoredCredentials,
  setSessionAuthenticated,
  type AuthCredentials,
} from '../lib/auth';

interface LockScreenProps {
  storedCredentials: AuthCredentials | null;
  onAuthenticated: () => void;
  onSaveCredentials: (creds: AuthCredentials) => void;
}

export const LockScreen: React.FC<LockScreenProps> = ({
  storedCredentials,
  onAuthenticated,
  onSaveCredentials,
}) => {
  const isFirstTimeSetup = !storedCredentials;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberOnDevice, setRememberOnDevice] = useState(true);

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

  const handleSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

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
      const newCreds: AuthCredentials = {
        hash,
        salt,
        updatedAt: new Date().toISOString(),
      };

      saveStoredCredentials(newCreds);
      onSaveCredentials(newCreds);
      setSessionAuthenticated(rememberOnDevice);
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

    if (!password.trim()) {
      triggerErrorShake('Podaj hasło dostępu.');
      return;
    }

    setIsLoading(true);
    try {
      const isValid = await verifyPassword(password, storedCredentials);
      if (isValid) {
        setSessionAuthenticated(rememberOnDevice);
        onAuthenticated();
      } else {
        triggerErrorShake('Nieprawidłowe hasło dostępu.');
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

        {/* Form */}
        <form onSubmit={isFirstTimeSetup ? handleSetupSubmit : handleUnlockSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase text-[#9e8f82] mb-1.5">
              {isFirstTimeSetup ? 'Nowe hasło główne' : 'Hasło dostępu'}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoFocus
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
              <label className="block text-xs font-mono uppercase text-[#9e8f82] mb-1.5">
                Powtórz hasło
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Wpisz ponownie to samo hasło..."
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl glass-input text-sm font-mono placeholder-[#7a6b5e] focus:border-[#d99b5a] transition-all"
              />
            </div>
          )}

          {/* Remember on device checkbox */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-[#9e8f82] hover:text-[#f5ede4] transition-colors select-none">
              <input
                type="checkbox"
                checked={rememberOnDevice}
                onChange={(e) => setRememberOnDevice(e.target.checked)}
                className="w-4 h-4 rounded border-[#382b20] bg-[#140f0c] text-[#d99b5a] focus:ring-0 accent-[#d99b5a] cursor-pointer"
              />
              <span>Zapamiętaj na tym urządzeniu (30 dni)</span>
            </label>
          </div>

          {/* Cryptographic security note */}
          <div className="p-3 rounded-2xl bg-[#140f0c]/60 border border-[#2a1e16] flex items-start gap-2.5 text-[11px] text-[#7a6b5e] leading-relaxed">
            <ShieldCheck className="w-4 h-4 text-[#7ec29a] flex-shrink-0 mt-0.5" />
            <span>
              Hasło jest zabezpieczone haszem kryptograficznym <strong>PBKDF2 + SHA-256 (100 000 powtórzeń)</strong> z unikalną solą. Hasło w postaci jawnej nigdy nie jest zapisywane.
            </span>
          </div>

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
